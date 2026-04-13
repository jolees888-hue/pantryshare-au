# PantryShare AU + Famine & Feast AU — Project Documentation

**Last updated:** April 2026  
**Developer:** EmuAppleAI (Joanne Lees, East Fremantle, Western Australia)  
**Email:** joanna@emuappleai.com

---

## Dual Brand Structure

| Brand | Purpose | Domain |
|-------|---------|--------|
| **Famine & Feast AU** | Campaign / movement brand, media-facing | famineandfeast.com.au |
| **PantryShare AU** | The community app | pantryshare.com.au |

---

## Concept

A community food sharing app for Australia, built in response to rising fuel costs straining supply chains and potential food shortages. Connects neighbours suburb by suburb to share, swap, and request food — covering all emergency scenarios: economic hardship, floods, cyclones, conflict, supply disruptions.

**Tone:** Calm, serious, community-first. Not alarmist.  
**App Store goal:** $0.99 AUD on Apple App Store (requires $149 AUD/year Apple Developer account)

---

## Live URLs

- **App:** https://pantryshare.com.au
- **Landing page:** https://famineandfeast.com.au
- **Privacy policy:** https://famineandfeast.com.au/privacy.html
- **Short link:** https://tinyurl.com/pantryshare-au
- **GitHub repo:** https://github.com/jolees888-hue/pantryshare-au

---

## Hosting & Infrastructure

| Service | Details |
|---------|---------|
| **Hosting** | Hostinger Business Web Hosting |
| **GitHub username** | jolees888-hue |
| **Node version** | 20.x |
| **Auto-deploy** | ON — pushes to `main` branch auto-deploy to Hostinger |
| **Entry file** | `dist/index.cjs` ← CRITICAL (not server.js) |
| **Build command** | `npm run build` (runs `tsx script/build.ts`) |
| **Start command** | `NODE_ENV=production node dist/index.cjs` |

---

## App Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Routing:** Wouter with `useHashLocation`
- **Styling:** Custom CSS design system (no Tailwind)
- **Backend:** Express.js
- **Storage:** Pure JavaScript JSON file (`pantryshare-data.json`) — NO native modules
- **PWA:** manifest.json + service worker + custom icons
- **Fonts:** Cabinet Grotesk (headings) + General Sans (body) via Fontshare

> ⚠️ IMPORTANT: `better-sqlite3` and all native C++ modules were removed. Hostinger's managed Node.js does not support native modules. Storage is handled entirely by `server/storage.ts` using a JSON file.

---

## Design System

| Token | Value |
|-------|-------|
| Dark background | `#2e3822` |
| Army green accent | `#6a8040` |
| Sage | `#98ba68` |
| Cream | `#f8f4e8` |
| Warm cream | `#f0ece0` |
| Gold accent | `#c9a030` |
| Body font | General Sans (Fontshare) |
| Heading font | Cabinet Grotesk (Fontshare) |

---

## App Features (MVP)

- Browse food listings by suburb/postcode
- Filter by type: Share / Swap / Wanted
- Filter by category: Pantry, Produce, Dairy, Bakery, Meals, Baby & Kids, Pet Food, Other
- Post a listing with validation
- Listing detail page with direct email contact
- Remove listing functionality
- Dark mode toggle
- PWA — installable on home screen
- Seed endpoint: `POST /api/seed` (adds 6 demo listings)

---

## Key Files — PantryShare AU App

```
suburbshare/
├── client/
│   ├── src/
│   │   ├── App.tsx                  # Router setup
│   │   ├── pages/
│   │   │   ├── Home.tsx             # Browse listings, search/filter, stats
│   │   │   ├── PostListing.tsx      # Post form with validation
│   │   │   └── ListingDetail.tsx    # Detail view + email + remove
│   │   ├── components/
│   │   │   └── Layout.tsx           # Header, footer, dark mode, SVG logo
│   │   └── index.css                # Full design system
│   ├── index.html                   # PWA meta tags, fonts
│   └── public/
│       ├── manifest.json            # PWA manifest
│       ├── sw.js                    # Service worker
│       └── icons/                   # PWA icons (192px + 512px)
├── server/
│   ├── storage.ts                   # JSON file storage (NO native modules)
│   └── routes.ts                    # Express API routes
├── shared/
│   └── schema.ts                    # Zod schema (no drizzle)
├── script/
│   └── build.ts                     # Build script
├── pantryshare-data.json            # Live data file
├── package.json                     # better-sqlite3 removed
└── .nvmrc                           # Node 20
```

---

## Key Files — Famine & Feast AU Landing Page

```
famineandfeast/
├── index.html      # Full landing page (hosted at famineandfeast.com.au)
└── privacy.html    # Privacy policy + food safety disclaimer
```

**Landing page sections:**
1. Nav — logo + "Open PantryShare AU" CTA
2. Alert band — urgent message
3. Hero — large headline + animated particles, orb, scan line
4. Reality — stats section (food insecurity data)
5. How it works — 4 steps
6. Why it matters — preparedness + community framing + "Asking is part of how it works"
7. App CTA — App Store coming soon badges + waitlist email capture
8. Press section
9. Footer

**Animations:** Floating particles, glowing orb, scan line sweep, stat card shimmer, fade-in on scroll — all in soft blush-white (`rgba(255,248,252,0.x)`)

---

## Privacy Policy

Hosted at: https://famineandfeast.com.au/privacy.html

Covers:
- Data collection (listing info, contact email, suburb only)
- No account login required
- Food safety disclaimer (FSANZ + Australian Consumer Law)
- Australian Privacy Act 1988 rights
- Children's privacy
- Contact: hello@famineandfeast.com.au

---

## Email Setup (TODO)

Set up `hello@famineandfeast.com.au` in Hostinger Emails. Referenced throughout the landing page and privacy policy.

---

## Google Search Console (TODO)

Submit both domains:
- https://pantryshare.com.au
- https://famineandfeast.com.au

---

## Apple App Store Roadmap

1. Build user base to 100+ active users
2. Purchase Apple Developer account ($149 AUD/year)
3. Wrap PWA using Capacitor or React Native WebView
4. Submit to App Store at $0.99 AUD
5. Consider Android (Google Play — $35 USD one-time fee) simultaneously

---

## Known Issues / Lessons Learned

- `better-sqlite3` fails on Hostinger — native C++ modules not supported on managed Node.js
- Hostinger entry file must be `dist/index.cjs` (not `server.js`)
- `famineandfeast.com.au` uses Hostinger's `dns-parking.com` nameservers (these ARE Hostinger's nameservers — correct)
- Waitlist form currently logs to console only — connect to Mailchimp free tier for production

---

*Built with love in Western Australia. For all Australians.*
