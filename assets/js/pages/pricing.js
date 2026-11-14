/* Pricing page — example packages, live estimator, rate table, add-ons */
(function () {
  const { yachts, experiences, addons, pricing } = CYB.data;
  const money = CYB.fmt.money;

  // Next weekday / weekend date so example quotes use the right rate
  const nextDay = (weekend) => {
    let iso = CYB.date.iso(CYB.date.today());
    for (let i = 1; i < 10; i++) { iso = CYB.date.addDays(iso, 1); if (CYB.date.isWeekend(iso) === weekend) return iso; }
    return iso;
  };

  /* ---------- Popular packages ---------- */
  const pkgs = [
    { title: 'Sunset for Two', yacht: 'windward', experience: 'sunset', hours: 2, guests: 2, weekend: false, addons: ['champagne'], perks: ['2-hour sunset sail', 'Licensed captain', 'Champagne toast', 'Blankets & ice'] },
    { title: 'Playpen Party', yacht: 'azure', experience: 'playpen', hours: 4, guests: 12, weekend: true, addons: ['lilypad'], perks: ['4 hours at the Playpen', 'Captain included', 'Lily pad & floats', 'Saturday rate'], featured: true },
    { title: 'Corporate Cruise', yacht: 'skyline', experience: 'corporate', hours: 3, guests: 40, weekend: false, addons: ['catering'], perks: ['3-hour skyline cruise', 'Captain + 2 crew', 'Catering for 40', 'Event coordinator'] },
  ];
  document.getElementById('packages').innerHTML = pkgs.map((p, i) => {
    const y = CYB.find.yacht(p.yacht);
    const q = CYB.quote({ ...p, date: nextDay(p.weekend) });
    const dark = p.featured;
    return `
    <article class="reveal relative flex flex-col overflow-hidden rounded-3xl ${dark ? 'bg-navy-950 text-white shadow-2xl lg:-translate-y-4' : 'bg-white shadow-card ring-1 ring-navy-100'}" data-delay="${i}">
      ${dark ? '<span class="absolute right-5 top-5 z-10 rounded-full bg-brass-400 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-navy-950">Most booked</span>' : ''}
      <img src="${y.image}" alt="${y.name}" loading="lazy" class="h-48 w-full object-cover">
      <div class="flex flex-1 flex-col p-7">
        <p class="text-[11px] font-bold uppercase tracking-[0.2em] ${dark ? 'text-brass-300' : 'text-brass-600'}">${y.name} · ${p.guests} guests</p>
        <h3 class="mt-2 font-display text-3xl">${p.title}</h3>
        <p class="mt-4 font-display text-5xl ${dark ? 'text-brass-300' : 'text-navy-950'}">${money(q.total)}</p>
        <p class="mt-1 text-xs ${dark ? 'text-white/50' : 'text-navy-400'}">all-in incl. tax · ${money(Math.round(q.total / p.guests))} per guest</p>
        <ul class="mt-6 space-y-2.5 text-sm ${dark ? 'text-white/80' : 'text-navy-600'}">
          ${p.perks.map((x) => `<li class="flex items-center gap-2.5"><i data-lucide="check" class="h-4 w-4 ${dark ? 'text-brass-300' : 'text-brass-500'}"></i>${x}</li>`).join('')}
        </ul>
        <div class="mt-auto pt-8">
          <a href="booking.html?yacht=${p.yacht}&experience=${p.experience}&hours=${p.hours}&guests=${p.guests}&addons=${p.addons.join(',')}" class="${dark ? CYB.cls.btnPrimary : CYB.cls.btnDark} w-full py-4">Book this package</a>
        </div>
      </div>
    </article>`;
  }).join('');

  /* ---------- Estimator ---------- */
  const f = document.getElementById('estimator');
  f.yacht.innerHTML = yachts.map((y) => `<option value="${y.id}">${y.name} (up to ${y.guests})</option>`).join('');
  const selected = new Set();
  document.getElementById('est-addons').innerHTML = addons.map((a) => `
    <button type="button" data-addon="${a.id}" class="inline-flex items-center gap-2 rounded-full border border-navy-200 px-4 py-2 text-xs font-bold text-navy-700 transition hover:border-navy-950">
      <i data-lucide="${a.icon}" class="h-3.5 w-3.5"></i>${a.name} · ${money(a.price)}${a.unit === 'guest' ? '/guest' : ''}
    </button>`).join('');

  const fillExperiences = () => {
    const y = CYB.find.yacht(f.yacht.value);
    const prev = f.experience.value;
    const list = experiences.filter((e) => y.experiences.includes(e.id));
    f.experience.innerHTML = list.map((e) => `<option value="${e.id}">${e.name}</option>`).join('');
    if (list.some((e) => e.id === prev)) f.experience.value = prev;
    f.guests.max = y.guests;
    if (Number(f.guests.value) > y.guests) f.guests.value = y.guests;
  };
  const fillHours = () => {
    const ds = CYB.availability.durations(CYB.find.yacht(f.yacht.value), CYB.find.experience(f.experience.value));
    const prev = f.hours.value;
    f.hours.innerHTML = ds.map((h) => `<option value="${h}">${h} hours</option>`).join('');
    if (ds.includes(Number(prev))) f.hours.value = prev;
  };

  function update() {
    const y = CYB.find.yacht(f.yacht.value);
    const guests = Math.max(1, Math.min(y.guests, Number(f.guests.value) || 1));
    const weekend = f.day.value === 'weekend';
    const b = { yacht: y.id, experience: f.experience.value, hours: f.hours.value, guests, addons: [...selected], date: nextDay(weekend) };
    const q = CYB.quote(b);
    document.getElementById('est-head').innerHTML = `
      <img src="${y.image}" alt="" class="h-full w-full object-cover opacity-70">
      <div class="absolute inset-0 bg-gradient-to-t from-navy-950 to-transparent"></div>
      <div class="absolute bottom-4 left-7"><p class="text-[11px] font-bold uppercase tracking-[0.2em] text-brass-300">${q.experience.name}</p><p class="font-display text-2xl">${y.name} · ${q.hours} hrs · ${guests} guests</p></div>`;
    document.getElementById('est-lines').innerHTML = q.lines.map((l) => `
      <div class="flex justify-between gap-4"><dt class="text-white/70">${l.label}<span class="block text-xs text-white/40">${l.sub}</span></dt><dd class="font-semibold">${money(l.amount)}</dd></div>`).join('') +
      `<div class="flex justify-between gap-4"><dt class="text-white/70">Taxes (est. ${Math.round(pricing.taxRate * 100)}%)</dt><dd class="font-semibold">${money(q.tax)}</dd></div>`;
    document.getElementById('est-total').textContent = money(q.total);
    document.getElementById('est-deposit').textContent = money(q.deposit);
    const p = new URLSearchParams({ yacht: y.id, experience: b.experience, hours: q.hours, guests });
    if (selected.size) p.set('addons', [...selected].join(','));
    document.getElementById('est-book').href = 'booking.html?' + p.toString();
  }

  f.yacht.addEventListener('change', () => { fillExperiences(); fillHours(); update(); });
  f.experience.addEventListener('change', () => { fillHours(); update(); });
  f.addEventListener('input', update);
  f.addEventListener('change', update);
  document.getElementById('est-addons').addEventListener('click', (e) => {
    const b = e.target.closest('[data-addon]');
    if (!b) return;
    const id = b.dataset.addon;
    selected.has(id) ? selected.delete(id) : selected.add(id);
    b.classList.toggle('bg-navy-950', selected.has(id));
    b.classList.toggle('text-white', selected.has(id));
    b.classList.toggle('border-navy-950', selected.has(id));
    update();
  });
  fillExperiences(); fillHours(); update();

  /* ---------- Rate table ---------- */
  document.getElementById('rate-body').innerHTML = yachts.map((y) => `
    <tr class="transition hover:bg-navy-50/60">
      <td class="px-6 py-4"><a href="yacht.html?id=${y.id}" class="flex items-center gap-4"><img src="${y.image}" alt="" class="h-12 w-16 rounded-xl object-cover"><span><span class="block font-display text-lg text-navy-950">${y.name}</span><span class="text-xs text-navy-400">${y.length} ft ${y.type}</span></span></a></td>
      <td class="px-4 py-4 font-semibold">${y.guests}</td>
      <td class="px-4 py-4 font-bold text-navy-950">${money(y.hourly)}</td>
      <td class="px-4 py-4 font-bold text-navy-950">${money(Math.round(y.hourly * pricing.weekendMultiplier))}</td>
      <td class="px-4 py-4 text-navy-600">${money(y.captainHourly)} <span class="text-xs text-navy-400">(${y.crew > 1 ? 'captain + ' + (y.crew - 1) + ' crew' : 'captain'})</span></td>
      <td class="px-4 py-4 text-navy-600">${y.minHours} hrs</td>
      <td class="px-4 py-4 font-extrabold text-brass-700">${money(CYB.startingAt(y))}</td>
      <td class="px-6 py-4 text-right"><a href="booking.html?yacht=${y.id}" class="inline-flex rounded-full bg-navy-950 px-4 py-2 text-xs font-bold text-white hover:bg-brass-400 hover:text-navy-950">Book</a></td>
    </tr>`).join('');

  /* ---------- Add-ons ---------- */
  document.getElementById('addon-grid').innerHTML = addons.map((a, i) => `
    <div class="reveal rounded-3xl border border-navy-100 p-6 transition hover:-translate-y-1 hover:shadow-card" data-delay="${i % 4}">
      <span class="grid h-12 w-12 place-items-center rounded-2xl bg-brass-100 text-brass-700"><i data-lucide="${a.icon}" class="h-6 w-6"></i></span>
      <h3 class="mt-5 text-lg font-bold text-navy-950">${a.name}</h3>
      <p class="mt-1 text-sm text-navy-500">${a.desc}</p>
      <p class="mt-4 text-xl font-extrabold text-navy-950">${money(a.price)}<span class="text-sm font-semibold text-navy-400">${a.unit === 'guest' ? ' / guest' : ' flat'}</span></p>
    </div>`).join('') + `
    <div class="reveal flex flex-col justify-center rounded-3xl bg-navy-950 p-6 text-white" data-delay="3">
      <p class="font-display text-2xl">Need something else?</p>
      <p class="mt-2 text-sm text-white/60">Florists, cakes, live music, branded décor — just ask.</p>
      <a href="contact.html" class="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brass-300">Contact our team <i data-lucide="arrow-right" class="h-4 w-4"></i></a>
    </div>`;

  CYB.refresh();
})();
