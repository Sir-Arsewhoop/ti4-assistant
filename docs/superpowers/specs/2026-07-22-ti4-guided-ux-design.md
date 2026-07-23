# TI4 Turn Assistant — Plan 2: Guided UX (design)

Design spec — 2026-07-22

## Purpose

Replace the unstyled vertical-slice `App.svelte` (Plan 1) with the real guided
user experience: a phase-driven mobile screen that walks a non-expert through a
Twilight Imperium 4 turn, teaches inline, tracks the player's own state, and
surfaces reminders. Builds on the Plan 1 core (domain, engine, reducers, store,
Zod content, IndexedDB persistence) with no changes to those layers' contracts.

## Decisions (from brainstorming)

- **Shell = phase-driven single adaptive screen** (option A). Not tabs, not a
  dashboard-of-drill-ins. The body swaps by `store.state.phase`.
- **Collapsible overview header** (option C's overview, adapted): VP, command
  tokens, trade goods, commodities, round, phase. Open/closed state **persists**.
- **Theme = follow the phone's system setting by default**, with a manual
  override toggle (light/dark).
- **Teaching = always-visible one-liner + tap to expand** for full detail.
- **Assistant, not referee** (carried from the project spec): every tracked
  value is manually editable; the engine guides, never forbids.

## Non-goals (this plan)

- Offline service worker + GitHub Pages deploy → **Plan 3**.
- Opponent / whole-table state, board map, dice roller → out of v1.
- Full faction/tech/card data, leaders/mechs/exploration actions → later content
  plans. Plan 2 uses the Plan 1 seed content as-is.

## Architecture

New UI lives under `src/lib/`; the Plan 1 core (`src/domain`, `src/engine`,
`src/state`, `src/content`, `src/persistence`) is consumed unchanged. `App.svelte`
becomes the shell + phase router + autosave wiring.

### Components (`src/lib/components/*.svelte`)

- **`OverviewHeader`** — the collapsible status header. Collapsed: a one-line
  strip (round · phase · VP). Expanded: VP, tactic/fleet/strategy tokens, trade
  goods, commodities. Reads `store.state`; open/closed comes from prefs (below).
- **`ExpandableItem`** — reusable teaching primitive: a always-visible title +
  one-line summary; tapping toggles a detail region. Props: `title`, `summary`,
  `detail`, optional lead action slot. Used by action cards, strategy cards,
  status steps.
- **`ActionPanel`** (action phase) — renders `getAvailableActions(state, {componentActionSources})`
  as `ExpandableItem`s; each item's primary control dispatches the matching
  `GameAction` (using `sourceId` for component actions). Pass appears only when
  the engine offers it.
- **`StrategyPhase`** (strategy phase) — lists the 8 strategy cards from content;
  the player taps the card(s) they took; explanations via `ExpandableItem`;
  writes `strategyCardIds` via `editState`.
- **`StatusChecklist`** (status phase) — ordered guided steps (score a public
  objective, gain + redistribute command tokens, ready planets, draw action
  card), each an `ExpandableItem` with a control. Scoring dispatches
  `scorePublicObjective`; token/planet-ready adjustments dispatch `editState`
  (arbitrary patch — assistant-not-referee, no new reducers needed); steps that
  are purely physical table actions (draw action card) are acknowledge-only
  checkboxes. If a dedicated reducer proves cleaner during implementation, the
  plan may add one, but `editState` is the baseline.
- **`AgendaHelper`** (agenda phase, stub) — a simple for/against/abstain vote
  tally with a running count. Reachable only after the custodians flag is set.
- **`ReminderList`** — renders `getReminders(state)`; info vs warn styling.
- **`ReferenceBrowser`** — searchable list over content (factions, technologies,
  strategy cards, objectives); read-only; opened from the menu.
- **`BoardEditor`** — manual override screen (assistant-not-referee): toggle
  planet exhaust/ready, adjust tokens/trade goods/VP, add/remove tech; all via
  `editState`. Opened from the menu.
- **`GamesSheet`** — new game, save, load, export/import JSON; opened from the menu.
- **`MenuSheet`** — the ☰ slide-in that hosts Reference, Your board, Games, and
  the theme toggle.

### Shell wiring (`App.svelte`)

- Holds the single `createGameStore` instance (created empty → the setup wizard
  seeds it, or a saved game is loaded).
- Phase router: `{#if phase === 'setup'}SetupWizard{:else if 'strategy'}…` etc.
- Bottom bar: Undo (`store.undo`, disabled when `!canUndo()`), Advance phase
  (`advancePhase`), ☰ (opens `MenuSheet`).
- **Autosave**: a Svelte `$effect` watching `store.state` writes the current game
  to IndexedDB (`saveGame(currentGameId, state)`), debounced to the microtask/tick.

### `SetupWizard`

Collects, in order: enabled content (base only / base + PoK — a toggle that
filters the faction list), player count (3–8), the player's faction (from the
enabled content), and speaker + turn-order seat. On finish, calls
`createInitialState(faction, { turnOrder, speaker })`, `store.load(...)`, assigns
a new game id, and advances to the strategy phase.

### Preferences (`src/lib/prefs.ts`)

A tiny module over `localStorage`, separate from game saves:

- `theme`: `'system' | 'light' | 'dark'` (default `'system'`).
- `overviewOpen`: boolean (default `true`).
- `currentGameId`: string | null (which saved game is live, for autosave/resume).

Exposes `loadPrefs()`, `savePrefs(patch)`. The theme value drives a
`data-theme` attribute (or `prefers-color-scheme` when `'system'`).

## Data flow

Setup wizard → `createInitialState` → `store.load` → autosave writes to IndexedDB.
Each turn: the active phase component reads `store.state`, renders engine output
(actions/reminders) or content, and dispatches `GameAction`s through the store;
the `$effect` autosaves. `OverviewHeader`/`MenuSheet` read prefs; the theme
toggle writes prefs and updates `data-theme`. Advancing phases swaps the body.

## Error handling & edge cases

- **No current game**: app opens on the setup wizard (or a "resume / new" choice
  if a saved game exists for `currentGameId`).
- **Divergence from the real board**: `BoardEditor` can edit any value; Undo
  reverts the last dispatch.
- **Agenda before custodians**: agenda phase body shows a note + the custodians
  flag toggle rather than the vote UI until the flag is set.
- **Corrupt/absent save**: `loadGame` returning `undefined`/invalid → fall back to
  the setup wizard rather than crashing.
- Theme: `'system'` honors `prefers-color-scheme`; override wins when set.

## Testing

Component tests with `@testing-library/svelte` (jsdom, already configured):

- `ActionPanel`: renders exactly the engine's available actions; expanding shows
  detail; tapping an action dispatches the right `GameAction` (e.g. tactical
  decrements tactic pool through the store).
- `OverviewHeader`: collapse/expand toggles the detail region and persists via
  prefs.
- `SetupWizard`: completing it seeds a game whose state matches the chosen
  faction (planets/tech/tokens) and moves to the strategy phase.
- `StatusChecklist`: scoring an objective dispatches `scorePublicObjective` and
  the header VP updates.
- `prefs.ts`: round-trips theme/overviewOpen/currentGameId through localStorage.

Engine, reducers, store, content, and persistence remain covered by Plan 1 tests.

## Deployment

Runs via `npm run dev` on a phone over LAN during development. Installable-PWA +
offline + GitHub Pages is **Plan 3**; nothing in this plan depends on it.
