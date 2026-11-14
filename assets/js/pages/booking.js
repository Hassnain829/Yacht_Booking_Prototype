/**
 * Booking flow — 4 steps: Experience → Yacht → Date & Time → Extras → (checkout.html)
 * State is mirrored to the URL (shareable / refresh-safe) and handed to checkout via localStorage.
 * Laravel: keep this UI (Alpine.js or plain JS), but load availability & quotes from API endpoints.
 */
(function () {
  const { yachts, experiences, addons, pricing } = CYB.data;
  const money = CYB.fmt.money;
  const P = CYB.params();
  const $ = (id) => document.getElementById(id);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const OPEN = ['available', 'limited'];

  const state = { step: 1, experience: null, yacht: null, guests: 6, date: null, time: null, hours: null, addons: [], occasion: '', notes: '' };

  /* ---------------- Init from URL ---------------- */
  if (CYB.find.experience(P.experience)) state.experience = P.experience;
  if (CYB.find.yacht(P.yacht)) state.yacht = P.yacht;
  if (P.guests) state.guests = clamp(parseInt(P.guests, 10) || 6, 1, 80);
  if (P.hours) state.hours = Number(P.hours);
  if (P.date && /^\d{4}-\d{2}-\d{2}$/.test(P.date) && CYB.date.parse(P.date) >= CYB.date.today()) state.date = P.date;
  if (P.time) state.time = P.time;
  if (P.addons) state.addons = P.addons.split(',').filter((id) => CYB.find.addon(id));
  if (P.occasion) state.occasion = P.occasion;
  // A yacht link with more guests than the yacht holds: cap guests instead of dropping the yacht
  if (state.yacht && state.guests > CYB.find.yacht(state.yacht).guests) state.guests = CYB.find.yacht(state.yacht).guests;

  const Y = () => CYB.find.yacht(state.yacht);
  const E = () => CYB.find.experience(state.experience);

  let calMonth = (() => { const d = state.date ? CYB.date.parse(state.date) : CYB.date.today(); return new Date(d.getFullYear(), d.getMonth(), 1); })();
  let lastStep = 0;

  /* ---------------- Rules ---------------- */
  function normalize() {
    const y = Y(), e = E();
    if (y && e && !y.experiences.includes(e.id)) state.yacht = null;
    if (Y() && state.guests > Y().guests) state.yacht = null;
    const y2 = Y();
    if (y2 && e) {
      const ds = CYB.availability.durations(y2, e);
      if (!ds.includes(state.hours)) state.hours = ds[0];
      if (state.date && !OPEN.includes(CYB.availability.dayStatus(y2.id, state.date, e.id))) { state.date = null; state.time = null; }
      if (state.date && state.time) {
        const s = CYB.availability.slots(y2.id, state.date, e.id).find((x) => x.time === state.time);
        if (!s || !s.available) state.time = null;
      }
    } else {
      state.time = null;
    }
  }
  const done = {
    1: () => !!state.experience,
    2: () => !!state.experience && !!state.yacht,
    3: () => done[2]() && !!(state.date && state.time && state.hours),
    4: () => done[3](),
  };
  const maxStep = () => (!done[1]() ? 1 : !done[2]() ? 2 : !done[3]() ? 3 : 4);

  function goTo(n, scroll = true) {
    state.step = clamp(n, 1, maxStep());
    render();
    if (scroll) $('step-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------------- Templates ---------------- */
  const STEPS = [
    { n: 1, label: 'Experience', icon: 'compass' },
    { n: 2, label: 'Yacht & Guests', icon: 'sailboat' },
    { n: 3, label: 'Date & Time', icon: 'calendar-days' },
    { n: 4, label: 'Extras', icon: 'gift' },
  ];

  function stepperHTML() {
    const max = maxStep();
    return STEPS.map((s) => {
      const current = s.n === state.step;
      const complete = s.n !== state.step && (s.n < state.step || (s.n < 4 && done[s.n]()));
      const reachable = s.n <= max;
      return `
      <li>
        <button type="button" data-goto="${s.n}" ${reachable ? '' : 'disabled'} class="group flex w-full flex-col gap-3 text-left disabled:cursor-not-allowed" aria-current="${current ? 'step' : 'false'}">
          <span class="h-1 w-full overflow-hidden rounded-full bg-white/10"><span class="block h-full rounded-full bg-brass-400 transition-all duration-500" style="width:${current ? '50%' : complete || s.n < state.step ? '100%' : '0%'}"></span></span>
          <span class="flex items-center gap-2.5">
            <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-extrabold transition ${current ? 'bg-brass-400 text-navy-950' : complete ? 'bg-white text-navy-950' : 'bg-white/10 text-white/60'}">
              ${complete && !current ? '<i data-lucide="check" class="h-4 w-4"></i>' : s.n}
            </span>
            <span class="hidden truncate text-sm font-bold md:block ${current ? 'text-white' : reachable ? 'text-white/70 group-hover:text-white' : 'text-white/35'}">${s.label}</span>
          </span>
        </button>
      </li>`;
    }).join('');
  }

  function panel(title, sub, body, opts = {}) {
    const canNext = done[state.step]();
    return `
    <div class="overflow-hidden rounded-[2rem] bg-white shadow-card ring-1 ring-navy-100">
      <div class="flex flex-col justify-between gap-2 border-b border-navy-100 px-6 py-6 md:flex-row md:items-end md:px-8">
        <div>
          <p class="text-[11px] font-bold uppercase tracking-[0.25em] text-brass-600">Step ${state.step} of 4</p>
          <h2 class="mt-1 font-display text-3xl text-navy-950">${title}</h2>
          <p class="mt-1 text-sm text-navy-500">${sub}</p>
        </div>
        ${opts.headRight || ''}
      </div>
      <div class="p-6 md:p-8">${body}</div>
      <div class="flex items-center justify-between gap-4 border-t border-navy-100 bg-navy-50/50 px-6 py-5 md:px-8">
        ${state.step > 1 ? `<button type="button" data-back class="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-navy-600 hover:bg-white hover:text-navy-950"><i data-lucide="arrow-left" class="h-4 w-4"></i>Back</button>` : '<span></span>'}
        ${state.step < 4
          ? `<button type="button" data-next ${canNext ? '' : 'disabled'} class="inline-flex items-center gap-2 rounded-full bg-navy-950 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-navy-200">Continue <i data-lucide="arrow-right" class="h-4 w-4"></i></button>`
          : `<button type="button" data-checkout class="${CYB.cls.btnPrimary} px-7 py-3.5">Continue to checkout <i data-lucide="arrow-right" class="h-4 w-4"></i></button>`}
      </div>
    </div>`;
  }

  /* ---- Step 1: experience ---- */
  function stepExperience() {
    const y = Y();
    const cards = experiences.map((e) => {
      const sel = state.experience === e.id;
      const offered = !y || y.experiences.includes(e.id);
      const boats = yachts.filter((b) => b.experiences.includes(e.id));
      const from = y && offered ? CYB.startingAt(y, e) : Math.min(...boats.map((b) => CYB.startingAt(b, e)));
      return `
      <button type="button" data-exp="${e.id}" aria-pressed="${sel}" class="group relative flex flex-col overflow-hidden rounded-2xl bg-white text-left ring-2 transition ${sel ? 'shadow-card ring-brass-400' : 'ring-navy-100 hover:ring-navy-300'}">
        <span class="relative block h-36 w-full overflow-hidden">
          <img src="${e.image}" alt="" class="h-full w-full object-cover transition duration-700 group-hover:scale-105">
          <span class="absolute inset-0 bg-gradient-to-t from-navy-950/80 to-transparent"></span>
          <span class="absolute bottom-3 left-4 inline-flex items-center gap-1.5 text-xs font-bold text-white"><i data-lucide="${e.icon}" class="h-4 w-4 text-brass-300"></i>${e.tagline}</span>
          ${sel ? '<span class="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-brass-400 text-navy-950"><i data-lucide="check" class="h-4 w-4"></i></span>' : ''}
        </span>
        <span class="flex flex-1 flex-col p-4">
          <span class="flex items-start justify-between gap-3"><span class="font-bold text-navy-950">${e.name}</span><span class="whitespace-nowrap text-xs font-bold text-brass-700">from ${money(from)}</span></span>
          <span class="mt-1 text-xs text-navy-500">${e.durations[0]}–${e.durations[e.durations.length - 1]} hrs · ${e.days ? 'Wed &amp; Sat nights' : 'Daily'} · ${e.packageFee ? '+' + money(e.packageFee) + ' package' : 'no package fee'}</span>
          ${!offered ? `<span class="mt-2 text-xs font-semibold text-amber-700">Not offered on ${y.name} — you'll choose another yacht next</span>` : ''}
        </span>
      </button>`;
    }).join('');
    return panel('Choose your experience', 'Each experience sets the route, timing and what\'s included.', `<div class="grid gap-4 sm:grid-cols-2">${cards}</div>`);
  }

  /* ---- Step 2: yacht + guests ---- */
  function stepYacht() {
    const e = E();
    const rows = yachts
      .map((y) => ({ y, offered: y.experiences.includes(e.id), fits: y.guests >= state.guests }))
      .sort((a, b) => (b.offered && b.fits) - (a.offered && a.fits) || a.y.hourly - b.y.hourly)
      .map(({ y, offered, fits }) => {
        const ok = offered && fits;
        const sel = state.yacht === y.id;
        const h = CYB.find.harbor(y.harbor);
        const hrs = CYB.availability.durations(y, e)[0];
        const reason = !offered ? `Not offered for ${e.name}` : !fits ? `Max ${y.guests} guests` : '';
        return `
        <div data-yacht-row="${ok ? y.id : ''}" class="flex flex-col overflow-hidden rounded-2xl bg-white ring-2 transition sm:flex-row ${sel ? 'shadow-card ring-brass-400' : ok ? 'cursor-pointer ring-navy-100 hover:ring-navy-300' : 'opacity-50 ring-navy-100'}">
          <div class="relative h-44 shrink-0 sm:h-auto sm:w-56">
            <img src="${y.image}" alt="${y.name}" class="absolute inset-0 h-full w-full object-cover">
            ${sel ? '<span class="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-brass-400 text-navy-950"><i data-lucide="check" class="h-4 w-4"></i></span>' : ''}
          </div>
          <div class="flex flex-1 flex-col justify-between gap-4 p-5 md:flex-row md:items-center">
            <div class="min-w-0">
              <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-brass-600">${y.type} · ${y.length} ft · ${h.name}</p>
              <h3 class="mt-1 font-display text-2xl text-navy-950">${y.name}</h3>
              <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-navy-500">
                <span class="inline-flex items-center gap-1"><i data-lucide="users" class="h-3.5 w-3.5"></i>Up to ${y.guests}</span>
                <span class="inline-flex items-center gap-1"><i data-lucide="star" class="h-3.5 w-3.5 fill-brass-400 text-brass-400"></i>${y.rating.toFixed(1)} (${y.reviews})</span>
                <span class="inline-flex items-center gap-1"><i data-lucide="ship-wheel" class="h-3.5 w-3.5"></i>${y.crew > 1 ? 'Captain + crew' : 'Captain'} included</span>
              </div>
              ${reason ? `<p class="mt-3 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">${reason}</p>` : `<a href="yacht.html?id=${y.id}" target="_blank" class="mt-3 inline-flex items-center gap-1 text-xs font-bold text-navy-500 hover:text-brass-600">View photos &amp; details <i data-lucide="external-link" class="h-3 w-3"></i></a>`}
            </div>
            <div class="flex shrink-0 items-end justify-between gap-4 md:flex-col md:items-end md:text-right">
              <div>
                <p class="text-2xl font-extrabold text-navy-950">${money(y.hourly)}<span class="text-sm font-semibold text-navy-400">/hr</span></p>
                <p class="text-xs text-navy-500">${hrs} hrs incl. captain from ${money(CYB.startingAt(y, e))}</p>
              </div>
              <button type="button" data-yacht="${y.id}" ${ok ? '' : 'disabled'} class="rounded-full px-5 py-2.5 text-xs font-bold transition disabled:cursor-not-allowed ${sel ? 'bg-brass-400 text-navy-950' : 'bg-navy-950 text-white hover:bg-navy-800 disabled:bg-navy-200'}">${sel ? 'Selected' : 'Select'}</button>
            </div>
          </div>
        </div>`;
      }).join('');

    const quick = [2, 6, 13, 25, 49, 80];
    const guestsBox = `
      <div class="mb-6 flex flex-col justify-between gap-4 rounded-2xl bg-navy-50 p-5 md:flex-row md:items-center">
        <div><p class="font-bold text-navy-950">How many guests?</p><p class="text-xs text-navy-500">Everyone on board, including kids. USCG passenger limits apply.</p></div>
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center rounded-full bg-white p-1 ring-1 ring-navy-200">
            <button type="button" data-guests="-1" class="grid h-9 w-9 place-items-center rounded-full hover:bg-navy-50" aria-label="Fewer guests"><i data-lucide="minus" class="h-4 w-4"></i></button>
            <input id="guests-input" type="number" min="1" max="80" value="${state.guests}" class="w-14 bg-transparent text-center text-base font-extrabold text-navy-950 focus:outline-none" aria-label="Number of guests">
            <button type="button" data-guests="1" class="grid h-9 w-9 place-items-center rounded-full hover:bg-navy-50" aria-label="More guests"><i data-lucide="plus" class="h-4 w-4"></i></button>
          </div>
          <div class="hidden gap-1 sm:flex">${quick.map((q) => `<button type="button" data-guests-set="${q}" class="rounded-full px-3 py-1.5 text-xs font-bold ${state.guests === q ? 'bg-navy-950 text-white' : 'bg-white text-navy-600 ring-1 ring-navy-200 hover:ring-navy-950'}">${q}</button>`).join('')}</div>
        </div>
      </div>`;
    return panel('Choose your yacht', `Showing yachts for <strong class="text-navy-800">${e.name}</strong> · ${state.guests} guests`, guestsBox + `<div class="space-y-4">${rows}</div>`);
  }

  /* ---- Step 3: date, duration, time ---- */
  function calendarHTML(y, e) {
    const m = calMonth;
    const startPad = new Date(m.getFullYear(), m.getMonth(), 1).getDay();
    const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    const thisMonth = new Date(CYB.date.today().getFullYear(), CYB.date.today().getMonth(), 1);
    const canPrev = m > thisMonth;
    const wk = Math.round(y.hourly * pricing.weekendMultiplier);
    let cells = '';
    for (let i = 0; i < startPad; i++) cells += '<span></span>';
    for (let d = 1; d <= days; d++) {
      const iso = CYB.date.iso(new Date(m.getFullYear(), m.getMonth(), d));
      const st = CYB.availability.dayStatus(y.id, iso, e.id);
      const sel = state.date === iso;
      const open = OPEN.includes(st);
      const rate = CYB.date.isWeekend(iso) ? wk : y.hourly;
      let cls = 'relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition ';
      let sub = '';
      if (sel) { cls += 'bg-navy-950 font-extrabold text-white shadow-lg'; sub = `<span class="text-[9px] font-semibold text-brass-300">$${rate}</span>`; }
      else if (open) { cls += 'font-bold text-navy-950 hover:bg-brass-50 hover:ring-1 hover:ring-brass-300'; sub = `<span class="text-[9px] font-semibold text-navy-400">$${rate}</span>`; }
      else if (st === 'soldout') { cls += 'cursor-not-allowed text-navy-300 line-through'; sub = '<span class="text-[9px] font-semibold no-underline text-red-400">Full</span>'; }
      else { cls += 'cursor-not-allowed text-navy-200'; }
      const dot = st === 'limited' && !sel ? '<span class="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brass-500"></span>' : '';
      const title = st === 'unavailable' ? `${e.name} runs ${e.days ? 'Wed & Sat only' : ''}` : st === 'soldout' ? 'Sold out' : st === 'limited' ? 'Few times left' : '';
      cells += `<button type="button" ${open ? `data-day="${iso}"` : 'disabled'} class="${cls}" title="${title}" aria-label="${CYB.fmt.date(iso)} ${st}">${d}${sub}${dot}</button>`;
    }
    return `
      <div>
        <div class="flex items-center justify-between">
          <button type="button" data-cal="-1" ${canPrev ? '' : 'disabled'} class="grid h-10 w-10 place-items-center rounded-full ring-1 ring-navy-200 hover:bg-navy-50 disabled:opacity-30" aria-label="Previous month"><i data-lucide="chevron-left" class="h-4 w-4"></i></button>
          <p class="font-display text-xl text-navy-950">${m.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          <button type="button" data-cal="1" class="grid h-10 w-10 place-items-center rounded-full ring-1 ring-navy-200 hover:bg-navy-50" aria-label="Next month"><i data-lucide="chevron-right" class="h-4 w-4"></i></button>
        </div>
        <div class="mt-5 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-navy-400">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => `<span>${d}</span>`).join('')}</div>
        <div class="mt-2 grid grid-cols-7 gap-1">${cells}</div>
        <div class="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-semibold text-navy-500">
          <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-navy-950"></span>Selected</span>
          <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-brass-500"></span>Few left</span>
          <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-navy-200"></span>Unavailable</span>
          <span class="inline-flex items-center gap-1.5">$ = hourly rate</span>
        </div>
      </div>`;
  }

  function nextAvailable(y, e, n = 4) {
    const out = [];
    let iso = CYB.date.iso(CYB.date.today());
    for (let i = 0; i < 90 && out.length < n; i++) {
      if (OPEN.includes(CYB.availability.dayStatus(y.id, iso, e.id)) && CYB.availability.slots(y.id, iso, e.id).some((s) => s.available)) out.push(iso);
      iso = CYB.date.addDays(iso, 1);
    }
    return out;
  }

  function stepDate() {
    const y = Y(), e = E();
    const ds = CYB.availability.durations(y, e);
    const soon = nextAvailable(y, e);
    const slots = state.date ? CYB.availability.slots(y.id, state.date, e.id) : [];
    const rate = state.date && CYB.date.isWeekend(state.date) ? Math.round(y.hourly * pricing.weekendMultiplier) : y.hourly;

    const right = `
      <div class="space-y-7">
        <div>
          <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-navy-400">Duration</p>
          <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            ${ds.map((h) => {
              const sel = state.hours === h;
              return `<button type="button" data-hours="${h}" class="rounded-xl px-3 py-3 text-left ring-2 transition ${sel ? 'bg-navy-950 text-white ring-navy-950' : 'bg-white ring-navy-100 hover:ring-navy-300'}">
                <span class="block text-sm font-extrabold">${h} hours</span>
                <span class="block text-[11px] ${sel ? 'text-brass-300' : 'text-navy-400'}">${money((rate + y.captainHourly) * h)} w/ captain</span>
              </button>`;
            }).join('')}
          </div>
        </div>
        <div>
          <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-navy-400">Departure time</p>
          ${!state.date
            ? `<div class="mt-3 rounded-2xl border-2 border-dashed border-navy-100 p-6 text-center text-sm text-navy-400"><i data-lucide="calendar-days" class="mx-auto mb-2 h-6 w-6"></i>Pick a date to see available times</div>`
            : `<p class="mt-1 text-sm font-semibold text-navy-700">${CYB.fmt.date(state.date, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
               <div class="mt-3 grid grid-cols-2 gap-2">
                 ${slots.map((s) => {
                   const sel = state.time === s.time;
                   return `<button type="button" ${s.available ? `data-time="${s.time}"` : 'disabled'} class="rounded-xl px-3 py-3 text-left ring-2 transition ${sel ? 'bg-brass-400 text-navy-950 ring-brass-400' : s.available ? 'bg-white ring-navy-100 hover:ring-navy-300' : 'cursor-not-allowed bg-navy-50 text-navy-300 ring-transparent'}">
                     <span class="block text-sm font-extrabold ${s.available ? '' : 'line-through'}">${CYB.fmt.time(s.time)}</span>
                     <span class="block text-[11px] ${sel ? 'text-navy-800' : 'text-navy-400'}">${s.available ? 'until ' + CYB.fmt.time(CYB.fmt.addHours(s.time, state.hours)) : 'Booked'}</span>
                   </button>`;
                 }).join('')}
               </div>
               ${CYB.date.isWeekend(state.date) ? `<p class="mt-3 flex items-center gap-2 text-xs font-semibold text-brass-700"><i data-lucide="info" class="h-4 w-4"></i>Weekend rate: ${money(rate)}/hr</p>` : ''}`}
        </div>
        ${e.days ? `<div class="flex gap-3 rounded-2xl bg-brass-50 p-4 text-xs text-navy-700 ring-1 ring-brass-200"><i data-lucide="sparkles" class="h-4 w-4 shrink-0 text-brass-600"></i>${e.name} departs on Wednesday &amp; Saturday nights only.</div>` : ''}
      </div>`;

    const head = soon.length ? `
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-[11px] font-bold uppercase tracking-[0.18em] text-navy-400">Next available:</span>
        ${soon.map((iso) => `<button type="button" data-day="${iso}" class="rounded-full px-3 py-1.5 text-xs font-bold ${state.date === iso ? 'bg-navy-950 text-white' : 'bg-navy-50 text-navy-700 hover:bg-navy-100'}">${CYB.fmt.date(iso, { weekday: 'short', month: 'short', day: 'numeric' })}</button>`).join('')}
      </div>` : '';

    return panel('Pick a date & time', `Live availability for <strong class="text-navy-800">${y.name}</strong> · ${e.name}`,
      `<div class="grid gap-10 xl:grid-cols-[1.15fr_1fr]">${calendarHTML(y, e)}${right}</div>`, { headRight: head });
  }

  /* ---- Step 4: extras ---- */
  function stepExtras() {
    const cards = addons.map((a) => {
      const sel = state.addons.includes(a.id);
      const price = a.unit === 'guest' ? a.price * state.guests : a.price;
      return `
      <button type="button" data-addon="${a.id}" aria-pressed="${sel}" class="flex items-start gap-4 rounded-2xl p-4 text-left ring-2 transition ${sel ? 'bg-brass-50 ring-brass-400' : 'bg-white ring-navy-100 hover:ring-navy-300'}">
        <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl ${sel ? 'bg-brass-400 text-navy-950' : 'bg-navy-50 text-navy-600'}"><i data-lucide="${a.icon}" class="h-5 w-5"></i></span>
        <span class="min-w-0 flex-1">
          <span class="block font-bold text-navy-950">${a.name}</span>
          <span class="block text-xs text-navy-500">${a.desc}</span>
          <span class="mt-1.5 block text-sm font-extrabold text-navy-950">${money(price)} <span class="text-[11px] font-semibold text-navy-400">${a.unit === 'guest' ? `(${money(a.price)} × ${state.guests})` : ''}</span></span>
        </span>
        <span class="grid h-6 w-6 shrink-0 place-items-center rounded-md ring-2 ${sel ? 'bg-navy-950 text-white ring-navy-950' : 'ring-navy-200'}">${sel ? '<i data-lucide="check" class="h-4 w-4"></i>' : ''}</span>
      </button>`;
    }).join('');
    const occasions = ['', 'Birthday', 'Bachelorette / Bachelor', 'Anniversary', 'Proposal', 'Corporate event', 'Family outing', 'Other'];
    return panel('Make it yours', 'Optional extras — add as many as you like, or skip straight to checkout.', `
      <div class="grid gap-3 md:grid-cols-2">${cards}</div>
      <div class="mt-8 grid gap-5 md:grid-cols-[1fr_2fr]">
        <label class="block"><span class="text-[11px] font-bold uppercase tracking-[0.18em] text-navy-400">Occasion</span>
          <select id="occasion" class="mt-2 w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-sm font-semibold focus:border-navy-950 focus:outline-none">
            ${occasions.map((o) => `<option value="${o}" ${state.occasion === o ? 'selected' : ''}>${o || 'Select (optional)'}</option>`).join('')}
          </select></label>
        <label class="block"><span class="text-[11px] font-bold uppercase tracking-[0.18em] text-navy-400">Notes for your captain</span>
          <textarea id="notes" rows="3" placeholder="Dietary needs, surprise plans, accessibility…" class="mt-2 w-full rounded-xl border border-navy-200 px-4 py-3 text-sm focus:border-navy-950 focus:outline-none">${CYB.esc(state.notes)}</textarea></label>
      </div>`);
  }

  /* ---- Summary (desktop sidebar) ---- */
  function summaryHTML() {
    const y = Y(), e = E();
    const q = y ? CYB.quote({ ...state }) : null;
    const row = (icon, label, value, step) => `
      <div class="flex items-center gap-3 py-3">
        <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-navy-50 text-navy-500"><i data-lucide="${icon}" class="h-4 w-4"></i></span>
        <div class="min-w-0 flex-1"><p class="text-[10px] font-bold uppercase tracking-[0.18em] text-navy-400">${label}</p><p class="truncate text-sm font-bold ${value ? 'text-navy-950' : 'text-navy-300'}">${value || 'Not selected'}</p></div>
        ${value && step <= maxStep() && step !== state.step ? `<button type="button" data-goto="${step}" class="text-xs font-bold text-brass-600 hover:underline">Edit</button>` : ''}
      </div>`;
    const timeLabel = state.time ? `${CYB.fmt.time(state.time)} – ${CYB.fmt.time(CYB.fmt.addHours(state.time, state.hours))}` : '';
    const btnLabel = state.step < 4 ? 'Continue' : 'Continue to checkout';
    const canGo = state.step < 4 ? done[state.step]() : done[4]();
    return `
    <div class="overflow-hidden rounded-[2rem] bg-white shadow-card ring-1 ring-navy-100">
      <div class="relative h-36 overflow-hidden bg-navy-950">
        ${y ? `<img src="${y.image}" alt="" class="h-full w-full object-cover opacity-80">` : `<div class="grid h-full place-items-center text-brass-300"><i data-lucide="anchor" class="h-10 w-10"></i></div>`}
        <div class="absolute inset-0 bg-gradient-to-t from-navy-950 to-transparent"></div>
        <div class="absolute bottom-4 left-5 text-white"><p class="text-[10px] font-bold uppercase tracking-[0.2em] text-brass-300">Your charter</p><p class="font-display text-2xl">${y ? y.name : 'Start building'}</p></div>
      </div>
      <div class="divide-y divide-navy-100 px-5">
        ${row('compass', 'Experience', e && e.name, 1)}
        ${row('sailboat', 'Yacht · guests', y && `${y.name} · ${state.guests} guests`, 2)}
        ${row('calendar-days', 'Date', state.date && CYB.fmt.date(state.date), 3)}
        ${row('clock', 'Time · duration', state.time && `${timeLabel} · ${state.hours}h`, 3)}
      </div>
      ${q ? `
      <div class="border-t border-navy-100 bg-navy-50/60 px-5 py-5">
        <dl class="space-y-2 text-sm">
          ${q.lines.map((l) => `<div class="flex justify-between gap-3"><dt class="text-navy-600">${l.label}</dt><dd class="font-semibold text-navy-900">${money(l.amount)}</dd></div>`).join('')}
          <div class="flex justify-between gap-3"><dt class="text-navy-600">Taxes (est.)</dt><dd class="font-semibold text-navy-900">${money(q.tax)}</dd></div>
        </dl>
        <div class="mt-4 flex items-end justify-between border-t border-navy-200 pt-4">
          <div><p class="text-sm font-bold text-navy-950">Total</p>${!state.date ? '<p class="text-[11px] text-navy-400">Weekday estimate</p>' : ''}</div>
          <p class="text-2xl font-extrabold text-navy-950">${money(q.total)}</p>
        </div>
        <p class="mt-1 text-right text-xs font-semibold text-brass-700">${money(q.deposit)} due today (50% deposit)</p>
      </div>` : `<div class="border-t border-navy-100 px-5 py-5 text-sm text-navy-400">Choose a yacht to see your live price.</div>`}
      <div class="p-5 pt-0 ${q ? '' : 'pt-0'}">
        <button type="button" ${state.step < 4 ? 'data-next' : 'data-checkout'} ${canGo ? '' : 'disabled'} class="${CYB.cls.btnPrimary} w-full py-4 disabled:cursor-not-allowed disabled:bg-navy-100 disabled:text-navy-400 disabled:shadow-none disabled:hover:translate-y-0">${btnLabel} <i data-lucide="arrow-right" class="h-4 w-4"></i></button>
        <ul class="mt-4 space-y-2 text-xs text-navy-500">
          <li class="flex items-center gap-2"><i data-lucide="cloud-sun" class="h-4 w-4 text-brass-500"></i>Free weather rescheduling</li>
          <li class="flex items-center gap-2"><i data-lucide="shield-check" class="h-4 w-4 text-brass-500"></i>Licensed &amp; insured captains</li>
          <li class="flex items-center gap-2"><i data-lucide="lock" class="h-4 w-4 text-brass-500"></i>No charge until checkout</li>
        </ul>
      </div>
    </div>`;
  }

  /* ---- Mobile bottom bar ---- */
  function mobileHTML() {
    const y = Y();
    const q = y ? CYB.quote({ ...state }) : null;
    const canGo = state.step < 4 ? done[state.step]() : done[4]();
    return `
    <div class="border-t border-navy-100 bg-white/95 p-4 shadow-[0_-10px_30px_-15px_rgba(7,17,30,.3)] backdrop-blur">
      <div class="flex items-center justify-between gap-4">
        <div class="min-w-0">
          <p class="truncate text-xs text-navy-400">${y ? `${y.name} · ${state.guests} guests${state.hours ? ' · ' + state.hours + 'h' : ''}` : 'Step ' + state.step + ' of 4'}</p>
          <p class="text-xl font-extrabold text-navy-950">${q ? money(q.total) : '—'}</p>
        </div>
        <button type="button" ${state.step < 4 ? 'data-next' : 'data-checkout'} ${canGo ? '' : 'disabled'} class="${CYB.cls.btnPrimary} shrink-0 px-6 disabled:bg-navy-100 disabled:text-navy-400 disabled:shadow-none">${state.step < 4 ? 'Continue' : 'Checkout'} <i data-lucide="arrow-right" class="h-4 w-4"></i></button>
      </div>
    </div>`;
  }

  /* ---------------- Render ---------------- */
  function syncURL() {
    const p = new URLSearchParams();
    ['experience', 'yacht', 'guests', 'date', 'time', 'hours'].forEach((k) => { if (state[k]) p.set(k, state[k]); });
    if (state.addons.length) p.set('addons', state.addons.join(','));
    try { history.replaceState(null, '', '?' + p.toString()); } catch (e) { /* file:// in some browsers */ }
  }

  function render() {
    normalize();
    if (state.step > maxStep()) state.step = maxStep();
    $('stepper').innerHTML = stepperHTML();
    const c = $('step-container');
    c.innerHTML = [null, stepExperience, stepYacht, stepDate, stepExtras][state.step]();
    if (lastStep !== state.step) { c.firstElementChild.classList.add('step-panel'); lastStep = state.step; }
    $('summary').innerHTML = summaryHTML();
    $('mobile-summary').innerHTML = mobileHTML();
    syncURL();
    CYB.icons();
  }

  function checkout() {
    if (!done[4]()) { CYB.toast('Please complete all steps first', 'error'); return; }
    const { experience, yacht, guests, date, time, hours, addons: ad, occasion, notes } = state;
    CYB.store.set('booking', { experience, yacht, guests, date, time, hours, addons: ad, occasion, notes });
    location.href = 'checkout.html';
  }

  /* ---------------- Events ---------------- */
  document.addEventListener('click', (ev) => {
    const t = ev.target;
    const q = (sel) => t.closest(sel);
    let b;

    if ((b = q('[data-goto]'))) { goTo(Number(b.dataset.goto)); return; }
    if (q('[data-back]')) { goTo(state.step - 1); return; }
    if (q('[data-next]')) { if (done[state.step]()) goTo(state.step + 1); return; }
    if (q('[data-checkout]')) { checkout(); return; }

    if ((b = q('[data-exp]'))) {
      state.experience = b.dataset.exp;
      render();
      setTimeout(() => goTo(maxStep()), 220); // jump to the next incomplete step
      return;
    }
    if (q('a[href]')) return; // let detail links work inside yacht rows
    if ((b = q('[data-yacht]')) || (b = q('[data-yacht-row]'))) {
      const id = b.dataset.yacht || b.dataset.yachtRow;
      if (!id) return;
      state.yacht = id;
      render();
      setTimeout(() => goTo(maxStep()), 220);
      return;
    }
    if ((b = q('[data-guests]'))) { state.guests = clamp(state.guests + Number(b.dataset.guests), 1, 80); render(); return; }
    if ((b = q('[data-guests-set]'))) { state.guests = Number(b.dataset.guestsSet); render(); return; }
    if ((b = q('[data-cal]'))) { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + Number(b.dataset.cal), 1); render(); return; }
    if ((b = q('[data-day]'))) {
      state.date = b.dataset.day;
      const d = CYB.date.parse(state.date);
      calMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      // keep the previously chosen time if still available that day
      render();
      return;
    }
    if ((b = q('[data-hours]'))) { state.hours = Number(b.dataset.hours); render(); return; }
    if ((b = q('[data-time]'))) { state.time = b.dataset.time; render(); return; }
    if ((b = q('[data-addon]'))) {
      const id = b.dataset.addon;
      state.addons = state.addons.includes(id) ? state.addons.filter((x) => x !== id) : [...state.addons, id];
      render();
    }
  });

  document.addEventListener('change', (ev) => {
    if (ev.target.id === 'guests-input') { state.guests = clamp(parseInt(ev.target.value, 10) || 1, 1, 80); render(); }
    if (ev.target.id === 'occasion') state.occasion = ev.target.value;
  });
  document.addEventListener('input', (ev) => {
    if (ev.target.id === 'notes') state.notes = ev.target.value;
  });

  /* ---------------- Go ---------------- */
  normalize();
  state.step = maxStep();
  render();
})();
