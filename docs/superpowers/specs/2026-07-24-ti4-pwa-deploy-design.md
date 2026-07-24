# TI4 Turn Assistant — Plan 3: PWA + Deploy (design)

Design spec — 2026-07-24

## Purpose

Turn the working app into an installable, offline-capable PWA and publish it to
GitHub Pages, so it can be added to a phone's home screen and used at the table
with no network. This is the last v1 milestone; after it the app is a real
install-once, works-offline tool.

## Decisions (from brainstorming)

- **Host on GitHub Pages.** The tool configures everything; the user does the
  one-time GitHub repo create + push + Pages enablement (account/auth is the
  user's — the tool never creates accounts or pushes to the user's GitHub).
- **Icon = an authored `public/icon.svg`** referenced directly in the manifest
  (Chrome/Android install accepts SVG icons), so no PNG raster tooling is needed.
- **Silent auto-update** (`registerType: 'autoUpdate'`), no version-prompt UI.
- Carries the project's constraints: the app is 100% client-side, `base` is
  `/ti4-assistant/`, TS strict, `npm run check` 0/0.

## Non-goals

- A generated PNG icon set and iOS `apple-touch-icon` polish (SVG covers the
  Android target; add later if iOS matters).
- A custom "new version available / offline ready" toast (auto-update is silent).
- Any server/runtime backend (there is none — pure static precache).
- Full content / gameplay changes (that's later content plans, not this one).

## Architecture

`vite-plugin-pwa` (already a dependency, already emitting `sw.js` via Workbox) is
configured fully. No app runtime code changes beyond confirming service-worker
registration. Deployment is a GitHub Actions workflow. The pieces:

### 1. Manifest (`src/pwa/manifest.ts`, imported by `vite.config.ts`)

The manifest object is defined in a small importable module `src/pwa/manifest.ts`
and passed into `VitePWA({ manifest })` in `vite.config.ts`. Extracting it makes
the fields unit-testable without running a build.

- `name: 'TI4 Turn Assistant'`, `short_name: 'TI4'`, a `description`.
- `display: 'standalone'`, `orientation: 'portrait'`.
- `theme_color` and `background_color` set to the app's dark palette values
  (this also clears the build's current "missing theme_color" warning).
- `start_url: '.'` and `scope: '.'` (relative, so they resolve under the
  `/ti4-assistant/` base without hardcoding it).
- `icons`: the SVG (see below), declared with `sizes: 'any'`,
  `type: 'image/svg+xml'`, `purpose: 'any maskable'`.

### 2. Icon (`public/icon.svg`)

A small, self-contained SVG emblem (dark space field + a simple central hex/star
motif) authored by hand. Lives in `public/` so Vite copies it to the build root;
referenced by the manifest. No external assets, no rasterization step.

### 3. Offline / service worker (`vite-plugin-pwa` Workbox options)

- Keep `registerType: 'autoUpdate'`; confirm the plugin auto-injects registration
  (default `injectRegister: 'auto'`) so `sw.js` registers without manual code —
  verify in the built output / browser.
- Add `workbox.navigateFallback: 'index.html'` so an offline navigation/refresh
  serves the SPA shell (respecting the base path).
- Precache covers the built JS/CSS/HTML + the SVG icon (Workbox default glob plus
  the icon). Because the app makes no network calls, precache = full offline.
- `includeAssets` for the icon so it's precached.

### 4. Deploy (`.github/workflows/deploy.yml`)

A GitHub Actions workflow: on push to `main`, checkout → setup Node 20 →
`npm ci` → `npm run build` → `actions/upload-pages-artifact` (path `dist`) →
`actions/deploy-pages`, with the `pages: write` / `id-token: write` permissions
and a `github-pages` environment. Standard Vite-on-Pages recipe.

### 5. README deploy section

Exact one-time user steps: create the GitHub repo, `git remote add origin …`,
`git push -u origin main`, then Settings → Pages → Source = "GitHub Actions".
Notes the resulting URL `https://<user>.github.io/ti4-assistant/`.

## The auth / publish boundary

The tool writes all files (manifest config, icon, workflow, README) and can run
local git (branch, commit). It does **not**: create a GitHub account or repo on
the user's behalf without explicit per-step authorization, add a remote pointing
at the user's account, push to the user's GitHub, or enable Pages. Those are the
user's actions; the tool supplies exact commands. If the user explicitly asks and
`gh` is already authenticated, the tool may run `gh repo create` / push one step
at a time with confirmation — publishing is a per-action, user-authorized step.

## Data flow

Build produces `dist/` (app + `sw.js` + `manifest.webmanifest` + icon). First
load registers the service worker, which precaches everything; subsequent loads
(including offline) are served from the cache. On a new deploy, `autoUpdate`
fetches the new precache in the background and swaps it in on the next load. The
GitHub Actions workflow rebuilds and republishes `dist/` on each push to `main`.

## Error handling & edge cases

- **Base path**: `start_url`/`scope` are relative (`.`) and `navigateFallback`
  resolves under `base`, so the app works served from `/ti4-assistant/` without
  hardcoded absolute paths.
- **SW update**: `autoUpdate` avoids a stuck old version; no user action needed.
- **First load requires network** (to install the SW/precache); documented. After
  that, offline works.
- **Icon compatibility**: SVG manifest icons install on Chrome/Android (the
  target); other platforms may show a default icon until a PNG set is added.

## Testing

- **Build**: `npm run build` succeeds and emits `sw.js` + `manifest.webmanifest`;
  no manifest warnings.
- **Manifest assertion**: a unit test imports the manifest object from
  `src/pwa/manifest.ts` and asserts the required fields (`name`, `short_name`,
  `theme_color`, `display`, at least one `icons` entry). No build needed — it
  runs in the normal `npm test` suite.
- **Offline (manual browser check)**: build → `npm run preview` → load in the
  browser pane → confirm the service worker registers → go offline → reload →
  the app still loads and runs a turn. Service-worker behavior is inherently
  integration-level, so this is a documented manual check, not a unit test.
- `npm run check` stays 0/0; the existing 83-test unit suite stays green.

## Deployment

GitHub Pages via the Actions workflow. The user performs the one-time repo
setup + Pages enablement (see the README section); thereafter every push to
`main` redeploys. The installable, offline PWA is reachable at
`https://<user>.github.io/ti4-assistant/`.
