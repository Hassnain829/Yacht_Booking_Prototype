/* My boats — owner's listings (drafts, pending review, approved) */
(function () {
  const el = document.getElementById('boat-list');
  const esc = CYB.esc;
  const SECTION = { intro: 'Getting started', insuranceType: 'Boat details', location: 'Boat details', title: 'Boat details', cancellation: 'Boat details', rules: 'Boat details', features: 'Boat details', photos: 'Boat details', specs: 'Boat details', availability: 'Availability', advance: 'Availability', multi: 'Availability', operators: 'Operators and durations', insurance: 'Insurance', insuranceOwner: 'Insurance', insuranceBoat: 'Insurance', commercial: 'Insurance', review: 'Review and submit' };

  function render() {
    const list = CYB.listings.all();
    if (!list.length) {
      el.innerHTML = `
        <div class="rounded-[2rem] border-2 border-dashed border-navy-200 bg-white px-6 py-16 text-center">
          <span class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-navy-50 text-navy-400"><i data-lucide="sailboat" class="h-8 w-8"></i></span>
          <h2 class="mt-5 font-display text-3xl text-navy-950">You haven't listed a boat yet</h2>
          <p class="mx-auto mt-2 max-w-md text-sm text-navy-500">List your boat in about 15 minutes and start earning from Chicago charters — with vetted captains and secure payouts.</p>
          <a href="list-your-boat.html?new=1" class="${CYB.cls.btnPrimary} mt-8 px-8 py-4">List your boat <i data-lucide="arrow-right" class="h-4 w-4"></i></a>
        </div>`;
      CYB.icons();
      return;
    }
    el.innerHTML = list.map((l) => {
      const st = CYB.listings.status[l.status] || CYB.listings.status.draft;
      const sp = l.specs || {};
      const loc = l.location || {};
      const meta = [[sp.year, sp.make !== 'Other' ? sp.make : '', sp.model].filter(Boolean).join(' '), sp.length ? `${sp.length} ft` : '', [loc.city, loc.state].filter(Boolean).join(', ')].filter(Boolean).join(' · ');
      const photo = (l.photos || [])[0];
      const updated = new Date(l.updatedAt || l.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const isDraft = l.status === 'draft';
      return `
      <article class="flex flex-col gap-5 rounded-[1.75rem] bg-white p-4 shadow-card ring-1 ring-navy-100 sm:flex-row sm:p-5">
        <div class="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-2xl bg-navy-50 sm:aspect-auto sm:h-36 sm:w-56">
          ${photo ? `<img src="${photo}" alt="" class="h-full w-full object-cover">` : '<div class="grid h-full place-items-center text-navy-300"><i data-lucide="image-off" class="h-8 w-8"></i></div>'}
          <span class="absolute bottom-2 left-2 rounded-md bg-navy-950/75 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">${(l.photos || []).length} photos</span>
        </div>
        <div class="flex min-w-0 flex-1 flex-col">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider ${st.cls}">${st.label}</span>
            <span class="text-xs text-navy-400">Updated ${updated} · ID ${esc(l.id)}</span>
          </div>
          <h2 class="mt-2 truncate font-display text-2xl text-navy-950">${esc(CYB.listings.title(l))}</h2>
          <p class="mt-1 truncate text-sm text-navy-500">${esc(meta) || 'Details not added yet'}</p>
          ${isDraft ? `<p class="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-navy-600"><i data-lucide="list-checks" class="h-4 w-4 text-brass-500"></i>Next up: ${SECTION[l.step] || 'Boat details'}</p>` : ''}
          ${l.status === 'pending' ? '<p class="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-navy-600"><i data-lucide="clock" class="h-4 w-4 text-brass-500"></i>Our team reviews new listings within 2 business days</p>' : ''}
          <div class="mt-4 flex flex-wrap items-center justify-end gap-2 sm:mt-auto sm:pt-4">
            <button type="button" data-delete="${esc(l.id)}" class="rounded-full px-4 py-2.5 text-xs font-bold text-navy-400 hover:bg-red-50 hover:text-red-600">Delete</button>
            <a href="list-your-boat.html?id=${encodeURIComponent(l.id)}${isDraft ? '' : '&step=review'}" class="${CYB.cls.btnPrimary} px-6 py-2.5 text-xs uppercase tracking-wider">${isDraft ? 'Continue listing' : 'Edit listing'}</a>
          </div>
        </div>
      </article>`;
    }).join('') + `<p class="pt-2 text-center text-xs text-navy-400">${list.length} boat${list.length > 1 ? 's' : ''}</p>`;
    CYB.icons();
  }

  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-delete]');
    if (!b) return;
    const l = CYB.listings.get(b.dataset.delete);
    if (l && confirm(`Delete "${CYB.listings.title(l)}"? This can't be undone.`)) {
      CYB.listings.remove(l.id);
      render();
      CYB.toast('Listing deleted');
    }
  });

  render();
})();
