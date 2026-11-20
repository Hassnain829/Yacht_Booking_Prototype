# Chicago Yacht Booking — Client Mockup

Static HTML + Tailwind CSS + vanilla JS mockup for **chicagoyachtbooking.com**.
Built so the markup can be moved into **Laravel Blade + Tailwind** later with minimal rework.

## How to open

No build step. Double-click `index.html`. For the best result (video autoplay, clipboard, share), serve the folder locally:

```bash
# any one of these, from the project folder
npx serve .
php -S localhost:8000
python -m http.server 8000
```

An internet connection is needed for Tailwind CDN, Google Fonts, Lucide icons and Google Maps embeds.

## Pages

| Page | File | What it shows |
|---|---|---|
| Home | `index.html` | Video hero + quick availability search, stats, fleet tabs, experiences, why us, 3 steps, reviews carousel, gallery lightbox, FAQ, CTA |
| Yachts | `yachts.html` | Fleet grid with type / guests / harbor filters, sorting, compare table |
| Yacht detail | `yacht.html?id=azure` | Gallery + lightbox, specs, amenities, experiences, pricing breakdown, map, sticky booking card with live estimate |
| Experiences | `experiences.html` | All 8 experiences with category filter, "all-in from" price, durations, departures |
| Pricing | `pricing.html` | Price formula, example packages, **live price estimator**, rate card, add-ons, policies |
| About Us | `about.html` | Story, values, captains, harbors |
| Contact Us | `contact.html` | Contact cards, validated form, map, quick FAQ |
| Book Now | `booking.html` | **4-step booking**: Experience → Yacht & guests → Calendar, duration & time slot → Extras, with live summary |
| Checkout | `checkout.html` | Full-page checkout (not a popup): guest details, gratuity, deposit vs. full payment, card fields, promo code, order summary, hold timer |
| Confirmation | `confirmation.html` | Booking reference, trip details, payment summary, next steps, **.ics add-to-calendar**, print, map |
| List Your Boat | `list-your-boat.html` | **Owner onboarding wizard** (flow based on the client's reference): Boat details → Availability → Operators & durations + insurance → Review & submit. Auto-saves drafts, "Save and exit", photo upload |
| My boats | `my-boats.html` | Owner's listings with status (In progress / Pending review / Approved), continue/edit, delete |
| Owner dashboard | `owner-dashboard.html` | Owner profile, stats, action-required notice, tool cards (bookings, messages, payouts, tax forms…) |

### Demo tips for the client meeting
- Promo codes: `WELCOME10` (10% off charter), `SUNSET50` ($50 off).
- Test card: `4242 4242 4242 4242`, any future expiry, any CVC (click the number on checkout to auto-fill).
- **Navy Pier Fireworks** only allows Wednesday & Saturday dates in the calendar.
- Fri–Sun dates use the weekend rate (+15%).
- Trips less than 7 days away must be paid in full (the deposit option is disabled).
- Availability (sold-out days, booked slots) is fake but consistent: the same yacht and date always show the same result.
- **List Your Boat**: on the photos step, "Demo: use sample photos" fills 4 photos instantly. Boats over 32 ft can't be renter-operated, and over 33 ft must be captained (enforced automatically). Drafts and submitted listings are stored in the browser (localStorage) for the demo.

## Folder structure

```
index.html … owner-dashboard.html   13 pages
assets/
  css/app.css                    small custom CSS (reveal animations, accordion, header states)
  js/tailwind.config.js          brand theme (colors, fonts) → becomes tailwind.config.js / @theme
  js/data.js                     ALL business data: yachts, experiences, add-ons, harbors, pricing rules
  js/app.js                      helpers: formatting, availability, quote calculator, UI components
  js/layout.js                   shared header, mobile menu, footer
  js/pages/*.js                  one script per page
  images/                        royalty-free placeholder photos (Unsplash)
  video/hero.mp4                 hero background video (Mixkit, free license)
```

## Pricing model (placeholders — final numbers come from the business)

```
Yacht charter     = yacht hourly rate × hours   (Fri–Sun × 1.15)
Captain & crew    = captain hourly × hours      (always included, shown as its own line)
Experience pkg    = flat package fee            (e.g. Fireworks +$250, Playpen +$150)
Add-ons           = flat or per-guest
Fuel & cleaning   = flat per yacht
Tax (est.)        = 9% of the above, after discount
Gratuity          = optional % of (charter + captain)
Deposit           = 50% today, balance auto-charged 7 days before the trip
```
Change any of these in `assets/js/data.js`; every page updates automatically.

---

## Moving to Laravel (Blade + Tailwind)

### 1. Layout and partials
| Mockup | Laravel |
|---|---|
| `<head>` of each page | `resources/views/layouts/app.blade.php` (`@vite(['resources/css/app.css','resources/js/app.js'])`) |
| `layout.js` header markup | `resources/views/partials/header.blade.php` |
| `layout.js` footer markup | `resources/views/partials/footer.blade.php` |
| `CYB.ui.yachtCard()` | `resources/views/components/yacht-card.blade.php` → `<x-yacht-card :yacht="$yacht" />` |
| each page `<main>` | `@extends('layouts.app') @section('content') … @endsection` |
| `href="booking.html?yacht=x"` | `href="{{ route('booking.create', ['yacht' => $yacht->slug]) }}"` |

The Tailwind classes copy over unchanged. Move `tailwind.config.js` `theme.extend` into the Laravel Tailwind config (v3), or into `@theme { --color-navy-950: #07111e; … }` in `resources/css/app.css` (v4). Install Tailwind via Vite and remove the CDN script.

### 2. Database (from `data.js`)
```
harbors        id, name, area, note, map_query, image
yachts         id, slug, name, type, length_ft, max_guests, cabins, heads, year, harbor_id,
               hourly_rate, weekend_multiplier, min_hours, captain_hourly, crew_count,
               cleaning_fee, rating, reviews_count, badge, short, description, is_featured, is_active
yacht_images   id, yacht_id, path, sort
amenities      id, name  +  amenity_yacht (pivot)
experiences    id, slug, name, category, icon, image, tagline, description, includes (json),
               durations (json), slots (json), package_fee, allowed_days (json, nullable)
experience_yacht   pivot: which yacht offers which experience (optional price override)
addons         id, name, description, price, unit (flat|guest), icon, is_active
bookings       id, reference, yacht_id, experience_id, date, start_time, hours, guests,
               occasion, notes, subtotal, discount, tax, gratuity, total, paid, balance,
               balance_due_on, status (pending|confirmed|cancelled|completed),
               customer_name, email, phone, stripe_payment_intent, timestamps
addon_booking  pivot with price snapshot
blackout_dates id, yacht_id (nullable = all), date, reason
promo_codes    code, type (percent|flat), value, expires_at, max_uses
settings       tax_rate, deposit_rate, balance_due_days, weekend_multiplier, …
```

### 3. Logic to move server-side
- `CYB.quote()` → `App\Services\QuoteService`. **Always recalculate prices on the server at checkout**; never trust totals sent from the browser.
- `CYB.availability` → `App\Services\AvailabilityService`: a slot is free if no confirmed or pending booking overlaps `[start, start + hours + buffer]` for that yacht, and the date isn't a blackout date.
- Booking hold: create a `pending` booking with `expires_at = now()+15min` on checkout load, and release it with a scheduled job.
- Payment: Stripe (Laravel Cashier or the Stripe PHP SDK) using Payment Element. Charge the deposit now, save the card, and auto-charge the balance with a scheduled command.
- Emails: confirmation (with the .ics attached), captain reminder at 24h, balance receipt.

### 4. Admin dashboard (suggested: Filament)
Resources: Yachts (with image uploads), Experiences, Add-ons, Harbors, Bookings (calendar view + status), Blackout dates, Promo codes, Settings, Contact leads, **Owner listings (approve / reject)**. Filament gives tables, forms and a calendar widget quickly.

### 5. List Your Boat (owner listings)
- Requires login: owners register first (Laravel Breeze), `users.role = owner`. The "Your details" card on the review step is replaced by the logged-in user.
- `listings` table: `user_id, status (draft|pending|approved|rejected), step, insurance_type, location_* , title, description, cancellation_policy, rules (json), features (json), extras (json), navigation (json), specs_* , availability (json), advance_notice, multi_booking, buffer, operators (json), durations (json), fuel_policy, insurance_owner (json), insurance_boat (json), commercial_insurance (json), submitted_at, approved_at`
- `listing_photos`: `listing_id, path, sort` (first = cover). Upload to `storage/app/public/listings/{id}`.
- Wizard: one route `/list-your-boat/{listing?}/{step?}`, `PATCH` per step (form request per step for validation), so drafts are saved server-side like the mockup's auto-save.
- Admin approves a listing → it becomes a `yachts` row (or `yachts.listing_id`), where the team sets pricing, captain fee and experiences before it appears in the public fleet.
- Wizard options (`CYB.data.listing` in `data.js`) → `config/listing.php`.



## Credits
- Photos: [Unsplash](https://unsplash.com/license) (free to use).
- Hero video: [Mixkit](https://mixkit.co/license/) (free license).
- Icons: [Lucide](https://lucide.dev) (ISC).
