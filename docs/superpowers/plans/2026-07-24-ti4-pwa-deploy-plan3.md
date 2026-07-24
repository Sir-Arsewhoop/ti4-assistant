# TI4 Turn Assistant — Plan 3: PWA + Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the app an installable, offline-capable PWA (full manifest, an SVG icon, Workbox precache + navigate fallback) and add a GitHub Pages deploy workflow, so it installs to a phone home screen and runs offline.

**Architecture:** `vite-plugin-pwa` (already a dependency, already emitting `sw.js`) is configured fully; the manifest is extracted to an importable module so its fields are unit-testable. The app is 100% client-side, so Workbox precache = full offline. Deployment is a GitHub Actions workflow; the actual repo-create/push/Pages-enable stays with the user.

**Tech Stack:** Vite 5, `vite-plugin-pwa` (Workbox), Svelte 5, TypeScript 5, Vitest 2, GitHub Actions.

## Global Constraints

- The app is 100% client-side; `base` is `/ti4-assistant/` in `vite.config.ts` — do not hardcode that base into manifest `start_url`/`scope` (use relative `.`).
- TypeScript `strict: true`; `import type` for type-only imports; `npm run check` stays 0 errors / 0 warnings.
- No new runtime app code beyond config; no backend.
- The tool does NOT create a GitHub account/repo, add a remote to the user's account, push to the user's GitHub, or enable Pages — those are the user's steps (Task 2 README documents them). Local git (commit) is fine.
- Tests colocated; `npm test` runs `vitest run`. The existing 83-test suite stays green.

---

## File Structure

```
src/pwa/manifest.ts            # the manifest object (Task 1)
src/pwa/manifest.test.ts       # asserts required install fields (Task 1)
public/icon.svg                # authored SVG app icon (Task 1)
vite.config.ts                 # MODIFY: import manifest, includeAssets, workbox fallback (Task 1)
.github/workflows/deploy.yml   # GitHub Pages Actions workflow (Task 2)
README.md                      # deploy + usage instructions (Task 2)
```

---

### Task 1: PWA manifest module, icon, and offline config

**Files:**
- Create: `src/pwa/manifest.ts`, `src/pwa/manifest.test.ts`, `public/icon.svg`
- Modify: `vite.config.ts`

**Interfaces:**
- Consumes: `ManifestOptions` type from `vite-plugin-pwa`.
- Produces: `export const manifest` (the PWA manifest object), consumed by `vite.config.ts`.

- [ ] **Step 1: Write the failing test**

```ts
// src/pwa/manifest.test.ts
import { describe, it, expect } from 'vitest'
import { manifest } from './manifest'

describe('pwa manifest', () => {
  it('has the fields a browser needs to offer install', () => {
    expect(manifest.name).toBe('TI4 Turn Assistant')
    expect(manifest.short_name).toBe('TI4')
    expect(manifest.display).toBe('standalone')
    expect(manifest.theme_color).toBeTruthy()
    expect(manifest.background_color).toBeTruthy()
    expect(manifest.icons?.length ?? 0).toBeGreaterThan(0)
    expect(manifest.icons?.[0]?.src).toBe('icon.svg')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pwa/manifest.test.ts`
Expected: FAIL — cannot find module `./manifest`.

- [ ] **Step 3: Write `src/pwa/manifest.ts`**

```ts
import type { ManifestOptions } from 'vite-plugin-pwa'

export const manifest: Partial<ManifestOptions> = {
  name: 'TI4 Turn Assistant',
  short_name: 'TI4',
  description: 'A guided turn assistant for Twilight Imperium 4 — tracks your state and tells you your options each phase.',
  display: 'standalone',
  orientation: 'portrait',
  theme_color: '#14161a',
  background_color: '#14161a',
  start_url: '.',
  scope: '.',
  icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
}
```

- [ ] **Step 4: Write `public/icon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="TI4">
  <rect width="512" height="512" rx="96" fill="#14161a"/>
  <polygon points="256,92 388,174 388,338 256,420 124,338 124,174" fill="none" stroke="#6aa6e6" stroke-width="22"/>
  <circle cx="256" cy="256" r="52" fill="#6aa6e6"/>
  <g fill="#e8e8e6">
    <circle cx="178" cy="150" r="8"/>
    <circle cx="358" cy="206" r="6"/>
    <circle cx="332" cy="360" r="7"/>
    <circle cx="182" cy="332" r="6"/>
  </g>
</svg>
```

- [ ] **Step 5: Modify `vite.config.ts`**

Add the manifest import at the top with the other imports:

```ts
import { manifest } from './src/pwa/manifest'
```

Replace the existing `VitePWA({ ... })` call with:

```ts
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest,
      workbox: { navigateFallback: 'index.html' },
    }),
```

(Leave the rest of the config — `base`, `svelte()`, `svelteTesting()`, the `test` block — unchanged.)

- [ ] **Step 6: Run the manifest test**

Run: `npx vitest run src/pwa/manifest.test.ts`
Expected: PASS (1 test).

- [ ] **Step 7: Build and verify PWA output**

Run: `npm run build`
Expected: build succeeds; output includes `dist/manifest.webmanifest`, `dist/sw.js`, and `dist/icon.svg`; NO "missing theme_color" warning (it was present before this task).

Run: `npm run check`
Expected: 0 errors, 0 warnings.

Run: `npm test`
Expected: full suite green (84 tests: prior 83 + the manifest test).

- [ ] **Step 8: Commit**

```bash
git add src/pwa vite.config.ts public/icon.svg
git commit -m "feat: full PWA manifest, SVG icon, and offline navigate fallback"
```

---

### Task 2: GitHub Pages deploy workflow + README

**Files:**
- Create: `.github/workflows/deploy.yml`, `README.md`

**Interfaces:**
- Consumes: the `npm run build` output (`dist/`).
- Produces: a workflow that publishes `dist/` to GitHub Pages on push to `main`.

- [ ] **Step 1: Write `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Write `README.md`**

```markdown
# TI4 Turn Assistant

A guided, offline-capable turn assistant for Twilight Imperium 4 (4th edition,
Prophecy of Kings-ready). It tracks your own game state and walks you through each
phase — telling you your legal options and reminders — so the game stays
manageable as it grows. Built as an installable PWA (Svelte + Vite).

## Develop

```bash
npm install
npm run dev      # local dev server
npm test         # unit suite (Vitest)
npm run check    # svelte-check (types)
npm run build    # production build to dist/
```

## Deploy to GitHub Pages (one-time setup)

The app is preconfigured for GitHub Pages (`base: '/ti4-assistant/'`) with a
deploy workflow at `.github/workflows/deploy.yml`. To publish it under your own
GitHub account:

1. Create a new GitHub repository named `ti4-assistant` (empty — no README).
2. Add it as a remote and push:
   ```bash
   git remote add origin https://github.com/<your-username>/ti4-assistant.git
   git push -u origin main
   ```
3. In the repo on GitHub: **Settings → Pages → Build and deployment → Source → "GitHub Actions"**.
4. The workflow runs on every push to `main`. When it finishes, the app is live at
   `https://<your-username>.github.io/ti4-assistant/`.

## Install on a phone

Open the deployed URL in Chrome on Android, then **⋮ → Add to Home screen**.
After the first load it works fully offline.
```

- [ ] **Step 3: Sanity-check the workflow file and build**

Run: `npm run build`
Expected: still succeeds (the deploy job runs exactly this build).

Confirm by reading `.github/workflows/deploy.yml` that: it triggers on push to `main`, has `pages: write` + `id-token: write` permissions, uploads `dist`, and uses the `deploy-pages` action. (The workflow can only truly run once the repo is on GitHub — it is not executable locally; verification here is structural + the build step it invokes passing locally.)

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml README.md
git commit -m "ci: GitHub Pages deploy workflow + README"
```

---

## User publish steps (NOT performed by the tool)

After both tasks land on `main`, the user (not the tool) publishes:

1. Create the GitHub repo `ti4-assistant`.
2. `git remote add origin https://github.com/<user>/ti4-assistant.git`
3. `git push -u origin main`
4. Settings → Pages → Source → "GitHub Actions".

The tool may run these one step at a time ONLY with explicit per-step user
authorization and an already-authenticated `gh`/git — publishing is user-driven.

---

## Self-review (completed by author)

- **Spec coverage:** manifest (extracted, testable) ✓ (T1); SVG icon ✓ (T1);
  Workbox precache + `navigateFallback` + `autoUpdate` registration ✓ (T1, via the
  already-present plugin); deploy workflow ✓ (T2); README one-time steps ✓ (T2);
  auth/publish boundary respected ✓ (T2 + the publish-steps section). Deferred by
  design: PNG icon set / iOS polish; update toast.
- **Placeholder scan:** none — every step has concrete file contents or exact
  commands with expected output. The `<your-username>` tokens in the README are
  intentional user-substituted placeholders in shipped docs, not plan gaps.
- **Consistency:** `manifest` export name + `icon.svg` path are identical across
  `manifest.ts`, the test, `public/icon.svg`, and `includeAssets`. `base` is left
  untouched; `start_url`/`scope` stay relative per the constraint.

---

## Roadmap (after Plan 3 — v1 complete)

- **Content plans:** all PoK factions, full tech tree, real public + secret
  objectives, leaders/mechs/exploration component actions.
- **Deferred Minors** (from `.superpowers/sdd/progress.md`): collision-free game
  ids (Games menu), live OS theme tracking, MenuSheet on-device positioning,
  import-error placement, PNG icon set + iOS `apple-touch-icon`.
```