/* Owner dashboard — profile, stats, action-required notice and tool cards */
(function () {
  const esc = CYB.esc;
  const list = CYB.listings.all();
  const owner = (list.find((l) => l.owner && l.owner.firstName) || {}).owner || {};
  const name = [owner.firstName, owner.lastName].filter(Boolean).join(' ') || 'Boat owner';
  const initials = (owner.firstName || 'B')[0].toUpperCase() + (owner.lastName || 'O')[0].toUpperCase();
  const pending = list.filter((l) => l.status === 'pending');
  const drafts = list.filter((l) => l.status === 'draft');

  let notice = '';
  if (!list.length) {
    notice = action('Get started', "You haven't listed a boat yet", 'List your boat in about 15 minutes. Our team reviews every listing and helps you set the right Chicago pricing.', 'List your boat', 'list-your-boat.html?new=1');
  } else if (drafts.length) {
    notice = action('Action required', 'Your boat listing is not submitted yet', `"${esc(CYB.listings.title(drafts[0]))}" is saved as a draft. Finish the remaining steps and submit it for review.`, 'Continue listing', `list-your-boat.html?id=${encodeURIComponent(drafts[0].id)}`);
  } else if (pending.length) {
    notice = action('Action required', 'Your boat is pending review — add payout information', 'Payout information is required for your boat to be visible to renters once it\'s approved. Add your bank details now so we can activate your listing right away.', 'Update payout info', '#', 'data-soon');
  }

  function action(tag, title, text, cta, href, attr = '') {
    return `
    <div class="flex flex-col gap-5 rounded-3xl bg-white p-6 shadow-card ring-1 ring-brass-200 md:flex-row md:items-center md:p-7">
      <div class="flex-1">
        <span class="rounded-md bg-brass-400 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-navy-950">${tag}</span>
        <h2 class="mt-3 text-lg font-extrabold text-navy-950">${title}</h2>
        <p class="mt-1 text-sm leading-relaxed text-navy-500">${text}</p>
      </div>
      <a href="${href}" ${attr} class="${CYB.cls.btnPrimary} shrink-0 px-7 py-3.5 text-xs uppercase tracking-wider">${cta}</a>
    </div>`;
  }

  const big = (icon, title, text, cta, href, attr = '') => `
    <div class="flex items-center gap-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-navy-100">
      <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-navy-950 text-brass-300"><i data-lucide="${icon}" class="h-5 w-5"></i></span>
      <div class="min-w-0 flex-1"><h3 class="font-bold text-navy-950">${title}</h3><p class="mt-0.5 text-xs text-navy-500">${text}</p></div>
      <a href="${href}" ${attr} class="shrink-0 rounded-full bg-navy-950 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-brass-400 hover:text-navy-950">${cta}</a>
    </div>`;

  const tile = (icon, title, text, href, incomplete) => `
    <a href="${href}" ${href === '#' ? 'data-soon' : ''} class="group relative flex flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-navy-100 transition hover:-translate-y-1 hover:shadow-card">
      <div class="flex items-start justify-between gap-3">
        <span class="grid h-11 w-11 place-items-center rounded-2xl bg-brass-100 text-brass-700 transition group-hover:bg-brass-400 group-hover:text-navy-950"><i data-lucide="${icon}" class="h-5 w-5"></i></span>
        ${incomplete ? '<span class="rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">Incomplete</span>' : ''}
      </div>
      <h3 class="mt-5 font-bold text-navy-950">${title}</h3>
      <p class="mt-1 text-sm text-navy-500">${text}</p>
    </a>`;

  document.getElementById('dash').innerHTML = `
    <div class="flex flex-col gap-8 border-b border-navy-100 pb-10 md:flex-row md:items-center">
      <div class="flex items-center gap-5">
        <span class="relative grid h-20 w-20 shrink-0 place-items-center rounded-full bg-navy-950 font-display text-3xl text-brass-300">${esc(initials)}
          <span class="absolute -bottom-0.5 -right-0.5 grid h-7 w-7 place-items-center rounded-full bg-emerald-600 text-white ring-4 ring-shell"><i data-lucide="check" class="h-4 w-4"></i></span>
        </span>
        <div><p class="font-display text-2xl text-navy-950">${esc(name)}</p><p class="text-xs font-bold uppercase tracking-[0.18em] text-navy-400">No reviews yet</p></div>
      </div>
      <dl class="grid flex-1 grid-cols-3 divide-x divide-navy-100 rounded-3xl bg-white py-5 text-center shadow-sm ring-1 ring-navy-100 md:ml-auto md:max-w-lg">
        <div class="px-3"><dd class="text-xl font-extrabold text-navy-950">N/A</dd><dt class="mt-1 text-xs text-navy-500">Avg. response rate</dt></div>
        <div class="px-3"><dd class="text-xl font-extrabold text-navy-950">0</dd><dt class="mt-1 text-xs text-navy-500">Completed bookings</dt></div>
        <div class="px-3"><dd class="text-xl font-extrabold text-navy-950">$0.00</dd><dt class="mt-1 text-xs text-navy-500">Total earnings</dt></div>
      </dl>
    </div>

    ${notice ? `<div class="mt-10">${notice}</div>` : ''}

    <div class="mt-8 grid gap-5 md:grid-cols-2">
      ${big('calendar-check', 'Bookings', 'You have 0 bookings ready for approval.', 'Go to bookings', '#', 'data-soon')}
      ${big('mail', 'Messages', 'You have 0 unread messages.', 'Go to messages', '#', 'data-soon')}
    </div>

    <div class="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      ${tile('sailboat', `My boats${list.length ? ` (${list.length})` : ''}`, 'Manage the calendar, pricing, and other details of your boat(s).', 'my-boats.html')}
      ${tile('landmark', 'Payout preferences', 'Add or edit your bank account details.', '#', true)}
      ${tile('history', 'Payout history', 'View your payout history.', '#')}
      ${tile('user-round', 'Profile', 'View your profile page.', '#')}
      ${tile('file-text', 'Tax forms', 'Update your tax information.', '#', true)}
      ${tile('user-plus', 'My boat manager', 'Invite someone to manage your bookings, messages, and boats.', '#')}
      ${tile('life-buoy', 'Owner resources', 'Explore tools and tips to get the most out of Chicago Yacht Booking.', '#')}
      <a href="list-your-boat.html?new=1" class="flex flex-col justify-center rounded-3xl bg-navy-950 p-6 text-white transition hover:-translate-y-1 hover:shadow-card">
        <i data-lucide="circle-plus" class="h-8 w-8 text-brass-300"></i>
        <h3 class="mt-4 font-display text-2xl">List a new boat</h3>
        <p class="mt-1 text-sm text-white/60">Add another boat to your fleet.</p>
      </a>
    </div>`;

  document.getElementById('dash').addEventListener('click', (e) => {
    if (e.target.closest('[data-soon]')) {
      e.preventDefault();
      CYB.toast('This section will be available in the full platform (Laravel version).');
    }
  });
})();
