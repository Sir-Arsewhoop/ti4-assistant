# Twilight Imperium 4 — Turn Assistant (PWA)

Design spec — 2026-07-22

## Purpose

A personal Android web app to help a non-expert play Twilight Imperium 4 efficiently.
The game grows unwieldy as it progresses; the app tells the player their legal action
options each turn, tracks the player's own game state, and surfaces reminders — reducing
missed actions and constant rules lookups.

## Constraints & decisions (from brainstorming)

- **Rules-aware guide**, not just a tracker — it actively tells the player their legal options.
- Tracks the **player's own state only** ("your stuff"), never the whole table.
- Content: **Prophecy of Kings (PoK) confirmed; possibly Thunder's Edge; exact expansion set
  unknown** → all content is **data-driven** so expansions are added as data, not code.
- Platform: **PWA** (installable, offline), built with **Vite + Svelte**, deployed to
  **GitHub Pages**. No backend, no accounts.
- **Assistant, not referee**: guides but never enforces; all state is editable and every step
  is undoable, because tracking only "your stuff" means the app's view can diverge from the
  real board.

## Non-goals (out of scope)

- **Twilight's Fall** mode (Thunder's Edge) — effectively a separate game.
- Whole-table / opponent state tracking.
- **Combat dice roller** (v1; may be added later).
- Online multiplayer, sync, accounts, backend.
- Verbatim reproduction of copyrighted card text — the app authors concise **mechanical
  summaries** only.

## Architecture

Four units with clean separation. The engine and data layers have **no UI dependency**.

### 1. State store (single source of truth)

A Svelte store holding one game's state:

- **meta**: round number, current phase, active-player flag, turn-order position, speaker.
- **faction**: id + resolved abilities.
- **command tokens**: tactic / fleet / strategy pool counts.
- **strategy card(s)** held this round + `primaryUsed` flag.
- **planets**: list of `{ id, resources, influence, exhausted }`.
- **technologies** owned (ids).
- **trade goods**, **commodities**.
- **objectives**: scored public ids; secret objectives `{ id, scored }`.
- **victory points** (derived, with manual override).
- **leaders** (PoK): agent / commander / hero unlocked flags.
- **action-card hand**: count only (v1).
- **log**: ordered list of actions taken (drives undo + reminders).

All fields are user-editable. Undo pops the log and reverts the effect.

### 2. Rules engine (pure functions)

`getAvailableActions(state) -> Action[]` and `getReminders(state) -> Reminder[]`.

Availability predicates:

- **Strategic action**: a strategy card is held AND its primary is not yet used this round.
- **Tactical action**: tactic pool ≥ 1.
- **Component action**: a tracked tech / leader / relic exposes an "Action:" ability. (In v1
  the action-card hand is a count only, so action-card component actions arrive with card data
  in v2.)
- **Pass**: the strategic action has already been taken this round.

Reminders (examples): unresolved strategy-card secondaries, newly-qualified objectives,
fleet / tactic pool levels, exhausted planets that will ready in the Status phase, leader
unlock thresholds.

Pure, deterministic, fully unit-tested. No UI, no storage access.

### 3. Content data (JSON, schema-validated)

Separate data files, one concern each: **factions, technologies, strategy cards, objectives**
(public I / II + secret), **action cards, agendas**. Each entry carries an id, name, a concise
**mechanical summary**, and structured fields the engine reads (e.g. faction starting
tech/planets/tokens; tech prerequisites/color; strategy-card primary/secondary text).

- Seed from an open-source, permissively-licensed TI4 dataset, then **verify against the
  official Living Rules Reference (LRR)**.
- Expansions (PoK, Thunder's Edge) are additional data files gated by an "enabled content"
  setting chosen in setup.
- JSON Schema + validation tests keep every data file well-formed.

### 4. UI (Svelte components)

- **Setup wizard**: choose enabled content + player count + faction → auto-fill starting
  tech / planets / tokens from faction data; set speaker and turn order.
- **Dashboard**: round #, current phase, VP, a resource bar (tokens, trade goods), and a
  prominent "what can I do now" panel.
- **Turn panel** (action phase): large buttons for **legal actions only**; each expands to a
  plain-English "what this does / why you'd pick it"; tapping logs the action and updates
  state; **Pass appears only when eligible**.
- **Status checklist**: score objective, gain + redistribute command tokens, ready cards,
  draw action card, repair units.
- **Agenda helper**: appears once the Mecatol Rex custodians token is taken; a vote tracker.
- **Reference browser**: search factions / tech / strategy cards / objectives.
- **Reminder surface**: contextual badges / toasts fed by the engine.

## Data flow

Setup wizard seeds the state store from faction data. Each turn: UI reads `engine(state)` →
renders legal actions + reminders → user taps an action → a store reducer applies the effect
and appends to the log → the engine re-derives. Phase transitions advance the state machine
(Strategy → Action loop → Status → Agenda?). A persistence layer autosaves the store to
IndexedDB on every change.

## Persistence

- **IndexedDB**: multiple saved games; autosave on every state change (a game spans several
  sittings).
- **Export / import** a game as JSON (manual backup / moving between devices).
- No network dependency; a **service worker** precaches the app shell + data for full offline
  use at the table.

## Error handling & edge cases

- **Board divergence**: every value is editable; manual override is always available.
- **Undo**: log-based revert of the last action.
- **Corrupt / old save**: schema-validate on load; if invalid, offer a fresh game rather than
  crash.
- **Offline**: service worker precaches; the app is fully functional with no connection.

## Testing

- **Vitest** unit tests: engine predicates (each availability rule + edges), state reducers
  (spend token, exhaust planet, score objective, pass), reminder generation.
- **Data validation**: a JSON Schema test over every content file.
- **Light component tests** for the turn panel (legal-action rendering) and the setup wizard.

## v1 scope (first implementation plan)

- The four units above, wired end-to-end.
- Round state machine: Strategy, Action (full turn loop), Status; Agenda stubbed as a basic
  vote tracker.
- Generic (faction-agnostic) action guidance + resource tracking + objective scoring.
- Setup wizard.
- Reference browser over the seeded data.
- **Seed factions: Universities of Jol-Nar (priority), Federation of Sol, Sardakk N'orr** —
  three deliberately different factions to stress the engine (Jol-Nar: tech-heavy, `-1`
  combat, 4 starting techs, Technology-secondary special case; Sol: vanilla baseline;
  Sardakk N'orr: `+1` combat).
- Persistence (IndexedDB autosave + export/import), offline PWA, GitHub Pages deploy.

## Staged later (not v1)

- **v2**: all PoK factions, full tech tree, leaders / mechs / exploration component actions,
  action- and agenda-card references.
- **Later**: Thunder's Edge factions + galactic events.
- **Deferred / optional**: combat dice roller.

## Deployment

GitHub Pages (static, free HTTPS). The first phone load caches the app for offline use;
add-to-home-screen installs the PWA. Updates ship by pushing to the repo.
