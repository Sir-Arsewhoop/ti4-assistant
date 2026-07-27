# TI4 Turn Assistant — project guide

Rules-aware turn assistant for Twilight Imperium 4 (base + Prophecy of Kings). Offline
PWA (Vite + Svelte 5), deployed to GitHub Pages. Helps a non-expert play: tracks **only
the player's own state** and tells them their legal options + reminders each phase.
**Assistant, not referee** — every value is user-editable and undoable; nothing is enforced.

## Commands

- `npm run dev` — dev server
- `npm test` — Vitest suite
- `npm run check` — svelte-check (must be 0 errors / 0 warnings)
- `npm run build` — production build
- Deploy: push to `main` → `.github/workflows/deploy.yml` builds to GitHub Pages
  (`base: '/ti4-assistant/'`).

## Architecture (keep these boundaries)

- `src/domain/` — pure types + `createInitialState`. No Svelte, no content imports.
- `src/engine/` — pure `getAvailableActions` / `getReminders`. No UI, no storage.
- `src/state/` — `reducers.ts` (pure `applyAction`: clamps, idempotent, appends a log
  entry) + `store.svelte.ts` (Svelte store: state / dispatch / undo / load).
- `src/content/` — Zod-validated data (`factions`, `technologies`, `strategyCards`,
  `publicObjectives`, `planets`) surfaced via `index.ts` as `content`. **All game data lives
  here as data files — never hardcode game data in components.**
- `src/lib/components/` — presentational only (props + callbacks). Store / engine /
  persistence wiring lives ONLY in `App.svelte`.
- `src/persistence/` — IndexedDB autosave + JSON export/import.

## Conventions

- Svelte 5 runes. **Gotcha:** a prop literally named `state` collides with the `$state`
  rune — alias it (`let { state: gameState } = $props()`), as in MenuSheet/BoardEditor.
- Every new content file gets a Zod schema + a validation test.
- **Ability / effect summaries are authored in our own words — never verbatim card text**
  (copyright). Engine reads structured fields; prose is ours.

## Content sourcing (accuracy matters)

- **Primary: the TI4 fandom wiki** via MediaWiki API
  (`https://twilight-imperium.fandom.com/api.php?action=parse&prop=wikitext&format=json&redirects=1`).
- **AsyncTI4** repo (`github.com/AsyncTI4/TI4_map_generator_bot`,
  `src/main/resources/planets/*.json`) is authoritative for planet/tile data
  (resources/influence/`planetType`/`techSpecialties`/legendary). Home planets are
  `planetType: FACTION` (no cultural/industrial/hazardous trait).
- The M3dnar community JSON dataset has **verified value errors** — do NOT trust it for
  numbers; cross-check against the two sources above.

## State (as of 2026-07-27)

Done + merged to `main`: v1 (setup → strategy → action → status → agenda round loop,
offline PWA, GitHub Pages deploy) + all **24 factions** (base + PoK) + a **63-planet
catalog** (gain/remove planets in the board editor, Planets reference tab) + the **full
generic tech tree** (33 base+PoK techs with `type`/`expansion`; pure `getResearchableTechs`;
`researchTechnology` action + `ResearchPicker`; Technology-card / researchable-count
reminders; grouped tech reference) + **public objectives** (Objectives sub-cycle 2a): the
full 40-card base+PoK public objective deck (20 Stage I + 20 Stage II) with `stage`/
`expansion` on the schema, reveal tracking (`revealedPublicObjectiveIds`) and a per-round
scoring window flag (`scoredPublicThisRound`), a `withStateDefaults` legacy-save migration,
the pure `getScorablePublicObjectives` helper, status-phase reminders, the StatusChecklist
reveal picker + revealed-only stage-grouped scoring (each revealed objective is individually
un-revealable), and the stage-grouped Objectives reference tab. 143 tests, check 0/0,
build OK.

Full history lives in `docs/superpowers/specs/` and `docs/superpowers/plans/` (esp. the
`2026-07-24-*` faction-breadth, planet-catalog, and tech-tree files) and git log.

## Next cycles (each: brainstorm → spec → plan → build)

1. Secret objectives (Objectives sub-cycle 2b — public half shipped this cycle; this is the
   full secret deck: draw-and-hold, phase-tagged secret scoring, secret reminders, and
   retiring the `secret-N` placeholder in StatusChecklist)
2. Leaders / mechs / faction-tech (faction depth — the same wiki `{{Main Infobox 1}}`
   exposes all of it)
3. Trait-aware reminders (planets now carry traits)
4. Action + agenda card references

Deferred polish (from tech-tree final review, non-blocking): extract the duplicated
`TECH_GROUPS` array shared by `ResearchPicker.svelte` + `ReferenceBrowser.svelte` into one
module; consider a Zod `.refine()` enforcing the `unit-upgrade ⟺ color:'none'` invariant;
a copyright pass over the pre-existing (non-tech-tree) content summaries; extract a shared
`GroupedEntries` presentational component (the objective and tech grouped-render blocks in
`ReferenceBrowser.svelte` are now structurally identical, and `TECH_GROUPS` is still
duplicated with `ResearchPicker.svelte`); split `objectiveSchema` into a plain
`objectiveBase` object plus the refined export, because `.refine()` makes it a `ZodEffects`
that 2b's secret schema cannot `.extend()`.
