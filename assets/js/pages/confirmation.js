/* Confirmation page — reads the confirmation saved by checkout.js (or shows a sample) */
(function () {
  const money = CYB.fmt.money;
  const B = CYB.data.business;
  let c = CYB.store.get('confirmation');
  const isDemo = !c || !CYB.find.yacht(c.booking?.yacht);

  if (isDemo) {
    const y = CYB.find.yacht('azure'), e = CYB.find.experience('sunset');
    const date = CYB.date.addDays(CYB.date.iso(CYB.date.today()), 14);
    const q = CYB.quote({ yacht: y.id, experience: e.id, date, hours: 3, guests: 8, addons: ['champagne'], gratuity: 18, payMode: 'deposit' });
    c = {
      ref: 'CYB-DEMO42', createdAt: new Date().toISOString(),
      booking: { yacht: y.id, experience: e.id, date, time: '18:00', hours: 3, guests: 8, addons: ['champagne'], occasion: 'Birthday', notes: '' },
      contact: { firstName: 'Alex', lastName: 'Morgan', email: 'alex@example.com', phone: '(312) 555-0100' },
      payment: { mode: 'deposit', gratuity: 18, promo: '', card: '•••• 4242', brand: 'Visa' },
      totals: { total: q.total, paid: q.dueNow, balance: q.balance, balanceDate: CYB.date.addDays(date, -7) },
    };
  }

  const bk = c.booking;
  const y = CYB.find.yacht(bk.yacht);
  const e = CYB.find.experience(bk.experience);
  const h = CYB.find.harbor(y.harbor);
  const end = CYB.fmt.addHours(bk.time, bk.hours);
  const addonNames = (bk.addons || []).map((id) => CYB.find.addon(id)?.name).filter(Boolean);

  document.getElementById('confirmation').innerHTML = `
    <section class="relative isolate overflow-hidden bg-navy-950 pb-36 pt-40 text-center text-white">
      <img src="${y.image}" alt="" class="absolute inset-0 -z-20 h-full w-full object-cover opacity-30">
      <div class="absolute inset-0 -z-10 bg-gradient-to-b from-navy-950/60 to-navy-950"></div>
      <div class="container">
        ${isDemo ? '<p class="no-print mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white/80"><i data-lucide="info" class="h-4 w-4 text-brass-300"></i>Sample confirmation for the demo</p>' : ''}
        <span class="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brass-400 text-navy-950 shadow-glow"><i data-lucide="check" class="h-10 w-10"></i></span>
        <h1 class="mt-6 font-display text-4xl md:text-6xl">You're booked, ${CYB.esc(c.contact.firstName)}!</h1>
        <p class="mx-auto mt-4 max-w-xl text-white/70">A confirmation has been sent to <strong class="text-white">${CYB.esc(c.contact.email)}</strong>. We can't wait to welcome you aboard ${y.name}.</p>
        <p class="mt-6 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm">
          <span class="text-white/60">Booking reference</span><strong class="font-mono tracking-widest text-brass-300">${c.ref}</strong>
          <button id="copy-ref" class="no-print text-white/60 hover:text-white" aria-label="Copy reference"><i data-lucide="copy" class="h-4 w-4"></i></button>
        </p>
      </div>
    </section>

    <section class="relative z-10 -mt-24">
      <div class="container grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div class="space-y-6">
          <div class="overflow-hidden rounded-[2rem] bg-white shadow-card ring-1 ring-navy-100">
            <div class="flex flex-col gap-5 p-6 sm:flex-row sm:items-center md:p-8">
              <img src="${y.image}" alt="${y.name}" class="h-28 w-full rounded-2xl object-cover sm:w-40">
              <div class="flex-1">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-brass-600">${e.name}</p>
                <h2 class="mt-1 font-display text-3xl text-navy-950">${y.name}</h2>
                <p class="mt-1 text-sm text-navy-500">${y.length} ft ${y.type} · ${y.crew > 1 ? 'Captain + crew' : 'Licensed captain'} included</p>
              </div>
              <span class="inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200"><i data-lucide="circle-check" class="h-4 w-4"></i>Confirmed</span>
            </div>
            <dl class="grid grid-cols-2 gap-px border-t border-navy-100 bg-navy-100 md:grid-cols-4">
              <div class="bg-white p-5"><dt class="text-[10px] font-bold uppercase tracking-[0.18em] text-navy-400">Date</dt><dd class="mt-1 font-bold text-navy-950">${CYB.fmt.date(bk.date, { weekday: 'short', month: 'long', day: 'numeric' })}</dd></div>
              <div class="bg-white p-5"><dt class="text-[10px] font-bold uppercase tracking-[0.18em] text-navy-400">Time</dt><dd class="mt-1 font-bold text-navy-950">${CYB.fmt.time(bk.time)} – ${CYB.fmt.time(end)}</dd></div>
              <div class="bg-white p-5"><dt class="text-[10px] font-bold uppercase tracking-[0.18em] text-navy-400">Guests</dt><dd class="mt-1 font-bold text-navy-950">${bk.guests}</dd></div>
              <div class="bg-white p-5"><dt class="text-[10px] font-bold uppercase tracking-[0.18em] text-navy-400">Duration</dt><dd class="mt-1 font-bold text-navy-950">${bk.hours} hours</dd></div>
            </dl>
            ${addonNames.length || bk.occasion ? `
            <div class="flex flex-wrap gap-2 border-t border-navy-100 p-6 md:px-8">
              ${bk.occasion ? `<span class="rounded-full bg-brass-50 px-3 py-1.5 text-xs font-bold text-brass-800 ring-1 ring-brass-200">${CYB.esc(bk.occasion)}</span>` : ''}
              ${addonNames.map((n) => `<span class="rounded-full bg-navy-50 px-3 py-1.5 text-xs font-bold text-navy-700">+ ${n}</span>`).join('')}
            </div>` : ''}
            <div class="no-print flex flex-wrap gap-3 border-t border-navy-100 bg-navy-50/50 p-6 md:px-8">
              <button id="ics-btn" class="${CYB.cls.btnDark}"><i data-lucide="calendar-plus" class="h-4 w-4"></i>Add to calendar</button>
              <button onclick="window.print()" class="${CYB.cls.btnOutline}"><i data-lucide="printer" class="h-4 w-4"></i>Print</button>
              <a href="https://www.google.com/maps/search/?api=1&query=${h.map}" target="_blank" rel="noopener" class="${CYB.cls.btnOutline}"><i data-lucide="navigation" class="h-4 w-4"></i>Directions</a>
            </div>
          </div>

          <div class="rounded-[2rem] bg-white p-6 shadow-card ring-1 ring-navy-100 md:p-8">
            <h3 class="font-display text-2xl text-navy-950">What happens next</h3>
            <ol class="mt-6 space-y-6">
              ${[
                ['mail-check', 'Confirmation email', 'Your receipt, booking details and waiver link are on the way to your inbox.'],
                ['users', 'Share with your crew', 'Forward the waiver link so every guest can sign before boarding.'],
                ['message-circle', 'Your captain reaches out', 'Expect a text 24 hours before departure with the exact dock and weather update.'],
                ['anchor', 'Arrive & set sail', `Check in at ${h.name} 20 minutes early. Bring ID, sunscreen and your playlist.`],
              ].map(([icon, t, d], i) => `
                <li class="relative flex gap-4">
                  ${i < 3 ? '<span class="absolute left-5 top-11 h-[calc(100%-1rem)] w-px bg-navy-100"></span>' : ''}
                  <span class="relative grid h-10 w-10 shrink-0 place-items-center rounded-full ${i === 0 ? 'bg-brass-400 text-navy-950' : 'bg-navy-50 text-navy-600'}"><i data-lucide="${icon}" class="h-5 w-5"></i></span>
                  <div><p class="font-bold text-navy-950">${t}</p><p class="mt-0.5 text-sm text-navy-500">${d}</p></div>
                </li>`).join('')}
            </ol>
          </div>

          <div class="overflow-hidden rounded-[2rem] bg-white shadow-card ring-1 ring-navy-100">
            <div class="p-6 md:p-8">
              <h3 class="font-display text-2xl text-navy-950">Meeting point: ${h.name}</h3>
              <p class="mt-1 text-sm text-navy-500">${h.area}. ${h.note}</p>
            </div>
            <iframe title="Map of ${h.name}" src="https://www.google.com/maps?q=${h.map}&output=embed" class="h-64 w-full border-0" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
          </div>
        </div>

        <aside class="space-y-6">
          <div class="rounded-[2rem] bg-white p-6 shadow-card ring-1 ring-navy-100">
            <h3 class="text-lg font-extrabold text-navy-950">Payment summary</h3>
            <dl class="mt-4 space-y-2.5 text-sm">
              <div class="flex justify-between"><dt class="text-navy-500">Booking total</dt><dd class="font-bold text-navy-950">${money(c.totals.total)}</dd></div>
              <div class="flex justify-between"><dt class="text-navy-500">Paid today</dt><dd class="font-bold text-emerald-700">${money(c.totals.paid)}</dd></div>
              ${c.totals.balance > 0 ? `<div class="flex justify-between"><dt class="text-navy-500">Balance due${c.totals.balanceDate ? ' ' + CYB.fmt.date(c.totals.balanceDate, { month: 'short', day: 'numeric' }) : ''}</dt><dd class="font-bold text-navy-950">${money(c.totals.balance)}</dd></div>` : ''}
              <div class="flex justify-between border-t border-navy-100 pt-3"><dt class="text-navy-500">Card</dt><dd class="font-semibold text-navy-700">${CYB.esc(c.payment.brand)} ${c.payment.card}</dd></div>
              <div class="flex justify-between"><dt class="text-navy-500">Gratuity</dt><dd class="font-semibold text-navy-700">${c.payment.gratuity}%</dd></div>
              ${c.payment.promo ? `<div class="flex justify-between"><dt class="text-navy-500">Promo</dt><dd class="font-semibold text-emerald-700">${c.payment.promo}</dd></div>` : ''}
            </dl>
          </div>

          <div class="rounded-[2rem] bg-navy-950 p-6 text-white">
            <h3 class="text-lg font-extrabold">What to bring</h3>
            <ul class="mt-4 space-y-2.5 text-sm text-white/75">
              ${['Photo ID (21+ for BYOB)', 'Sunscreen & sunglasses', 'Soft-soled shoes', 'A light layer for the evening', 'Drinks & snacks (no glass)'].map((x) => `<li class="flex items-center gap-2.5"><i data-lucide="check" class="h-4 w-4 text-brass-300"></i>${x}</li>`).join('')}
            </ul>
          </div>

          <div class="rounded-[2rem] bg-white p-6 shadow-card ring-1 ring-navy-100">
            <h3 class="text-lg font-extrabold text-navy-950">Need to change something?</h3>
            <p class="mt-2 text-sm text-navy-500">Free date changes up to 14 days before your charter.</p>
            <div class="mt-4 space-y-2 text-sm">
              <a href="tel:${B.phoneHref}" class="flex items-center gap-2 font-bold text-navy-900 hover:text-brass-600"><i data-lucide="phone" class="h-4 w-4 text-brass-500"></i>${B.phone}</a>
              <a href="mailto:${B.email}" class="flex items-center gap-2 font-bold text-navy-900 hover:text-brass-600"><i data-lucide="mail" class="h-4 w-4 text-brass-500"></i>${B.email}</a>
            </div>
          </div>

          <a href="index.html" class="no-print ${CYB.cls.btnPrimary} w-full py-4">Back to home</a>
        </aside>
      </div>
    </section>`;

  /* ---------- Copy reference ---------- */
  document.getElementById('copy-ref').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(c.ref); CYB.toast('Booking reference copied'); }
    catch (err) { CYB.toast(c.ref); }
  });

  /* ---------- .ics calendar file ---------- */
  document.getElementById('ics-btn').addEventListener('click', () => {
    const stamp = (iso, t) => iso.replace(/-/g, '') + 'T' + t.replace(':', '') + '00';
    const endDate = Number(end.split(':')[0]) < Number(bk.time.split(':')[0]) ? CYB.date.addDays(bk.date, 1) : bk.date;
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Chicago Yacht Booking//EN', 'BEGIN:VEVENT',
      `UID:${c.ref}@${B.domain}`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART;TZID=America/Chicago:${stamp(bk.date, bk.time)}`,
      `DTEND;TZID=America/Chicago:${stamp(endDate, end)}`,
      `SUMMARY:${e.name} on ${y.name}`,
      `LOCATION:${h.name}\\, Chicago\\, IL`,
      `DESCRIPTION:Booking ${c.ref} · ${bk.guests} guests · Arrive 20 minutes early. Questions: ${B.phone}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = `${c.ref}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
})();
