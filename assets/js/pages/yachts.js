/* Yachts page — filter by type / guests / harbor, sort, compare table */
(function () {
  const { yachts, harbors } = CYB.data;
  const form = document.getElementById('fleet-filters');
  const grid = document.getElementById('yacht-grid');
  const chips = document.getElementById('type-chips');
  const empty = document.getElementById('empty-state');
  const reset = document.getElementById('reset-filters');
  const params = CYB.params();

  const types = ['All', ...new Set(yachts.map((y) => y.type))];
  let activeType = 'All';

  const chipCls = (on) => `shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition ${on ? 'bg-navy-950 text-white' : 'border border-navy-200 text-navy-700 hover:border-navy-950'}`;
  const renderChips = () => {
    chips.innerHTML = types.map((t) => `<button type="button" data-type="${t}" class="${chipCls(t === activeType)}" aria-pressed="${t === activeType}">${t}</button>`).join('');
  };

  document.getElementById('harbor-select').insertAdjacentHTML('beforeend', harbors.map((h) => `<option value="${h.id}">${h.name}</option>`).join(''));
  if (params.guests) form.guests.value = params.guests;

  function apply() {
    const guests = Number(form.guests.value);
    const harbor = form.harbor.value;
    const sort = form.sort.value;
    const minFor = { 6: 1, 13: 7, 49: 14, 80: 50 };
    let list = yachts.filter((y) =>
      (activeType === 'All' || y.type === activeType) &&
      (!harbor || y.harbor === harbor) &&
      (!guests || y.guests >= (minFor[guests] || guests))
    );
    if (sort === 'price-asc') list.sort((a, b) => a.hourly - b.hourly);
    if (sort === 'price-desc') list.sort((a, b) => b.hourly - a.hourly);
    if (sort === 'guests') list.sort((a, b) => b.guests - a.guests);
    if (sort === 'popular') list.sort((a, b) => b.reviews - a.reviews);

    grid.innerHTML = list.map((y, i) => CYB.ui.yachtCard(y, { delay: i % 3 })).join('');
    document.getElementById('result-count').textContent = list.length;
    empty.classList.toggle('hidden', list.length > 0);
    reset.classList.toggle('hidden', activeType === 'All' && !guests && !harbor && sort === 'popular');
    renderChips();
    CYB.refresh();
  }

  chips.addEventListener('click', (e) => {
    const b = e.target.closest('[data-type]');
    if (!b) return;
    activeType = b.dataset.type;
    apply();
  });
  form.addEventListener('change', apply);
  reset.addEventListener('click', () => { form.reset(); activeType = 'All'; apply(); });

  // Compare table
  document.getElementById('compare-body').innerHTML = [...yachts].sort((a, b) => a.hourly - b.hourly).map((y) => `
    <tr class="transition hover:bg-navy-50/60">
      <td class="px-7 py-4"><a href="yacht.html?id=${y.id}" class="flex items-center gap-4"><img src="${y.image}" alt="" class="h-12 w-16 rounded-xl object-cover"><span class="font-display text-lg text-navy-950">${y.name}</span></a></td>
      <td class="px-4 py-4 text-navy-600">${y.type} · ${y.length} ft</td>
      <td class="px-4 py-4 font-semibold text-navy-800">${y.guests}</td>
      <td class="px-4 py-4 text-navy-600">${CYB.find.harbor(y.harbor).name}</td>
      <td class="px-4 py-4 font-extrabold text-navy-950">${CYB.fmt.money(y.hourly)}</td>
      <td class="px-4 py-4 text-navy-600">${CYB.fmt.money(y.captainHourly)}</td>
      <td class="px-7 py-4 text-right"><a href="booking.html?yacht=${y.id}" class="inline-flex rounded-full bg-navy-950 px-4 py-2 text-xs font-bold text-white hover:bg-brass-400 hover:text-navy-950">Book</a></td>
    </tr>`).join('');

  apply();
})();
