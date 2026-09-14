# Evi & Pepe — Wedding Website · Project State

_Handoff doc so any session can pick up. Last updated: 2026-09-14._

## The wedding
- **Couple:** Evi & Pepe
- **Date:** Friday **28 May 2027**, ceremony ~18:00 (Europe/Madrid, UTC+2)
- **Place:** Venue **El Telar** (Benimàmet), Valencia; guests stay in **Alboraya**
- **Guests:** international — English (default), Spanish, German. German note: many guests
  are German-speaking; "Corpus Christi" framing used for context.

## What this is
Single-page, mobile-first **static site**. Plain **HTML + CSS + JS**, **Tailwind via CDN**
(config inline in `index.html`), **no framework, no build step**. Deployed on **Vercel**.

**MOBILE IS TOP PRIORITY.** Always test 360–390px: no horizontal overflow, tap targets ≥44px.

## Repo / git
- GitHub: `git@github.com:pepebonet/wedding-website.git`
- Default branch: **`master`**.
- **Workflow (user's preference):** for each change → branch off fresh `master`
  (`git checkout master && git pull`), edit, verify locally, push, open PR via `gh`.
  User merges PRs themselves. Keep history linear (rebase, not merge-commits into feature branch).
- Merged so far: PR #1 (initial build), PR #2 (content tweaks), PR #3 (RSVP endpoint + share
  image + favicon). **PR #4** (`dress-code-tweak`, drop "long" from women's dress code) — open,
  user to merge. **`olympia-booking-code`** — hotel promo code + booking steps (this change).

## File map
- `index.html` — all sections in §7 order: hero → story → venue (details) → schedule →
  stay (+bus nested) → travel → rsvp → gifts → good-to-know (gtk) → faq → footer. Sticky nav +
  hamburger. Tailwind config + theme colors inline in `<head>`. OG/Twitter meta + favicon links.
- `css/styles.css` — green theme, components: `.kicker`, `.h2`, `.rule`, `.tbd` badge,
  `.timeline`, RSVP `.radio-face`/`.check-row`, `.card`, `.btn-outline`, `.lnk`.
- `js/i18n.js` — `window.I18N = { en, es, de }`. ALL copy lives here. `t("a.b.c")` dot-path.
- `js/app.js` — countdown, nav, language switch, gallery/lightbox, IBAN + hotel-code copy,
  RSVP submit, scroll-reveal. `CONFIG` block at top.
- `google-apps-script/Code.gs` — versioned copy of the RSVP endpoint script (see RSVP below).
- `vercel.json`, `.vercelignore`, `.gitignore`, `README.md`.
- `favicon.svg` + `favicon-32.png` + `apple-touch-icon.png`; `images/og-image.jpg` (1200×630).

## Design system
- **Palette (green):** ivory `#F5F0E5`, sand `#ECE4D2`, green `#19332B`, greenL `#27483D`,
  gold `#C9AB70`, goldD `#A8884E`, ink `#2C2824`, sage `#D6CDBA`.
- **Fonts (Google):** display `Cormorant Garamond`, sans `Montserrat`, script `Great Vibes`.
- Hero title: script font, gold `&`, `clamp(2.5rem,12.5vw,6.5rem)` + `whitespace-nowrap`
  (fixes 390px overflow).

## i18n
- Three languages `en`/`es`/`de`. English default. **Any copy change must be applied to all
  three** unless the user says otherwise.
- `data-i18n="path"` on elements; `data-i18n-ph-attr` for input placeholders.
- `{{TBD}}` token in a string → rendered as a styled `.tbd` badge by `applyText()`.
- Arrays (schedule items, gtk, faq, stay steps) are rendered by dedicated `render*()` fns in app.js.

## RSVP (live)
- Custom form → **Google Apps Script Web App** (`doPost` appends a row to the couple's Sheet).
- Endpoint in `js/app.js` → `CONFIG.GOOGLE_APPS_SCRIPT_URL`:
  `https://script.google.com/macros/s/AKfycbxt1Dib7GYhMlUnDWKZ7bE0_6u-yVo1WswkChZalFWYb_OZy_UgrB5e2OVfyB3dwCKfoQ/exec`
- Submit uses `fetch(..., { mode:"no-cors", headers:{ "Content-Type":"text/plain;charset=utf-8" }, body: JSON })`
  — avoids CORS preflight; Apps Script redirects through googleusercontent.com without CORS headers,
  so the browser can't read the response but the write still happens. Verified working via curl
  (302 → echo URL returns `{"result":"success"}`).
- Script writes to a tab named **`RSVPs`** (auto-created if missing) — `Code.gs`:
  `ss.getSheetByName('RSVPs') || ss.insertSheet('RSVPs')`. If rows "don't appear", check that tab.
  An open Sheet does NOT block writes.
- **Security:** the `/exec` URL is public by design (embedded in client JS — unavoidable for a
  client-side form). It is NOT a credential to the Google account. `doPost` only appends; `doGet`
  returns a static health message — no read/exfiltration path. Only realistic risk = spam rows.
  Optional hardening (not yet done): honeypot field or shared token.
- Sheet: https://docs.google.com/spreadsheets/d/1Ns6ZoCDpiMnAOFBLXqnigj3z4y0aefHIJc-1VWo0mII/edit
- After editing `Code.gs`: redeploy via Deploy ▸ Manage deployments ▸ New version (URL stays same).

## Hotel booking (added in `olympia-booking-code`)
- Hotel: **Olympia Hotel, Events & Spa**, Alboraya. Personal group promo code: **`ENLACE P&E`**.
- Rendered in the "stay" section: a green card with the code (copy button) + 5 numbered steps.
  Steps live in `I18N[lang].stay.steps`; code in `.stay.code`; deadline still `{{TBD}}` in `.stay.roomblock`.
- Booking steps: 1) go to olympiahotelvalencia.com, 2) pick check-in date + nights,
  3) enter code in the **"Promo"** box, 4) choose room + add to cart, 5) complete booking.

## Deployment (Vercel)
- Production URL (as configured in OG meta): `https://evi-pepe-wedding.vercel.app/`
- `vercel.json`: `cleanUrls`, cache headers for `/images/*` (immutable) and `/css|js/*`.
- `.gitignore` excludes `images/src/` (61MB raw originals — NOT committed). `images/curated/`
  (~12MB) IS committed. `.vercelignore` excludes `images/src`, `images/curated`, `README.md`.

## Local dev + QA
- Serve: `python3 -m http.server 8099` in repo root → http://localhost:8099
- Dev flags: `?noanim` reveals all scroll-reveal elements + caps hero height (for screenshots);
  `y=N` scrolls.
- Mobile QA: headless Chrome at 390px. Reliable overflow check = load the site in a same-origin
  390px `<iframe>` and compare `documentElement.scrollWidth` vs `clientWidth` (hidden mobile-menu
  overlay legitimately measures wide — ignore it). Full-page screenshots: `--window-size=390,H
  --virtual-time-budget=5000 --screenshot`, then slice with `sips`.

## Open placeholders (still {{TBD}} on the site)
- IBAN + account holder (gifts section)
- RSVP deadline
- Hotel **booking deadline** (code itself is now set)
- Exact bus times (currently ~17:00 depart, ~01:00–02:00 + ~04:00 return — marked placeholder)
- Saturday day-after details
- A real **venue photo** for El Telar (no asset provided yet)

## Housekeeping TODO
- User to delete the "TEST — please delete" rows in the RSVP Sheet (from endpoint testing).
- Confirm `og:image` URL matches the final production domain if the domain changes.
