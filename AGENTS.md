# AGENTS.md

Instructions for AI coding assistants (Claude Code, Copilot, etc.) working in this repo.
This file describes **this specific client site** — the Southwest Card & Collectible
Show (SWCCS), Las Cruces NM — cloned from `client-site-starter`. Keep it up to date as
the site diverges from the template.

## This site

- **Brand**: matches the client's Instagram flyers — black background, neon-orange
  glowing sign type, rounded-top "arch" flyer panels, navy ribbon banners. Fonts are
  Anton (headings), Bangers (the "Free Entry!" script) and Inter (body) from Google Fonts.
  Palette lives in `src/_includes/css/variables.scss`.
- **Hosting**: GitHub Pages at the custom domain https://swccshows.com (registered and
  DNS on Cloudflare: apex A/AAAA records to GitHub Pages, `www` CNAME to
  `sebastiansells13-bot.github.io`, DNS only). The site deploys with GitHub Actions, so
  the custom domain is set in repo Settings → Pages, not by a `CNAME` file.
  `pathPrefix` is `/`; `metadata.json` `url` is the one place the domain lives in code
  (canonicals, sitemap, feed, JSON-LD, robots.txt, llms.txt all read it).
- **Events**: `src/events/*.md` (CMS "Shows & Trade Days"). The `upcoming` / `past`
  filters split them by build date; the soonest upcoming event is featured in the home
  hero. Each event gets a page at `/shows/<file-slug>/`.
- **Show recaps**: events take `gallery` (`image`, `alt`, `altEs`) and `galleryCredit`;
  `components/gallery.njk` renders them and `js/gallery.js` adds the lightbox. The
  `thumb` filter maps `/img/...` to `/thumbs/...` and an `eleventy.after` hook builds
  540px thumbnails with sharp (outside `/img` so the dev server finds them).
- **Calendar + countdown**: `shows-ics.njk` paginates events into
  `/shows/<slug>.ics`; `components/calendar-buttons.njk` adds Google Calendar and .ics
  links on upcoming shows (`isUpcoming` filter). `js/countdown.js` runs on the home hero.
- **Other pages**: `/visit/` (`visit.json`), `/vendors/directory/`
  (`vendorDirectory.json`, `js/directory.js` search/filter; specialties reuse
  `booking.categories` for Spanish labels via `toMap`), `/sponsors/packages/`
  (`sponsors.packages`).
- **News**: `src/posts/*.md`, served at `/news/<file-slug>/`, shown as an
  Instagram-style grid.
- **Table picker**: `/vendors/#pick-a-table`. Floor geometry is in
  `src/_data/floorLayout.js` (traced from the October 2026 vendor map, 141 tables);
  which tables are taken lives in `booking.json` (CMS "Table Booking"), which lists only
  non-open tables. The form posts to `booking.formEndpoint`: FormSubmit's AJAX endpoint for
  tables@swccshows.com (forwarded by Cloudflare Email Routing to swccshow@gmail.com).
  A response counts as sent only when its JSON says `success: "true"`, since FormSubmit
  returns 200 before the inbox has activated the form. `_honey` is FormSubmit's honeypot
  and `_template=table` formats the email. With no endpoint it falls back to a
  copy-and-DM summary. Spots are confirmed by the organizer, never auto-reserved —
  there's no backend.
- **Spanish toggle**: same contract as julia-ketsaa-remax. `src/_includes/js/i18n.js`
  + `i18n-runtime.js` (passthrough-copied to `/js/`) swap `data-i18n` keys from
  `src/_data/i18n.json` (inlined as `#i18n-data`), plus `data-i18n-attr`,
  `data-i18n-placeholder`, `data-i18n-date` and `data-i18n-title-es`. CMS content uses
  optional `…Es` fields rendered with `macros/bilingual.njk` (`data-i18n-lang`). Any new
  visitor-facing string needs a key in `i18n.json` or an `Es` field. The choice is
  stored in localStorage; `base.njk` hides the page (`i18n-pending`) until Spanish is
  applied so there's no English flash. Client-side only, so no Spanish SEO.
- **Booking on/off**: `booking.open` (CMS "Taking Vendor Requests") decides whether
  `vendors.njk` includes the picker at all; when off it shows `closedMessage` instead.
- **SEO**: `base.njk` builds the title (`seoTitle` or `title` + " · SWCCS"; the home page
  uses `metadata.homeTitle`), description, canonical, Open Graph/Twitter tags and
  includes `components/structured-data.njk` (Organization on every page, WebSite on
  home, Event on show pages, BlogPosting on news). Event titles and descriptions come
  from `eleventyComputed` in `src/events/events.json`; event hours are parsed into ISO
  times in America/Denver by the `eventTimes` filter, so keep the CMS "Hours" field in
  the "10 AM – 5 PM" shape. `sitemap.xml.njk` is hand-rolled so URLs keep the path
  prefix; pages with `noindex: true` are left out. `optimize-media.mjs` only rewrites
  `src`/`href` to WebP, so og:image and JSON-LD keep the JPG for link previews.
  `robots.txt` and `llms.txt` only take effect at a domain root.
- **Security**:
  - CSP is a `<meta>` in `base.njk` (GitHub Pages can't send headers):
    `script-src 'self'`, so never add inline `<script>` code; put it in
    `src/_includes/js/`. JSON data blocks (`application/json`, `ld+json`) are fine and
    go through the `jsonld` filter, which escapes `<`.
  - The form endpoint's origin is added to `connect-src`/`form-action` automatically.
  - Every href that comes from the CMS goes through `safeUrl`, which allows only
    http(s), mailto, tel or a site path; the form endpoint must be https.
  - Rich-text CMS fields render as HTML: editors are repo collaborators, so they're
    trusted, and the CSP blocks any script that slips into that HTML.
  - Actions are pinned to commit SHAs and Dependabot updates them weekly.
  - Fonts are self-hosted in `src/_includes/fonts/` (Latin subset), so `font-src` is
    `'self'`. The only third parties in the CSP are Cloudflare Web Analytics and the
    form endpoint.
- **Analytics**: Cloudflare Web Analytics beacon in `base.njk`, token in
  `metadata.json` `analyticsToken` (public by design). The Cloudflare records are DNS
  only; if the proxy is ever turned on, set the Web Analytics site to manual setup so
  Cloudflare doesn't inject a second beacon.
- **Page copy**: `src/_data/{home,vendors,sponsors,about,business}.json`, all editable
  in the CMS.
- **Images**: flyers from Instagram live in `src/_includes/img/posts/`; sponsor logos go
  in `src/_includes/img/sponsors/`. The logo is `img/brand/logo.jpg` (only 150px — ask
  the client for a full-size file).

## Commands

- **Dev**: `npm start` (runs Sass + Eleventy with hot reload at http://localhost:8080/;
  writes generated pages to `dev/`, serves images/CSS/fonts straight from `src/`, and
  cleans `dev/` and `docs/` on startup and shutdown)
- **Build**: `npm run build` (cleans output, compiles Sass, builds the Eleventy site with
  original, unoptimized media into `docs/`)
- **CI build**: `npm run build:ci` (GitHub Actions only — runs `npm run build`, then
  optimizes referenced images with `scripts/optimize-media.mjs`)

## Architecture

- **SSG**: Eleventy (11ty) v3, static output, no server runtime
- **Input**: `src/` — Markdown and Nunjucks (`.njk`) templates
- **Dev output**: `dev/` (generated pages only; removed when `npm start` stops)
- **Production output**: `docs/` (generated, not committed; built in CI, deployed via
  GitHub Actions to GitHub Pages)
- **Templates**: Nunjucks for layouts and pages; Markdown for blog posts
- **Styling**: Sass, compiled from `src/_includes/css/index.scss` to a content-hashed,
  cache-busted `index.<hash>.css` (see `assetPaths` in `eleventy.config.cjs`)
- **Content editing**: Pages CMS (`.pages.yml`) — the client edits structured content
  (shows, news, sponsors, page copy) through a GitHub-authenticated web UI with no
  code exposure. See `CMS-GUIDE.md` for the client-facing walkthrough.
- **Data**: `src/_data/business.json` holds the client's name, tagline, contact info,
  and social links — pulled from the intake worksheet. Reference it in templates rather
  than hardcoding business details.
- **Deployment**: pushes to `main` build the site and deploy to GitHub Pages;
  pull requests run the build to catch errors but do not deploy.

## Code style

- 2-space indentation, LF line endings, trim trailing whitespace, UTF-8 (per `.editorconfig`)
- Template formats: `.md`, `.njk`, `.html`
- Dates: UTC, Luxon filters `readableDate` (display) / `htmlDateString` (machine-readable)
- Passthrough assets live under `src/_includes/{img,favicons}`; don't reference images
  from anywhere else or the build won't copy them
- Don't hardcode content that a non-technical client might want to change — put it in
  `src/_data/` or a Pages CMS collection instead

## Adding a new page

1. Create `src/<page-name>.njk` with front matter `layout: layouts/page.njk`
2. Add it to `src/_data/navigation.json` if it belongs in the nav
3. If the client should be able to edit its content, add a matching entry to `.pages.yml`

## Adding a new content type to the CMS

1. Add a `collection` block to `.pages.yml` (see the `posts` entry as a template)
2. Create the corresponding Nunjucks layout under `src/_includes/layouts/`
3. Add a listing/index template if the content type needs its own index page
4. Document the new field set in `CMS-GUIDE.md` in plain language for the client

## What NOT to do

- Don't commit `dev/` or `docs/` — both are build output
- Don't add a runtime backend/server — this is a static site by design
- Don't remove the `assetPaths` content-hashing — it's what makes the CDN cache safe
  to set far-future/immutable
