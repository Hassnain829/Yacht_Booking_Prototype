/**
 * "List your boat" — owner onboarding wizard
 * ------------------------------------------------------------
 * Sections: Boat details → Availability → Operators & durations (+ insurance) → Review & submit
 * Mockup: draft auto-saves to localStorage (CYB.listings). Laravel: listings table, one PATCH per step,
 * photos to storage/app/public, status: draft → pending → approved (approved by admin in the dashboard).
 */
(function () {
  const O = CYB.data.listing;
  const P = CYB.params();
  const esc = CYB.esc;
  const $ = (id) => document.getElementById(id);

  const DAYS = [['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'], ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday']];
  const TIMES = Array.from({ length: 35 }, (_, i) => { const m = 5 * 60 + i * 30; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; }); // 05:00 → 22:00
  const YEARS = Array.from({ length: 77 }, (_, i) => String(new Date().getFullYear() + 1 - i));
  const SECTIONS = ['Boat details', 'Availability', 'Operators and durations', 'Review and submit'];

  /* ------------------------------------------------------------------ */
  /* State                                                               */
  /* ------------------------------------------------------------------ */
  const blank = () => ({
    id: 'BL-' + Date.now().toString(36).toUpperCase(),
    status: 'draft', step: 'intro', createdAt: new Date().toISOString(),
    insuranceType: '',
    location: { type: '', country: 'United States', street: '', city: 'Chicago', state: 'IL', zip: '' },
    title: '', description: '',
    cancellation: 'flexible',
    rules: [], features: [], extras: [], navigation: [],
    photos: [], photosSkipped: false,
    specs: { registration: '', year: '', make: '', model: '', type: '', length: '', category: '', engines: '', horsepower: '', engineYear: '', engineType: '', staterooms: '', sleeps: '', beds: '', passengers: '' },
    availability: { mode: 'default', days: Object.fromEntries(DAYS.map(([k]) => [k, { on: true, start: '08:00', end: '18:00' }])) },
    advanceNotice: '1h',
    multiBooking: { allow: '', buffer: '1h' },
    operators: { renter: false, captain: true, captainNetwork: 'yes', fishingCharter: 'no' },
    durations: [2, 3, 4, 6, 8],
    fuel: 'renter',
    insuranceOwner: { years: '', company: '', claims: 'no', criminal: 'no', overCapacity: 'no', bankruptcy: 'no', business: 'no', otherPolicy: 'no' },
    insuranceBoat: { value: '', customized: 'no', underlying: 'no', attachments: 'no', seaworthy: 'yes', racing: 'no', special: 'no', captained: 'yes' },
    commercial: { carrier: '', policy: '', expires: '', liability: '', coi: '' },
    owner: { firstName: '', lastName: '', email: '', phone: '' },
  });

  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  function hydrate(saved) {
    const b = blank();
    Object.keys(saved).forEach((k) => {
      if (isObj(b[k]) && isObj(saved[k])) {
        b[k] = { ...b[k], ...saved[k] };
        if (k === 'availability' && isObj(saved[k].days)) b[k].days = { ...blank().availability.days, ...saved[k].days };
      } else b[k] = saved[k];
    });
    return b;
  }

  let s;
  let restored = false;
  if (P.id && CYB.listings.get(P.id)) s = hydrate(CYB.listings.get(P.id));
  else if (!P.new) {
    const draft = CYB.listings.all().find((l) => l.status === 'draft');
    if (draft) { s = hydrate(draft); restored = s.step !== 'intro'; }
  }
  if (!s) s = blank();
  if (P.step) s.step = P.step;
  if (s.step === 'done') s.step = 'review';
  let returnToReview = false;
  let lastStep = null;

  const getP = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), s);
  const setP = (path, v) => { const ks = path.split('.'); const last = ks.pop(); ks.reduce((o, k) => o[k], s)[last] = v; };
  const len = () => Number(s.specs.length) || 0;
  const rec = () => s.insuranceType !== 'commercial';

  /* ------------------------------------------------------------------ */
  /* UI building blocks (same look as the rest of the site)              */
  /* ------------------------------------------------------------------ */
  const inputCls = 'mt-2 w-full rounded-xl border border-navy-200 bg-white px-4 py-3.5 text-sm text-navy-950 placeholder:text-navy-300 focus:border-navy-950 focus:outline-none focus:ring-4 focus:ring-navy-100 disabled:bg-navy-50';
  const badge = (t) => `<span class="rounded-md bg-brass-400 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-navy-950">${t}</span>`;
  const radioDot = (on, dark = on) => `<span class="grid h-5 w-5 shrink-0 place-items-center rounded-full ring-2 ${on ? 'ring-brass-400' : dark ? 'ring-white/40' : 'ring-navy-300'}">${on ? '<span class="h-2.5 w-2.5 rounded-full bg-brass-400"></span>' : ''}</span>`;
  const checkBox = (on) => `<span class="grid h-5 w-5 shrink-0 place-items-center rounded-md ${on ? 'bg-brass-400 text-navy-950' : 'bg-white ring-2 ring-navy-200'}">${on ? '<i data-lucide="check" class="h-3.5 w-3.5"></i>' : ''}</span>`;
  const h3 = (t, extra = '') => `<h3 class="text-lg font-extrabold text-navy-950 ${extra}">${t}</h3>`;

  function field({ label, bind, type = 'text', placeholder = '', options, required, hint, attrs = '', span = '', rerender }) {
    const v = getP(bind) ?? '';
    const lab = `<span class="text-sm font-bold text-navy-800">${label}${required ? ' <span class="text-brass-600">*</span>' : ''}</span>`;
    const common = `data-bind="${bind}" ${rerender ? 'data-rerender' : ''} ${attrs}`;
    let control;
    if (options) {
      control = `<select ${common} class="${inputCls}"><option value="">Select…</option>${options.map((o) => {
        const [val, lbl] = Array.isArray(o) ? o : [o, o];
        return `<option value="${esc(val)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(lbl)}</option>`;
      }).join('')}</select>`;
    } else if (type === 'textarea') {
      control = `<textarea ${common} rows="9" placeholder="${esc(placeholder)}" class="${inputCls}">${esc(v)}</textarea>`;
    } else {
      control = `<input ${common} type="${type}" value="${esc(v)}" placeholder="${esc(placeholder)}" class="${inputCls}">`;
    }
    return `<label class="block ${span}">${lab}${control}${hint ? `<span class="mt-1.5 block text-xs text-navy-400">${hint}</span>` : ''}</label>`;
  }

  function radioCard({ group, value, title, sub, tag, body = '', selected }) {
    return `
    <div class="overflow-hidden rounded-2xl ring-2 transition ${selected ? 'shadow-card ring-navy-950' : 'ring-navy-100 hover:ring-navy-300'}">
      <button type="button" data-radio="${group}" data-value="${value}" aria-pressed="${selected}" class="flex w-full items-center gap-4 p-5 text-left md:p-6 ${selected ? 'bg-navy-950 text-white' : 'bg-white text-navy-950'}">
        ${radioDot(selected, false)}
        <span class="min-w-0 flex-1">
          <span class="flex flex-wrap items-center gap-2"><span class="text-base font-bold md:text-lg">${title}</span>${tag ? badge(tag) : ''}</span>
          ${sub ? `<span class="mt-0.5 block text-sm ${selected ? 'text-white/70' : 'text-navy-500'}">${sub}</span>` : ''}
        </span>
      </button>
      ${selected && body ? `<div class="border-t border-navy-100 bg-white p-5 text-sm leading-relaxed text-navy-600 md:p-6">${body}</div>` : ''}
    </div>`;
  }

  /** small radio tiles in a grid: items = [[value, label], …] */
  function radioTiles(group, items, cols = 'sm:grid-cols-3') {
    const cur = String(getP(group));
    return `<div class="grid grid-cols-2 gap-3 ${cols}">${items.map(([val, lbl]) => {
      const on = cur === String(val);
      return `<button type="button" data-radio="${group}" data-value="${val}" aria-pressed="${on}" class="flex items-center gap-3 rounded-2xl px-4 py-4 text-left text-sm font-bold ring-2 transition ${on ? 'bg-navy-950 text-white ring-navy-950' : 'bg-white text-navy-800 ring-navy-100 hover:ring-navy-300'}">${radioDot(on, false)}${lbl}</button>`;
    }).join('')}</div>`;
  }

  /** checkbox tiles: items = strings or [value, label] */
  function checkTiles(path, items, cols = 'sm:grid-cols-2 xl:grid-cols-3') {
    const arr = getP(path);
    return `<div class="grid gap-3 ${cols}">${items.map((it) => {
      const [val, lbl] = Array.isArray(it) ? it : [it, it];
      const on = arr.includes(val);
      return `<button type="button" data-check="${path}" data-value="${esc(val)}" aria-pressed="${on}" class="flex items-center gap-3 rounded-2xl px-4 py-4 text-left text-sm font-semibold ring-2 transition ${on ? 'bg-navy-950 text-white ring-navy-950' : 'bg-white text-navy-800 ring-navy-100 hover:ring-navy-300'}">${checkBox(on)}${esc(lbl)}</button>`;
    }).join('')}</div>`;
  }

  function yesNo(path, question, opts = {}) {
    const v = getP(path);
    const btn = (val, label) => {
      const on = v === val;
      const dis = opts.lock && opts.lock !== val;
      return `<button type="button" data-radio="${path}" data-value="${val}" ${dis ? 'disabled' : ''} class="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold ring-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${on ? 'bg-navy-950 text-white ring-navy-950' : 'bg-white text-navy-800 ring-navy-100 hover:ring-navy-300'}">${radioDot(on, false)}${label}</button>`;
    };
    return `
      <div class="border-b border-navy-100 py-6 last:border-0">
        <p class="text-sm font-semibold leading-relaxed text-navy-800">${question}</p>
        ${opts.note ? `<p class="mt-1 text-xs text-brass-700">${opts.note}</p>` : ''}
        <div class="mt-3 grid grid-cols-2 gap-3">${btn('no', 'No')}${btn('yes', 'Yes')}</div>
      </div>`;
  }

  const tipsCard = (title, inner) => `
    <div class="mt-10 hidden rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur md:block">
      <div class="flex items-center gap-3 border-b border-white/10 pb-4">
        <i data-lucide="lightbulb" class="h-7 w-7 shrink-0 text-brass-300"></i>
        <p class="text-sm font-semibold text-white">${title}</p>
      </div>
      <div class="pt-4 text-sm leading-relaxed text-white/70">${inner}</div>
    </div>`;
  const bullets = (items) => `<ul class="list-disc space-y-2 pl-5">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;

  /* ------------------------------------------------------------------ */
  /* Steps                                                               */
  /* ------------------------------------------------------------------ */
  const STEPS = [
    {
      id: 'intro', section: 0,
      left: () => ({ title: "Let's get started", text: 'You\'ll be done in less than 15 minutes.' }),
      body: () => `
        <div class="rounded-[2rem] bg-white p-8 shadow-card ring-1 ring-navy-100 md:p-10">
          <p class="font-display text-3xl text-navy-950">List your boat in 5 quick steps</p>
          <ol class="mt-8 space-y-0">
            ${O.steps.map((t, i) => `
              <li class="relative flex gap-4 pb-7 last:pb-0">
                ${i < O.steps.length - 1 ? '<span class="absolute left-[13px] top-8 h-[calc(100%-1.5rem)] w-0.5 bg-navy-100"></span>' : ''}
                <span class="relative grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brass-400 text-xs font-extrabold text-navy-950">${i + 1}</span>
                <p class="pt-0.5 font-bold text-navy-900">${t}</p>
              </li>`).join('')}
          </ol>
        </div>
        <div class="mt-6 grid gap-3 sm:grid-cols-3">
          ${[['ship-wheel', 'Vetted USCG captains'], ['shield-check', 'Secure payouts'], ['calendar-check', 'You control the calendar']].map(([ic, t]) => `
            <div class="flex items-center gap-3 rounded-2xl bg-navy-50 px-4 py-3 text-xs font-bold text-navy-700"><i data-lucide="${ic}" class="h-5 w-5 shrink-0 text-brass-600"></i>${t}</div>`).join('')}
        </div>`,
    },

    /* ---------------- Boat details ---------------- */
    {
      id: 'insuranceType', section: 1,
      left: () => ({ title: 'What type of insurance do you have?', text: 'You must have existing insurance in order for your boat to be approved. This can be recreational boat insurance or commercial charter operator insurance.' }),
      valid: () => !!s.insuranceType,
      body: () => `<div class="space-y-5">
        ${radioCard({ group: 'insuranceType', value: 'recreational', title: 'I have recreational boat insurance', sub: 'Select this if you own a personal boat.', tag: 'Most common', selected: s.insuranceType === 'recreational',
          body: `<p>Chicago Yacht Booking partners with a trip-based marine insurer to offer an insurance plan for owners listing their personal boats. This rental policy covers the boat during each booking. It's added on top of your recreational policy for a fee, so you can rent your boat peer-to-peer.</p>
                 <p class="mt-4 inline-flex items-center gap-2 font-bold text-navy-900"><i data-lucide="shield-check" class="h-5 w-5 text-brass-500"></i>Coverage is arranged later in this flow</p>` })}
        ${radioCard({ group: 'insuranceType', value: 'commercial', title: 'I have commercial charter insurance', sub: 'Select this if you run a boat rental or charter business.', selected: s.insuranceType === 'commercial',
          body: '<p>You\'ll add your carrier and policy details later in this flow. Your policy must list Chicago Yacht Booking as an additional insured.</p>' })}
      </div>`,
    },
    {
      id: 'location', section: 1,
      left: () => ({ title: 'Where is your boat?', text: "To protect your privacy, we only show your boat's exact location to guests once you've confirmed their trip." }),
      valid: () => !!(s.location.type && s.location.street.trim() && s.location.city.trim() && s.location.state && s.location.zip.trim()),
      body: () => `
        ${field({ label: 'Location type', bind: 'location.type', options: O.locationTypes, required: true, rerender: true })}
        ${s.location.type ? `
          <div class="mt-6 grid gap-5 sm:grid-cols-2">
            ${field({ label: 'Country / Territory', bind: 'location.country', options: O.countries, required: true, span: 'sm:col-span-2' })}
            ${field({ label: 'Street address', bind: 'location.street', placeholder: 'e.g. 111 N Lake Shore Dr', required: true, span: 'sm:col-span-2', attrs: 'autocomplete="address-line1"' })}
            ${field({ label: 'City', bind: 'location.city', required: true, attrs: 'autocomplete="address-level2"' })}
            ${field({ label: 'State / Province', bind: 'location.state', options: O.states, required: true })}
            ${field({ label: 'Zip code', bind: 'location.zip', placeholder: '60601', required: true, attrs: 'inputmode="numeric" maxlength="10" autocomplete="postal-code"' })}
          </div>
          <p class="mt-5 flex items-center gap-2 text-xs text-navy-500"><i data-lucide="lock" class="h-4 w-4 text-brass-500"></i>Your exact address is only shared with confirmed guests.</p>` : ''}`,
    },
    {
      id: 'title', section: 1,
      left: () => ({
        title: 'Your boat listing',
        tips: tipsCard('This is what renters will see when looking for boats in Chicago. You can always edit this later.', `
          <p class="font-semibold text-white">Boat title</p><p class="mt-1">A great title helps your boat stand out in search results.</p>
          <div class="my-4 h-px bg-white/10"></div>
          <p class="font-semibold text-white">Boat description</p><p class="mb-3 mt-1">A detailed description helps renters know what to expect when renting your boat. Some important details you should include:</p>
          ${bullets(['Identify where your boat can go on the water', 'Provide itinerary suggestions of places to see or swim', 'List any extra perks/toys that come with your boat', 'Be transparent if there are any additional costs not included in the boat price (like fuel)', 'Specify delivery areas for your boat (if applicable)'])}`),
      }),
      valid: () => !!(s.title.trim() && s.description.trim()),
      body: () => `
        ${h3('Boat title and description')}
        <div class="mt-6">
          ${field({ label: 'Listing title', bind: 'title', placeholder: 'e.g. Sunset-ready 42 ft cruiser in DuSable Harbor', required: true, attrs: 'maxlength="70"' })}
          <p class="mt-1.5 text-right text-xs text-navy-400"><span data-count-for="title">${70 - s.title.length}</span> characters remaining</p>
        </div>
        <div class="my-8 h-px bg-navy-100"></div>
        ${field({ label: 'Description', bind: 'description', type: 'textarea', placeholder: 'Where can your boat go? What makes it special? Any toys, perks or extra costs renters should know about?', required: true })}`,
    },
    {
      id: 'cancellation', section: 1,
      left: () => ({ title: 'Cancellation policy', text: 'Select how you want to handle trip cancellations. <a href="pricing.html#policies" target="_blank" class="font-semibold text-brass-300 hover:underline">Learn more</a> about our cancellation options.' }),
      valid: () => !!s.cancellation,
      body: () => `<div class="space-y-4">${O.cancellation.map((c) => {
        const on = s.cancellation === c.id;
        return `
        <button type="button" data-radio="cancellation" data-value="${c.id}" aria-pressed="${on}" class="flex w-full flex-col gap-4 rounded-2xl p-5 text-left ring-2 transition sm:flex-row sm:items-center md:p-6 ${on ? 'bg-navy-950 text-white shadow-card ring-navy-950' : 'bg-white text-navy-950 ring-navy-100 hover:ring-navy-300'}">
          <span class="flex items-center gap-4 sm:w-48 sm:shrink-0">${radioDot(on, false)}<span><span class="block text-lg font-bold">${c.name}</span>${c.badge ? `<span class="mt-1 inline-block">${badge(c.badge)}</span>` : ''}</span></span>
          <ul class="list-disc space-y-1.5 pl-5 text-sm ${on ? 'text-white/80' : 'text-navy-600'}">${c.points.map((p) => `<li>${p}</li>`).join('')}</ul>
        </button>`;
      }).join('')}</div>`,
    },
    {
      id: 'rules', section: 1,
      left: () => ({ title: 'What is allowed on your boat?', text: 'Select everything guests are allowed to bring or do on board. Anything you leave unchecked is not allowed.' }),
      body: () => checkTiles('rules', O.rules),
    },
    {
      id: 'features', section: 1,
      left: () => ({ title: 'Boat features', text: 'Show off what you offer on your boat! Renters are more likely to choose boats with lots of features that enable them to have a fun time on the water.' }),
      body: () => `
        ${h3('Features')}<div class="mt-4">${checkTiles('features', O.features)}</div>
        ${h3('Extras', 'mt-10')}<div class="mt-4">${checkTiles('extras', O.extras)}</div>
        ${h3('Navigation', 'mt-10')}<div class="mt-4">${checkTiles('navigation', O.navigation)}</div>`,
    },
    {
      id: 'photos', section: 1,
      left: () => ({
        title: 'Boat photos',
        text: 'It\'s important for renters to see your boat before they request it.<br><button type="button" data-skip-photos class="mt-2 font-semibold text-brass-300 hover:underline">Skip for now</button>',
        tips: tipsCard('Tips to get great photos of your boat', bullets(['Use your camera or smartphone.', 'Avoid using flash. Boats look best in natural light.', 'Tidy up before taking interior shots.', 'Take photos in landscape mode and avoid extreme close-ups.'])),
      }),
      valid: () => s.photos.length >= 4,
      body: () => {
        const n = s.photos.length;
        const slots = Math.max(4, n + 1);
        const tiles = Array.from({ length: slots }, (_, i) => {
          if (i < n) {
            return `
            <div class="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-navy-50 ring-1 ring-navy-100">
              <img src="${s.photos[i]}" alt="Boat photo ${i + 1}" class="h-full w-full object-cover">
              ${i === 0 ? `<span class="absolute left-2 top-2">${badge('Cover photo')}</span>` : `<button type="button" data-cover-photo="${i}" class="absolute left-2 top-2 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-navy-900 opacity-0 transition group-hover:opacity-100">Make cover</button>`}
              <button type="button" data-remove-photo="${i}" class="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-navy-950/80 text-white hover:bg-red-600" aria-label="Remove photo ${i + 1}"><i data-lucide="x" class="h-4 w-4"></i></button>
            </div>`;
          }
          if (i === n) {
            return `
            <button type="button" data-pick-photos class="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brass-400 bg-brass-50/60 text-brass-700 transition hover:bg-brass-50">
              <i data-lucide="upload" class="h-6 w-6"></i><span class="text-xs font-bold">${n === 0 ? 'Upload cover photo' : 'Add photo'}</span>
            </button>`;
          }
          return `<div class="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-navy-100 text-navy-300"><i data-lucide="camera" class="h-6 w-6"></i><span class="text-xs font-semibold">Photo ${i + 1}</span></div>`;
        }).join('');
        return `
          <p class="text-sm leading-relaxed text-navy-600">Once you have a good photo that shows the whole boat, add more displaying the boat's details and interior, especially any cool or unique features.</p>
          <div id="dropzone" class="mt-6 rounded-3xl border-2 border-dashed border-navy-200 bg-navy-50/50 px-6 py-8 text-center transition">
            <i data-lucide="image-plus" class="mx-auto h-8 w-8 text-navy-400"></i>
            <p class="mt-3 font-bold text-navy-900">Drag and drop or <button type="button" data-pick-photos class="text-brass-600 underline underline-offset-2 hover:text-brass-700">click here</button> to choose photos (4 minimum)</p>
            <p class="mx-auto mt-2 max-w-md text-xs text-navy-400">Avoid photos with company logos and phone numbers. Photos at least 960px wide display best. Accepted formats: JPG, PNG, GIF, WEBP. Max file size: 25 MB.</p>
          </div>
          <div class="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">${tiles}</div>
          <div class="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span class="font-bold ${n >= 4 ? 'text-emerald-700' : 'text-navy-500'}">${n} of 4 minimum photos added</span>
            <button type="button" data-sample-photos class="font-bold text-navy-400 underline underline-offset-2 hover:text-navy-700">Demo: use sample photos</button>
          </div>`;
      },
    },
    {
      id: 'specs', section: 1,
      left: () => ({ title: 'Boat specifications', text: "Please add your boat's specifications. These help renters (and our insurance partner) understand your boat." }),
      valid: () => { const p = s.specs; return !!(p.year && p.make && p.model.trim() && p.type && Number(p.length) > 0 && p.category && Number(p.passengers) > 0); },
      body: () => `
        ${h3('General information')}
        <div class="mt-4 grid gap-5 sm:grid-cols-2">
          ${field({ label: 'Boat registration number / HIN', bind: 'specs.registration', placeholder: 'AA1234SS' })}
          ${field({ label: 'Year', bind: 'specs.year', options: YEARS, required: true })}
          ${field({ label: 'Make', bind: 'specs.make', options: O.makes, required: true })}
          ${field({ label: 'Model', bind: 'specs.model', placeholder: 'e.g. Antares 10.80', required: true })}
          ${field({ label: 'Type', bind: 'specs.type', options: O.types, required: true })}
          ${field({ label: 'Length (ft)', bind: 'specs.length', type: 'number', placeholder: '38', required: true, attrs: 'min="8" max="400" inputmode="numeric"' })}
          ${field({ label: 'Category', bind: 'specs.category', options: O.categories, required: true })}
        </div>
        ${h3('Engine', 'mt-10')}
        <div class="mt-4 grid gap-5 sm:grid-cols-2">
          ${field({ label: 'Number of engines', bind: 'specs.engines', type: 'number', attrs: 'min="0" max="6"' })}
          ${field({ label: 'Total horsepower', bind: 'specs.horsepower', type: 'number', attrs: 'min="0"' })}
          ${field({ label: 'Engine year', bind: 'specs.engineYear', options: YEARS })}
          ${field({ label: 'Engine type', bind: 'specs.engineType', options: O.engineTypes })}
        </div>
        ${h3('Capacity', 'mt-10')}
        <div class="mt-4 grid gap-5 sm:grid-cols-3">
          ${field({ label: 'Staterooms', bind: 'specs.staterooms', type: 'number', attrs: 'min="0"' })}
          ${field({ label: 'Sleeps', bind: 'specs.sleeps', type: 'number', attrs: 'min="0"' })}
          ${field({ label: 'Bed count', bind: 'specs.beds', type: 'number', attrs: 'min="0"' })}
          ${field({ label: 'Passenger capacity', bind: 'specs.passengers', type: 'number', required: true, hint: 'Maximum guests allowed by the USCG capacity plate (excluding crew).', attrs: 'min="1" max="150"', span: 'sm:col-span-2' })}
        </div>`,
    },

    /* ---------------- Availability ---------------- */
    {
      id: 'availability', section: 2,
      left: () => ({
        title: 'Select the available days and start times',
        text: `<p>You can use the default options we selected or customize the available days and start times yourself.</p>
               <p class="mt-3">Example: if you use our default start times, this boat will be available to depart between 8:00 AM – 6:00 PM. The return time depends on the booking durations you offer, which you will choose later.</p>
               <p class="mt-3">We may limit the available start times a renter can select to comply with sunrise and sunset insurance restrictions.</p>`,
      }),
      valid: () => s.availability.mode === 'default' || DAYS.some(([k]) => s.availability.days[k].on) && DAYS.every(([k]) => { const d = s.availability.days[k]; return !d.on || d.start < d.end; }),
      body: () => {
        const custom = `
          <div class="space-y-3">
            ${DAYS.map(([k, name]) => {
              const d = s.availability.days[k];
              const bad = d.on && d.start >= d.end;
              return `
              <div class="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 rounded-xl bg-navy-50/70 px-4 py-3 sm:grid-cols-[auto_7rem_1fr]">
                <button type="button" data-day-toggle="${k}" role="switch" aria-checked="${d.on}" aria-label="${name} available" class="relative h-6 w-11 rounded-full transition ${d.on ? 'bg-navy-950' : 'bg-navy-200'}"><span class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${d.on ? 'left-[22px]' : 'left-0.5'}"></span></button>
                <span class="text-sm font-bold ${d.on ? 'text-navy-950' : 'text-navy-400'}">${name}</span>
                <div class="col-span-2 flex items-center gap-2 sm:col-span-1">
                  ${['start', 'end'].map((which, i) => `${i ? '<span class="text-xs font-semibold text-navy-400">to</span>' : ''}<select data-bind="availability.days.${k}.${which}" data-rerender ${d.on ? '' : 'disabled'} class="w-full rounded-lg border ${bad ? 'border-red-400' : 'border-navy-200'} bg-white px-2 py-2 text-xs font-semibold focus:border-navy-950 focus:outline-none disabled:opacity-40" aria-label="${name} ${which} time">${TIMES.map((t) => `<option value="${t}" ${d[which] === t ? 'selected' : ''}>${CYB.fmt.time(t)}</option>`).join('')}</select>`).join('')}
                </div>
              </div>`;
            }).join('')}
          </div>`;
        return `<div class="space-y-5">
          ${radioCard({ group: 'availability.mode', value: 'default', title: 'Default availability', selected: s.availability.mode === 'default',
            body: '<p class="text-navy-500">Your boat will be available</p><p class="mt-2 text-lg font-bold text-navy-950">Monday to Sunday, from 8:00 AM to 6:00 PM</p>' })}
          ${radioCard({ group: 'availability.mode', value: 'custom', title: 'Custom availability', sub: 'Customize start times for each day of the week.', selected: s.availability.mode === 'custom', body: custom })}
          <p class="text-sm text-navy-500">You can always update this later.</p>
        </div>`;
      },
    },
    {
      id: 'advance', section: 2,
      left: () => ({ title: 'Select your advance notice', text: 'How much time do you need to prepare for potential last-minute requests? For example, if you select 7 days, this boat will only be available for bookings that start at least 7 days later. We recommend selecting 6 hours or less to capture last-minute bookings.' }),
      valid: () => !!s.advanceNotice,
      body: () => radioTiles('advanceNotice', O.advanceNotice),
    },
    {
      id: 'multi', section: 2,
      left: () => ({ title: 'Do you want to allow multiple bookings in one day?', text: 'Earn more from your boat by allowing multiple bookings on the same day. You have control over the start times and durations you offer.' }),
      valid: () => !!s.multiBooking.allow,
      body: () => `<div class="space-y-5">
        ${radioCard({ group: 'multiBooking.allow', value: 'no', title: 'No', sub: 'This boat can only be booked once a day', selected: s.multiBooking.allow === 'no' })}
        ${radioCard({ group: 'multiBooking.allow', value: 'yes', title: 'Yes', tag: 'Most common', selected: s.multiBooking.allow === 'yes',
          body: `<p class="text-base font-bold text-navy-950">How much time do you need in between bookings?</p>
                 <p class="mt-1 text-xs text-navy-500">Example: if your boat returns at 3:00 PM and you can have it ready for your next rental by 3:30 PM, select 30 minutes.</p>
                 <div class="mt-5">${radioTiles('multiBooking.buffer', O.buffers, 'sm:grid-cols-2')}</div>` })}
      </div>`,
    },

    /* ---------------- Operators & durations (+ insurance) ---------------- */
    {
      id: 'operators', section: 3,
      left: () => ({
        title: 'Choose who operates your boat and desired booking durations.',
        text: 'You can let renters who you approve and/or a captain operate your boat.',
        tips: tipsCard('We offer flexibility for you and captains', 'Chicago Yacht Booking will provide a list of vetted USCG captains you can approve. If you or a captain you know wish to operate the boat, joining our captain network is easy.'),
      }),
      valid: () => (s.operators.renter || s.operators.captain) && s.durations.length > 0 && !!s.fuel,
      body: () => {
        const tooLong = len() > 32;
        const opt = (key, title, sub, disabled) => {
          const on = s.operators[key];
          return `<button type="button" data-op="${key}" ${disabled ? 'disabled' : ''} aria-pressed="${on}" class="flex w-full items-start gap-3 p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-50">
            <span class="mt-0.5">${checkBox(on)}</span>
            <span><span class="block text-sm font-bold text-navy-950">${title}</span><span class="mt-0.5 block text-xs text-navy-500">${sub}</span></span>
          </button>`;
        };
        return `
          ${h3('Who can operate your boat? Select one or both options.')}
          <div class="mt-4 divide-y divide-navy-100 rounded-2xl bg-white ring-2 ring-navy-100">
            ${opt('renter', 'Renter operates my boat', tooLong ? 'Our insurance partner requires boats over 32 feet long to be captained.' : 'Approved renters with boating experience can drive your boat.', tooLong)}
            ${opt('captain', 'USCG-certified captain operates my boat', 'A licensed captain runs every trip — required for boats over 32 ft.')}
            ${s.operators.captain ? `<div class="px-5">
              ${yesNo('operators.captainNetwork', 'Will you use the Chicago Yacht Booking captain network?')}
              ${yesNo('operators.fishingCharter', 'Is this a captained fishing charter?')}
            </div>` : ''}
          </div>
          ${h3("Select which durations you'd like to offer.", 'mt-10')}
          <div class="mt-4">${checkTiles('durations', O.durations.map((h) => [h, `${h} hours`]), 'grid-cols-2 sm:grid-cols-3')}</div>
          ${h3('Who pays for fuel?', 'mt-10')}
          <div class="mt-4">${radioTiles('fuel', [['renter', 'Renter pays'], ['owner', 'I pay']], 'sm:grid-cols-2')}</div>
          <p class="mt-3 text-xs text-navy-500">${s.fuel === 'renter' ? 'Fuel used is calculated and charged to the renter after each trip.' : 'Fuel cost is included in your listing price.'}</p>`;
      },
    },
    {
      id: 'insurance', section: 3, when: rec,
      left: () => ({ eyebrow: `Great progress${s.owner.firstName ? ', ' + esc(s.owner.firstName) : ''}!`, title: "Let's get you insured" }),
      body: () => `
        <div class="rounded-[2rem] bg-white p-8 shadow-card ring-1 ring-navy-100 md:p-10">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-brass-600">Insurance provided by</p>
          <p class="mt-2 flex items-center gap-3 font-display text-3xl text-navy-950"><i data-lucide="shield-check" class="h-8 w-8 text-brass-500"></i>Our marine insurance partner</p>
          <p class="mt-6 text-sm leading-relaxed text-navy-600">We want everyone to feel secure while your boat is being rented. Chicago Yacht Booking partners with a trip-based marine insurer to offer an exclusive insurance plan required for owners listing personal boats. A small percentage of the listing price helps protect you, your boat, and your guests in case something happens on the water.</p>
          <p class="mt-4 text-sm leading-relaxed text-navy-600">To get started, we'll need a few more details about you and your boat.</p>
        </div>`,
    },
    {
      id: 'insuranceOwner', section: 3, when: rec,
      left: () => ({
        title: "Let's get you and your boat peer-to-peer insurance",
        text: `<p>Chicago Yacht Booking requires owners listing their personal boats to secure peer-to-peer insurance.</p>
               <p class="mt-3">Through our insurance partner, a trip-based boat insurance provider, your bookings on our platform are covered by peer-to-peer insurance.</p>
               <p class="mt-3">Our partner needs these additional details to review your boat for insurance approval.</p>`,
      }),
      valid: () => String(s.insuranceOwner.years).trim() !== '',
      body: () => `
        <div class="rounded-[2rem] bg-white p-6 ring-1 ring-navy-100 md:p-8">
          ${field({ label: 'How many years have you been operating a boat rental business?', bind: 'insuranceOwner.years', type: 'number', placeholder: 'Enter answer', required: true, attrs: 'min="0" max="80"' })}
          <div class="mt-5">${field({ label: 'Company name (optional)', bind: 'insuranceOwner.company', placeholder: 'Company name' })}</div>
          <div class="mt-4">
            ${yesNo('insuranceOwner.claims', 'Have you had combined boat insurance claim(s) exceeding $50,000, 2+ losses, or any constructive total vessel losses in the last 3 years?')}
            ${yesNo('insuranceOwner.criminal', 'Have you had any criminal convictions in the last 10 years or any felony convictions ever?')}
            ${yesNo('insuranceOwner.overCapacity', 'Are you offering bookings where the number of passengers exceeds the U.S. Coast Guard Capacity Plate including maximum persons, the number of persons permitted under applicable law, maximum gross load, or maximum horsepower?')}
            ${yesNo('insuranceOwner.bankruptcy', 'Have you had any bankruptcies in the last 5 years?')}
            ${yesNo('insuranceOwner.business', 'Do you operate your rentals as a registered business entity?')}
            ${yesNo('insuranceOwner.otherPolicy', 'Do you currently have a commercial marine policy with another carrier?')}
          </div>
          <p class="mt-2 border-t border-navy-100 pt-5 text-xs text-navy-500">By clicking continue, I certify that the above statements are true and correct.</p>
        </div>`,
    },
    {
      id: 'insuranceBoat', section: 3, when: rec,
      left: () => ({ title: 'A few details about your boat', text: 'These answers help our insurance partner price and approve coverage for your boat. Answer as accurately as you can — you can update them before submitting.' }),
      valid: () => Number(s.insuranceBoat.value) > 0,
      body: () => `
        <div class="rounded-[2rem] bg-white p-6 ring-1 ring-navy-100 md:p-8">
          ${field({ label: 'Boat value (USD)', bind: 'insuranceBoat.value', type: 'number', placeholder: 'e.g. 250000', required: true, hint: 'Current market value of the boat.', attrs: 'min="0" inputmode="numeric"' })}
          <div class="mt-4">
            ${yesNo('insuranceBoat.customized', "Has the boat been customized, modified, or altered from the original manufacturer's specifications?")}
            ${yesNo('insuranceBoat.underlying', "In addition to our partner's coverage, do you have and will you maintain an underlying insurance policy?")}
            ${yesNo('insuranceBoat.attachments', 'Are there any crafts or apparatuses attached to the boat? (Examples are flyboard, parasail etc.)')}
            ${yesNo('insuranceBoat.seaworthy', 'Will the boat be seaworthy during all charters?')}
            ${yesNo('insuranceBoat.racing', 'Is the boat designed for racing or experimental purposes?')}
            ${yesNo('insuranceBoat.special', 'Is the boat classified as any of the following: a submersible, conversion, hovercraft, hydrofoil, hydroplane, shuttle craft, repurposed military vessel, homemade vessel, personal watercraft such as jet-skis, or similar?')}
            ${yesNo('insuranceBoat.captained', 'Will the boat be driven by a United States Coast Guard licensed captain?', { note: len() > 33 ? `Your boat is ${len()} ft — boats over 33 feet are required to be captained.` : 'Note: Boats over 33 feet are required to be captained.', lock: len() > 33 ? 'yes' : null })}
          </div>
        </div>`,
    },
    {
      id: 'commercial', section: 3, when: () => !rec(),
      left: () => ({ title: 'Your commercial charter insurance', text: 'Commercial operators keep their own coverage. Add your policy details so our team can verify it before your boat goes live.' }),
      valid: () => !!(s.commercial.carrier.trim() && s.commercial.policy.trim() && s.commercial.expires && s.commercial.liability),
      body: () => `
        <div class="grid gap-5 sm:grid-cols-2">
          ${field({ label: 'Insurance carrier', bind: 'commercial.carrier', placeholder: 'Carrier name', required: true, span: 'sm:col-span-2' })}
          ${field({ label: 'Policy number', bind: 'commercial.policy', placeholder: 'Policy #', required: true })}
          ${field({ label: 'Policy expiration date', bind: 'commercial.expires', type: 'date', required: true })}
          ${field({ label: 'Liability coverage', bind: 'commercial.liability', options: O.liability, required: true, span: 'sm:col-span-2' })}
        </div>
        <div class="mt-6">
          <span class="text-sm font-bold text-navy-800">Certificate of insurance</span>
          <label class="mt-2 flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-navy-200 bg-navy-50/50 p-5 transition hover:border-navy-400">
            <i data-lucide="file-up" class="h-7 w-7 shrink-0 text-navy-400"></i>
            <span class="text-sm"><span class="block font-bold text-navy-900">${s.commercial.coi ? esc(s.commercial.coi) : 'Upload PDF or image'}</span><span class="text-xs text-navy-400">Must list Chicago Yacht Booking as additional insured</span></span>
            <input type="file" id="coi-input" accept=".pdf,image/*" class="hidden">
          </label>
        </div>`,
    },

    /* ---------------- Review & submit ---------------- */
    { id: 'review', section: 4, layout: 'full', valid: () => !!(s.owner.firstName.trim() && s.owner.lastName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.owner.email) && s.owner.phone.replace(/\D/g, '').length >= 10), body: () => reviewHTML() },
    { id: 'done', section: 5, layout: 'full', body: () => doneHTML() },
  ];

  const active = () => STEPS.filter((st) => !st.when || st.when());
  const cur = () => active().find((st) => st.id === s.step) || active()[0];

  /* ------------------------------------------------------------------ */
  /* Review & done screens                                               */
  /* ------------------------------------------------------------------ */
  const val = (v) => (v === '' || v == null || (Array.isArray(v) && !v.length) ? '<span class="text-navy-300">—</span>' : esc(v));
  const yn = (v) => (v === 'yes' ? 'Yes' : v === 'no' ? 'No' : '—');
  const label = (list, id) => (list.find(([k]) => k === id) || [, id])[1];
  const rows = (pairs) => `<dl class="divide-y divide-navy-100/70 text-sm">${pairs.map(([k, v]) => `<div class="grid grid-cols-[1fr_auto] gap-4 py-2.5 sm:grid-cols-[1.4fr_1fr]"><dt class="text-navy-500">${k}</dt><dd class="text-right font-semibold text-navy-950 sm:text-left">${v}</dd></div>`).join('')}</dl>`;
  const list = (items) => (items.length ? `<ul class="flex flex-wrap gap-2">${items.map((i) => `<li class="rounded-full bg-navy-50 px-3 py-1 text-xs font-semibold text-navy-700">${esc(i)}</li>`).join('')}</ul>` : '<p class="text-sm text-navy-300">None selected</p>');
  const card = (title, inner, step) => `
    <div class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-navy-100 md:p-7">
      <div class="flex items-center justify-between gap-4"><h3 class="text-lg font-extrabold text-navy-950">${title}</h3>${step ? `<button type="button" data-edit="${step}" class="inline-flex items-center gap-1 text-sm font-bold text-brass-600 hover:text-brass-700"><i data-lucide="pencil" class="h-3.5 w-3.5"></i>Edit</button>` : ''}</div>
      <div class="mt-4">${inner}</div>
    </div>`;
  const block = (title, cards) => `
    <div class="grid gap-6 border-t border-navy-100 py-12 first:border-0 first:pt-0 lg:grid-cols-[1fr_1.6fr] lg:gap-12">
      <h2 class="font-display text-3xl text-navy-950 md:text-4xl">${title}</h2>
      <div class="space-y-6">${cards.join('')}</div>
    </div>`;

  function reviewHTML() {
    const p = s.specs, l = s.location, c = O.cancellation.find((x) => x.id === s.cancellation);
    const av = s.availability.mode === 'default'
      ? 'Monday to Sunday, from 8:00 AM – 6:00 PM'
      : DAYS.filter(([k]) => s.availability.days[k].on).map(([k, n]) => `${n}: ${CYB.fmt.time(s.availability.days[k].start)} – ${CYB.fmt.time(s.availability.days[k].end)}`).join('<br>') || '—';
    const photoWarn = s.photos.length < 4;
    return `
    <section class="relative isolate overflow-hidden bg-navy-950 py-16 text-white md:py-20">
      <img src="assets/images/wake.jpg" alt="" class="absolute inset-0 -z-20 h-full w-full object-cover opacity-25">
      <div class="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/80 to-navy-900/40"></div>
      <div class="container max-w-6xl">
        <p class="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-brass-300"><span class="h-px w-10 bg-brass-400"></span>Review and submit</p>
        <h1 class="mt-4 max-w-2xl font-display text-4xl leading-tight md:text-5xl">Please review your boat listing before submitting.</h1>
      </div>
    </section>
    <div class="container max-w-6xl py-14">
      ${photoWarn ? `<div class="mb-10 flex flex-col gap-3 rounded-2xl bg-amber-50 p-5 text-sm text-amber-900 ring-1 ring-amber-200 sm:flex-row sm:items-center sm:justify-between"><p class="flex items-center gap-2"><i data-lucide="triangle-alert" class="h-5 w-5 shrink-0"></i>Add at least 4 photos before your boat can be approved. You can still submit now and add them later.</p><button type="button" data-edit="photos" class="shrink-0 font-bold underline">Add photos</button></div>` : ''}
      ${block('Boat details', [
        card('Specifications', `
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-navy-400">General information</p>
          ${rows([['Boat registration number / HIN', val(p.registration)], ['Year', val(p.year)], ['Make', val(p.make)], ['Model', val(p.model)], ['Type', val(p.type)], ['Length (ft)', val(p.length)], ['Category', val(p.category)]])}
          <p class="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-navy-400">Engine</p>
          ${rows([['Number of engines', val(p.engines)], ['Engine type', val(p.engineType)], ['Engine year', val(p.engineYear)], ['Total horsepower', val(p.horsepower)]])}
          <p class="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-navy-400">Capacity</p>
          ${rows([['Staterooms', val(p.staterooms)], ['Sleeps', val(p.sleeps)], ['Bed count', val(p.beds)], ['Passenger capacity', val(p.passengers)]])}`, 'specs'),
        card('Location', rows([['Location type', val(l.type)], ['Country / Territory', val(l.country)], ['Street address', val(l.street)], ['City', val(l.city)], ['State / Province', val(l.state)], ['Zip code', val(l.zip)]]), 'location'),
        card('Title & description', `<p class="font-display text-xl text-navy-950">${val(s.title)}</p><p class="mt-3 whitespace-pre-line text-sm leading-relaxed text-navy-600">${val(s.description)}</p>`, 'title'),
        card('Cancellation policy', c ? `<p class="font-bold text-navy-950">${c.name}</p><ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-navy-600">${c.points.map((x) => `<li>${x}</li>`).join('')}</ul>` : val(''), 'cancellation'),
        card('Preferences', `<p class="mb-3 text-sm text-navy-500">What is allowed on your boat?</p>${list(s.rules)}`, 'rules'),
        card('Features', `<p class="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-navy-400">Features</p>${list(s.features)}<p class="mb-2 mt-5 text-xs font-bold uppercase tracking-[0.18em] text-navy-400">Extras</p>${list(s.extras)}<p class="mb-2 mt-5 text-xs font-bold uppercase tracking-[0.18em] text-navy-400">Navigation</p>${list(s.navigation)}`, 'features'),
        card('Photos', s.photos.length ? `<div class="grid grid-cols-3 gap-3 sm:grid-cols-4">${s.photos.map((src, i) => `<div class="relative aspect-[4/3] overflow-hidden rounded-xl bg-navy-50"><img src="${src}" alt="" class="h-full w-full object-cover">${i === 0 ? `<span class="absolute left-1.5 top-1.5">${badge('Cover')}</span>` : ''}</div>`).join('')}</div>` : '<p class="text-sm text-navy-300">No photos added yet</p>', 'photos'),
      ])}
      ${block('Availability', [
        card('Start times', `<p class="text-sm font-semibold leading-relaxed text-navy-950">${av}</p>`, 'availability'),
        card('Advance notice', rows([['Advance notice', label(O.advanceNotice, s.advanceNotice)]]), 'advance'),
        card('Multiple-booking days', rows([['Allow multiple bookings on the same day', yn(s.multiBooking.allow)], ...(s.multiBooking.allow === 'yes' ? [['Buffer time', label(O.buffers, s.multiBooking.buffer)]] : [])]), 'multi'),
      ])}
      ${block('Operators and durations', [
        card('Booking options', `
          ${rows([['Is this a captained fishing charter?', s.operators.captain ? yn(s.operators.fishingCharter) : 'No'], ['Renter operates my boat', s.operators.renter ? 'Yes' : 'No'], ['USCG-certified captain operates my boat', s.operators.captain ? 'Yes' : 'No'], ['Will you use the Chicago Yacht Booking captain network?', s.operators.captain ? yn(s.operators.captainNetwork) : 'No']])}
          <p class="mb-2 mt-5 text-xs font-bold uppercase tracking-[0.18em] text-navy-400">Booking durations</p>${list([...s.durations].sort((a, b) => a - b).map((h) => `${h} hours`))}
          <p class="mb-1 mt-5 text-xs font-bold uppercase tracking-[0.18em] text-navy-400">Fuel policy</p>${rows([['Who pays for fuel?', s.fuel === 'owner' ? 'I pay' : 'Renter pays']])}`, 'operators'),
      ])}
      ${block('Insurance', rec() ? [
        card('Boat owner', rows([
          ['Insurance type', 'Recreational boat insurance'],
          ['How many years have you been operating a boat rental business?', val(s.insuranceOwner.years)],
          ['Company name', val(s.insuranceOwner.company)],
          ['Combined claims over $50,000, 2+ losses, or total vessel losses in the last 3 years?', yn(s.insuranceOwner.claims)],
          ['Criminal convictions in the last 10 years or any felony ever?', yn(s.insuranceOwner.criminal)],
          ['Bookings exceeding the U.S. Coast Guard Capacity Plate?', yn(s.insuranceOwner.overCapacity)],
          ['Bankruptcies in the last 5 years?', yn(s.insuranceOwner.bankruptcy)],
          ['Rentals operated as a registered business entity?', yn(s.insuranceOwner.business)],
          ['Commercial marine policy with another carrier?', yn(s.insuranceOwner.otherPolicy)],
        ]), 'insuranceOwner'),
        card('Boat', rows([
          ['Boat value', s.insuranceBoat.value ? CYB.fmt.money(s.insuranceBoat.value, true) : val('')],
          ["Customized, modified, or altered from the manufacturer's specifications?", yn(s.insuranceBoat.customized)],
          ['Underlying insurance policy maintained?', yn(s.insuranceBoat.underlying)],
          ['Crafts or apparatuses attached (flyboard, parasail…)?', yn(s.insuranceBoat.attachments)],
          ['Seaworthy during all charters?', yn(s.insuranceBoat.seaworthy)],
          ['Designed for racing or experimental purposes?', yn(s.insuranceBoat.racing)],
          ['Special vessel classification (submersible, hovercraft, PWC…)?', yn(s.insuranceBoat.special)],
          ['Driven by a USCG licensed captain?', yn(s.insuranceBoat.captained)],
        ]), 'insuranceBoat'),
      ] : [
        card('Commercial charter insurance', rows([['Insurance type', 'Commercial charter insurance'], ['Carrier', val(s.commercial.carrier)], ['Policy number', val(s.commercial.policy)], ['Expires', s.commercial.expires ? CYB.fmt.date(s.commercial.expires) : val('')], ['Liability coverage', val(s.commercial.liability)], ['Certificate of insurance', val(s.commercial.coi)]]), 'commercial'),
      ])}
      ${block('Your details', [
        `<div class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-navy-100 md:p-7">
          <p class="text-sm text-navy-500">We'll use these to contact you about your listing. <span class="text-navy-400">(In the live site this comes from your owner account.)</span></p>
          <div class="mt-5 grid gap-5 sm:grid-cols-2">
            ${field({ label: 'First name', bind: 'owner.firstName', required: true, attrs: 'autocomplete="given-name"' })}
            ${field({ label: 'Last name', bind: 'owner.lastName', required: true, attrs: 'autocomplete="family-name"' })}
            ${field({ label: 'Email', bind: 'owner.email', type: 'email', required: true, attrs: 'autocomplete="email"' })}
            ${field({ label: 'Mobile phone', bind: 'owner.phone', type: 'tel', placeholder: '(312) 000-0000', required: true, attrs: 'autocomplete="tel"' })}
          </div>
        </div>`,
      ])}
      <div class="grid gap-6 border-t border-navy-100 pt-12 lg:grid-cols-[1fr_1.6fr] lg:gap-12">
        <h2 class="font-display text-3xl text-navy-950 md:text-4xl">Chicago Yacht Booking standards</h2>
        <div>
          ${bullets(['Keep your boat well-maintained and make sure all regulatory and safety requirements have been met so your renters are safe on the water.', 'Clean and refuel your boat before every trip so guests have an enjoyable experience.']).replace('list-disc', 'list-disc text-sm leading-relaxed text-navy-700')}
          <p class="mt-5 text-xs text-navy-400">These standards keep our boating community safe and reliable. By clicking "Submit", you're agreeing to our standards.</p>
        </div>
      </div>
    </div>`;
  }

  function doneHTML() {
    const name = s.owner.firstName ? `, ${esc(s.owner.firstName)}` : '';
    return `
    <section class="relative isolate grid min-h-[calc(100svh-4rem)] place-items-center overflow-hidden bg-navy-950 px-4 py-16 text-white">
      <img src="assets/images/hero-poster.jpg" alt="" class="absolute inset-0 -z-20 h-full w-full object-cover opacity-25">
      <div class="absolute inset-0 -z-10 bg-gradient-to-b from-navy-950/70 to-navy-950"></div>
      <div class="w-full max-w-2xl text-center">
        <span class="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brass-400 text-navy-950 shadow-glow"><i data-lucide="check" class="h-10 w-10"></i></span>
        <h1 class="mt-6 font-display text-4xl md:text-6xl">Your boat is submitted${name}!</h1>
        <p class="mx-auto mt-4 max-w-lg text-white/70">Our fleet team reviews new listings within 2 business days. We'll email <strong class="text-white">${esc(s.owner.email)}</strong> once it's approved — or if we need anything else.</p>
        <div class="mx-auto mt-8 flex max-w-md items-center gap-4 rounded-2xl bg-white p-3 pr-5 text-left text-navy-950 shadow-2xl">
          ${s.photos[0] ? `<img src="${s.photos[0]}" alt="" class="h-16 w-20 shrink-0 rounded-xl object-cover">` : '<span class="grid h-16 w-20 shrink-0 place-items-center rounded-xl bg-navy-50 text-navy-300"><i data-lucide="sailboat" class="h-6 w-6"></i></span>'}
          <div class="min-w-0 flex-1"><p class="truncate font-bold">${esc(CYB.listings.title(s))}</p><p class="text-xs text-navy-500">${esc(s.location.city)}${s.location.state ? ', ' + esc(s.location.state) : ''}</p></div>
          <span class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${CYB.listings.status.pending.cls}">Pending review</span>
        </div>
        <ol class="mx-auto mt-10 grid max-w-xl gap-3 text-left sm:grid-cols-2">
          ${[['clipboard-check', 'Listing review', 'We check details, photos & insurance.'], ['landmark', 'Add payout info', 'So we can pay you after each trip.'], ['badge-dollar-sign', 'Set pricing together', 'Our team suggests rates for Chicago.'], ['sailboat', 'Go live', 'Your boat appears in our fleet.']].map(([ic, t, d], i) => `
            <li class="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"><span class="grid h-9 w-9 shrink-0 place-items-center rounded-full ${i === 0 ? 'bg-brass-400 text-navy-950' : 'bg-white/10 text-brass-300'}"><i data-lucide="${ic}" class="h-4 w-4"></i></span><span><span class="block text-sm font-bold">${t}</span><span class="text-xs text-white/60">${d}</span></span></li>`).join('')}
        </ol>
        <div class="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="owner-dashboard.html" class="${CYB.cls.btnPrimary} px-8 py-4">Go to owner dashboard <i data-lucide="arrow-right" class="h-4 w-4"></i></a>
          <a href="my-boats.html" class="inline-flex items-center gap-2 rounded-full border border-white/25 px-8 py-4 text-sm font-bold hover:bg-white hover:text-navy-950">View my boats</a>
        </div>
      </div>
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Layout, bottom bar, render                                          */
  /* ------------------------------------------------------------------ */
  function splitHTML(st) {
    const L = st.left();
    const secSteps = active().filter((x) => x.section === st.section);
    const eyebrow = L.eyebrow || (st.section >= 1 && st.section <= 3 ? `${SECTIONS[st.section - 1]} · ${secSteps.indexOf(st) + 1} of ${secSteps.length}` : '');
    return `
    <div class="grid lg:min-h-[calc(100vh-9rem)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section class="relative isolate overflow-hidden bg-navy-950 text-white lg:sticky lg:top-16 lg:h-[calc(100vh-9rem)]">
        <img src="assets/images/wake.jpg" alt="" class="absolute inset-0 -z-20 h-full w-full object-cover opacity-15">
        <div class="absolute inset-0 -z-10 bg-gradient-to-br from-navy-950 via-navy-950/95 to-navy-800/90"></div>
        <div class="pointer-events-none absolute -bottom-32 -right-32 -z-10 h-96 w-96 rounded-full bg-brass-400/15 blur-3xl"></div>
        <div class="flex h-full flex-col justify-center overflow-y-auto px-6 py-10 sm:px-10 md:py-14 xl:px-20">
          ${eyebrow ? `<p class="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.25em] text-brass-300"><span class="h-px w-8 bg-brass-400"></span>${eyebrow}</p>` : ''}
          <h1 class="mt-4 font-display text-3xl leading-tight md:text-5xl">${L.title}</h1>
          ${L.text ? `<div class="mt-5 max-w-lg text-sm leading-relaxed text-white/70 md:text-base">${L.text}</div>` : ''}
          ${L.tips || ''}
        </div>
      </section>
      <section class="flex bg-white px-5 py-10 sm:px-10 md:py-14 lg:items-center xl:px-16">
        <div class="mx-auto w-full max-w-2xl">${st.body()}</div>
      </section>
    </div>`;
  }

  function barHTML(st) {
    const act = active();
    const valid = st.valid ? st.valid() : true;
    const segs = SECTIONS.map((name, i) => {
      const n = i + 1;
      const inSec = act.filter((x) => x.section === n);
      const done = st.section > n;
      const current = st.section === n;
      const fill = done ? 100 : current ? (n === 4 ? 100 : Math.round(((inSec.indexOf(st) + 1) / inSec.length) * 100)) : 0;
      return `
        <div class="min-w-0 flex-1">
          <p class="mb-2 hidden truncate text-xs font-bold md:block ${current ? 'text-navy-950' : done ? 'text-navy-600' : 'text-navy-400'}">${name}</p>
          <div class="relative h-1.5 rounded-full bg-navy-100">
            <div class="absolute inset-y-0 left-0 rounded-full bg-brass-400 transition-all duration-500" style="width:${fill}%"></div>
            <span class="absolute -top-[3px] left-0 h-3 w-3 rounded-full ring-2 ring-white ${done || current ? 'bg-brass-500' : 'bg-navy-200'}"></span>
          </div>
        </div>`;
    }).join('');
    return `
      <div class="flex h-20 items-center gap-3 px-3 sm:gap-6 sm:px-6 md:px-8">
        <button type="button" data-back class="grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-navy-200 text-navy-700 transition hover:border-navy-950 hover:text-navy-950" aria-label="Back"><i data-lucide="chevron-left" class="h-5 w-5"></i></button>
        <div class="min-w-0 flex-1 ${st.section === 0 ? 'invisible' : ''}">
          <p class="mb-1.5 truncate text-[11px] font-bold text-navy-950 md:hidden">${SECTIONS[Math.max(0, st.section - 1)]}</p>
          <div class="flex gap-2 md:gap-4">${segs}</div>
        </div>
        <button type="button" data-next ${valid ? '' : 'disabled'} class="${CYB.cls.btnPrimary} shrink-0 px-5 py-3.5 uppercase tracking-wider sm:px-8 disabled:cursor-not-allowed disabled:bg-navy-100 disabled:text-navy-400 disabled:shadow-none disabled:hover:translate-y-0">${st.id === 'review' ? 'Submit' : 'Continue'}</button>
      </div>`;
  }

  function normalize() {
    if (len() > 32) s.operators.renter = false;
    if (len() > 33) s.insuranceBoat.captained = 'yes';
    if (!active().some((x) => x.id === s.step)) s.step = active()[0].id;
  }

  function updateEarnings() {
    const L = len();
    $('earnings').textContent = L > 0 ? CYB.fmt.money(Math.round(L * 86.4)) : '—';
  }

  function updateBar() { const st = cur(); $('wizard-bar').innerHTML = st.id === 'done' ? '' : barHTML(st); CYB.icons(); }

  function render() {
    normalize();
    const st = cur();
    const main = $('wizard');
    main.innerHTML = st.layout === 'full' ? st.body() : splitHTML(st);
    main.classList.toggle('pb-20', st.id !== 'done');
    $('wizard-bar').classList.toggle('hidden', st.id === 'done');
    $('save-exit').textContent = st.id === 'done' ? 'Exit' : 'Save and exit';
    updateBar();
    updateEarnings();
    if (lastStep !== st.id) {
      main.firstElementChild?.classList.add('step-panel');
      window.scrollTo({ top: 0 });
      lastStep = st.id;
    }
    document.title = `${st.id === 'review' ? 'Review your listing' : st.id === 'done' ? 'Listing submitted' : 'List Your Boat'} — Chicago Yacht Booking`;
    CYB.icons();
  }

  /* ------------------------------------------------------------------ */
  /* Persistence & navigation                                            */
  /* ------------------------------------------------------------------ */
  let warned = false;
  function persist() {
    if (s.step === 'intro' && !CYB.listings.get(s.id)) return; // don't save untouched drafts
    if (!CYB.listings.save(s) && !warned) {
      warned = true;
      CYB.toast('Browser storage is full — your photos are too large to save in this demo. Everything else is saved.', 'error');
      const lite = { ...s, photos: s.photos.filter((p) => !p.startsWith('data:')) };
      CYB.listings.save(lite);
    }
  }
  let saveTimer;
  const persistSoon = () => { clearTimeout(saveTimer); saveTimer = setTimeout(persist, 400); };

  function go(id) {
    s.step = id;
    if (id === 'review') returnToReview = false;
    persist();
    render();
  }
  function next() {
    const st = cur();
    if (st.valid && !st.valid()) return;
    if (st.id === 'review') return submit();
    const act = active();
    const target = returnToReview ? 'review' : act[act.indexOf(st) + 1].id;
    go(target);
  }
  function back() {
    if (returnToReview) { go('review'); return; }
    const act = active();
    const i = act.indexOf(cur());
    if (i <= 0) { location.href = 'index.html'; return; }
    go(act[i - 1].id);
  }
  function submit() {
    s.status = 'pending';
    s.submittedAt = new Date().toISOString();
    go('done');
  }

  /* ------------------------------------------------------------------ */
  /* Photos                                                              */
  /* ------------------------------------------------------------------ */
  function shrink(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const k = Math.min(1, 1000 / img.width);
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * k);
          c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.72));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  async function addFiles(files) {
    const imgs = [...files].filter((f) => f.type.startsWith('image/'));
    if (!imgs.length) { CYB.toast('Please choose image files (JPG, PNG, GIF or WEBP)', 'error'); return; }
    for (const f of imgs) {
      if (f.size > 25 * 1024 * 1024) { CYB.toast(`${f.name} is larger than 25 MB`, 'error'); continue; }
      try { s.photos.push(await shrink(f)); } catch (e) { CYB.toast(`Couldn't read ${f.name}`, 'error'); }
    }
    s.photosSkipped = false;
    persist();
    render();
  }

  /* ------------------------------------------------------------------ */
  /* Events                                                              */
  /* ------------------------------------------------------------------ */
  document.addEventListener('click', (e) => {
    const t = e.target;
    let b;
    if (t.closest('[data-next]')) return next();
    if (t.closest('[data-back]')) return back();
    if ((b = t.closest('[data-edit]'))) { returnToReview = true; s.step = b.dataset.edit; persist(); render(); return; }
    if ((b = t.closest('[data-radio]'))) { setP(b.dataset.radio, b.dataset.value); persistSoon(); render(); return; }
    if ((b = t.closest('[data-check]'))) {
      const path = b.dataset.check;
      const v = path === 'durations' ? Number(b.dataset.value) : b.dataset.value;
      const arr = getP(path);
      setP(path, arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
      persistSoon(); render(); return;
    }
    if ((b = t.closest('[data-op]'))) { const k = b.dataset.op; s.operators[k] = !s.operators[k]; persistSoon(); render(); return; }
    if ((b = t.closest('[data-day-toggle]'))) { const d = s.availability.days[b.dataset.dayToggle]; d.on = !d.on; persistSoon(); render(); return; }
    if (t.closest('[data-pick-photos]')) { $('photo-input').click(); return; }
    if ((b = t.closest('[data-remove-photo]'))) { s.photos.splice(Number(b.dataset.removePhoto), 1); persist(); render(); return; }
    if ((b = t.closest('[data-cover-photo]'))) { const i = Number(b.dataset.coverPhoto); s.photos.unshift(s.photos.splice(i, 1)[0]); persist(); render(); return; }
    if (t.closest('[data-sample-photos]')) {
      O.sampleOwnerPhotos.forEach((p) => { if (!s.photos.includes(p)) s.photos.push(p); });
      persist(); render(); return;
    }
    if (t.closest('[data-skip-photos]')) { s.photosSkipped = true; const act = active(); go(returnToReview ? 'review' : act[act.indexOf(cur()) + 1].id); return; }
    if (t.closest('#save-exit')) {
      if (s.step === 'intro' && !CYB.listings.get(s.id)) { location.href = 'my-boats.html'; return; }
      persist();
      CYB.toast('Draft saved');
      setTimeout(() => { location.href = 'my-boats.html'; }, 500);
    }
  });

  const onField = (e) => {
    const el = e.target;
    if (!el.matches || !el.matches('[data-bind]')) return;
    setP(el.dataset.bind, el.value);
    if (el.dataset.bind === 'title') { const c = document.querySelector('[data-count-for="title"]'); if (c) c.textContent = 70 - el.value.length; }
    if (el.dataset.bind === 'specs.length') updateEarnings();
    persistSoon();
    if (e.type === 'change' && el.hasAttribute('data-rerender')) render();
    else updateBar();
  };
  document.addEventListener('input', onField);
  document.addEventListener('change', (e) => {
    if (e.target.id === 'photo-input') { addFiles(e.target.files); e.target.value = ''; return; }
    if (e.target.id === 'coi-input') { const f = e.target.files[0]; if (f) { s.commercial.coi = f.name; persist(); render(); } return; }
    onField(e);
  });

  // Drag & drop photos
  document.addEventListener('dragover', (e) => {
    const z = e.target.closest?.('#dropzone');
    if (!z) return;
    e.preventDefault();
    z.classList.add('border-brass-400', 'bg-brass-50');
  });
  document.addEventListener('dragleave', (e) => { e.target.closest?.('#dropzone')?.classList.remove('border-brass-400', 'bg-brass-50'); });
  document.addEventListener('drop', (e) => {
    const z = e.target.closest?.('#dropzone');
    if (!z) return;
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  });

  // Enter key in a text field = Continue (not on textareas)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches?.('input[data-bind]') && cur().id !== 'review') { e.preventDefault(); next(); }
  });

  render();
  if (restored) CYB.toast('Welcome back — we restored your saved draft.');
})();
