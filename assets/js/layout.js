/**
 * Chicago Yacht Booking — shared header, mobile menu & footer
 * ------------------------------------------------------------
 * Mockup: injected into #site-header / #site-footer on every page.
 * Laravel: copy the markup into
 *   resources/views/partials/header.blade.php
 *   resources/views/partials/footer.blade.php
 * and replace `.html` links with route('...') helpers.
 */
(function () {
  const B = CYB.data.business;
  const page = document.body.dataset.page || '';

  const nav = [
    { id: 'home', label: 'Home', href: 'index.html' },
    { id: 'yachts', label: 'Yachts', href: 'yachts.html' },
    { id: 'experiences', label: 'Experiences', href: 'experiences.html' },
    { id: 'pricing', label: 'Pricing', href: 'pricing.html' },
    { id: 'about', label: 'About Us', href: 'about.html' },
    { id: 'contact', label: 'Contact Us', href: 'contact.html' },
    { id: 'list-boat', label: 'List Your Boat', href: 'list-your-boat.html' },
  ];
  const activeId = page === 'owner' ? 'list-boat' : page;

  const logo = (size = 'md') => `
    <a href="index.html" class="group flex shrink-0 items-center gap-3 whitespace-nowrap" aria-label="${B.name} home">
      <span class="grid ${size === 'lg' ? 'h-12 w-12' : 'h-11 w-11'} place-items-center rounded-full border border-brass-300/50 bg-white/5 text-brass-300 transition group-hover:bg-brass-400 group-hover:text-navy-950">
        <i data-lucide="anchor" class="h-5 w-5"></i>
      </span>
      <span class="leading-none">
        <span class="block text-[10px] font-extrabold tracking-[0.42em] text-brass-300">CHICAGO</span>
        <span class="mt-1 block font-display text-[1.35rem] text-white">Yacht Booking</span>
      </span>
    </a>`;

  /* ---------------- Promo bar + header ---------------- */
  const promoHidden = CYB.store.get('promo_hidden');
  const header = `
  <header id="header" class="fixed inset-x-0 top-0 z-50 transition-all duration-300">
    ${promoHidden ? '' : `
    <div id="promo-bar" class="relative bg-brass-400 text-navy-950">
      <div class="container flex items-center justify-center gap-3 py-2 pr-10 text-center text-xs font-semibold sm:text-sm">
        <i data-lucide="sparkles" class="hidden h-4 w-4 sm:block"></i>
        <span>Early-bird season pricing — save 10% on your charter with code <strong class="tracking-wider">WELCOME10</strong></span>
        <a href="booking.html" class="hidden rounded-full bg-navy-950 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-navy-800 md:inline-block">Book &amp; save</a>
      </div>
      <button id="promo-close" class="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full hover:bg-navy-950/10" aria-label="Dismiss offer"><i data-lucide="x" class="h-4 w-4"></i></button>
    </div>`}
    <div class="container flex h-20 items-center justify-between gap-6">
      ${logo()}
      <nav class="hidden items-center gap-7 xl:flex" aria-label="Main">
        ${nav.map((n) => `<a href="${n.href}" class="nav-link whitespace-nowrap text-[13px] font-semibold uppercase tracking-[0.12em] ${activeId === n.id ? 'is-active text-white' : 'text-white/75 hover:text-white'}">${n.label}</a>`).join('')}
      </nav>
      <div class="flex items-center gap-3">
        <a href="tel:${B.phoneHref}" class="hidden h-10 w-10 place-items-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white min-[1360px]:grid" aria-label="Call ${B.phone}" title="${B.phone}">
          <i data-lucide="phone" class="h-4 w-4"></i>
        </a>
        <a href="booking.html" class="${CYB.cls.btnPrimary} hidden whitespace-nowrap sm:inline-flex">Book Now <i data-lucide="arrow-right" class="h-4 w-4"></i></a>
        <button id="menu-open" class="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 xl:hidden" aria-label="Open menu" aria-controls="mobile-menu" aria-expanded="false">
          <i data-lucide="menu" class="h-5 w-5"></i>
        </button>
      </div>
    </div>
  </header>

  <div id="mobile-menu" class="fixed inset-0 z-[60] xl:hidden" aria-hidden="true">
    <div data-close class="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"></div>
    <aside class="drawer absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-navy-950 p-6 text-white shadow-2xl">
      <div class="flex items-center justify-between">
        ${logo()}
        <button data-close class="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Close menu"><i data-lucide="x" class="h-5 w-5"></i></button>
      </div>
      <nav class="mt-10 flex flex-col" aria-label="Mobile">
        ${nav.map((n) => `<a href="${n.href}" class="flex items-center justify-between border-b border-white/10 py-3.5 font-display text-2xl ${activeId === n.id ? 'text-brass-300' : 'text-white'}">${n.label}<i data-lucide="arrow-up-right" class="h-5 w-5 text-white/40"></i></a>`).join('')}
      </nav>
      <div class="mt-auto space-y-3 pt-8">
        <a href="booking.html" class="${CYB.cls.btnPrimary} w-full py-4">Book Now <i data-lucide="arrow-right" class="h-4 w-4"></i></a>
        <a href="tel:${B.phoneHref}" class="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 py-4 text-sm font-bold"><i data-lucide="phone" class="h-4 w-4"></i>${B.phone}</a>
      </div>
    </aside>
  </div>`;

  /* ---------------- Footer ---------------- */
  const footer = `
  <footer class="relative overflow-hidden bg-navy-950 text-white">
    <div class="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-brass-400/10 blur-3xl"></div>
    <div class="container relative">
      <div class="grid gap-6 border-b border-white/10 py-14 md:grid-cols-2 lg:grid-cols-4">
        ${CYB.data.harbors.map((h) => `
          <a href="https://www.google.com/maps/search/?api=1&query=${h.map}" target="_blank" rel="noopener" class="group rounded-2xl border border-white/10 p-5 transition hover:border-brass-400/60 hover:bg-white/5">
            <div class="flex items-center justify-between">
              <i data-lucide="map-pin" class="h-5 w-5 text-brass-300"></i>
              <i data-lucide="arrow-up-right" class="h-4 w-4 text-white/30 transition group-hover:text-brass-300"></i>
            </div>
            <p class="mt-4 font-display text-lg">${h.name}</p>
            <p class="text-sm text-white/55">${h.area}</p>
          </a>`).join('')}
      </div>

      <div class="grid gap-12 py-16 lg:grid-cols-12">
        <div class="lg:col-span-4">
          ${logo('lg')}
          <p class="mt-6 max-w-sm text-sm leading-relaxed text-white/60">Private yacht charters on Lake Michigan and the Chicago River. Licensed captains, transparent pricing and instant online booking — seven days a week.</p>
          <form id="newsletter" class="mt-8 flex max-w-sm overflow-hidden rounded-full bg-white/10 p-1.5 ring-1 ring-white/10 focus-within:ring-brass-400">
            <label for="nl-email" class="sr-only">Email address</label>
            <input id="nl-email" type="email" required placeholder="Your email for deals" class="min-w-0 flex-1 bg-transparent px-4 text-sm text-white placeholder:text-white/40 focus:outline-none">
            <button class="rounded-full bg-brass-400 px-5 py-2.5 text-sm font-bold text-navy-950 hover:bg-brass-300">Subscribe</button>
          </form>
        </div>
        <div class="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-8">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.25em] text-brass-300">Explore</p>
            <ul class="mt-5 space-y-3 text-sm text-white/65">
              ${nav.map((n) => `<li><a href="${n.href}" class="hover:text-white">${n.label}</a></li>`).join('')}
              <li><a href="booking.html" class="hover:text-white">Book Now</a></li>
              <li><a href="owner-dashboard.html" class="hover:text-white">Owner Dashboard</a></li>
            </ul>
          </div>
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.25em] text-brass-300">Experiences</p>
            <ul class="mt-5 space-y-3 text-sm text-white/65">
              ${CYB.data.experiences.slice(0, 7).map((e) => `<li><a href="booking.html?experience=${e.id}" class="hover:text-white">${e.name}</a></li>`).join('')}
            </ul>
          </div>
          <div class="col-span-2 sm:col-span-1">
            <p class="text-xs font-bold uppercase tracking-[0.25em] text-brass-300">Contact</p>
            <ul class="mt-5 space-y-4 text-sm text-white/65">
              <li><a href="tel:${B.phoneHref}" class="flex items-center gap-3 hover:text-white"><i data-lucide="phone" class="h-4 w-4 text-brass-300"></i>${B.phone}</a></li>
              <li><a href="mailto:${B.email}" class="flex items-center gap-3 break-all hover:text-white"><i data-lucide="mail" class="h-4 w-4 shrink-0 text-brass-300"></i>${B.email}</a></li>
              <li class="flex items-center gap-3"><i data-lucide="clock" class="h-4 w-4 text-brass-300"></i>${B.hours}</li>
              <li class="flex items-center gap-3"><i data-lucide="map-pin" class="h-4 w-4 text-brass-300"></i>${B.office}</li>
            </ul>
            <div class="mt-6 flex gap-2">
              ${['instagram', 'facebook', 'youtube'].map((s) => `<a href="${B[s]}" class="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-brass-400 hover:text-navy-950" aria-label="${s}"><i data-lucide="${s}" class="h-4 w-4"></i></a>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-4 border-t border-white/10 py-8 text-xs text-white/45 md:flex-row md:items-center md:justify-between">
        <p>© <span data-year></span> ${B.name}. All rights reserved.</p>
        <div class="flex flex-wrap gap-x-6 gap-y-2">
          <a href="pricing.html#policies" class="hover:text-white">Cancellation Policy</a>
          <a href="pricing.html#policies" class="hover:text-white">Weather Policy</a>
          <a href="#" class="hover:text-white">Privacy</a>
          <a href="#" class="hover:text-white">Terms</a>
        </div>
      </div>
    </div>
  </footer>`;

  const h = document.getElementById('site-header');
  const f = document.getElementById('site-footer');
  if (h) h.outerHTML = header;
  if (f) f.innerHTML = footer;
  // Leave room for fixed mobile bottom bars (yacht detail / booking pages)
  if (f && (document.getElementById('mobile-book-bar') || document.getElementById('mobile-summary'))) {
    f.querySelector('footer').classList.add('pb-24', 'lg:pb-0');
  }

  /* ---------------- Behaviour ---------------- */
  const headerEl = document.getElementById('header');
  const solidAlways = document.body.dataset.header === 'solid';
  const onScroll = () => headerEl && headerEl.classList.toggle('is-solid', solidAlways || window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const menu = document.getElementById('mobile-menu');
  const openBtn = document.getElementById('menu-open');
  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    openBtn.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('overflow-hidden', open);
  };
  openBtn?.addEventListener('click', () => setMenu(true));
  menu?.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  document.getElementById('promo-close')?.addEventListener('click', () => {
    document.getElementById('promo-bar')?.remove();
    CYB.store.set('promo_hidden', true);
  });

  document.getElementById('newsletter')?.addEventListener('submit', (e) => {
    e.preventDefault();
    e.target.reset();
    CYB.toast("You're on the list! Watch your inbox for seasonal deals.");
  });
})();
