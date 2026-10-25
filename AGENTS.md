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
- **Hosting**: GitHub Pages project URL, so `pathPrefix` in `eleventy.config.cjs` is
  `/southwest-card-collectible-show/`. Every internal link and image goes through the
  `| url` filter. When a custom domain is added, set `pathPrefix` to `/`, add `CNAME`
  (and its passthrough copy), and update `metadata.json` `url` and the sitemap hostname.
- **Events**: `src/events/*.md` (CMS "Shows & Trade Days"). The `upcoming` / `past`
  filters split them by build date; the soonest upcoming event is featured in the home
  hero. Each event gets a page at `/shows/<file-slug>/`.
- **News**: `src/posts/*.md`, served at `/news/<file-slug>/`, shown as an
  Instagram-style grid.
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
