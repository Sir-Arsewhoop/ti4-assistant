# TI4 public objectives — design

Date: 2026-07-27
Cycle: Objectives, sub-cycle **2a of 2** (public objectives). Sub-cycle 2b covers the secret
deck and is specified separately.

## Goal

Replace the three-entry public-objective stub with the complete base + Prophecy of Kings
public deck (Stage I and Stage II), track which objectives the table has revealed, and make
the assistant scoring-aware: it tells the player what they can score now, whether they have
already used this round's scoring window, and how close they are to 10 victory points.

Scope tier **B**: catalog + scoring awareness. No auto-qualification (that was tier C, and it
is explicitly out of scope).

## Why this is split from secrets

The full objectives cycle covers two decks, two catalogs, new state, a persistence migration,
and scoring UI across three phases — roughly twice the size of the tech-tree cycle. It is
split so each half ships working software and gets a reviewable plan:

- **2a (this spec)** — public deck, reveal tracking, public scoring, status-phase reminders.
  Also broadens `getReminders` beyond the action phase, which 2b reuses.
- **2b (later)** — secret deck, draw-and-hold, phase-tagged secret scoring, secret reminders;
  retires the placeholder that currently fabricates `secret-N` ids.

## Confirmed decisions

- **Tier B.** Catalog + scoring awareness (windows, per-round limit, VP progress). No
  auto-qualification hints.
- **Reveal tracking.** A new `revealedPublicObjectiveIds` array records which public
  objectives the table has revealed. This is a deliberate, minimal exception to the project's
  "track only the player's own state" rule: scoring is the player's own action, and without
  knowing which of the 40 objectives are actually live, the scoring guidance and reminders
  cannot say anything useful. It is one id array, user-editable and undoable like everything
  else.
- **Per-round window flag.** A `scoredPublicThisRound` boolean, set when scoring and reset on
  round rollover, following the existing `strategyPrimaryUsed` precedent. It lets reminders
  say "you have already scored a public this status phase" instead of restating the rule.
- **Assistant, not referee.** Nothing is enforced. Scored-out or unrevealed options may be
  greyed, but remain selectable, and every value stays editable and undoable.

## Non-goals

- Secret objectives (sub-cycle 2b).
- Auto-detecting whether the player qualifies for an objective.
- Tracking other players' scored objectives or their victory points.
- Enforcing the once-per-window scoring limit or the 10-point game end.

## 1. Data model

Extend `objectiveSchema` in `src/content/schema.ts`:

- Add `stage: z.enum(['I', 'II'])`.
- Add `expansion: z.enum(['base', 'pok'])`.
- Keep `points` (1 or 2) and `phase`. All 40 public objectives are scored in the status
  phase — verified across the whole sourced set — so `phase` is `'status'` throughout for
  publics. The field stays because 2b's secrets vary by phase.
- Add a Zod `.refine()` binding stage to points: `stage 'I' ⟺ points 1`, `stage 'II' ⟺
  points 2`. A malformed future entry then fails validation rather than silently landing in
  the wrong group in the UI.

**Rename.** `src/content/objectives.ts` → `src/content/publicObjectives.ts`, and the registry
key `content.objectives` → `content.publicObjectives`. When 2b adds secrets with their own
file and schema, neither file needs a `kind` discriminator. This touches the prop chain in
`App.svelte`, `MenuSheet.svelte`, `ReferenceBrowser.svelte`, and `StatusChecklist.svelte`.

## 2. Content

`src/content/publicObjectives.ts` holds all 40 public objectives:

| Stage | Points | base | PoK | Total |
|-------|--------|------|-----|-------|
| I     | 1      | 10   | 10  | 20    |
| II    | 2      | 10   | 10  | 20    |

**Sourcing.** Taken from AsyncTI4 `data/public_objectives/public_objectives.json`, filtered to
`source` of `base` or `pok` (the file also carries 40 homebrew entries under `other`, which are
excluded). Per `CLAUDE.md`, values are sourced, not recalled.

**Copyright.** Requirement summaries are authored in our own words. The source JSON's `text`
field is reference material and must not be copied through. The tech-tree cycle's review
caught several summaries that had drifted to near-verbatim card wording, so this gets explicit
attention during implementation and review: distinct sentence structure and word choice, same
mechanical meaning.

The three existing stub entries (`diversify-research`, `develop-weaponry`,
`lead-from-front`) correspond to real objectives and are absorbed into the full catalog.

## 3. State

Add to `GameState`:

- `revealedPublicObjectiveIds: string[]` — objectives the table has revealed.
- `scoredPublicThisRound: boolean` — whether this round's public scoring window is used.

`scoredPublicObjectiveIds` and `victoryPoints` are unchanged. `createInitialState` seeds the
new fields to `[]` and `false`.

## 4. Persistence migration

`loadGame` currently returns the stored object as-is and `importGame` validates only
`phase`, `command`, and `planets`. A save written before this cycle therefore has `undefined`
where the two new fields belong, and any `.includes()` on the missing array throws at render
time.

Add `withStateDefaults(raw)` in `src/persistence/`, applied by **both** `loadGame` and
`importGame`, filling any missing field with its initial value. One function, one place,
covered by a test that loads a legacy-shaped save.

## 5. Reducer

- New action `{ type: 'revealPublicObjective'; objectiveId: string; name: string }` — appends
  to `revealedPublicObjectiveIds`, idempotent by id, logs `Revealed <name>`. The `name` rides
  in the action so the reducer logs readably without importing content, matching the
  established `gainPlanet` / `researchTechnology` pattern.
- `scorePublicObjective` additionally sets `scoredPublicThisRound = true`.
- `advancePhase` resets `scoredPublicThisRound` to `false` on round rollover, in the same
  branch that already resets `strategyPrimaryUsed`.

## 6. Engine

`getReminders` currently early-returns outside the action phase. It broadens to serve the
**status** phase as well, keeping its existing action-phase reminders unchanged. This
groundwork is what 2b extends for action- and agenda-phase secret windows.

A pure helper returns the scorable set — revealed minus already-scored — taking the objectives
array as a parameter, exactly as `getResearchableTechs` takes technologies. `getReminders`
itself keeps its established shape: `App.svelte` computes the scorable set and passes a
**precomputed count** through the existing optional options argument (alongside
`researchableCount`), so the engine still imports no content. The options argument stays
optional and backward-compatible.

Status-phase reminders:

- how many revealed public objectives remain unscored,
- whether this round's public scoring window has already been used,
- victory-point progress toward 10,
- a note once any Stage II objective is scorable (they are worth 2 points).

## 7. UI

- **`StatusChecklist.svelte`** — the scoring list is built from *revealed* objectives only,
  grouped Stage I / Stage II with points shown, and already-scored entries greyed but still
  clickable. It also gains a reveal picker (searchable over all 40), because the status phase
  is exactly when a public objective is revealed. `BoardEditor` is intentionally left alone —
  one home for this control, not two.
- **`ReferenceBrowser.svelte`** — the Objectives tab groups by Stage I / Stage II with
  expansion tags, mirroring the grouped tech tab shipped last cycle.
- No new header UI. Victory-point progress is surfaced as a reminder.

## 8. Testing

- **Schema** — `stage`/`expansion` parse; the stage↔points refine rejects a mismatched entry.
- **Content** — 40 entries, 20 per stage, 10 base + 10 PoK per stage, unique ids, every entry
  `phase: 'status'`.
- **Migration** — a legacy-shaped save (missing both new fields) loads with correct defaults
  through `loadGame` and `importGame`.
- **Reducer** — reveal appends/is idempotent/logs; scoring sets the round flag; round rollover
  clears it.
- **Engine** — the scorable helper subtracts scored from revealed; status-phase reminders fire
  under the right conditions and the action-phase reminders still behave as before.
- **UI** — StatusChecklist lists revealed objectives only and reveals through the picker;
  ReferenceBrowser renders stage groups.

## Boundaries preserved

`domain/` stays pure types. `engine/` stays pure with content injected as data. `reducers.ts`
stays a pure logging reducer. Content lives only in `src/content/`. Store, engine, and
persistence wiring stays only in `App.svelte`. Components stay presentational.
