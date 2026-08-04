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

## Install on a phone

Open the deployed URL in Chrome on Android, then **⋮ → Add to Home screen**.
After the first load it works fully offline.
