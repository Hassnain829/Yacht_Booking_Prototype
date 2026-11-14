/**
 * Checkout — full page (not a popup). Reads the booking from localStorage (set by booking.js).
 * Laravel: this becomes a POST form with @csrf; payment via Stripe Elements (card fields are mock here).
 */
(function () {
  const { pricing } = CYB.data;
  const money = CYB.fmt.money;
  const form = document.getElementById('checkout-form');
  const F = form.elements;

  /* ---------------- Load booking (or a demo one) ---------------- */
  let booking = CYB.store.get('booking');
  const valid = booking && CYB.find.yacht(booking.yacht) && CYB.find.experience(booking.experience) && booking.date && booking.time;
  if (!valid) {
    booking = demoBooking();
    document.getElementById('demo-notice').classList.remove('hidden');
  }

  function demoBooking() {
    const y = CYB.find.yacht('azure'), e = CYB.find.experience('sunset');
    let iso = CYB.date.addDays(CYB.date.iso(CYB.date.today()), 10);
    for (let i = 0; i < 60; i++) {
      const s = CYB.availability.slots(y.id, iso, e.id).find((x) => x.available);
      if (s) return { experience: e.id, yacht: y.id, guests: 8, date: iso, time: s.time, hours: 3, addons: ['champagne'], occasion: 'Birthday', notes: '' };
      iso = CYB.date.addDays(iso, 1);
    }
    return { experience: e.id, yacht: y.id, guests: 8, date: iso, time: e.slots[0], hours: 3, addons: [], occasion: '', notes: '' };
  }

  const opts = { gratuity: pricing.defaultGratuity, payMode: 'deposit', promo: '' };
  F.occasion.value = booking.occasion || '';
  F.notes.value = booking.notes || '';

  const editParams = new URLSearchParams({ experience: booking.experience, yacht: booking.yacht, guests: booking.guests, date: booking.date, time: booking.time, hours: booking.hours });
  if (booking.addons?.length) editParams.set('addons', booking.addons.join(','));
  document.getElementById('edit-link').href = 'booking.html?' + editParams.toString();

  const quote = () => CYB.quote({ ...booking, ...opts });
  const balanceDate = () => {
    const due = CYB.date.addDays(booking.date, -pricing.balanceDueDays);
    return CYB.date.parse(due) <= CYB.date.today() ? null : due;
  };

  /* ---------------- Gratuity ---------------- */
  function renderGratuity() {
    const q = quote();
    const base = q.charter + q.captain;
    document.getElementById('gratuity-options').innerHTML = pricing.gratuityOptions.map((g) => {
      const sel = opts.gratuity === g;
      return `<button type="button" data-tip="${g}" class="rounded-2xl px-4 py-4 text-center ring-2 transition ${sel ? 'bg-navy-950 text-white ring-navy-950' : 'bg-white ring-navy-100 hover:ring-navy-300'}">
        <span class="block text-lg font-extrabold">${g === 0 ? 'No tip' : g + '%'}</span>
        <span class="block text-xs ${sel ? 'text-brass-300' : 'text-navy-400'}">${g === 0 ? 'Tip in cash' : money(Math.round((base * g) / 100))}</span>
        ${g === pricing.defaultGratuity ? `<span class="mt-1 block text-[10px] font-bold uppercase tracking-wider ${sel ? 'text-white/60' : 'text-brass-600'}">Most chosen</span>` : ''}
      </button>`;
    }).join('');
  }

  /* ---------------- Payment plans ---------------- */
  function renderPlans() {
    const q = CYB.quote({ ...booking, ...opts, payMode: 'deposit' });
    const bd = balanceDate();
    // If the trip is within the balance window, the full amount is due now
    if (!bd) opts.payMode = 'full';
    const plans = [
      { id: 'deposit', title: 'Pay 50% deposit', price: q.deposit, sub: bd ? `${money(q.total - q.deposit)} charged automatically on ${CYB.fmt.date(bd, { month: 'short', day: 'numeric' })}` : 'Not available — trip is within 7 days', disabled: !bd },
      { id: 'full', title: 'Pay in full', price: q.total, sub: 'Nothing more to pay before your trip' },
    ];
    document.getElementById('pay-plans').innerHTML = plans.map((p) => {
      const sel = opts.payMode === p.id;
      return `<button type="button" data-plan="${p.id}" ${p.disabled ? 'disabled' : ''} class="flex items-start gap-3 rounded-2xl p-4 text-left ring-2 transition disabled:cursor-not-allowed disabled:opacity-50 ${sel ? 'bg-brass-50 ring-brass-400' : 'bg-white ring-navy-100 hover:ring-navy-300'}">
        <span class="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ring-2 ${sel ? 'ring-navy-950' : 'ring-navy-300'}">${sel ? '<span class="h-2.5 w-2.5 rounded-full bg-navy-950"></span>' : ''}</span>
        <span class="flex-1"><span class="flex items-center justify-between gap-2"><span class="font-bold text-navy-950">${p.title}</span><span class="font-extrabold text-navy-950">${money(p.price)}</span></span>
        <span class="mt-1 block text-xs text-navy-500">${p.sub}</span></span>
      </button>`;
    }).join('');
  }

  /* ---------------- Order summary ---------------- */
  function renderSummary() {
    const q = quote();
    const y = q.yacht, e = q.experience;
    const h = CYB.find.harbor(y.harbor);
    const end = CYB.fmt.addHours(booking.time, q.hours);
    const bd = balanceDate();
    document.getElementById('order-summary').innerHTML = `
      <div class="overflow-hidden rounded-[2rem] bg-white shadow-card ring-1 ring-navy-100">
        <div class="relative h-40 overflow-hidden">
          <img src="${y.image}" alt="${y.name}" class="h-full w-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/30 to-transparent"></div>
          <div class="absolute bottom-4 left-5 right-5 flex items-end justify-between text-white">
            <div><p class="text-[10px] font-bold uppercase tracking-[0.2em] text-brass-300">${e.name}</p><p class="font-display text-2xl">${y.name}</p></div>
            <a href="${document.getElementById('edit-link').href}" class="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur hover:bg-white hover:text-navy-950">Edit</a>
          </div>
        </div>
        <dl class="grid grid-cols-2 gap-px bg-navy-100 text-sm">
          <div class="bg-white p-4"><dt class="text-[10px] font-bold uppercase tracking-[0.18em] text-navy-400">Date</dt><dd class="mt-1 font-bold text-navy-950">${CYB.fmt.date(booking.date)}</dd></div>
          <div class="bg-white p-4"><dt class="text-[10px] font-bold uppercase tracking-[0.18em] text-navy-400">Time</dt><dd class="mt-1 font-bold text-navy-950">${CYB.fmt.time(booking.time)} – ${CYB.fmt.time(end)}</dd></div>
          <div class="bg-white p-4"><dt class="text-[10px] font-bold uppercase tracking-[0.18em] text-navy-400">Guests</dt><dd class="mt-1 font-bold text-navy-950">${q.guests} guests</dd></div>
          <div class="bg-white p-4"><dt class="text-[10px] font-bold uppercase tracking-[0.18em] text-navy-400">Departs</dt><dd class="mt-1 font-bold text-navy-950">${h.name}</dd></div>
        </dl>

        <div class="border-t border-navy-100 p-5">
          <div id="promo-box">
            ${q.promo ? `
              <div class="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 text-sm ring-1 ring-emerald-200">
                <span class="flex items-center gap-2 font-bold text-emerald-800"><i data-lucide="tag" class="h-4 w-4"></i>${q.promo.code} · ${q.promo.label}</span>
                <button type="button" data-remove-promo class="text-xs font-bold text-emerald-800 hover:underline">Remove</button>
              </div>` : `
              <div class="flex gap-2">
                <label for="promo-input" class="sr-only">Promo code</label>
                <input id="promo-input" placeholder="Promo code" class="min-w-0 flex-1 rounded-xl border border-navy-200 px-4 py-3 text-sm uppercase placeholder:normal-case focus:border-navy-950 focus:outline-none">
                <button type="button" data-apply-promo class="rounded-xl bg-navy-950 px-5 text-sm font-bold text-white hover:bg-navy-800">Apply</button>
              </div>
              <p class="mt-2 text-[11px] text-navy-400">Try <strong>WELCOME10</strong> for 10% off the charter.</p>`}
          </div>

          <dl class="mt-5 space-y-2.5 text-sm">
            ${q.lines.map((l) => `<div class="flex justify-between gap-4"><dt class="text-navy-600">${l.label}<span class="block text-[11px] text-navy-400">${l.sub}</span></dt><dd class="font-semibold text-navy-900">${money(l.amount)}</dd></div>`).join('')}
            ${q.discount ? `<div class="flex justify-between gap-4 text-emerald-700"><dt class="font-semibold">Discount (${q.promo.code})</dt><dd class="font-bold">−${money(q.discount)}</dd></div>` : ''}
            <div class="flex justify-between gap-4"><dt class="text-navy-600">Taxes (est. ${Math.round(pricing.taxRate * 100)}%)</dt><dd class="font-semibold text-navy-900">${money(q.tax)}</dd></div>
            <div class="flex justify-between gap-4"><dt class="text-navy-600">Crew gratuity (${q.gratuityPct}%)</dt><dd class="font-semibold text-navy-900">${money(q.gratuity)}</dd></div>
          </dl>
          <div class="mt-4 flex items-end justify-between border-t border-navy-200 pt-4">
            <p class="font-bold text-navy-950">Total</p>
            <p class="text-2xl font-extrabold text-navy-950">${money(q.total)}</p>
          </div>
          <div class="mt-4 rounded-2xl bg-navy-950 p-4 text-white">
            <div class="flex items-center justify-between"><span class="text-sm font-bold">Due today</span><span class="text-xl font-extrabold text-brass-300">${money(q.dueNow)}</span></div>
            ${q.balance > 0 && bd ? `<div class="mt-1 flex items-center justify-between text-xs text-white/60"><span>Balance on ${CYB.fmt.date(bd, { month: 'short', day: 'numeric' })}</span><span>${money(q.balance)}</span></div>` : ''}
          </div>
        </div>
        <ul class="grid grid-cols-3 border-t border-navy-100 text-center text-[11px] font-semibold text-navy-500">
          <li class="flex flex-col items-center gap-1 p-4"><i data-lucide="cloud-sun" class="h-5 w-5 text-brass-500"></i>Weather guarantee</li>
          <li class="flex flex-col items-center gap-1 border-x border-navy-100 p-4"><i data-lucide="ship-wheel" class="h-5 w-5 text-brass-500"></i>Captain included</li>
          <li class="flex flex-col items-center gap-1 p-4"><i data-lucide="shield-check" class="h-5 w-5 text-brass-500"></i>Secure payment</li>
        </ul>
      </div>`;
    document.getElementById('pay-label').textContent = `Pay ${money(q.dueNow)} & confirm booking`;
  }

  function renderAll() { renderGratuity(); renderPlans(); renderSummary(); CYB.icons(); }

  /* ---------------- Interactions ---------------- */
  form.addEventListener('click', (e) => {
    const t = e.target;
    let b;
    if ((b = t.closest('[data-tip]'))) { opts.gratuity = Number(b.dataset.tip); renderAll(); }
    if ((b = t.closest('[data-plan]'))) { opts.payMode = b.dataset.plan; renderAll(); }
    if (t.closest('[data-apply-promo]')) applyPromo();
    if (t.closest('[data-remove-promo]')) { opts.promo = ''; renderAll(); }
    if (t.closest('#fill-demo')) {
      F.cardNumber.value = '4242 4242 4242 4242';
      F.cardExp.value = '12 / ' + String((new Date().getFullYear() + 2) % 100).padStart(2, '0');
      F.cardCvc.value = '123';
      F.zip.value = '60601';
      detectBrand();
      ['cardNumber', 'cardExp', 'cardCvc', 'zip'].forEach((n) => check(F[n]));
    }
  });
  form.addEventListener('keydown', (e) => {
    if (e.target.id === 'promo-input' && e.key === 'Enter') { e.preventDefault(); applyPromo(); }
  });

  function applyPromo() {
    const code = (document.getElementById('promo-input')?.value || '').trim().toUpperCase();
    if (!code) return;
    if (pricing.promos[code]) { opts.promo = code; renderAll(); CYB.toast(`Promo ${code} applied — ${pricing.promos[code].label}`); }
    else CYB.toast('That promo code is not valid', 'error');
  }

  /* ---------------- Card formatting & validation ---------------- */
  const digits = (s) => s.replace(/\D/g, '');
  function detectBrand() {
    const n = digits(F.cardNumber.value);
    const brand = /^4/.test(n) ? 'Visa' : /^(5[1-5]|2[2-7])/.test(n) ? 'Mastercard' : /^3[47]/.test(n) ? 'Amex' : /^6(011|5)/.test(n) ? 'Discover' : 'Card';
    const el = document.getElementById('card-brand');
    el.textContent = brand;
    el.className = `absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider ${brand === 'Card' ? 'bg-navy-50 text-navy-400' : 'bg-navy-950 text-white'}`;
  }
  F.cardNumber.addEventListener('input', () => {
    F.cardNumber.value = digits(F.cardNumber.value).slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    detectBrand();
  });
  F.cardExp.addEventListener('input', (e) => {
    let v = digits(F.cardExp.value).slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + ' / ' + v.slice(2);
    else if (v.length === 2 && e.inputType !== 'deleteContentBackward') v = v + ' / ';
    F.cardExp.value = v;
  });
  F.cardCvc.addEventListener('input', () => { F.cardCvc.value = digits(F.cardCvc.value).slice(0, 4); });

  const luhn = (num) => {
    let sum = 0, alt = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let n = Number(num[i]);
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n; alt = !alt;
    }
    return num.length >= 13 && sum % 10 === 0;
  };
  const rules = {
    firstName: (v) => v.trim().length > 0,
    lastName: (v) => v.trim().length > 0,
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    phone: (v) => digits(v).length >= 10,
    cardNumber: (v) => luhn(digits(v)),
    cardExp: (v) => {
      const m = v.match(/^(\d{2})\s*\/\s*(\d{2})$/);
      if (!m) return false;
      const mm = Number(m[1]), yy = 2000 + Number(m[2]);
      if (mm < 1 || mm > 12) return false;
      return new Date(yy, mm, 0, 23, 59) >= new Date();
    },
    cardCvc: (v) => /^\d{3,4}$/.test(v),
    zip: (v) => digits(v).length >= 5,
  };
  function check(el) {
    if (!el || !el.name) return true;
    const ok = el.type === 'checkbox' ? el.checked : rules[el.name] ? rules[el.name](el.value) : true;
    el.classList.toggle('border-red-400', !ok);
    el.classList.toggle('ring-4', !ok && el.type !== 'checkbox');
    el.classList.toggle('ring-red-100', !ok && el.type !== 'checkbox');
    el.closest('label')?.querySelector('.err')?.classList.toggle('hidden', ok);
    return ok;
  }
  form.addEventListener('blur', (e) => { if (e.target.classList?.contains('field') && e.target.value) check(e.target); }, true);
  form.addEventListener('change', (e) => { if (e.target.type === 'checkbox') check(e.target); });

  /* ---------------- Submit ---------------- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = Array.from(form.querySelectorAll('.field'));
    const results = fields.map(check);
    if (!results.every(Boolean)) {
      const firstBad = fields[results.indexOf(false)];
      firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => firstBad.focus({ preventScroll: true }), 400);
      CYB.toast('Please check the highlighted fields', 'error');
      return;
    }
    const btn = document.getElementById('pay-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span><span>Processing payment…</span>';

    const q = quote();
    const ref = 'CYB-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    const confirmation = {
      ref,
      createdAt: new Date().toISOString(),
      booking: { ...booking, occasion: F.occasion.value, notes: F.notes.value },
      contact: { firstName: F.firstName.value.trim(), lastName: F.lastName.value.trim(), email: F.email.value.trim(), phone: F.phone.value.trim() },
      payment: { mode: opts.payMode, gratuity: opts.gratuity, promo: opts.promo, card: '•••• ' + digits(F.cardNumber.value).slice(-4), brand: document.getElementById('card-brand').textContent },
      totals: { total: q.total, paid: q.dueNow, balance: q.balance, balanceDate: balanceDate() },
    };
    setTimeout(() => {
      CYB.store.set('confirmation', confirmation);
      CYB.store.remove('booking');
      location.href = 'confirmation.html';
    }, 1600);
  });

  /* ---------------- Hold timer ---------------- */
  let left = 15 * 60;
  const timerEl = document.getElementById('hold-timer');
  const iv = setInterval(() => {
    left -= 1;
    if (left <= 0) {
      clearInterval(iv);
      timerEl.textContent = 'expired';
      CYB.toast('Your hold expired — times may change, but you can still complete checkout.', 'error');
      return;
    }
    timerEl.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  }, 1000);

  renderAll();
})();
