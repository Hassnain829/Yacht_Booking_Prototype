/**
 * Chicago Yacht Booking — shared helpers & UI behaviour
 * ------------------------------------------------------------
 * Laravel notes:
 *  - CYB.quote()        -> App\Services\QuoteService (server must re-calculate on checkout)
 *  - CYB.availability   -> App\Services\AvailabilityService (real bookings table)
 *  - CYB.ui.yachtCard() -> resources/views/components/yacht-card.blade.php
 */
(function () {
  const CYB = (window.CYB = window.CYB || {});
  const D = () => CYB.data;

  /* ------------------------------------------------------------------ */
  /* Formatting & dates                                                  */
  /* ------------------------------------------------------------------ */
  CYB.fmt = {
    money(n, cents) {
      return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });
    },
    time(t) {
      const [h, m] = t.split(':').map(Number);
      return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
    },
    addHours(t, hrs) {
      const [h, m] = t.split(':').map(Number);
      const total = h * 60 + m + hrs * 60;
      return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
    },
    date(iso, opts) {
      return CYB.date.parse(iso).toLocaleDateString('en-US', opts || { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    },
  };

  CYB.date = {
    parse(iso) { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); },
    iso(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; },
    today() { const t = new Date(); t.setHours(0, 0, 0, 0); return t; },
    addDays(iso, n) { const d = CYB.date.parse(iso); d.setDate(d.getDate() + n); return CYB.date.iso(d); },
    isWeekend(iso) { const g = CYB.date.parse(iso).getDay(); return g === 0 || g === 5 || g === 6; },
  };

  /* ------------------------------------------------------------------ */
  /* Storage (safe) & URL params                                         */
  /* ------------------------------------------------------------------ */
  CYB.store = {
    get(k, fb = null) { try { const v = localStorage.getItem('cyb_' + k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } },
    set(k, v) { try { localStorage.setItem('cyb_' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
    remove(k) { try { localStorage.removeItem('cyb_' + k); } catch (e) { /* ignore */ } },
  };
  CYB.params = () => Object.fromEntries(new URLSearchParams(location.search));
  CYB.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* Owner boat listings ("List your boat"). Mockup: localStorage. Laravel: listings table + ListingController. */
  CYB.listings = {
    all() { return CYB.store.get('listings', []); },
    get(id) { return this.all().find((l) => l.id === id); },
    /** returns false when the browser storage is full (large photos) */
    save(listing) {
      listing.updatedAt = new Date().toISOString();
      const list = [listing, ...this.all().filter((l) => l.id !== listing.id)];
      try { localStorage.setItem('cyb_listings', JSON.stringify(list)); return true; } catch (e) { return false; }
    },
    remove(id) { CYB.store.set('listings', this.all().filter((l) => l.id !== id)); },
    title(l) {
      const s = l.specs || {};
      return l.title || [s.year, s.make !== 'Other' ? s.make : '', s.model].filter(Boolean).join(' ') || 'Untitled boat';
    },
    status: {
      draft: { label: 'In progress', cls: 'bg-navy-100 text-navy-700' },
      pending: { label: 'Pending review', cls: 'bg-amber-100 text-amber-800' },
      approved: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-800' },
    },
  };

  CYB.find = {
    yacht: (id) => D().yachts.find((y) => y.id === id),
    experience: (id) => D().experiences.find((e) => e.id === id),
    harbor: (id) => D().harbors.find((h) => h.id === id),
    addon: (id) => D().addons.find((a) => a.id === id),
  };

  /* ------------------------------------------------------------------ */
  /* Availability (deterministic fake data for the mockup)               */
  /* ------------------------------------------------------------------ */
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  CYB.availability = {
    durations(yacht, exp) {
      if (!yacht || !exp) return exp ? exp.durations : [];
      const d = exp.durations.filter((h) => h >= yacht.minHours);
      return d.length ? d : [yacht.minHours];
    },
    /** 'past' | 'unavailable' | 'soldout' | 'limited' | 'available' */
    dayStatus(yachtId, iso, expId) {
      const day = CYB.date.parse(iso);
      if (day < CYB.date.today()) return 'past';
      const exp = CYB.find.experience(expId);
      if (exp && exp.days && !exp.days.includes(day.getDay())) return 'unavailable';
      const h = hash((yachtId || 'any') + iso) % 100;
      if (h < 9) return 'soldout';
      if (h < 32) return 'limited';
      return 'available';
    },
    slots(yachtId, iso, expId) {
      const exp = CYB.find.experience(expId);
      if (!exp || !iso) return [];
      const status = this.dayStatus(yachtId, iso, expId);
      const open = status === 'available' || status === 'limited';
      const isToday = iso === CYB.date.iso(CYB.date.today());
      const nowH = new Date().getHours();
      const list = exp.slots.map((t) => {
        let available = open;
        if (available) {
          const h = hash(yachtId + iso + t) % 100;
          available = status === 'limited' ? h >= 60 : h >= 20;
        }
        if (isToday && Number(t.split(':')[0]) <= nowH + 2) available = false;
        return { time: t, available };
      });
      if (open && !isToday && !list.some((s) => s.available)) list[list.length - 1].available = true;
      return list;
    },
  };

  /* ------------------------------------------------------------------ */
  /* Quote / price calculation                                           */
  /* ------------------------------------------------------------------ */
  CYB.quote = function (b) {
    const P = D().pricing;
    const y = CYB.find.yacht(b.yacht);
    if (!y) return null;
    const e = CYB.find.experience(b.experience);
    const hours = Number(b.hours) || y.minHours;
    const guests = Number(b.guests) || 2;
    const weekend = b.date ? CYB.date.isWeekend(b.date) : false;
    const rate = Math.round(y.hourly * (weekend ? P.weekendMultiplier : 1));
    const charter = rate * hours;
    const captain = y.captainHourly * hours;
    const lines = [
      { key: 'charter', label: `Yacht charter`, sub: `${CYB.fmt.money(rate)}/hr × ${hours} hrs${weekend ? ' · weekend rate' : ''}`, amount: charter },
      { key: 'captain', label: y.crew > 1 ? `Captain & crew (${y.crew})` : 'Licensed USCG captain', sub: `${CYB.fmt.money(y.captainHourly)}/hr × ${hours} hrs · included`, amount: captain },
    ];
    if (e && e.packageFee) lines.push({ key: 'package', label: `${e.name} package`, sub: 'Experience extras', amount: e.packageFee });
    (b.addons || []).forEach((id) => {
      const a = CYB.find.addon(id);
      if (!a) return;
      lines.push({ key: 'addon-' + id, label: a.name, sub: a.unit === 'guest' ? `${CYB.fmt.money(a.price)} × ${guests} guests` : 'Add-on', amount: a.unit === 'guest' ? a.price * guests : a.price });
    });
    lines.push({ key: 'cleaning', label: 'Fuel & cleaning', sub: 'Flat fee', amount: y.cleaningFee });

    const subtotal = lines.reduce((s, l) => s + l.amount, 0);
    let discount = 0, promo = null;
    const code = (b.promo || '').toUpperCase();
    if (code && P.promos[code]) {
      promo = { code, ...P.promos[code] };
      discount = promo.type === 'percent' ? Math.round((charter * promo.value) / 100) : promo.value;
    }
    const taxable = Math.max(0, subtotal - discount);
    const tax = Math.round(taxable * P.taxRate);
    const gratuityPct = b.gratuity == null ? 0 : Number(b.gratuity);
    const gratuity = Math.round(((charter + captain) * gratuityPct) / 100);
    const total = taxable + tax + gratuity;
    const deposit = Math.round(total * P.depositRate);
    const dueNow = b.payMode === 'full' ? total : deposit;
    return { yacht: y, experience: e, hours, guests, weekend, rate, charter, captain, lines, subtotal, discount, promo, tax, gratuity, gratuityPct, total, deposit, dueNow, balance: total - dueNow };
  };

  /** Lowest all-in price for a yacht (+ optional experience) at minimum hours, weekday. */
  CYB.startingAt = function (y, e) {
    const hours = e ? CYB.availability.durations(y, e)[0] : y.minHours;
    return y.hourly * hours + y.captainHourly * hours + (e ? e.packageFee : 0);
  };

  /* ------------------------------------------------------------------ */
  /* Reusable UI snippets (become Blade components later)                */
  /* ------------------------------------------------------------------ */
  CYB.cls = {
    btnPrimary: 'inline-flex items-center justify-center gap-2 rounded-full bg-brass-400 px-6 py-3 text-sm font-bold text-navy-950 shadow-glow transition hover:-translate-y-0.5 hover:bg-brass-300',
    btnDark: 'inline-flex items-center justify-center gap-2 rounded-full bg-navy-950 px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-navy-800',
    btnOutline: 'inline-flex items-center justify-center gap-2 rounded-full border border-navy-200 px-6 py-3 text-sm font-bold text-navy-900 transition hover:border-navy-950 hover:bg-navy-950 hover:text-white',
  };

  CYB.ui = {
    stars(r = 5, size = 'h-4 w-4') {
      return Array.from({ length: 5 }, (_, i) => `<i data-lucide="star" class="${size} ${i < Math.round(r) ? 'fill-brass-400 text-brass-400' : 'text-navy-200'}"></i>`).join('');
    },
    yachtCard(y, opts = {}) {
      const h = CYB.find.harbor(y.harbor);
      const bookHref = `booking.html?yacht=${y.id}${opts.experience ? '&experience=' + opts.experience : ''}`;
      return `
      <article class="reveal group flex flex-col overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-navy-100/60 transition duration-500 hover:-translate-y-1.5" ${opts.delay ? `data-delay="${opts.delay}"` : ''}>
        <a href="yacht.html?id=${y.id}" class="relative block aspect-[4/3] overflow-hidden">
          <img src="${y.image}" alt="${CYB.esc(y.name)} — ${y.length} ft ${y.type}" loading="lazy" class="h-full w-full object-cover transition duration-[1.2s] group-hover:scale-110">
          <div class="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent"></div>
          <span class="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-navy-900">${y.badge}</span>
          <span class="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-navy-950/70 px-2.5 py-1 text-xs font-bold text-white backdrop-blur"><i data-lucide="star" class="h-3.5 w-3.5 fill-brass-400 text-brass-400"></i>${y.rating.toFixed(1)}</span>
          <span class="absolute bottom-4 left-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white"><i data-lucide="ship-wheel" class="h-4 w-4 text-brass-300"></i>Captain included</span>
        </a>
        <div class="flex flex-1 flex-col p-6">
          <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-brass-600">${y.type} · ${y.length} ft</p>
          <h3 class="mt-1.5 font-display text-2xl text-navy-950"><a href="yacht.html?id=${y.id}" class="hover:text-brass-600">${y.name}</a></h3>
          <p class="mt-2 line-clamp-2 text-sm leading-relaxed text-navy-500">${y.short}</p>
          <div class="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-navy-600">
            <span class="inline-flex items-center gap-1.5"><i data-lucide="users" class="h-4 w-4 text-navy-400"></i>Up to ${y.guests}</span>
            <span class="inline-flex items-center gap-1.5"><i data-lucide="map-pin" class="h-4 w-4 text-navy-400"></i>${h ? h.name : ''}</span>
            <span class="inline-flex items-center gap-1.5"><i data-lucide="clock" class="h-4 w-4 text-navy-400"></i>${y.minHours} hr min</span>
          </div>
          <div class="mt-auto pt-6"><div class="flex items-end justify-between gap-3 border-t border-navy-100 pt-5">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-wider text-navy-400">From</p>
              <p class="text-2xl font-extrabold text-navy-950">${CYB.fmt.money(y.hourly)}<span class="text-sm font-semibold text-navy-400">/hr</span></p>
            </div>
            <div class="flex gap-2">
              <a href="yacht.html?id=${y.id}" class="grid h-11 w-11 place-items-center rounded-full border border-navy-200 text-navy-700 transition hover:border-navy-950 hover:bg-navy-950 hover:text-white" aria-label="View ${CYB.esc(y.name)} details"><i data-lucide="arrow-up-right" class="h-4 w-4"></i></a>
              <a href="${bookHref}" class="inline-flex h-11 items-center gap-2 rounded-full bg-navy-950 px-5 text-sm font-bold text-white transition hover:bg-brass-400 hover:text-navy-950">Book</a>
            </div>
          </div></div>
        </div>
      </article>`;
    },
  };

  /* ------------------------------------------------------------------ */
  /* Toasts                                                              */
  /* ------------------------------------------------------------------ */
  CYB.toast = function (msg, type = 'success') {
    let wrap = document.getElementById('toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'toast-wrap';
      wrap.className = 'fixed bottom-6 left-1/2 z-[120] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 space-y-2';
      wrap.setAttribute('aria-live', 'polite');
      document.body.appendChild(wrap);
    }
    const el = document.createElement('div');
    el.className = 'toast flex items-start gap-3 rounded-2xl bg-navy-950 px-5 py-4 text-sm font-medium text-white shadow-2xl ring-1 ring-white/10';
    el.innerHTML = `<i data-lucide="${type === 'error' ? 'circle-alert' : 'circle-check'}" class="mt-0.5 h-5 w-5 shrink-0 ${type === 'error' ? 'text-red-400' : 'text-brass-300'}"></i><span>${msg}</span>`;
    wrap.appendChild(el);
    CYB.icons();
    setTimeout(() => { el.classList.add('toast-out'); setTimeout(() => el.remove(), 300); }, 3400);
  };

  /* ------------------------------------------------------------------ */
  /* Icons, reveal, counters, accordion, carousel, lightbox              */
  /* ------------------------------------------------------------------ */
  CYB.icons = () => { if (window.lucide) window.lucide.createIcons(); };

  let io;
  CYB.reveal = function () {
    const els = document.querySelectorAll('.reveal:not(.is-visible)');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-visible')); return; }
    io = io || new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach((e) => io.observe(e));
  };

  CYB.refresh = () => { CYB.icons(); CYB.reveal(); };

  function initCounters() {
    const els = document.querySelectorAll('[data-count]');
    if (!els.length) return;
    const run = (el) => {
      const target = Number(el.dataset.count);
      const dec = Number(el.dataset.decimals || 0);
      const suffix = el.dataset.suffix || '';
      const start = performance.now();
      const dur = 1600;
      const tick = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const v = target * (1 - Math.pow(1 - p, 3));
        el.textContent = v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { run(en.target); obs.unobserve(en.target); } });
    }, { threshold: 0.5 });
    els.forEach((el) => obs.observe(el));
  }

  CYB.initAccordions = function (root = document) {
    root.querySelectorAll('[data-accordion]').forEach((acc) => {
      if (acc.dataset.bound) return;
      acc.dataset.bound = '1';
      acc.addEventListener('click', (ev) => {
        const btn = ev.target.closest('.acc-trigger');
        if (!btn || !acc.contains(btn)) return;
        const item = btn.closest('.acc-item');
        const open = item.classList.contains('is-open');
        if (acc.dataset.accordion !== 'multi') acc.querySelectorAll('.acc-item.is-open').forEach((i) => { i.classList.remove('is-open'); i.querySelector('.acc-trigger').setAttribute('aria-expanded', 'false'); });
        item.classList.toggle('is-open', !open);
        btn.setAttribute('aria-expanded', String(!open));
      });
    });
  };

  /* Scroll-snap carousel: [data-carousel] > [data-track], [data-prev], [data-next], [data-counter] */
  function initCarousels() {
    document.querySelectorAll('[data-carousel]').forEach((c) => {
      const track = c.querySelector('[data-track]');
      if (!track) return;
      const items = () => Array.from(track.children);
      const step = () => (items()[0] ? items()[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 24) : 300);
      c.querySelector('[data-prev]')?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
      c.querySelector('[data-next]')?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
      const counter = c.querySelector('[data-counter]');
      const progress = c.querySelector('[data-progress]');
      const update = () => {
        const max = track.scrollWidth - track.clientWidth;
        const idx = Math.round(track.scrollLeft / step());
        if (counter) counter.textContent = `${String(Math.min(idx + 1, items().length)).padStart(2, '0')} / ${String(items().length).padStart(2, '0')}`;
        if (progress) progress.style.width = `${max > 0 ? Math.max(12, (track.scrollLeft / max) * 100) : 100}%`;
      };
      track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
      update();
    });
  }

  /* Lightbox: CYB.lightbox(['img1.jpg', ...], startIndex) */
  CYB.lightbox = function (images, start = 0) {
    let lb = document.getElementById('lightbox');
    if (!lb) {
      lb = document.createElement('div');
      lb.id = 'lightbox';
      lb.className = 'fixed inset-0 z-[110] flex items-center justify-center bg-navy-950/95 p-4 backdrop-blur';
      lb.innerHTML = `
        <button data-lb-close class="absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close"><i data-lucide="x" class="h-6 w-6"></i></button>
        <button data-lb-prev class="absolute left-3 md:left-8 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Previous"><i data-lucide="chevron-left" class="h-6 w-6"></i></button>
        <img data-lb-img class="max-h-[82vh] max-w-full rounded-2xl object-contain shadow-2xl" alt="">
        <button data-lb-next class="absolute right-3 md:right-8 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Next"><i data-lucide="chevron-right" class="h-6 w-6"></i></button>
        <p data-lb-count class="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm font-semibold tracking-widest text-white/70"></p>`;
      document.body.appendChild(lb);
      CYB.icons();
      lb.addEventListener('click', (e) => {
        if (e.target === lb || e.target.closest('[data-lb-close]')) lb.classList.remove('is-open');
        if (e.target.closest('[data-lb-prev]')) lb._go(-1);
        if (e.target.closest('[data-lb-next]')) lb._go(1);
      });
      document.addEventListener('keydown', (e) => {
        if (!lb.classList.contains('is-open')) return;
        if (e.key === 'Escape') lb.classList.remove('is-open');
        if (e.key === 'ArrowLeft') lb._go(-1);
        if (e.key === 'ArrowRight') lb._go(1);
      });
    }
    lb._images = images;
    lb._i = start;
    lb._go = (d) => { lb._i = (lb._i + d + lb._images.length) % lb._images.length; show(); };
    const show = () => {
      lb.querySelector('[data-lb-img]').src = lb._images[lb._i];
      lb.querySelector('[data-lb-count]').textContent = `${lb._i + 1} / ${lb._images.length}`;
    };
    show();
    requestAnimationFrame(() => lb.classList.add('is-open'));
  };

  /* Quick-book forms (hero / sidebar): pass values to booking.html via URL */
  function initQuickBook() {
    document.querySelectorAll('form[data-quick-book]').forEach((form) => {
      const dateInput = form.querySelector('input[type=date]');
      if (dateInput) dateInput.min = CYB.date.iso(CYB.date.today());
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        new FormData(form).forEach((v, k) => { if (v) params.set(k, v); });
        location.href = 'booking.html' + (params.toString() ? '?' + params.toString() : '');
      });
    });
  }

  /* Fills <select data-experience-options> with experiences */
  function fillExperienceSelects() {
    document.querySelectorAll('select[data-experience-options]').forEach((sel) => {
      const keep = sel.innerHTML;
      sel.innerHTML = keep + D().experiences.map((e) => `<option value="${e.id}">${e.name}</option>`).join('');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    fillExperienceSelects();
    initQuickBook();
    initCounters();
    CYB.initAccordions();
    initCarousels();
    CYB.refresh();
    document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
  });
})();
