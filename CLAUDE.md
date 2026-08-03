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
un-revealable), and the stage-grouped Objectives reference tab + **secret objectives**
(Objectives sub-cycle 2b, closing the objectives cycle): the full 40-card base+PoK secret
deck (26 status / 12 action / 2 agenda, each 1 VP) on its own standalone
`secretObjectiveSchema`, a `scoredSecretThisRound` window flag (set only in the status phase —
action and agenda windows are per-combat / per-timing-window and are described by reminders
instead of modelled), `drawSecretObjective` + `scoreSecretObjective` actions, the pure
`getHeldSecretObjectives` helper tagging each held secret `scorableNow`, secret reminders plus
a new agenda-phase reminder branch, and the presentational `SecretPanel` (whole hand with phase
tags, scorable highlighted, draw picker, per-row discard) mounted in all four post-setup
phases. The `secret-N` placeholder is gone. 175 tests, check 0/0, build OK.

Full history lives in `docs/superpowers/specs/` and `docs/superpowers/plans/` (esp. the
`2026-07-24-*` faction-breadth, planet-catalog, and tech-tree files, the
`2026-07-27-*` public-objectives pair, and the `2026-07-28-*` secret-objectives pair) and
git log.

## Next cycles (each: brainstorm → spec → plan → build)

1. Leaders / mechs / faction-tech (faction depth — the same wiki `{{Main Infobox 1}}`
   exposes all of it)
2. Trait-aware reminders (planets now carry traits)
3. Action + agenda card references

Deferred polish (non-blocking): consider a Zod `.refine()` enforcing the
`unit-upgrade ⟺ color:'none'` invariant; a copyright pass over the pre-existing
(non-tech-tree, non-objective) content summaries.

Retired by the 2b cycle: the duplicated `TECH_GROUPS` array now lives in `src/lib/techGroups.ts`
and is shared by `ResearchPicker.svelte` + `ReferenceBrowser.svelte`; the grouped-render block
is now the `GroupedEntries.svelte` component used by the objectives, tech, and secrets reference
tabs. The proposed `objectiveBase` split was dropped as unnecessary — secrets got their own
standalone schema rather than extending the public one.
