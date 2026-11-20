/**
 * Chicago Yacht Booking — mock data
 * ------------------------------------------------------------
 * Everything here becomes database tables + an admin dashboard in Laravel:
 *   business   -> settings table (or config/business.php)
 *   harbors    -> harbors table
 *   yachts     -> yachts table (+ yacht_images, yacht_amenities)
 *   experiences-> experiences table (+ experience_yacht pivot via yacht.experiences)
 *   addons     -> addons table
 *   pricing    -> settings table (weekend multiplier, tax, deposit, promo_codes table)
 * All prices are PLACEHOLDERS for the client mockup.
 */
window.CYB = window.CYB || {};

CYB.data = {
  business: {
    name: 'Chicago Yacht Booking',
    domain: 'chicagoyachtbooking.com',
    phone: '(312) 555-0148',
    phoneHref: '+13125550148',
    email: 'hello@chicagoyachtbooking.com',
    office: 'DuSable Harbor, Chicago, IL 60601',
    hours: 'Daily 8:00 AM – 9:00 PM',
    instagram: '#',
    facebook: '#',
    youtube: '#',
  },

  harbors: [
    { id: 'dusable', name: 'DuSable Harbor', area: 'Downtown · Streeterville', note: 'Steps from Millennium Park and Maggie Daley Park.', map: 'DuSable+Harbor+Chicago+IL', image: 'assets/images/chicago-navy-pier.jpg' },
    { id: 'navypier', name: 'Navy Pier', area: 'Streeterville', note: 'Board right next to the Centennial Wheel.', map: 'Navy+Pier+Chicago+IL', image: 'assets/images/chicago-river-cruise.jpg' },
    { id: 'belmont', name: 'Belmont Harbor', area: 'Lakeview', note: 'Calm north-side harbor, easy street parking.', map: 'Belmont+Harbor+Chicago+IL', image: 'assets/images/chicago-river-boats.jpg' },
    { id: 'burnham', name: 'Burnham Harbor', area: 'Museum Campus', note: 'Skyline views from the moment you board.', map: 'Burnham+Harbor+Chicago+IL', image: 'assets/images/chicago-architecture.jpg' },
  ],

  yachts: [
    {
      id: 'azure', name: 'The Azure', type: 'Motor Yacht', length: 62, guests: 13, cabins: 3, heads: 2, year: 2021,
      harbor: 'dusable', hourly: 450, minHours: 3, captainHourly: 85, crew: 1, cleaningFee: 150,
      rating: 4.9, reviews: 312, badge: 'Most Popular', featured: true,
      image: 'assets/images/yacht-azure.jpg',
      gallery: ['assets/images/yacht-azure.jpg', 'assets/images/deck-lounge.jpg', 'assets/images/interior-salon.jpg', 'assets/images/yacht-aerial.jpg', 'assets/images/deck-aft.jpg'],
      short: 'A sleek flybridge yacht with a sun-drenched upper deck — our most-booked boat for birthdays and Playpen days.',
      description: 'The Azure pairs a wide-open flybridge with a cool, air-conditioned salon, so your group can chase the sun or retreat to the shade. A swim platform at the stern makes Playpen days effortless, and the premium sound system keeps the energy right from the moment you leave the harbor.',
      amenities: ['Flybridge sun lounge', 'Premium Bluetooth sound', 'Swim platform & ladder', 'Air-conditioned salon', '2 private restrooms', 'Coolers & ice', 'Lily pad compatible', 'Shaded seating'],
      experiences: ['sunset', 'playpen', 'river', 'fireworks', 'celebration', 'proposal', 'private'],
    },
    {
      id: 'skyline', name: 'Skyline Majesty', type: 'Luxury Yacht', length: 75, guests: 49, cabins: 4, heads: 3, year: 2019,
      harbor: 'navypier', hourly: 950, minHours: 3, captainHourly: 175, crew: 3, cleaningFee: 250,
      rating: 5.0, reviews: 128, badge: 'Best for Groups', featured: true,
      image: 'assets/images/yacht-skyline-majesty.jpg',
      gallery: ['assets/images/yacht-skyline-majesty.jpg', 'assets/images/interior-salon.jpg', 'assets/images/exp-party.jpg', 'assets/images/deck-aft.jpg', 'assets/images/chicago-navy-pier.jpg'],
      short: 'Three decks, a full bar setup and room for 49 — built for company outings, weddings and milestone parties.',
      description: 'Skyline Majesty is a tri-deck yacht designed for hosting. A climate-controlled main salon flows onto an open aft deck, while the top deck delivers 360° views of the Chicago skyline. A captain and two crew members handle everything so you can focus on your guests.',
      amenities: ['Three entertaining decks', 'Built-in bar & catering prep', 'Climate-controlled salon', '3 restrooms', 'Pro sound & mic', 'Dance floor', 'Shaded & open seating', 'Captain + 2 crew'],
      experiences: ['sunset', 'fireworks', 'celebration', 'corporate', 'private'],
    },
    {
      id: 'windward', name: 'Windward', type: 'Sailboat', length: 42, guests: 6, cabins: 2, heads: 1, year: 2018,
      harbor: 'belmont', hourly: 225, minHours: 2, captainHourly: 65, crew: 1, cleaningFee: 75,
      rating: 4.9, reviews: 186, badge: 'Romantic Pick', featured: true,
      image: 'assets/images/yacht-windward.jpg',
      gallery: ['assets/images/yacht-windward.jpg', 'assets/images/bow.jpg', 'assets/images/exp-couple.jpg', 'assets/images/chicago-navy-pier.jpg'],
      short: 'A classic sailing yacht for couples and small groups — quiet, breezy and unforgettable at sunset.',
      description: 'There is nothing quite like the hush of the sails filling as the skyline glows. Windward is a beautifully kept 42-foot sailing yacht for up to six guests — perfect for proposals, anniversaries and anyone who wants to actually feel the lake.',
      amenities: ['Under-sail experience', 'Cushioned cockpit seating', 'Private cabin', '1 restroom', 'Bluetooth speaker', 'Blankets for evening sails', 'Cooler with ice', 'Hands-on sailing (optional)'],
      experiences: ['sunset', 'proposal', 'fireworks', 'private'],
    },
    {
      id: 'golden', name: 'Golden Hour', type: 'Motor Yacht', length: 58, guests: 13, cabins: 3, heads: 2, year: 2022,
      harbor: 'dusable', hourly: 395, minHours: 3, captainHourly: 85, crew: 1, cleaningFee: 150,
      rating: 4.8, reviews: 97, badge: 'New in 2022', featured: false,
      image: 'assets/images/yacht-golden-hour.jpg',
      gallery: ['assets/images/yacht-golden-hour.jpg', 'assets/images/cockpit.jpg', 'assets/images/deck-lounge.jpg', 'assets/images/exp-friends.jpg'],
      short: 'Modern lines, warm teak and a spacious sun pad — a stylish pick for birthdays and river cruises.',
      description: 'Golden Hour is our newest 13-guest yacht, with a contemporary interior, a large forward sun pad and an easy-boarding swim platform. Low enough for the Chicago River and roomy enough for a proper party on the lake.',
      amenities: ['Forward sun pad', 'Teak swim platform', 'Modern salon', '2 restrooms', 'Premium sound', 'Coolers & ice', 'River-cruise friendly', 'USB charging'],
      experiences: ['sunset', 'playpen', 'river', 'fireworks', 'celebration', 'proposal', 'private'],
    },
    {
      id: 'lakeside', name: 'Lakeside Party Cat', type: 'Catamaran', length: 65, guests: 80, cabins: 0, heads: 2, year: 2020,
      harbor: 'navypier', hourly: 1250, minHours: 3, captainHourly: 225, crew: 4, cleaningFee: 300,
      rating: 4.9, reviews: 241, badge: 'Party Favorite', featured: false,
      image: 'assets/images/yacht-party-cat.jpg',
      gallery: ['assets/images/yacht-party-cat.jpg', 'assets/images/exp-party.jpg', 'assets/images/exp-toast.jpg', 'assets/images/exp-swim.jpg'],
      short: 'A wide, stable party catamaran for up to 80 guests with a DJ booth, bar counter and huge open deck.',
      description: 'When the guest list gets big, the Lakeside Party Cat delivers. Two hulls mean a smooth, stable ride and an enormous open deck — ideal for company summer parties, reunions and Playpen days with the whole crew.',
      amenities: ['Huge open deck', 'DJ booth & PA system', 'Bar counter', '2 restrooms', 'Shaded lounge', 'Swim ladders', 'Captain + 3 crew', 'ADA-friendly boarding'],
      experiences: ['playpen', 'celebration', 'corporate', 'fireworks', 'private'],
    },
    {
      id: 'onyx', name: 'Midnight Onyx', type: 'Superyacht', length: 85, guests: 49, cabins: 5, heads: 4, year: 2023,
      harbor: 'burnham', hourly: 1650, minHours: 3, captainHourly: 275, crew: 4, cleaningFee: 350,
      rating: 5.0, reviews: 64, badge: 'Flagship', featured: false,
      image: 'assets/images/yacht-midnight-onyx.jpg',
      gallery: ['assets/images/yacht-midnight-onyx.jpg', 'assets/images/superyacht.jpg', 'assets/images/interior-salon.jpg', 'assets/images/deck-aft.jpg', 'assets/images/wake.jpg'],
      short: 'Our flagship 85-foot superyacht with a dedicated steward — the ultimate Chicago VIP experience.',
      description: 'Midnight Onyx is the most refined way to see Chicago from the water. A full crew including a dedicated steward, a formal dining salon, and a sky lounge built for sunset cocktails and front-row fireworks views.',
      amenities: ['Sky lounge', 'Formal dining salon', 'Dedicated steward', '4 restrooms', 'Jacuzzi on deck', 'Surround sound', 'Captain + 3 crew', 'Concierge catering'],
      experiences: ['sunset', 'fireworks', 'corporate', 'proposal', 'celebration', 'private'],
    },
  ],

  /* days: allowed weekdays (0 = Sun … 6 = Sat). null = every day. */
  experiences: [
    {
      id: 'sunset', name: 'Sunset Skyline Cruise', category: 'sightseeing', icon: 'sunset',
      image: 'assets/images/hero-poster.jpg',
      tagline: 'Golden hour over Lake Michigan',
      description: 'Watch the city light up as the sun drops behind the skyline. Cruise past Navy Pier, the Lakefront and Museum Campus with a drink in hand and the best seat in Chicago.',
      includes: ['Golden-hour departure', 'Skyline photo stop', 'Ice, water & cups', 'Bluetooth playlist'],
      durations: [2, 3, 4], slots: ['17:30', '18:00', '18:30', '19:00'], packageFee: 0, days: null,
    },
    {
      id: 'playpen', name: 'Playpen Swim Party', category: 'party', icon: 'waves',
      image: 'assets/images/exp-swim.jpg',
      tagline: "Anchor up at Chicago's favorite floating party",
      description: 'Drop anchor at the Playpen, the sheltered swim spot off Ohio Street Beach. Float on the lily pad, swim off the back of the boat and soak up the summer energy.',
      includes: ['Anchor at the Playpen', 'Lily pad & pool floats', 'Swim ladder', 'Towels on request'],
      durations: [3, 4, 5], slots: ['11:00', '12:00', '13:00', '14:00'], packageFee: 150, days: null,
    },
    {
      id: 'river', name: 'River Architecture Cruise', category: 'sightseeing', icon: 'building-2',
      image: 'assets/images/chicago-river-bridges.jpg',
      tagline: "Glide past Chicago's iconic architecture",
      description: 'Wind through the canyon of skyscrapers on the Chicago River — Marina City, the Wrigley Building and the Riverwalk — then head out to the lake for open-water views.',
      includes: ['Main & south branch route', 'Captain-led highlights', 'Lakefront lock passage', 'Ice & water'],
      durations: [2, 3], slots: ['10:00', '13:00', '16:00'], packageFee: 75, days: null,
    },
    {
      id: 'fireworks', name: 'Navy Pier Fireworks', category: 'sightseeing', icon: 'sparkles',
      image: 'assets/images/exp-fireworks.jpg',
      tagline: 'Front-row seats to the summer fireworks',
      description: 'Anchor just off Navy Pier for a private, front-row view of the summer fireworks show, then cruise home past a glittering skyline. Available on Wednesday and Saturday nights.',
      includes: ['Prime anchoring spot', 'Night-cruise lighting', 'Blankets & ice', 'Skyline night cruise'],
      durations: [2, 3], slots: ['20:00', '20:30'], packageFee: 250, days: [3, 6],
    },
    {
      id: 'celebration', name: 'Birthdays & Bachelorettes', category: 'party', icon: 'party-popper',
      image: 'assets/images/exp-friends.jpg',
      tagline: 'Celebrate the big day on the water',
      description: "Birthdays, bachelorettes, graduations, reunions — we'll set the scene with décor, a curated playlist and a route that hits the Playpen or the skyline at sunset.",
      includes: ['Welcome décor & banner', 'Celebration playlist', 'Champagne flutes', 'Photo stop'],
      durations: [3, 4], slots: ['11:00', '15:00', '19:00'], packageFee: 175, days: null,
    },
    {
      id: 'corporate', name: 'Corporate Outings', category: 'private', icon: 'briefcase',
      image: 'assets/images/exp-toast.jpg',
      tagline: 'Team events, client entertaining & offsites',
      description: 'Impress clients or reward your team with a private charter. We coordinate catering, branded touches and invoicing, and our crew keeps everything running on schedule.',
      includes: ['Dedicated event coordinator', 'Catering coordination', 'Mic & AV on larger yachts', 'Invoice & W-9 on request'],
      durations: [3, 4, 6], slots: ['09:00', '12:00', '15:00', '18:00'], packageFee: 0, days: null,
    },
    {
      id: 'proposal', name: 'Proposals & Romance', category: 'private', icon: 'heart',
      image: 'assets/images/exp-couple.jpg',
      tagline: 'The yes you will remember forever',
      description: 'A private sunset sail with roses, champagne and a captain who knows exactly when to look the other way. We help plan every detail — including a hidden photographer.',
      includes: ['Rose petals & candles', 'Chilled champagne', 'Private sunset route', 'Planning call with our team'],
      durations: [2, 3], slots: ['17:30', '18:30'], packageFee: 295, days: null,
    },
    {
      id: 'private', name: 'Private Day Charter', category: 'private', icon: 'ship-wheel',
      image: 'assets/images/yacht-aerial.jpg',
      tagline: 'Your yacht, your route, your rules',
      description: 'Want the lake your way? Book a fully private charter and tell your captain where to go — skyline, beaches, the Playpen or simply open water.',
      includes: ['Fully custom route', 'Flexible stops', 'Ice & water', 'Bluetooth sound'],
      durations: [2, 3, 4, 6, 8], slots: ['09:00', '12:00', '15:00', '18:00'], packageFee: 0, days: null,
    },
  ],

  /* unit: 'flat' = per booking, 'guest' = per guest */
  addons: [
    { id: 'catering', name: 'Chef-curated catering', desc: 'Charcuterie, sliders, fruit & dessert bites', price: 35, unit: 'guest', icon: 'utensils' },
    { id: 'champagne', name: 'Champagne toast', desc: 'Two chilled bottles of brut + crystal flutes', price: 120, unit: 'flat', icon: 'wine' },
    { id: 'decor', name: 'Celebration décor', desc: 'Balloons, banner & styled table', price: 175, unit: 'flat', icon: 'party-popper' },
    { id: 'lilypad', name: 'Lily pad & water toys', desc: '18 ft floating mat, noodles & tubes', price: 150, unit: 'flat', icon: 'waves' },
    { id: 'photographer', name: 'Pro photographer', desc: '1 hour on board + edited gallery in 72 hrs', price: 350, unit: 'flat', icon: 'camera' },
    { id: 'dj', name: 'Live DJ', desc: 'Professional DJ with lights & sound', price: 450, unit: 'flat', icon: 'music' },
    { id: 'ice', name: 'Cooler & ice package', desc: 'Two coolers stocked with ice & water', price: 45, unit: 'flat', icon: 'snowflake' },
  ],

  /* "List your boat" wizard options.
     Laravel: config/listing.php (or lookup tables) — editable from the admin dashboard. */
  listing: {
    steps: ['Boat details (4 boat photos minimum)', 'Availability', 'Operators and durations', 'Insurance information if applicable', 'Review and submit'],
    locationTypes: ['Marina slip', 'Marina dry storage', 'Marina rack storage', 'Marina mooring', 'Residence trailer', 'Residence slip', 'Residence mooring', 'Other'],
    countries: ['United States', 'Canada'],
    states: ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
    cancellation: [
      { id: 'flexible', name: 'Flexible', badge: 'Recommended', points: ['Free cancellations until 24 hours before the booking start time.', 'Cancellations within 24 hours of the booking start time are non-refundable.'] },
      { id: 'moderate', name: 'Moderate', points: ['Free cancellations until 5 days before the booking start time.', '50% refund for cancellations between 3–5 days before the booking start time.', 'Cancellations within 2 days of the booking start time are non-refundable.'] },
      { id: 'strict', name: 'Strict', points: ['Free cancellations until 30 days before the booking start time.', '50% refund for cancellations between 15–30 days before the booking start time.', 'Cancellations within 14 days of the booking start time are non-refundable.'] },
    ],
    rules: ['Shoes', 'Glass bottles', 'Fishing', 'Pets', 'Kids under 12', 'Smoking', 'Alcohol', 'Liveaboard', 'Swimming', 'Red wine'],
    features: ['Air conditioning', 'Anchor', 'Bathroom', 'Bluetooth audio', 'Cooler / ice chest', 'Deck shower', 'Fish finder', 'Grill', 'Livewell / baitwell', 'Refrigerator', 'Rod holders', 'Shower', 'Stereo', 'Stereo AUX input', 'Swim ladder', 'WiFi'],
    extras: ['Lily pad / float', 'Paddleboard', 'Kayak', 'Tube', 'Water skis', 'Wakeboard', 'Snorkeling gear', 'Fishing gear'],
    navigation: ['GPS', 'Chartplotter', 'Depth finder', 'VHF radio', 'Radar', 'Autopilot', 'Bow thruster', 'Compass'],
    makes: ['Azimut', 'Bayliner', 'Beneteau', 'Boston Whaler', 'Carver', 'Catalina', 'Chaparral', 'Cobalt', 'Cruisers Yachts', 'Formula', 'Grady-White', 'Hatteras', 'Jeanneau', 'Lagoon', 'Leopard', 'Malibu', 'MasterCraft', 'Meridian', 'Prestige', 'Princess', 'Regal', 'Sea Ray', 'Sunseeker', 'Tiara', 'Viking', 'Other'],
    types: ['Power', 'Sail'],
    categories: ['Airboat', 'Aluminum fishing', 'Angler', 'Bass boat', 'Bow rider', 'Catamaran', 'Center console', 'Classic', 'Cruiser', 'Cuddy cabin', 'Daysailer', 'Deck boat', 'Dual console', 'Electric boat', 'Express cruiser', 'Flats boat', 'Flybridge', 'Houseboat', 'Jet boat', 'Mega yacht', 'Motor yacht', 'Pontoon', 'Power catamaran', 'Sailboat', 'Ski & wakeboard', 'Sport fishing', 'Trawler', 'Walkaround', 'Other'],
    engineTypes: ['Inboard', 'Outboard', 'Inboard/Outboard (sterndrive)', 'Jet drive', 'Pod drive', 'V-drive', 'Electric'],
    advanceNotice: [['1h', '1 hour'], ['3h', '3 hours'], ['6h', '6 hours'], ['12h', '12 hours'], ['1d', '1 day'], ['3d', '3 days'], ['7d', '7 days']],
    buffers: [['30m', '30 min'], ['1h', '1 hour'], ['2h', '2 hours'], ['3h', '3 hours']],
    durations: [2, 3, 4, 6, 8],
    liability: ['$300,000', '$500,000', '$1,000,000', '$2,000,000+'],
    sampleOwnerPhotos: ['assets/images/yacht-golden-hour.jpg', 'assets/images/cockpit.jpg', 'assets/images/deck-lounge.jpg', 'assets/images/interior-salon.jpg'],
  },

  pricing: {
    weekendMultiplier: 1.15, // Fri, Sat, Sun
    taxRate: 0.09,
    depositRate: 0.5,
    balanceDueDays: 7,
    gratuityOptions: [0, 15, 18, 20],
    defaultGratuity: 18,
    promos: {
      WELCOME10: { type: 'percent', value: 10, label: '10% off yacht charter' },
      SUNSET50: { type: 'flat', value: 50, label: '$50 off your booking' },
    },
  },
};
