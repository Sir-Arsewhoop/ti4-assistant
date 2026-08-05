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
- **AsyncTI4 has two known traps for card text, both caught in the 3a cycle** — the wiki wins:
  it ships some **Codex Ω revisions under `source: base`** (Yin Spinner and Magmus Reactor both
  bit us; filtering on the Ω name or a codex source does *not* catch these), and its faction
  `startingTech` can be incomplete (Nekro's omits both Valefar Assimilators). Check any card with
  an Ω printing against the wiki before cataloguing it — 3b's leaders have Ω versions too.

## State (as of 2026-08-05)

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
phases. The `secret-N` placeholder is gone. + **faction technologies** (faction depth
sub-cycle 3a): 48 faction techs (exactly 2 per faction × 24; Keleres excluded as a Codex
faction) folded into the same `technologies.ts` via optional `factionId` + `replaces`, taking
the catalog to 81. `getResearchableTechs` now filters by ownership and drops generic unit
upgrades a faction sheet supersedes; `App.svelte` feeds `ResearchPicker` that filtered candidate
set (the board editor and reference still see all 81). `TECH_GROUPS` gained a Faction group; the
reference tech tab splits faction techs by owning faction so an opponent's tech is findable.
The `unit-upgrade ⟺ color:'none'` invariant is now one-way — Nekro's Valefar Assimilators are
colourless *ability* cards. 191 tests, check 0/0, build OK.

Full history lives in `docs/superpowers/specs/` and `docs/superpowers/plans/` (esp. the
`2026-07-24-*` faction-breadth, planet-catalog, and tech-tree files, the
`2026-07-27-*` public-objectives pair, the `2026-07-28-*` secret-objectives pair, and the
`2026-08-04`/`2026-08-05` faction-technologies pair) and git log.

## Next cycles (each: brainstorm → spec → plan → build)

Faction depth is split into three sub-cycles (~161 content entries and three distinct state
models — too big for one spec, same reasoning as the objectives 2a/2b split). Counts sourced
from AsyncTI4:

3a (faction technologies) is **done** — see State above.

1. **3b — Leaders** (83: 28 agents, 26 commanders, 29 heroes, each with an unlock condition).
   The biggest of the three: replaces the unused 3-boolean `LeaderState` stub with real
   per-leader unlock / exhaust / purge state, adds a LeaderPanel and unlock reminders.
2. **3c — Mechs** (26 faction mechs with stats + deploy abilities). Mostly reference-shaped,
   since the app tracks no unit counts; faction flagships (27) fold in cheaply if wanted —
   two objectives already reference them.
3. Trait-aware reminders (planets now carry traits)
4. Action + agenda card references
5. UI redesign

Deferred polish (non-blocking): a copyright pass over the pre-existing (non-tech-tree,
non-objective) content summaries — fold in the closest 3a calls while there
(`non-euclidean-shielding`, `supercharge`, `voidwatch`). Verify the two Valefar Assimilator
summaries against the wiki: they also have Ω printings and ours were not checked. **The board
editor's technology list is now 81 flat, ungrouped, unlabelled buttons** with no search and no
faction attribution (`BoardEditor.svelte`) — it must stay unfiltered (Nekro legitimately gains
rivals' techs, and it is the escape hatch that makes research filtering safe), so group it with
`TECH_GROUPS` or add the query input the planet section already has; natural fit for the UI
redesign. Per-faction reference groups are not prereq-sorted the way generic groups are.

Retired by the 3a cycle: the proposed Zod `.refine()` for `unit-upgrade ⟺ color:'none'` — Nekro's
colourless ability cards prove the strict form wrong, and the content test now asserts the
one-way direction instead.

Retired by the 2b cycle: the duplicated `TECH_GROUPS` array now lives in `src/lib/techGroups.ts`
and is shared by `ResearchPicker.svelte` + `ReferenceBrowser.svelte`; the grouped-render block
is now the `GroupedEntries.svelte` component used by the objectives, tech, and secrets reference
tabs. The proposed `objectiveBase` split was dropped as unnecessary — secrets got their own
standalone schema rather than extending the public one.
