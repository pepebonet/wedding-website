# Evi & Pepe — Wedding Website

Single-page, mobile-first static site for our wedding on **Friday 28 May 2027** in Valencia, Spain.

## Stack
- Plain **HTML + CSS + JS**, no framework, no build step.
- **Tailwind via CDN** for styling, custom styles in `css/styles.css`.
- EN / ES / DE language switcher — all copy in `js/i18n.js` (English default).
- Images optimized to WebP under `images/` (originals kept in `images/curated/` and `images/src/`).

## Run locally
```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Structure
```
index.html        # all sections (hero, story, venue, schedule, travel, stay, bus,
                  # weekend, RSVP, gifts, good-to-know, FAQ, photos, footer)
css/styles.css    # green theme, components
js/i18n.js        # EN/ES/DE copy dictionary
js/app.js         # countdown, nav, language switch, IBAN copy, gallery, RSVP
images/           # *.webp served on the site; src/ + curated/ are originals
vercel.json       # static hosting config (clean URLs + cache headers)
```

## RSVP
The form posts to a Google Apps Script web app that appends to a Google Sheet.
Set the endpoint in `CONFIG.GOOGLE_APPS_SCRIPT_URL` at the top of `js/app.js`.
While it's the placeholder, the form runs in demo mode and logs submissions to the console.

## Deployment
Hosted on **Vercel** (static, auto-deploy on push). `.vercelignore` keeps the large
original photos out of the deployment.

## TODO (placeholders shown as `TBD` on the site)
Apps Script URL · IBAN + account holder · RSVP deadline · hotel room block ·
exact bus times · Saturday day-after details · venue photo.
