/* Yacht detail page — renders from ?id= (falls back to first yacht) */
(function () {
  const { yachts, experiences, pricing } = CYB.data;
  const params = CYB.params();
  const y = CYB.find.yacht(params.id) || yachts[0];
  const harbor = CYB.find.harbor(y.harbor);
  const exps = experiences.filter((e) => y.experiences.includes(e.id));
  const money = CYB.fmt.money;

  document.title = `${y.name} — ${y.length} ft ${y.type} | Chicago Yacht Booking`;
  document.getElementById('crumb-name').textContent = y.name;

  /* ---------- Head ---------- */
  document.getElementById('y-head').innerHTML = `
    <div class="flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div>
        <span class="inline-flex rounded-full bg-brass-400 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-navy-950">${y.badge}</span>
        <h1 class="mt-4 font-display text-5xl md:text-6xl">${y.name}</h1>
        <div class="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
          <span class="inline-flex items-center gap-1.5"><span class="flex gap-0.5">${CYB.ui.stars(y.rating)}</span><strong class="ml-1 text-white">${y.rating.toFixed(1)}</strong> (${y.reviews} reviews)</span>
          <span class="inline-flex items-center gap-1.5"><i data-lucide="sailboat" class="h-4 w-4 text-brass-300"></i>${y.length} ft ${y.type}</span>
          <span class="inline-flex items-center gap-1.5"><i data-lucide="users" class="h-4 w-4 text-brass-300"></i>Up to ${y.guests} guests</span>
          <span class="inline-flex items-center gap-1.5"><i data-lucide="map-pin" class="h-4 w-4 text-brass-300"></i>${harbor.name}</span>
        </div>
      </div>
      <div class="flex gap-2">
        <button id="share-btn" class="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold hover:bg-white hover:text-navy-950"><i data-lucide="share-2" class="h-4 w-4"></i>Share</button>
        <button id="save-btn" class="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold hover:bg-white hover:text-navy-950"><i data-lucide="heart" class="h-4 w-4"></i>Save</button>
      </div>
    </div>`;

  /* ---------- Gallery ---------- */
  const g = y.gallery;
  document.getElementById('y-gallery').innerHTML = `
    <div class="relative grid h-[340px] grid-cols-4 grid-rows-2 gap-3 overflow-hidden rounded-3xl md:h-[520px]">
      ${g.slice(0, 5).map((src, i) => `
        <button data-i="${i}" class="group relative overflow-hidden ${i === 0 ? 'col-span-4 row-span-2 md:col-span-2' : 'hidden md:block'} ${g.length < 5 && i === 1 ? 'md:row-span-2' : ''}">
          <img src="${src}" alt="${y.name} photo ${i + 1}" class="h-full w-full object-cover transition duration-700 group-hover:scale-105">
        </button>`).join('')}
      <button data-i="0" class="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-navy-950 shadow-lg hover:bg-brass-300"><i data-lucide="images" class="h-4 w-4"></i>View all ${g.length} photos</button>
    </div>`;
  document.getElementById('y-gallery').addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]');
    if (b) CYB.lightbox(g, Number(b.dataset.i));
  });

  /* ---------- Main content ---------- */
  const spec = (icon, label, value) => `
    <div class="rounded-2xl border border-navy-100 bg-white p-5">
      <i data-lucide="${icon}" class="h-5 w-5 text-brass-500"></i>
      <p class="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-navy-400">${label}</p>
      <p class="mt-1 text-lg font-extrabold text-navy-950">${value}</p>
    </div>`;
  const weekend = Math.round(y.hourly * pricing.weekendMultiplier);
  const sample = CYB.quote({ yacht: y.id, experience: 'private', hours: y.minHours, guests: Math.min(10, y.guests) });

  document.getElementById('y-main').innerHTML = `
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      ${spec('ruler', 'Length', `${y.length} ft`)}
      ${spec('users', 'Guests', `Up to ${y.guests}`)}
      ${spec('clock', 'Minimum', `${y.minHours} hours`)}
      ${spec('bed-double', 'Cabins', y.cabins || '—')}
      ${spec('bath', 'Restrooms', y.heads)}
      ${spec('calendar-check', 'Year', y.year)}
    </div>

    <div>
      <h2 class="font-display text-3xl text-navy-950">About ${y.name}</h2>
      <p class="mt-4 text-lg leading-relaxed text-navy-600">${y.description}</p>
      <div class="mt-6 flex items-start gap-4 rounded-2xl bg-brass-50 p-5 ring-1 ring-brass-200">
        <i data-lucide="ship-wheel" class="mt-0.5 h-6 w-6 shrink-0 text-brass-600"></i>
        <p class="text-sm leading-relaxed text-navy-700"><strong class="text-navy-950">${y.crew > 1 ? `Captain + ${y.crew - 1} crew included.` : 'Licensed captain included.'}</strong> Your USCG-licensed captain handles navigation, safety and docking — you just enjoy the ride.</p>
      </div>
    </div>

    <div>
      <h2 class="font-display text-3xl text-navy-950">Amenities</h2>
      <ul class="mt-6 grid gap-3 sm:grid-cols-2">
        ${y.amenities.map((a) => `<li class="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-navy-700 ring-1 ring-navy-100"><i data-lucide="circle-check" class="h-5 w-5 text-brass-500"></i>${a}</li>`).join('')}
      </ul>
    </div>

    <div>
      <h2 class="font-display text-3xl text-navy-950">Experiences on this yacht</h2>
      <p class="mt-2 text-navy-500">Choose an experience at booking — each one sets the route, timing and extras.</p>
      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        ${exps.map((e) => `
          <a href="booking.html?yacht=${y.id}&experience=${e.id}" class="group flex items-center gap-4 rounded-2xl bg-white p-3 pr-5 ring-1 ring-navy-100 transition hover:ring-brass-400">
            <img src="${e.image}" alt="" class="h-20 w-20 shrink-0 rounded-xl object-cover">
            <div class="min-w-0 flex-1">
              <p class="font-bold text-navy-950 group-hover:text-brass-600">${e.name}</p>
              <p class="mt-0.5 text-xs text-navy-500">${CYB.availability.durations(y, e).join(', ')} hrs · ${e.days ? 'Wed & Sat only' : 'Daily'}</p>
              <p class="mt-1 text-xs font-bold text-brass-600">${e.packageFee ? '+' + money(e.packageFee) + ' package' : 'No package fee'}</p>
            </div>
            <i data-lucide="arrow-right" class="h-4 w-4 text-navy-300 transition group-hover:translate-x-1 group-hover:text-brass-500"></i>
          </a>`).join('')}
      </div>
    </div>

    <div>
      <h2 class="font-display text-3xl text-navy-950">Pricing</h2>
      <div class="mt-6 overflow-hidden rounded-3xl bg-white ring-1 ring-navy-100">
        <div class="grid divide-y divide-navy-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div class="p-6"><p class="text-[11px] font-bold uppercase tracking-[0.18em] text-navy-400">Mon – Thu</p><p class="mt-2 text-3xl font-extrabold text-navy-950">${money(y.hourly)}<span class="text-sm font-semibold text-navy-400">/hr</span></p></div>
          <div class="p-6"><p class="text-[11px] font-bold uppercase tracking-[0.18em] text-navy-400">Fri – Sun</p><p class="mt-2 text-3xl font-extrabold text-navy-950">${money(weekend)}<span class="text-sm font-semibold text-navy-400">/hr</span></p></div>
          <div class="p-6"><p class="text-[11px] font-bold uppercase tracking-[0.18em] text-navy-400">Captain${y.crew > 1 ? ' & crew' : ''}</p><p class="mt-2 text-3xl font-extrabold text-navy-950">${money(y.captainHourly)}<span class="text-sm font-semibold text-navy-400">/hr</span></p></div>
        </div>
        <div class="border-t border-navy-100 bg-navy-50/60 p-6">
          <p class="text-sm font-bold text-navy-950">Example: ${y.minHours}-hour weekday private charter, ${sample.guests} guests</p>
          <dl class="mt-4 space-y-2 text-sm">
            ${sample.lines.map((l) => `<div class="flex justify-between gap-4"><dt class="text-navy-600">${l.label} <span class="text-navy-400">· ${l.sub}</span></dt><dd class="font-semibold text-navy-900">${money(l.amount)}</dd></div>`).join('')}
            <div class="flex justify-between gap-4"><dt class="text-navy-600">Taxes (est. ${Math.round(pricing.taxRate * 100)}%)</dt><dd class="font-semibold text-navy-900">${money(sample.tax)}</dd></div>
            <div class="flex justify-between gap-4 border-t border-navy-200 pt-3 text-base"><dt class="font-bold text-navy-950">Estimated total</dt><dd class="font-extrabold text-navy-950">${money(sample.total)}</dd></div>
          </dl>
          <p class="mt-3 text-xs text-navy-400">Gratuity optional, added at checkout. 50% deposit secures your date.</p>
        </div>
      </div>
    </div>

    <div class="grid gap-6 sm:grid-cols-2">
      <div class="rounded-3xl bg-white p-6 ring-1 ring-navy-100">
        <h3 class="flex items-center gap-2 text-lg font-bold text-navy-950"><i data-lucide="circle-check" class="h-5 w-5 text-emerald-600"></i>Included</h3>
        <ul class="mt-4 space-y-2.5 text-sm text-navy-600">
          <li>Licensed USCG captain${y.crew > 1 ? ' & crew' : ''}</li><li>Fuel for standard routes</li><li>Life jackets &amp; safety gear</li><li>Ice, water &amp; cups</li><li>Bluetooth sound system</li>
        </ul>
      </div>
      <div class="rounded-3xl bg-white p-6 ring-1 ring-navy-100">
        <h3 class="flex items-center gap-2 text-lg font-bold text-navy-950"><i data-lucide="info" class="h-5 w-5 text-brass-500"></i>Good to know</h3>
        <ul class="mt-4 space-y-2.5 text-sm text-navy-600">
          <li>BYOB welcome (21+), no glass</li><li>Arrive 20 minutes before departure</li><li>Soft-soled shoes on deck</li><li>Free weather rescheduling</li><li>Crew gratuity not included</li>
        </ul>
      </div>
    </div>

    <div>
      <h2 class="font-display text-3xl text-navy-950">Departure location</h2>
      <p class="mt-2 text-navy-500"><strong class="text-navy-800">${harbor.name}</strong> · ${harbor.area}. ${harbor.note}</p>
      <div class="mt-6 overflow-hidden rounded-3xl ring-1 ring-navy-100">
        <iframe title="Map of ${harbor.name}" src="https://www.google.com/maps?q=${harbor.map}&output=embed" class="h-72 w-full border-0" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
    </div>`;

  /* ---------- Booking card ---------- */
  const today = CYB.date.iso(CYB.date.today());
  const card = document.getElementById('y-book');
  card.innerHTML = `
    <form id="y-book-form" class="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-navy-100">
      <div class="bg-navy-950 p-6 text-white">
        <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-brass-300">Starting from</p>
        <p class="mt-1 text-4xl font-extrabold">${money(y.hourly)}<span class="text-base font-semibold text-white/50">/hr</span></p>
        <p class="mt-1 text-xs text-white/60">${y.minHours}-hour minimum · captain fee ${money(y.captainHourly)}/hr</p>
      </div>
      <div class="space-y-4 p-6">
        <label class="block">
          <span class="text-[11px] font-bold uppercase tracking-[0.18em] text-navy-400">Experience</span>
          <select name="experience" class="mt-1.5 w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-sm font-semibold focus:border-navy-950 focus:outline-none">
            ${exps.map((e) => `<option value="${e.id}">${e.name}</option>`).join('')}
          </select>
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="text-[11px] font-bold uppercase tracking-[0.18em] text-navy-400">Date</span>
            <input type="date" name="date" min="${today}" class="mt-1.5 w-full rounded-xl border border-navy-200 px-3 py-3 text-sm font-semibold focus:border-navy-950 focus:outline-none">
          </label>
          <label class="block">
            <span class="text-[11px] font-bold uppercase tracking-[0.18em] text-navy-400">Duration</span>
            <select name="hours" class="mt-1.5 w-full rounded-xl border border-navy-200 bg-white px-3 py-3 text-sm font-semibold focus:border-navy-950 focus:outline-none"></select>
          </label>
        </div>
        <div>
          <span class="text-[11px] font-bold uppercase tracking-[0.18em] text-navy-400">Guests</span>
          <div class="mt-1.5 flex items-center justify-between rounded-xl border border-navy-200 px-2 py-1.5">
            <button type="button" data-g="-1" class="grid h-9 w-9 place-items-center rounded-lg hover:bg-navy-50" aria-label="Fewer guests"><i data-lucide="minus" class="h-4 w-4"></i></button>
            <input name="guests" type="number" min="1" max="${y.guests}" value="${Math.min(6, y.guests)}" class="w-16 text-center text-sm font-bold focus:outline-none" aria-label="Guests">
            <button type="button" data-g="1" class="grid h-9 w-9 place-items-center rounded-lg hover:bg-navy-50" aria-label="More guests"><i data-lucide="plus" class="h-4 w-4"></i></button>
          </div>
          <p class="mt-1 text-xs text-navy-400">Maximum ${y.guests} guests (USCG limit)</p>
        </div>
        <div id="y-estimate" class="rounded-2xl bg-navy-50 p-4 text-sm"></div>
        <button class="${CYB.cls.btnPrimary} w-full py-4">Check Availability <i data-lucide="arrow-right" class="h-4 w-4"></i></button>
        <p class="flex items-center justify-center gap-2 text-xs text-navy-400"><i data-lucide="lock" class="h-3.5 w-3.5"></i>No charge until checkout</p>
      </div>
    </form>
    <div class="mt-4 flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-navy-100">
      <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brass-100 text-brass-700"><i data-lucide="phone" class="h-5 w-5"></i></span>
      <div class="text-sm"><p class="font-bold text-navy-950">Questions about ${y.name}?</p><a href="tel:${CYB.data.business.phoneHref}" class="text-brass-600 hover:underline">${CYB.data.business.phone}</a></div>
    </div>`;

  const form = document.getElementById('y-book-form');
  const fillHours = () => {
    const e = CYB.find.experience(form.experience.value);
    const ds = CYB.availability.durations(y, e);
    form.hours.innerHTML = ds.map((h) => `<option value="${h}">${h} hours</option>`).join('');
  };
  const estimate = () => {
    const guests = Math.max(1, Math.min(y.guests, Number(form.guests.value) || 1));
    const q = CYB.quote({ yacht: y.id, experience: form.experience.value, date: form.date.value, hours: form.hours.value, guests });
    document.getElementById('y-estimate').innerHTML = `
      <div class="flex justify-between"><span class="text-navy-500">Charter + captain</span><span class="font-semibold">${money(q.charter + q.captain)}</span></div>
      <div class="mt-1 flex justify-between"><span class="text-navy-500">Package, fees &amp; tax</span><span class="font-semibold">${money(q.total - q.charter - q.captain)}</span></div>
      <div class="mt-2 flex justify-between border-t border-navy-200 pt-2"><span class="font-bold text-navy-950">Estimated total</span><span class="font-extrabold text-navy-950">${money(q.total)}</span></div>
      ${q.weekend ? '<p class="mt-2 text-xs font-semibold text-brass-700">Weekend rate applied</p>' : ''}`;
    mobileBar(q);
  };
  form.experience.addEventListener('change', () => { fillHours(); estimate(); });
  form.addEventListener('input', estimate);
  form.addEventListener('click', (e) => {
    const b = e.target.closest('[data-g]');
    if (!b) return;
    form.guests.value = Math.max(1, Math.min(y.guests, (Number(form.guests.value) || 1) + Number(b.dataset.g)));
    estimate();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const p = new URLSearchParams({ yacht: y.id, experience: form.experience.value, hours: form.hours.value, guests: form.guests.value });
    if (form.date.value) p.set('date', form.date.value);
    location.href = 'booking.html?' + p.toString();
  });

  function mobileBar(q) {
    document.getElementById('mobile-book-bar').innerHTML = `
      <div class="flex items-center justify-between gap-4">
        <div><p class="text-xs text-navy-400">Est. total · ${q.hours} hrs</p><p class="text-xl font-extrabold text-navy-950">${money(q.total)}</p></div>
        <a href="booking.html?yacht=${y.id}&experience=${form.experience.value}&hours=${form.hours.value}&guests=${form.guests.value}${form.date.value ? '&date=' + form.date.value : ''}" class="${CYB.cls.btnPrimary} px-7">Book Now</a>
      </div>`;
  }

  fillHours();
  estimate();

  /* ---------- Share / save ---------- */
  document.getElementById('share-btn').addEventListener('click', async () => {
    try {
      if (navigator.share) await navigator.share({ title: y.name, url: location.href });
      else { await navigator.clipboard.writeText(location.href); CYB.toast('Link copied to clipboard'); }
    } catch (err) { /* user cancelled */ }
  });
  document.getElementById('save-btn').addEventListener('click', (e) => {
    const saved = CYB.store.get('saved', []);
    const on = !saved.includes(y.id);
    CYB.store.set('saved', on ? [...saved, y.id] : saved.filter((s) => s !== y.id));
    e.currentTarget.classList.toggle('bg-white', on);
    e.currentTarget.classList.toggle('text-navy-950', on);
    CYB.toast(on ? `${y.name} saved to your favorites` : 'Removed from favorites');
  });

  /* ---------- Similar ---------- */
  const similar = yachts.filter((o) => o.id !== y.id).sort((a, b) => Math.abs(a.guests - y.guests) - Math.abs(b.guests - y.guests)).slice(0, 3);
  document.getElementById('similar').innerHTML = similar.map((o, i) => CYB.ui.yachtCard(o, { delay: i })).join('');
})();
