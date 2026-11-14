/* Experiences page — alternating feature rows with category filter */
(function () {
  const { experiences, yachts } = CYB.data;
  const list = document.getElementById('exp-list');
  const filter = document.getElementById('exp-filter');
  const money = CYB.fmt.money;

  function row(e, i) {
    const boats = yachts.filter((y) => y.experiences.includes(e.id));
    const from = Math.min(...boats.map((y) => CYB.startingAt(y, e)));
    const flip = i % 2 === 1;
    return `
    <article id="${e.id}" class="grid scroll-mt-40 items-center gap-10 lg:grid-cols-2 lg:gap-20">
      <div class="reveal relative ${flip ? 'lg:order-2' : ''}">
        <div class="overflow-hidden rounded-[2rem]"><img src="${e.image}" alt="${e.name}" loading="lazy" class="aspect-[5/4] w-full object-cover transition duration-[1.2s] hover:scale-105"></div>
        <div class="absolute -bottom-6 ${flip ? 'left-6' : 'right-6'} rounded-2xl bg-white p-5 shadow-card">
          <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-navy-400">All-in from</p>
          <p class="text-2xl font-extrabold text-navy-950">${money(from)}</p>
          <p class="text-xs text-navy-400">incl. captain · before tax</p>
        </div>
      </div>
      <div class="reveal" data-delay="1">
        <p class="inline-flex items-center gap-2 rounded-full bg-brass-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brass-800"><i data-lucide="${e.icon}" class="h-3.5 w-3.5"></i>${e.tagline}</p>
        <h2 class="mt-4 font-display text-4xl leading-tight text-navy-950 md:text-5xl">${e.name}</h2>
        <p class="mt-4 text-lg leading-relaxed text-navy-600">${e.description}</p>
        <ul class="mt-6 grid gap-2.5 sm:grid-cols-2">
          ${e.includes.map((x) => `<li class="flex items-center gap-2.5 text-sm font-semibold text-navy-700"><i data-lucide="circle-check" class="h-5 w-5 shrink-0 text-brass-500"></i>${x}</li>`).join('')}
        </ul>
        <div class="mt-7 grid grid-cols-3 divide-x divide-navy-100 rounded-2xl bg-white py-4 ring-1 ring-navy-100">
          <div class="px-4"><p class="text-[10px] font-bold uppercase tracking-[0.18em] text-navy-400">Duration</p><p class="mt-1 text-sm font-bold text-navy-950">${e.durations[0]}–${e.durations[e.durations.length - 1]} hrs</p></div>
          <div class="px-4"><p class="text-[10px] font-bold uppercase tracking-[0.18em] text-navy-400">Departures</p><p class="mt-1 text-sm font-bold text-navy-950">${CYB.fmt.time(e.slots[0])}${e.slots.length > 1 ? ' +' + (e.slots.length - 1) : ''}</p></div>
          <div class="px-4"><p class="text-[10px] font-bold uppercase tracking-[0.18em] text-navy-400">Available</p><p class="mt-1 text-sm font-bold text-navy-950">${e.days ? 'Wed &amp; Sat' : 'Daily'}</p></div>
        </div>
        <div class="mt-6 flex items-center gap-3">
          <div class="flex -space-x-3">${boats.slice(0, 4).map((y) => `<img src="${y.image}" alt="${y.name}" title="${y.name}" class="h-10 w-10 rounded-full object-cover ring-2 ring-shell">`).join('')}</div>
          <p class="text-xs font-semibold text-navy-500">${boats.length} yachts offer this experience</p>
        </div>
        <div class="mt-8 flex flex-wrap gap-3">
          <a href="booking.html?experience=${e.id}" class="${CYB.cls.btnPrimary} px-7 py-3.5">Book this experience <i data-lucide="arrow-right" class="h-4 w-4"></i></a>
          <a href="yachts.html" class="${CYB.cls.btnOutline} px-7 py-3.5">See yachts</a>
        </div>
      </div>
    </article>`;
  }

  function render(cat) {
    const items = experiences.filter((e) => cat === 'all' || e.category === cat);
    list.innerHTML = items.map(row).join('');
    CYB.refresh();
  }

  filter.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-cat]');
    if (!b) return;
    filter.querySelectorAll('button').forEach((x) => {
      x.className = x === b
        ? 'shrink-0 rounded-full bg-navy-950 px-5 py-2.5 text-sm font-bold text-white'
        : 'shrink-0 rounded-full border border-navy-200 px-5 py-2.5 text-sm font-bold text-navy-700 hover:border-navy-950';
    });
    render(b.dataset.cat);
  });

  render('all');
})();
