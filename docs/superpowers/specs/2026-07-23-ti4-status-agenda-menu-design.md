# TI4 Turn Assistant — Plan 2b: Status / Agenda + Menu (design)

Design spec — 2026-07-23

## Purpose

Complete the guided UX begun in Plan 2a by building the deferred pieces: an
interactive Status-phase checklist, an Agenda-phase stub, and the ☰ menu
(reference browser, manual board editor, and game management). After this plan
the app covers every phase of a round and exposes the manual-override and
reference tools the "assistant, not referee" model needs.

## Decisions (from brainstorming)

- **Status phase = guided and state-updating** (not reminder-only): steps that
  touch the player's own state dispatch changes; physical steps are
  tick-to-acknowledge.
- **Save management = one active game + export/import** (no multi-game list).
- **Secret objectives = a generic "+1 VP" toggle** until real secret-objective
  content exists (none is seeded yet).
- Carries all Plan 2a/project constraints: Svelte 5 runes, TS strict, theme-aware,
  presentational components with wiring in `App.svelte`, teaching via
  `ExpandableItem`.

## Non-goals (this plan)

- PWA offline service worker + GitHub Pages deploy → **Plan 3**.
- Full faction/tech/objective content, real secret objectives, leaders/mechs/
  exploration → later content plans.
- Multi-game named saves, opponent tracking, board map, dice roller → out.

## Core change (the one place this plan touches the Plan 1 core)

Agenda is currently unreachable: `advancePhase` routes `status → strategy` and
nothing enters `agenda`. Fix, with tests:

- Add `custodiansTaken: boolean` to `GameState` (default `false` in
  `createInitialState`).
- In `applyAction`'s `advancePhase`: compute the next phase so that from
  `status`, next is `agenda` when `custodiansTaken` else `strategy`; `agenda`
  goes to `strategy`. Move the round increment and the
  `strategyPrimaryUsed`/`passed` reset to fire when **entering `strategy`**
  (i.e. `next === 'strategy'`), so the round advances correctly whether the
  round ends after `status` (pre-custodians) or after `agenda` (post-custodians).
- `custodiansTaken` is set through the existing `editState` action (no new
  action type). Existing reducer tests are updated for the new routing; new
  tests cover: status→agenda when custodians taken, status→strategy otherwise,
  agenda→strategy with round bump + reset.

Everything else consumes the core unchanged.

## Architecture

New components under `src/lib/components/`; `App.svelte` gains menu state and the
status/agenda routes. Components stay presentational (props + callbacks); all
store/engine/persistence wiring lives in `App.svelte`.

### `StatusChecklist.svelte` (status phase)

Props: `{ state: GameState; objectives: Objective[]; onAction: (a: GameAction) => void }`.
Ordered steps, each an `ExpandableItem` with teaching text and a control:

- **Score public objective**: a picker listing `objectives` not already in
  `state.scoredPublicObjectiveIds`; selecting one dispatches
  `{ type: 'scorePublicObjective', objectiveId, points }`. Scored ones render as done.
- **Score a secret**: a button dispatching `editState` that appends a generic
  entry to `secretObjectives` and adds 1 VP (mirrors the reducer's VP handling).
- **Gain + redistribute tokens**: +/- steppers per pool dispatching `editState`
  with the new `command` object; a hint notes "gain 2 this phase".
- **Ready planets**: "Ready all" dispatches `editState` setting every planet
  `exhausted: false`.
- **Acknowledge-only** steps (draw action card, repair units, return strategy
  card): local checkboxes, no dispatch.
- A **"custodians token taken"** control (dispatches `editState { custodiansTaken: true }`)
  appears here so the player can unlock the agenda phase when it first happens.

### `AgendaHelper.svelte` (agenda phase, stub)

Props: `{ state: GameState; onAction: (a: GameAction) => void }`.
If `!state.custodiansTaken`, shows a note plus the custodians toggle. Otherwise a
vote scratchpad: for / against / abstain counters with a running total, kept in
component-local `$state` (ephemeral — voting is not part of persisted "your
stuff"). Teaching text explains the agenda flow at a high level.

### `MenuSheet.svelte` (☰ slide-in)

Props: `{ open: boolean; onClose: () => void }` plus slotted sections (or child
components passed in). A normal-flow overlay (no `position: fixed`) with a
backdrop and a close control. A simple section switcher (buttons select
Reference / Your board / Games; the theme toggle is always visible) shows one
section at a time. Opened from the App bottom bar's ☰ button.

### `ReferenceBrowser.svelte`

Props: `{ content: { factions, technologies, strategyCards, objectives } }`.
A text search box + a type filter (faction / tech / strategy card / objective);
matching entries render as read-only `ExpandableItem`s (name + summary + detail).
Pure over the content registry.

### `BoardEditor.svelte`

Props: `{ state: GameState; technologies: Technology[]; onAction: (a: GameAction) => void }`.
Manual override of the player's own state (assistant, not referee): +/- steppers
for VP, trade goods, commodities, and the three command pools; a per-planet
exhaust/ready toggle; add/remove technology from the `technologies` list. Every
edit dispatches `editState` with the changed slice.

### `GamesSheet.svelte`

Props: `{ onNewGame: () => void; onExport: () => void; onImport: (file: File) => void }`.
"New game" (with a confirm step) calls `onNewGame`; Export calls `onExport`;
Import takes a file and calls `onImport`. The actual persistence/store work lives
in `App.svelte`'s handlers.

### `App.svelte` (additions)

- Menu open state (`$state`); ☰ opens `MenuSheet`; theme toggle moves into the menu.
- Routes: `status → StatusChecklist`, `agenda → AgendaHelper` (replacing the Plan
  2a placeholder body).
- Menu handlers: `onNewGame` clears `currentGameId` in prefs and sets the store
  null (returns to `SetupWizard`); `onExport` builds a JSON blob from
  `exportGame(store.state)` and triggers a download; `onImport` reads the file,
  `importGame`s it, `store.load`s the result, and assigns a fresh game id.
- `BoardEditor`/`StatusChecklist`/`AgendaHelper` `onAction` maps to `store.dispatch`.

## Data flow

Status/agenda phases render their components from `store.state`; their controls
dispatch `GameAction`s (mostly `editState`, plus `scorePublicObjective`) through
the store; autosave (Plan 2a) persists. The menu reads `content` (reference) and
`store.state` (board editor) and dispatches edits; game handlers call the
persistence layer and swap the store. Setting `custodiansTaken` (via a status/
agenda control) changes how `advancePhase` routes on the next advance.

## Error handling & edge cases

- **Import of a malformed/foreign file**: `importGame` throws on bad JSON; the
  handler catches it and surfaces a brief inline error instead of crashing.
  (Structural validation of an otherwise-valid JSON remains a later hardening —
  noted, out of scope here.)
- **New game confirm**: destructive relative to the current autosaved game, so it
  requires an explicit confirm tap before clearing.
- **Agenda before custodians**: `AgendaHelper` shows the note + toggle rather
  than the vote UI; and because the router only reaches `agenda` when
  `custodiansTaken`, this is mostly a guard for manual edits.
- **Board editor**: values clamp at 0 where negatives are meaningless (pools,
  goods, commodities); VP may be set freely.

## Testing

Component tests (`@testing-library/svelte`, jsdom):
- `StatusChecklist`: scoring a public objective dispatches `scorePublicObjective`;
  "Ready all" dispatches an `editState` clearing exhaustion; custodians toggle
  dispatches `editState { custodiansTaken: true }`.
- `AgendaHelper`: shows the toggle when custodians not taken; the vote counters
  increment and total correctly when taken.
- `BoardEditor`: a stepper and a planet toggle each dispatch the right `editState`.
- `GamesSheet`: New/Export/Import invoke their callbacks (Import passes the file).
- `ReferenceBrowser`: a search term filters the rendered entries.
- `MenuSheet`: renders when open, calls `onClose`.
Reducer tests (core change): `advancePhase` routing across status/agenda/strategy
with the corrected round-increment timing.

## Deployment

Still `npm run dev` for local/LAN play. Installable-PWA + offline + GitHub Pages
is Plan 3.
