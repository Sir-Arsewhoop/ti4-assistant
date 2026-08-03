# TI4 secret objectives — design

Date: 2026-07-28
Cycle: Objectives, sub-cycle **2b of 2** (secret objectives). Sub-cycle 2a shipped the public
deck and is specified in `2026-07-27-ti4-public-objectives-design.md`.

## Goal

Replace the placeholder that fabricates `secret-N` ids with the complete base + Prophecy of
Kings secret deck, track the secrets the player holds, and let them score one in the phase
where its window actually falls. This closes the objectives cycle: both decks real, both
scoring paths modelled.

Scope tier **B**, matching 2a: catalog + scoring awareness. No auto-qualification.

## What exists today

`SecretObjective = { id: string; scored: boolean }` and `GameState.secretObjectives` are
already in place, and the shape already supports draw-and-hold (held = `scored: false`).
The gap is everything else: `StatusChecklist.svelte`'s `scoreSecret()` invents an id
(`secret-${n}`), always marks it `scored: true`, adds 1 VP through `editState`, and lives only
in the status phase — so the 14 secrets whose windows fall in the action or agenda phase have
no route at all. Its own UI text admits the content isn't loaded.

## Confirmed decisions

- **One shared `SecretPanel`**, mounted in every post-setup phase, rather than three bespoke
  per-phase blocks. Secrets score in three different phases; one component keeps the behavior
  and tests in a single place.
- **The whole hand stays visible**, with the secrets scorable in the current phase highlighted
  and the rest greyed but still clickable. The hand is at most three cards, so nothing is
  crowded, and a hard phase filter would show an empty panel in the agenda phase while the
  player holds three status-phase secrets, with no hint why.
- **The panel mounts in strategy, action, status, and agenda** — everywhere after setup. TI4
  deals a secret during setup and no secret scores in the strategy phase, so a panel present
  only in scoring phases would have nowhere to record the opening hand.
- **Status window flagged, action and agenda described.** A `scoredSecretThisRound` boolean
  mirrors 2a's `scoredPublicThisRound` and is correct for the status phase (one public plus one
  secret). The action phase allows one objective per combat and the agenda phase one per timing
  window — neither is per-round, so no flag is claimed there; a reminder states the rule
  instead. The app models what it can honestly and describes the rest.
- **Assistant, not referee.** The three-secret hand limit, the scoring windows, and phase
  eligibility are all reminders. Greyed entries stay clickable; every value stays editable and
  undoable.

## Non-goals

- Auto-detecting whether the player qualifies for a secret.
- Modelling per-combat or per-agenda timing windows as state (needs combat tracking the app has
  no concept of).
- Tracking other players' secrets.
- Enforcing the three-card hand limit or any scoring window.

## 1. Data model

Add a standalone `secretObjectiveSchema` to `src/content/schema.ts`:

- `id`, `name`, `summary` — strings.
- `points: z.literal(1)` — every secret is worth exactly 1 victory point.
- `phase: z.enum(['status', 'action', 'agenda'])` — the window in which it can be scored.
- `expansion: z.enum(['base', 'pok'])`.

No `stage` field: staging is a public-deck concept.

**This retires a deferred-polish item.** `CLAUDE.md` carries a note to split `objectiveSchema`
into a plain `objectiveBase` plus the refined export, on the grounds that 2b's secrets could not
`.extend()` a `ZodEffects`. A standalone secret schema removes that need entirely, and is
clearer than contorting two decks into one shared base to save six field declarations. Drop the
note rather than acting on it.

## 2. Content

New `src/content/secretObjectives.ts` with all 40 secrets — 20 base, 20 PoK — distributed by
window:

| Phase  | base | PoK | Total |
|--------|------|-----|-------|
| status | 15   | 11  | 26    |
| action | 5    | 7   | 12    |
| agenda | 0    | 2   | 2     |

Every secret is 1 victory point.

**Sourcing.** From AsyncTI4 `data/secret_objectives/secret_objectives.json`, filtered to
`source` of `base` or `pok` (the file carries 109 further homebrew entries under other sources,
which are excluded). Per `CLAUDE.md`, values are sourced, not recalled.

**Copyright.** Requirement summaries are authored in our own words; the source JSON's `text`
field is reference material and must not be copied through. Two prior cycles' reviews caught
summaries drifting to near-verbatim card wording, so this gets explicit attention in both
implementation and review: distinct sentence structure and word choice, same mechanical
meaning.

## 3. State

`SecretObjective` and `GameState.secretObjectives` are unchanged — the existing
`{ id, scored }` shape already expresses both a held secret and a scored one.

Add `scoredSecretThisRound: boolean` to `GameState`, seeded `false` by `createInitialState`, and
add the matching line to `withStateDefaults` in `src/persistence/storage.ts` so saves written
before this cycle keep loading.

## 4. Reducer

- `{ type: 'drawSecretObjective'; objectiveId: string; name: string }` — appends
  `{ id, scored: false }`, idempotent by id, logs `Drew <name>`. The `name` rides in the action
  so the reducer logs readably without importing content, matching the established
  `gainPlanet` / `researchTechnology` / `revealPublicObjective` pattern.
- `{ type: 'scoreSecretObjective'; objectiveId: string; name: string }` — flips that entry to
  `scored: true`, adds 1 victory point, logs `Scored <name> (+1 VP)`, and is idempotent (an
  already-scored secret returns the same state reference, so no double VP). An id the player
  does not hold is also a no-op returning the same reference: scoring a secret you never drew is
  meaningless, and silently inserting it would let a stray dispatch mint victory points. It sets
  `scoredSecretThisRound` **only when `state.phase === 'status'`**; the flag has no meaning in
  the action or agenda phase, where windows are per-combat and per-agenda.
- `advancePhase` resets `scoredSecretThisRound` to `false` on round rollover, in the same branch
  that already resets `scoredPublicThisRound`.
- Discarding a mis-drawn secret goes through the existing generic `editState` action, mirroring
  the un-reveal control 2a's final review required. It ships with the feature rather than
  waiting to be demanded.

## 5. Engine

New pure helper in `src/engine/objectives.ts` (beside `getScorablePublicObjectives`):

```
getHeldSecretObjectives(state, secrets) -> { objective: SecretObjectiveContent; scorableNow: boolean }[]
```

It returns the held-but-unscored secrets, each tagged `scorableNow` — true when the secret's
`phase` equals the state's current phase. The phase-eligibility rule lives in the engine, not in
the component. Content arrives as a parameter, so the engine still imports no content.

`getReminders` currently serves the action and status phases and returns `[]` for the agenda
phase. It gains an agenda branch, and these secret reminders:

- how many held secrets are scorable in the current phase (status, action, and agenda),
- in the status phase, whether this round's secret window is already used,
- a hand-full note once three unscored secrets are held,
- in the action phase, that the window is one objective per combat; in the agenda phase, one per
  timing window,
- an Imperial-card note when the player holds strategy card 8, since its primary and secondary
  both draw a secret — mirroring 2a's Technology-card note for card 7.

## 6. UI

New presentational `src/lib/components/SecretPanel.svelte`:

- The held hand, each entry showing its phase tag, with `scorableNow` entries highlighted and
  the others greyed but still clickable.
- A settled list of scored secrets.
- A draw picker, searchable across all 40, excluding secrets already held or scored.
- A per-row discard control for a mis-drawn secret.

`App.svelte` mounts `SecretPanel` alongside the existing phase component in each of the four
post-setup branches. It receives its data as props directly, so nothing needs threading through
`StatusChecklist` or `AgendaHelper`.

`StatusChecklist.svelte` loses `scoreSecret()` and the placeholder button and text.

## 7. Reference

A sixth **Secrets** tab in `ReferenceBrowser.svelte`, grouped by scoring phase.

This is the third grouped tab, which makes the shared-rendering extraction worth doing now
rather than adding a third copy: **extract a `GroupedEntries` presentational component** taking
`groups: { key, label, entries }[]`, and use it for the objectives, tech, and secrets tabs.
Move the duplicated `TECH_GROUPS` array into one module shared with `ResearchPicker.svelte`.
Both are deferred-polish items in `CLAUDE.md`; 2a's final review specifically flagged that a
third grouped tab is the point to stop the duplication.

## 8. Testing

- **Schema** — `secretObjectiveSchema` parses a valid secret; rejects `points` other than 1.
- **Content** — 40 entries; 20 base + 20 PoK; 26 status / 12 action / 2 agenda; every entry
  1 point; unique ids; ids disjoint from the public catalog's.
- **Migration** — a legacy-shaped save missing `scoredSecretThisRound` loads with `false`
  through both `loadGame` and `importGame`.
- **Reducer** — draw appends once and logs; score flips to scored, adds exactly 1 VP, and is
  idempotent; the window flag sets in the status phase and does not in the action phase; round
  rollover clears it.
- **Engine** — `getHeldSecretObjectives` excludes scored secrets and tags `scorableNow`
  correctly per phase; the new agenda reminders fire; existing action and status reminders are
  unchanged.
- **UI** — `SecretPanel` lists the hand with phase tags, highlights scorable entries, keeps
  non-scorable entries clickable, draws through the picker, and discards a row; the
  `StatusChecklist` placeholder is gone.
- **Refactor safety** — `GroupedEntries` renders for the objectives, tech, and secrets tabs, and
  the pre-existing tab tests still pass unchanged.

## Boundaries preserved

`domain/` stays pure types. `engine/` stays pure with content injected as parameters.
`reducers.ts` stays a pure logging reducer. Content lives only in `src/content/`. Store, engine,
and persistence wiring stays only in `App.svelte`. Components stay presentational.
