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
