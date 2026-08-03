# Secret Objectives (2b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the complete 40-card base + PoK secret objective deck with draw-and-hold tracking and phase-correct scoring, retiring the `secret-N` placeholder and closing the objectives cycle.

**Architecture:** A standalone `secretObjectiveSchema` and a new `secretObjectives.ts` catalog carry the deck. One new state flag (`scoredSecretThisRound`) joins the existing `secretObjectives: { id, scored }[]`, defaulted for legacy saves. Two reducer cases (draw, score) plus a rollover reset; a pure `getHeldSecretObjectives` tags each held secret with whether its window is open in the current phase; `getReminders` grows an agenda branch. One presentational `SecretPanel` is mounted by `App.svelte` in all four post-setup phases. Finally, a `GroupedEntries` component and a shared `TECH_GROUPS` module retire two deferred-polish items before a third grouped reference tab would triple the duplication.

**Tech Stack:** Vite + Svelte 5 (runes), TypeScript, Zod, Vitest, @testing-library/svelte, idb (IndexedDB).

## Global Constraints

- `npm run check` must report **0 errors / 0 warnings** (svelte-check); `npm test` green; `npm run build` OK — run all three before the final commit of any task touching `.svelte`.
- Svelte 5 runes. A prop literally named `state` collides with the `$state` rune — alias it: `let { state: gameState } = $props()`.
- All game data lives in `src/content/` as data files. Never hardcode game data in components.
- Secret requirement summaries are authored in **our own words — never verbatim card text** (copyright). The summaries in Task 1 are already paraphrased; transcribe them exactly and do not "restore" them toward official wording.
- `src/engine/` stays pure: no Svelte, no runtime content imports. Type-only imports are allowed; content arrays are passed in as parameters.
- Store / engine / persistence wiring lives **only** in `App.svelte`. Components are presentational (props + callbacks).
- `state/reducers.ts` stays a pure reducer: clamp, idempotent, append one log entry via the existing `log(state, summary)` helper. A no-op returns the *same state reference*.
- Every content file has a Zod schema + a validation test.
- "Assistant, not referee": nothing is enforced. Greyed options stay clickable; every value stays editable and undoable.

## Verified source data (AsyncTI4 `data/secret_objectives/secret_objectives.json`, `source` ∈ {base, pok})

40 official secrets, **every one worth exactly 1 victory point**, distributed by scoring window:

| Phase  | base | PoK | Total |
|--------|------|-----|-------|
| status | 15   | 11  | 26    |
| action | 5    | 7   | 12    |
| agenda | 0    | 2   | 2     |

The file's other 109 entries are homebrew (other sources) and are excluded.

---

## Task 1: Secret schema + 40-card catalog

**Files:**
- Modify: `src/content/schema.ts` (add `secretObjectiveSchema`)
- Create: `src/content/secretObjectives.ts`
- Modify: `src/content/index.ts` (register + re-export the type)
- Test: `src/content/content.test.ts`

**Interfaces:**
- Produces: `SecretObjective = { id: string; name: string; points: 1; phase: 'status' | 'action' | 'agenda'; expansion: 'base' | 'pok'; summary: string }`, exported as a type from `src/content/schema.ts` and re-exported from `src/content/index.ts`; registry key `content.secretObjectives`.

**Naming note:** the domain layer already has a *different* `SecretObjective` type (`{ id, scored }` in `src/domain/types.ts`) representing a held card in game state. That one is unchanged. This new content type shares the name across a different module; import sites disambiguate by path, exactly as `Objective` (content) and `Planet` (both) already do.

- [ ] **Step 1: Write the failing tests**

Add this import at the top of `src/content/content.test.ts`, below the existing `import { objectiveSchema } from './schema'` line:

```ts
import { secretObjectiveSchema } from './schema'
```

Then append inside `describe('content registry', ...)`:

```ts
it('exposes the full 40-card secret objective deck (20 base + 20 PoK)', () => {
  expect(content.secretObjectives).toHaveLength(40)
  expect(content.secretObjectives.filter((o) => o.expansion === 'base')).toHaveLength(20)
  expect(content.secretObjectives.filter((o) => o.expansion === 'pok')).toHaveLength(20)
})

it('splits secrets across scoring windows 26 status / 12 action / 2 agenda', () => {
  expect(content.secretObjectives.filter((o) => o.phase === 'status')).toHaveLength(26)
  expect(content.secretObjectives.filter((o) => o.phase === 'action')).toHaveLength(12)
  expect(content.secretObjectives.filter((o) => o.phase === 'agenda')).toHaveLength(2)
})

it('makes every secret worth exactly 1 victory point', () => {
  for (const o of content.secretObjectives) expect(o.points).toBe(1)
})

it('has unique secret ids, disjoint from the public catalog', () => {
  const ids = content.secretObjectives.map((o) => o.id)
  expect(new Set(ids).size).toBe(ids.length)
  const publicIds = new Set(content.publicObjectives.map((o) => o.id))
  for (const id of ids) expect(publicIds.has(id)).toBe(false)
})

it('rejects a secret worth more than 1 point', () => {
  const bad = { id: 'x', name: 'X', points: 2, phase: 'status', expansion: 'base', summary: 'y' }
  expect(secretObjectiveSchema.safeParse(bad).success).toBe(false)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- content.test`
Expected: FAIL — `content.secretObjectives` is undefined and `secretObjectiveSchema` is not exported.

- [ ] **Step 3: Add the secret schema**

In `src/content/schema.ts`, add this immediately after the existing `objectiveSchema` block and its `export type Objective` line:

```ts
export const secretObjectiveSchema = z.object({
  id: z.string(),
  name: z.string(),
  points: z.literal(1),
  phase: z.enum(['status', 'action', 'agenda']),
  expansion: z.enum(['base', 'pok']),
  summary: z.string(),
})
export type SecretObjective = z.infer<typeof secretObjectiveSchema>
```

- [ ] **Step 4: Create the catalog**

Create `src/content/secretObjectives.ts`:

```ts
import type { SecretObjective } from './schema'

export const secretObjectives: SecretObjective[] = [
  // ── Status window · base (15) ──
  { id: 'adapt-new-strategies', name: 'Adapt New Strategies', points: 1, phase: 'status', expansion: 'base', summary: 'Hold 2 of your faction\'s own techs (Valefar Assimilator copies do not count).' },
  { id: 'become-the-gatekeeper', name: 'Become the Gatekeeper', points: 1, phase: 'status', expansion: 'base', summary: 'Keep ships at both an alpha and a beta wormhole system.' },
  { id: 'control-the-region', name: 'Control the Region', points: 1, phase: 'status', expansion: 'base', summary: 'Have ships spread across 6 systems.' },
  { id: 'cut-supply-lines', name: 'Cut Supply Lines', points: 1, phase: 'status', expansion: 'base', summary: 'Park a ship in a system holding a rival\'s space dock.' },
  { id: 'establish-a-perimeter', name: 'Establish a Perimeter', points: 1, phase: 'status', expansion: 'base', summary: 'Field 4 PDS on the board.' },
  { id: 'forge-an-alliance', name: 'Forge an Alliance', points: 1, phase: 'status', expansion: 'base', summary: 'Hold 4 cultural planets.' },
  { id: 'form-a-spy-network', name: 'Form a Spy Network', points: 1, phase: 'status', expansion: 'base', summary: 'Throw away 5 action cards.' },
  { id: 'fuel-the-war-machine', name: 'Fuel the War Machine', points: 1, phase: 'status', expansion: 'base', summary: 'Field 3 space docks on the board.' },
  { id: 'gather-a-mighty-fleet', name: 'Gather a Mighty Fleet', points: 1, phase: 'status', expansion: 'base', summary: 'Field 5 dreadnoughts on the board.' },
  { id: 'learn-the-secrets-of-the-cosmos', name: 'Learn the Secrets of the Cosmos', points: 1, phase: 'status', expansion: 'base', summary: 'Keep ships in 3 systems that each sit next to an anomaly.' },
  { id: 'master-the-laws-of-physics', name: 'Master the Laws of Physics', points: 1, phase: 'status', expansion: 'base', summary: 'Hold 4 techs sharing one color.' },
  { id: 'mine-rare-metals', name: 'Mine Rare Metals', points: 1, phase: 'status', expansion: 'base', summary: 'Hold 4 hazardous planets.' },
  { id: 'monopolize-production', name: 'Monopolize Production', points: 1, phase: 'status', expansion: 'base', summary: 'Hold 4 industrial planets.' },
  { id: 'occupy-the-seat-of-the-empire', name: 'Occupy the Seat of the Empire', points: 1, phase: 'status', expansion: 'base', summary: 'Hold Mecatol Rex with 3 or more of your ships in its system.' },
  { id: 'threaten-enemies', name: 'Threaten Enemies', points: 1, phase: 'status', expansion: 'base', summary: 'Park a ship next door to a rival\'s home system.' },

  // ── Status window · PoK (11) ──
  { id: 'defy-space-and-time', name: 'Defy Space and Time', points: 1, phase: 'status', expansion: 'pok', summary: 'Station units in the wormhole nexus.' },
  { id: 'destroy-heretical-works', name: 'Destroy Heretical Works', points: 1, phase: 'status', expansion: 'pok', summary: 'Purge any 2 of your relic fragments.' },
  { id: 'establish-hegemony', name: 'Establish Hegemony', points: 1, phase: 'status', expansion: 'pok', summary: 'Hold planets totalling 12 or more influence.' },
  { id: 'foster-cohesion', name: 'Foster Cohesion', points: 1, phase: 'status', expansion: 'pok', summary: 'Share a border with every other player.' },
  { id: 'hoard-raw-materials', name: 'Hoard Raw Materials', points: 1, phase: 'status', expansion: 'pok', summary: 'Hold planets totalling 12 or more resources.' },
  { id: 'mechanize-the-military', name: 'Mechanize the Military', points: 1, phase: 'status', expansion: 'pok', summary: 'Post a mech on each of 4 different planets.' },
  { id: 'occupy-the-fringe', name: 'Occupy the Fringe', points: 1, phase: 'status', expansion: 'pok', summary: 'Amass 9 or more ground forces on a planet with no space dock of yours.' },
  { id: 'produce-en-masse', name: 'Produce en Masse', points: 1, phase: 'status', expansion: 'pok', summary: 'Concentrate 8 or more total Production in one system.' },
  { id: 'seize-an-icon', name: 'Seize an Icon', points: 1, phase: 'status', expansion: 'pok', summary: 'Hold a legendary planet.' },
  { id: 'stake-your-claim', name: 'Stake Your Claim', points: 1, phase: 'status', expansion: 'pok', summary: 'Hold a planet that shares its system with a rival\'s.' },
  { id: 'strengthen-bonds', name: 'Strengthen Bonds', points: 1, phase: 'status', expansion: 'pok', summary: 'Keep a rival\'s promissory note in your play area.' },

  // ── Action window · base (5) ──
  { id: 'destroy-their-greatest-ship', name: 'Destroy Their Greatest Ship', points: 1, phase: 'action', expansion: 'base', summary: 'Kill a rival\'s flagship or war sun.' },
  { id: 'make-an-example-of-their-world', name: 'Make an Example of Their World', points: 1, phase: 'action', expansion: 'base', summary: 'Wipe out a planet\'s last defenders during bombardment.' },
  { id: 'spark-a-rebellion', name: 'Spark a Rebellion', points: 1, phase: 'action', expansion: 'base', summary: 'Beat the victory-point leader in combat.' },
  { id: 'turn-their-fleets-to-dust', name: 'Turn Their Fleets to Dust', points: 1, phase: 'action', expansion: 'base', summary: 'Finish off a rival\'s last non-fighter ship with space cannon fire.' },
  { id: 'unveil-flagship', name: 'Unveil Flagship', points: 1, phase: 'action', expansion: 'base', summary: 'Win a space battle alongside your flagship — and it must survive.' },

  // ── Action window · PoK (7) ──
  { id: 'become-a-martyr', name: 'Become a Martyr', points: 1, phase: 'action', expansion: 'pok', summary: 'Lose a home-system planet.' },
  { id: 'betray-a-friend', name: 'Betray a Friend', points: 1, phase: 'action', expansion: 'pok', summary: 'Beat someone whose promissory note you were holding when the turn began.' },
  { id: 'brave-the-void', name: 'Brave the Void', points: 1, phase: 'action', expansion: 'pok', summary: 'Win a fight inside an anomaly.' },
  { id: 'darken-the-skies', name: 'Darken the Skies', points: 1, phase: 'action', expansion: 'pok', summary: 'Win a fight in a rival\'s home system.' },
  { id: 'demonstrate-your-power', name: 'Demonstrate Your Power', points: 1, phase: 'action', expansion: 'pok', summary: 'End a space battle still holding 3 or more non-fighter ships there.' },
  { id: 'fight-with-precision', name: 'Fight with Precision', points: 1, phase: 'action', expansion: 'pok', summary: 'Clear out a rival\'s last fighters with anti-fighter barrage.' },
  { id: 'prove-endurance', name: 'Prove Endurance', points: 1, phase: 'action', expansion: 'pok', summary: 'Outlast the table — pass last this round.' },

  // ── Agenda window · PoK (2) ──
  { id: 'dictate-policy', name: 'Dictate Policy', points: 1, phase: 'agenda', expansion: 'pok', summary: 'Have 3 or more laws standing in play.' },
  { id: 'drive-the-debate', name: 'Drive the Debate', points: 1, phase: 'agenda', expansion: 'pok', summary: 'Get elected by an agenda, or have one of your planets chosen.' },
]
```

- [ ] **Step 5: Register in the content index**

In `src/content/index.ts`:

Change the schema import line to add `secretObjectiveSchema`:

```ts
import { factionSchema, objectiveSchema, secretObjectiveSchema, strategyCardSchema, technologySchema, planetCatalogSchema, type Faction } from './schema'
```

Add the data import below the existing `import { publicObjectives } from './publicObjectives'` line:

```ts
import { secretObjectives } from './secretObjectives'
```

Add the registry entry immediately after the `publicObjectives:` line:

```ts
  secretObjectives: z.array(secretObjectiveSchema).parse(secretObjectives),
```

And add `SecretObjective` to the type re-export line so it reads:

```ts
export type { Faction, Technology, StrategyCard, Objective, SecretObjective, PlanetCatalogEntry } from './schema'
```

- [ ] **Step 6: Run tests + check, verify green**

Run: `npm test -- content.test` → Expected: PASS
Run: `npm test` → Expected: all pass
Run: `npm run check` → Expected: 0 errors, 0 warnings

- [ ] **Step 7: Commit**

```bash
git add src/content
git commit -m "feat: 40-card secret objective deck + standalone secret schema"
```

---

## Task 2: Secret scoring-window state + legacy-save default

**Files:**
- Modify: `src/domain/types.ts` (GameState)
- Modify: `src/domain/initialState.ts`
- Modify: `src/persistence/storage.ts` (`withStateDefaults`)
- Test: `src/persistence/storage.test.ts`
- Test: `src/domain/initialState.test.ts`

**Interfaces:**
- Produces: `GameState.scoredSecretThisRound: boolean`, seeded `false` by `createInitialState` and defaulted `false` by the existing `withStateDefaults` (already applied inside both `loadGame` and `importGame`).

- [ ] **Step 1: Write the failing tests**

Append inside `describe('persistence', ...)` in `src/persistence/storage.test.ts`:

```ts
it('defaults the secret scoring-window flag for a legacy save on load', async () => {
  const legacy = { ...state() } as Record<string, unknown>
  delete legacy.scoredSecretThisRound
  await saveGame('legacy-secret', legacy as never)
  const loaded = await loadGame('legacy-secret')
  expect(loaded?.scoredSecretThisRound).toBe(false)
})

it('defaults the secret scoring-window flag for a legacy import, and keeps a present value', () => {
  const legacy = { ...state() } as Record<string, unknown>
  delete legacy.scoredSecretThisRound
  expect(importGame(JSON.stringify(legacy)).scoredSecretThisRound).toBe(false)
  const present = importGame(exportGame({ ...state(), scoredSecretThisRound: true }))
  expect(present.scoredSecretThisRound).toBe(true)
})
```

Append inside the existing `describe` in `src/domain/initialState.test.ts`:

```ts
it('seeds the secret scoring-window flag', () => {
  const s = createInitialState(faction, { turnOrder: 1, speaker: false })
  expect(s.scoredSecretThisRound).toBe(false)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- storage.test initialState.test`
Expected: FAIL — the field does not exist, so both the seed and the default are `undefined`.

- [ ] **Step 3: Add the state field**

In `src/domain/types.ts`, inside `GameState`, add this line immediately after `scoredPublicThisRound: boolean`:

```ts
  scoredSecretThisRound: boolean
```

In `src/domain/initialState.ts`, add this line immediately after `scoredPublicThisRound: false,`:

```ts
    scoredSecretThisRound: false,
```

- [ ] **Step 4: Add the migration default**

In `src/persistence/storage.ts`, inside the object `withStateDefaults` returns, add this line immediately after the `scoredPublicThisRound:` line:

```ts
    scoredSecretThisRound: raw.scoredSecretThisRound ?? false,
```

- [ ] **Step 5: Run tests + check, verify green**

Run: `npm test -- storage.test initialState.test` → Expected: PASS
Run: `npm test` → Expected: all pass
Run: `npm run check` → Expected: 0 errors, 0 warnings

- [ ] **Step 6: Commit**

```bash
git add src/domain/types.ts src/domain/initialState.ts src/domain/initialState.test.ts src/persistence/storage.ts src/persistence/storage.test.ts
git commit -m "feat: secret scoring-window state with legacy-save default"
```

---

## Task 3: Draw + score secret reducer cases

**Files:**
- Modify: `src/domain/types.ts` (GameAction union)
- Modify: `src/state/reducers.ts`
- Test: `src/state/reducers.test.ts`

**Interfaces:**
- Consumes: `GameState.secretObjectives: { id: string; scored: boolean }[]` (pre-existing), `scoredSecretThisRound` (Task 2).
- Produces: two `GameAction` variants — `{ type: 'drawSecretObjective'; objectiveId: string; name: string }` and `{ type: 'scoreSecretObjective'; objectiveId: string; name: string }`. Draw appends `{ id, scored: false }`, is idempotent by id, and logs `Drew <name>`. Score flips the entry to `scored: true`, adds exactly 1 victory point, logs `Scored <name> (+1 VP)`, sets `scoredSecretThisRound` **only when `state.phase === 'status'`**, and is a no-op returning the same state reference when the id is not held or is already scored. `advancePhase` clears `scoredSecretThisRound` on round rollover.

- [ ] **Step 1: Write the failing tests**

Append inside `describe('applyAction', ...)` in `src/state/reducers.test.ts`:

```ts
it('drawSecretObjective holds the secret unscored, logs, and is idempotent', () => {
  const s1 = applyAction(base(), { type: 'drawSecretObjective', objectiveId: 'brave-the-void', name: 'Brave the Void' })
  expect(s1.secretObjectives).toEqual([{ id: 'brave-the-void', scored: false }])
  expect(s1.log.at(-1)?.summary).toBe('Drew Brave the Void')
  const s2 = applyAction(s1, { type: 'drawSecretObjective', objectiveId: 'brave-the-void', name: 'Brave the Void' })
  expect(s2).toBe(s1)
})

it('scoreSecretObjective scores a held secret once for exactly 1 VP', () => {
  const held = applyAction(base(), { type: 'drawSecretObjective', objectiveId: 'seize-an-icon', name: 'Seize an Icon' })
  const s1 = applyAction(held, { type: 'scoreSecretObjective', objectiveId: 'seize-an-icon', name: 'Seize an Icon' })
  expect(s1.secretObjectives).toEqual([{ id: 'seize-an-icon', scored: true }])
  expect(s1.victoryPoints).toBe(held.victoryPoints + 1)
  expect(s1.log.at(-1)?.summary).toBe('Scored Seize an Icon (+1 VP)')
  const s2 = applyAction(s1, { type: 'scoreSecretObjective', objectiveId: 'seize-an-icon', name: 'Seize an Icon' })
  expect(s2).toBe(s1)
})

it('scoreSecretObjective ignores a secret the player never drew', () => {
  const s = base()
  expect(applyAction(s, { type: 'scoreSecretObjective', objectiveId: 'never-drawn', name: 'Never Drawn' })).toBe(s)
})

it('scoring a secret marks the window only in the status phase', () => {
  const drawn = (phase: GameState['phase']) =>
    applyAction(base({ phase }), { type: 'drawSecretObjective', objectiveId: 'brave-the-void', name: 'Brave the Void' })
  const inStatus = applyAction(drawn('status'), { type: 'scoreSecretObjective', objectiveId: 'brave-the-void', name: 'Brave the Void' })
  expect(inStatus.scoredSecretThisRound).toBe(true)
  const inAction = applyAction(drawn('action'), { type: 'scoreSecretObjective', objectiveId: 'brave-the-void', name: 'Brave the Void' })
  expect(inAction.scoredSecretThisRound).toBe(false)
})

it('advancePhase clears the secret scoring window on round rollover', () => {
  const s = applyAction(base({ phase: 'status', scoredSecretThisRound: true, custodiansTaken: false }), { type: 'advancePhase' })
  expect(s.phase).toBe('strategy')
  expect(s.scoredSecretThisRound).toBe(false)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- reducers.test`
Expected: FAIL — neither action type exists, so TypeScript rejects them and no case handles them.

- [ ] **Step 3: Add the action variants**

In `src/domain/types.ts`, add these two lines to the `GameAction` union immediately after the `revealPublicObjective` line:

```ts
  | { type: 'drawSecretObjective'; objectiveId: string; name: string }
  | { type: 'scoreSecretObjective'; objectiveId: string; name: string }
```

- [ ] **Step 4: Add the reducer cases**

In `src/state/reducers.ts`, add both cases immediately before `case 'advancePhase': {`:

```ts
    case 'drawSecretObjective': {
      if (state.secretObjectives.some((s) => s.id === action.objectiveId)) return state
      return {
        ...state,
        secretObjectives: [...state.secretObjectives, { id: action.objectiveId, scored: false }],
        log: log(state, `Drew ${action.name}`),
      }
    }

    case 'scoreSecretObjective': {
      // Only a held, unscored secret can be scored: an unknown id would otherwise
      // mint victory points, and a re-score would double them.
      const held = state.secretObjectives.find((s) => s.id === action.objectiveId)
      if (!held || held.scored) return state
      return {
        ...state,
        secretObjectives: state.secretObjectives.map((s) => (s.id === action.objectiveId ? { ...s, scored: true } : s)),
        victoryPoints: state.victoryPoints + 1,
        scoredSecretThisRound: state.phase === 'status' ? true : state.scoredSecretThisRound,
        log: log(state, `Scored ${action.name} (+1 VP)`),
      }
    }
```

- [ ] **Step 5: Clear the flag on round rollover**

In the existing `case 'advancePhase'`, add this line to the returned object immediately after the `scoredPublicThisRound:` line:

```ts
        scoredSecretThisRound: enteringNewRound ? false : state.scoredSecretThisRound,
```

- [ ] **Step 6: Run tests + check, verify green**

Run: `npm test -- reducers.test` → Expected: PASS
Run: `npm run check` → Expected: 0 errors, 0 warnings

- [ ] **Step 7: Commit**

```bash
git add src/domain/types.ts src/state/reducers.ts src/state/reducers.test.ts
git commit -m "feat: draw + score secret objective reducer cases"
```

---

## Task 4: Held-secrets engine helper

**Files:**
- Modify: `src/engine/objectives.ts`
- Modify: `src/engine/index.ts` (re-export)
- Test: `src/engine/objectives.test.ts`

**Interfaces:**
- Consumes: content type `SecretObjective` (Task 1), `GameState.secretObjectives`.
- Produces: `getHeldSecretObjectives(state: GameState, secrets: SecretObjective[]): { objective: SecretObjective; scorableNow: boolean }[]` — the held-but-unscored secrets in catalog order, each tagged `scorableNow` (true when `objective.phase === state.phase`). Exported from `src/engine/index.ts`.

- [ ] **Step 1: Write the failing test**

In `src/engine/objectives.test.ts`, add `getHeldSecretObjectives` to the existing import from `./objectives` so it reads:

```ts
import { getScorablePublicObjectives, getHeldSecretObjectives } from './objectives'
```

Add `SecretObjective` to the existing content-schema type import:

```ts
import type { Objective, SecretObjective } from '../content/schema'
```

Then append this block at the end of the file:

```ts
const secrets: SecretObjective[] = [
  { id: 's-status', name: 'S Status', points: 1, phase: 'status', expansion: 'base', summary: 'x' },
  { id: 's-action', name: 'S Action', points: 1, phase: 'action', expansion: 'pok', summary: 'y' },
]

describe('getHeldSecretObjectives', () => {
  it('returns nothing when the player holds no secrets', () => {
    expect(getHeldSecretObjectives(state(), secrets)).toEqual([])
  })

  it('returns held secrets and tags which are scorable in the current phase', () => {
    const s = state({ phase: 'status', secretObjectives: [{ id: 's-status', scored: false }, { id: 's-action', scored: false }] })
    const held = getHeldSecretObjectives(s, secrets)
    expect(held.map((h) => h.objective.id)).toEqual(['s-status', 's-action'])
    expect(held.map((h) => h.scorableNow)).toEqual([true, false])
  })

  it('re-tags scorableNow when the phase changes', () => {
    const s = state({ phase: 'action', secretObjectives: [{ id: 's-status', scored: false }, { id: 's-action', scored: false }] })
    expect(getHeldSecretObjectives(s, secrets).map((h) => h.scorableNow)).toEqual([false, true])
  })

  it('excludes secrets already scored', () => {
    const s = state({ phase: 'status', secretObjectives: [{ id: 's-status', scored: true }, { id: 's-action', scored: false }] })
    expect(getHeldSecretObjectives(s, secrets).map((h) => h.objective.id)).toEqual(['s-action'])
  })

  it('ignores a held id that is not in the catalog', () => {
    const s = state({ phase: 'status', secretObjectives: [{ id: 'unknown', scored: false }] })
    expect(getHeldSecretObjectives(s, secrets)).toEqual([])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- objectives.test`
Expected: FAIL — `getHeldSecretObjectives` is not exported from `./objectives`.

- [ ] **Step 3: Implement the helper**

In `src/engine/objectives.ts`, add `SecretObjective` to the existing type import and append the function:

```ts
import type { Objective, SecretObjective } from '../content/schema'
```

```ts
export function getHeldSecretObjectives(
  state: GameState,
  secrets: SecretObjective[],
): { objective: SecretObjective; scorableNow: boolean }[] {
  const heldUnscored = new Set(state.secretObjectives.filter((s) => !s.scored).map((s) => s.id))
  return secrets
    .filter((o) => heldUnscored.has(o.id))
    .map((objective) => ({ objective, scorableNow: objective.phase === state.phase }))
}
```

- [ ] **Step 4: Re-export from the engine barrel**

In `src/engine/index.ts`, change the objectives export line so it reads:

```ts
export { getScorablePublicObjectives, getHeldSecretObjectives } from './objectives'
```

- [ ] **Step 5: Run test + check, verify green**

Run: `npm test -- objectives.test` → Expected: PASS
Run: `npm run check` → Expected: 0 errors, 0 warnings

- [ ] **Step 6: Commit**

```bash
git add src/engine/objectives.ts src/engine/objectives.test.ts src/engine/index.ts
git commit -m "feat: getHeldSecretObjectives with per-phase scorable tagging"
```

---

## Task 5: Secret reminders + agenda phase branch

**Files:**
- Modify: `src/engine/reminders.ts`
- Test: `src/engine/reminders.test.ts`

**Interfaces:**
- Consumes: `scoredSecretThisRound` (Task 2).
- Produces: `getReminders(state, opts?)` where `Opts` gains `scorableSecretCount?: number` and `heldSecretCount?: number`. New reminder ids: `scorable-secrets` (status, action, and agenda when the count is positive), `secret-window-used` (status only), `secret-hand-full` (any phase that reports reminders, when 3 secrets are held), `action-secret-window` (action), `agenda-secret-window` (agenda), `imperial-card` (action, when strategy card 8 is held). The agenda phase returns reminders instead of `[]`. `opts` stays optional and backward-compatible.

- [ ] **Step 1: Write the failing tests**

In `src/engine/reminders.test.ts`, add this helper immediately after the existing `statusPhase` helper:

```ts
function agendaPhase(overrides: Partial<GameState> = {}): GameState {
  const s = createInitialState(faction, { turnOrder: 1, speaker: false })
  return { ...s, phase: 'agenda', ...overrides }
}
```

Then append these tests inside `describe('getReminders', ...)`:

```ts
it('counts scorable secrets in each scoring phase', () => {
  expect(getReminders(statusPhase(), { scorableSecretCount: 2 }).map((r) => r.id)).toContain('scorable-secrets')
  expect(getReminders(actionPhase(), { scorableSecretCount: 1 }).map((r) => r.id)).toContain('scorable-secrets')
  expect(getReminders(agendaPhase(), { scorableSecretCount: 1 }).map((r) => r.id)).toContain('scorable-secrets')
  expect(getReminders(statusPhase(), { scorableSecretCount: 0 }).map((r) => r.id)).not.toContain('scorable-secrets')
})

it('warns once this round\'s secret window is used, in the status phase only', () => {
  expect(getReminders(statusPhase({ scoredSecretThisRound: true })).map((r) => r.id)).toContain('secret-window-used')
  expect(getReminders(actionPhase({ scoredSecretThisRound: true })).map((r) => r.id)).not.toContain('secret-window-used')
})

it('notes a full secret hand at three held', () => {
  expect(getReminders(statusPhase(), { heldSecretCount: 3 }).map((r) => r.id)).toContain('secret-hand-full')
  expect(getReminders(statusPhase(), { heldSecretCount: 2 }).map((r) => r.id)).not.toContain('secret-hand-full')
})

it('states the per-window rule for action and agenda secrets', () => {
  expect(getReminders(actionPhase()).map((r) => r.id)).toContain('action-secret-window')
  expect(getReminders(agendaPhase()).map((r) => r.id)).toContain('agenda-secret-window')
  expect(getReminders(statusPhase()).map((r) => r.id)).not.toContain('action-secret-window')
})

it('reminds about the Imperial strategy card only when held', () => {
  expect(getReminders(actionPhase({ strategyCardIds: [8] })).map((r) => r.id)).toContain('imperial-card')
  expect(getReminders(actionPhase({ strategyCardIds: [1] })).map((r) => r.id)).not.toContain('imperial-card')
})

it('is quiet in phases with no reminders yet (setup, strategy)', () => {
  const s = createInitialState(faction, { turnOrder: 1, speaker: false }) // setup
  expect(getReminders(s)).toEqual([])
  expect(getReminders({ ...s, phase: 'strategy' })).toEqual([])
})
```

Then **delete** the pre-existing test titled `'is quiet in phases with no reminders yet (setup, strategy, agenda)'` — the agenda phase is no longer silent, and the replacement above covers the two phases that still are.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- reminders.test`
Expected: FAIL — the agenda phase returns `[]`, and none of the new reminder ids exist.

- [ ] **Step 3: Extend the Opts type and add a shared secret-reminder helper**

In `src/engine/reminders.ts`, replace the `Opts` type line with:

```ts
type Opts = {
  researchableCount?: number
  scorablePublicCount?: number
  stageTwoScorable?: boolean
  scorableSecretCount?: number
  heldSecretCount?: number
}
```

Then add this helper immediately below the `Opts` type, above `actionReminders`:

```ts
// Shared by every phase that has a secret window: the count of secrets you could
// score right now, and the hand-limit nudge.
function secretReminders(opts: Opts): Reminder[] {
  const out: Reminder[] = []

  const scorable = opts.scorableSecretCount ?? 0
  if (scorable > 0) {
    out.push({
      id: 'scorable-secrets',
      severity: 'info',
      text: `${scorable} held secret${scorable === 1 ? '' : 's'} can be scored in this phase.`,
    })
  }

  if ((opts.heldSecretCount ?? 0) >= 3) {
    out.push({ id: 'secret-hand-full', severity: 'info', text: 'You are holding 3 unscored secrets — the usual limit. Score one before drawing more.' })
  }

  return out
}
```

- [ ] **Step 4: Wire the secret reminders into each phase**

In `actionReminders`, add these lines immediately before its `return out`:

```ts
  if (state.strategyCardIds.includes(8)) {
    out.push({
      id: 'imperial-card',
      severity: 'info',
      text: 'You hold the Imperial card: its primary scores a public objective you qualify for and gives a victory point for holding Mecatol Rex, and it draws you a secret; others may spend a token to draw one too.',
    })
  }

  out.push(...secretReminders(opts))
  out.push({ id: 'action-secret-window', severity: 'info', text: 'Action-phase secrets are scored in their own moment — at most one objective during or after each combat.' })
```

In `statusReminders`, add these lines **immediately above the existing `out.push({ id: 'vp-progress', ... })` line** — not before `return out` — so the victory-point reminder stays last in that phase:

```ts
  out.push(...secretReminders(opts))

  if (state.scoredSecretThisRound) {
    out.push({ id: 'secret-window-used', severity: 'info', text: 'You already scored a secret objective this round.' })
  }
```

Then add this new function immediately after `statusReminders`:

```ts
function agendaReminders(state: GameState, opts: Opts): Reminder[] {
  const out: Reminder[] = [...secretReminders(opts)]

  out.push({ id: 'agenda-secret-window', severity: 'info', text: 'Agenda-phase secrets are scored as each agenda resolves — at most one objective per timing window.' })
  out.push({ id: 'vp-progress', severity: 'info', text: `${state.victoryPoints} of 10 victory points.` })

  return out
}
```

Finally, update the dispatcher so the agenda phase is served:

```ts
export function getReminders(state: GameState, opts: Opts = {}): Reminder[] {
  if (state.phase === 'action') return actionReminders(state, opts)
  if (state.phase === 'status') return statusReminders(state, opts)
  if (state.phase === 'agenda') return agendaReminders(state, opts)
  return []
}
```

- [ ] **Step 5: Run tests + check, verify green**

Run: `npm test -- reminders.test` → Expected: PASS (including the pre-existing action- and status-phase tests)
Run: `npm test` → Expected: all pass
Run: `npm run check` → Expected: 0 errors, 0 warnings

- [ ] **Step 6: Commit**

```bash
git add src/engine/reminders.ts src/engine/reminders.test.ts
git commit -m "feat: secret reminders + agenda-phase reminder branch"
```

---

## Task 6: SecretPanel component

**Files:**
- Create: `src/lib/components/SecretPanel.svelte`
- Test: `src/lib/components/SecretPanel.svelte.test.ts`

**Interfaces:**
- Consumes: content type `SecretObjective` (Task 1); the shape returned by `getHeldSecretObjectives` (Task 4).
- Produces: `SecretPanel` props `{ secrets: SecretObjective[]; held: { objective: SecretObjective; scorableNow: boolean }[]; scoredIds: string[]; onDraw: (id: string, name: string) => void; onScore: (id: string, name: string) => void; onDiscard: (id: string) => void }`. Accessible names: score buttons `score <name>`, discard buttons `discard <name>`, draw buttons `draw <name>`; the draw search input's placeholder is `Draw a secret objective…`.

Presentational only: no store, engine, or content-data imports (a type-only import is fine).

- [ ] **Step 1: Write the failing test**

Create `src/lib/components/SecretPanel.svelte.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import SecretPanel from './SecretPanel.svelte'
import type { SecretObjective } from '../../content/schema'

const S = (o: Partial<SecretObjective> & { id: string; name: string }): SecretObjective =>
  ({ points: 1, phase: 'status', expansion: 'base', summary: 's', ...o })

const secrets: SecretObjective[] = [
  S({ id: 'a', name: 'Seize an Icon', phase: 'status' }),
  S({ id: 'b', name: 'Brave the Void', phase: 'action' }),
  S({ id: 'c', name: 'Dictate Policy', phase: 'agenda' }),
]
const held = [
  { objective: secrets[0], scorableNow: true },
  { objective: secrets[1], scorableNow: false },
]

function props(overrides: Record<string, unknown> = {}) {
  return { secrets, held, scoredIds: [] as string[], onDraw: vi.fn(), onScore: vi.fn(), onDiscard: vi.fn(), ...overrides }
}

describe('SecretPanel', () => {
  it('lists the held hand with phase tags', () => {
    render(SecretPanel, { props: props() })
    expect(screen.getByRole('button', { name: /score Seize an Icon/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /score Brave the Void/i })).toBeTruthy()
    expect(screen.getByText(/action/i)).toBeTruthy()
  })

  it('scores a held secret', async () => {
    const p = props()
    render(SecretPanel, { props: p })
    await fireEvent.click(screen.getByRole('button', { name: /score Seize an Icon/i }))
    expect(p.onScore).toHaveBeenCalledWith('a', 'Seize an Icon')
  })

  it('keeps an out-of-phase secret clickable (assistant, not referee)', async () => {
    const p = props()
    render(SecretPanel, { props: p })
    await fireEvent.click(screen.getByRole('button', { name: /score Brave the Void/i }))
    expect(p.onScore).toHaveBeenCalledWith('b', 'Brave the Void')
  })

  it('discards a held secret', async () => {
    const p = props()
    render(SecretPanel, { props: p })
    await fireEvent.click(screen.getByRole('button', { name: /discard Seize an Icon/i }))
    expect(p.onDiscard).toHaveBeenCalledWith('a')
  })

  // Narrower `held` here (only 'a') so that 'b' is genuinely drawable: the picker
  // must exclude held and scored ids, and the default fixture holds both a and b.
  it('draws an unheld secret through the picker, excluding held and scored ones', async () => {
    const p = props({ held: [{ objective: secrets[0], scorableNow: true }], scoredIds: ['c'] })
    render(SecretPanel, { props: p })
    expect(screen.queryByRole('button', { name: /draw Seize an Icon/i })).toBeNull() // held
    expect(screen.queryByRole('button', { name: /draw Dictate Policy/i })).toBeNull() // scored
    await fireEvent.click(screen.getByRole('button', { name: /draw Brave the Void/i }))
    expect(p.onDraw).toHaveBeenCalledWith('b', 'Brave the Void')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- SecretPanel`
Expected: FAIL — the component file does not exist.

- [ ] **Step 3: Implement the component**

Create `src/lib/components/SecretPanel.svelte`:

```svelte
<script lang="ts">
  import type { SecretObjective } from '../../content/schema'
  import ExpandableItem from './ExpandableItem.svelte'

  interface Props {
    secrets: SecretObjective[]
    held: { objective: SecretObjective; scorableNow: boolean }[]
    scoredIds: string[]
    onDraw: (id: string, name: string) => void
    onScore: (id: string, name: string) => void
    onDiscard: (id: string) => void
  }
  let { secrets, held, scoredIds, onDraw, onScore, onDiscard }: Props = $props()

  let drawQuery = $state('')
  const unavailable = $derived(new Set([...held.map((h) => h.objective.id), ...scoredIds]))
  const drawMatches = $derived(
    secrets
      .filter((o) => !unavailable.has(o.id) && o.name.toLowerCase().includes(drawQuery.toLowerCase()))
      .slice(0, 8),
  )
  function draw(o: SecretObjective) {
    onDraw(o.id, o.name)
    drawQuery = ''
  }
  const scored = $derived(secrets.filter((o) => scoredIds.includes(o.id)))
</script>

<h3 style="font-size:16px;font-weight:500;margin-top:16px;">Secret objectives</h3>
<ExpandableItem
  title="Your secrets"
  summary="Secrets you hold, and which can be scored in this phase."
  detail="Each secret is worth 1 victory point and is scored in its own phase. Highlighted ones match the current phase; the rest are shown greyed so you can see your whole hand. You normally hold at most 3 unscored secrets."
/>

{#each held as h (h.objective.id)}
  <div style="display:flex;align-items:center;gap:6px;margin:4px 0;">
    <button
      onclick={() => onScore(h.objective.id, h.objective.name)}
      aria-label={`score ${h.objective.name}`}
      style="flex:1;text-align:left;padding:8px 12px;border:1px solid {h.scorableNow ? 'var(--accent)' : 'var(--border)'};border-radius:var(--radius);background:{h.scorableNow ? 'var(--surface-2)' : 'var(--surface)'};color:{h.scorableNow ? 'var(--text)' : 'var(--text-muted)'};cursor:pointer;"
    >
      <span style="font-weight:{h.scorableNow ? 500 : 400};">Score: {h.objective.name}</span>
      <span style="font-size:12px;color:var(--text-muted);"> · {h.objective.phase} · {h.objective.summary}</span>
    </button>
    <button onclick={() => onDiscard(h.objective.id)} aria-label={`discard ${h.objective.name}`} style="padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">✕</button>
  </div>
{/each}
{#if held.length === 0}<p style="color:var(--text-muted);font-size:14px;">No secrets in hand — draw the one you were dealt below.</p>{/if}

<input placeholder="Draw a secret objective…" bind:value={drawQuery} style="width:100%;padding:8px;margin-top:8px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--text);" />
{#each drawMatches as o (o.id)}
  <button onclick={() => draw(o)} aria-label={`draw ${o.name}`} style="display:block;width:100%;text-align:left;margin:4px 0;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">+ {o.name} ({o.phase})</button>
{/each}

{#if scored.length > 0}
  <h4 style="font-weight:500;margin-top:12px;">Scored</h4>
  {#each scored as o (o.id)}
    <p style="color:var(--text-muted);font-size:14px;margin:2px 0;">✓ {o.name} (+1)</p>
  {/each}
{/if}
```

- [ ] **Step 4: Run the component test, verify green**

Run: `npm test -- SecretPanel` → Expected: PASS
Run: `npm run check` → Expected: 0 errors, 0 warnings

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/SecretPanel.svelte src/lib/components/SecretPanel.svelte.test.ts
git commit -m "feat: SecretPanel — held hand, phase tags, draw picker, discard"
```

---

## Task 7: Mount SecretPanel in all four phases and retire the placeholder

**Files:**
- Modify: `src/App.svelte`
- Modify: `src/lib/components/StatusChecklist.svelte`
- Test: `src/lib/components/StatusChecklist.svelte.test.ts`

**Interfaces:**
- Consumes: `SecretPanel` props (Task 6), `getHeldSecretObjectives` (Task 4), the `drawSecretObjective` / `scoreSecretObjective` actions (Task 3), `getReminders` opts `scorableSecretCount` / `heldSecretCount` (Task 5).
- Produces: `SecretPanel` rendered in the strategy, action, status, and agenda branches of `App.svelte`; `StatusChecklist` no longer has any secret-objective code.

- [ ] **Step 1: Write the failing test**

Append this test inside `describe('StatusChecklist', ...)` in `src/lib/components/StatusChecklist.svelte.test.ts`:

```ts
it('no longer carries the secret-objective placeholder', () => {
  render(StatusChecklist, { props: { state: state(), publicObjectives, onAction: vi.fn() } })
  expect(screen.queryByRole('button', { name: /Scored a secret/i })).toBeNull()
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- StatusChecklist`
Expected: FAIL — the placeholder button "Scored a secret (+1 VP)" is still rendered.

- [ ] **Step 3: Remove the placeholder from StatusChecklist**

In `src/lib/components/StatusChecklist.svelte`, delete the whole `scoreSecret` function (the `function scoreSecret() { ... }` block, including its `onAction({ type: 'editState', ... })` body), and delete these two template lines:

```svelte
<ExpandableItem title="Score a secret objective" summary="If you completed one, reveal it for VP." detail="Secret objective content isn't loaded yet, so this just records a secret scored (+1 VP)." />
<button onclick={scoreSecret} style="padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Scored a secret (+1 VP)</button>
```

Leave everything else in the file untouched.

- [ ] **Step 4: Wire App.svelte**

In `src/App.svelte`:

(a) Add `getHeldSecretObjectives` to the engine import so it reads:

```ts
  import { getAvailableActions, getReminders, getResearchableTechs, getScorablePublicObjectives, getHeldSecretObjectives } from './engine/index'
```

(b) Add the component import immediately after the `MenuSheet` import:

```ts
  import SecretPanel from './lib/components/SecretPanel.svelte'
```

(c) Add these derived values immediately after the existing `stageTwoScorable` line:

```ts
  const heldSecrets = $derived(gameState ? getHeldSecretObjectives(gameState, content.secretObjectives) : [])
  const scorableSecretCount = $derived(heldSecrets.filter((h) => h.scorableNow).length)
  const scoredSecretIds = $derived(gameState ? gameState.secretObjectives.filter((s) => s.scored).map((s) => s.id) : [])
```

(d) Replace the `reminders` derived with a version that passes the secret counts:

```ts
  const reminders = $derived(
    gameState
      ? getReminders(gameState, {
          researchableCount: researchableIds.size,
          scorablePublicCount: scorablePublics.length,
          stageTwoScorable,
          scorableSecretCount,
          heldSecretCount: heldSecrets.length,
        })
      : [],
  )
```

(e) Add these handlers immediately after the existing `toggleStrategyCard` function:

```ts
  function drawSecret(objectiveId: string, name: string) {
    store?.dispatch({ type: 'drawSecretObjective', objectiveId, name })
  }
  function scoreSecret(objectiveId: string, name: string) {
    store?.dispatch({ type: 'scoreSecretObjective', objectiveId, name })
  }
  function discardSecret(objectiveId: string) {
    if (!store) return
    store.dispatch({ type: 'editState', patch: { secretObjectives: store.state.secretObjectives.filter((s) => s.id !== objectiveId) } })
  }
```

(f) In the template, add this snippet **inside** each of the four phase branches — after `<StrategyPhase ... />`, after `<ActionPanel ... />`, after `<StatusChecklist ... />`, and after `<AgendaHelper ... />`:

```svelte
      <SecretPanel secrets={content.secretObjectives} held={heldSecrets} scoredIds={scoredSecretIds} onDraw={drawSecret} onScore={scoreSecret} onDiscard={discardSecret} />
```

- [ ] **Step 5: Run the full suite, check, and build**

Run: `npm test -- StatusChecklist` → Expected: PASS
Run: `npm test` → Expected: all pass
Run: `npm run check` → Expected: 0 errors, 0 warnings
Run: `npm run build` → Expected: success

- [ ] **Step 6: Commit**

```bash
git add src/App.svelte src/lib/components/StatusChecklist.svelte src/lib/components/StatusChecklist.svelte.test.ts
git commit -m "feat: mount SecretPanel in every phase; retire the secret-N placeholder"
```

---

## Task 8: Extract GroupedEntries and shared TECH_GROUPS

Pure refactor: no behavior changes, and every pre-existing test must keep passing untouched. This retires two `CLAUDE.md` deferred-polish items before Task 9 would add a third copy of the grouped-render block.

**Files:**
- Create: `src/lib/techGroups.ts`
- Create: `src/lib/components/GroupedEntries.svelte`
- Modify: `src/lib/components/ReferenceBrowser.svelte`
- Modify: `src/lib/components/ResearchPicker.svelte`
- Test: `src/lib/components/GroupedEntries.svelte.test.ts`

**Interfaces:**
- Produces: `TECH_GROUPS: { key: string; label: string; match: (t: Technology) => boolean }[]` exported from `src/lib/techGroups.ts`; `GroupedEntries` with props `{ groups: { key: string; label: string; entries: { id: string; title: string; summary: string; detail: string }[] }[] }`, rendering an `<h4>` per group, an `ExpandableItem` per entry, and `No matches.` when `groups` is empty.

**Note:** `ResearchPicker` renders its groups as buttons, not `ExpandableItem`s, so it shares only the `TECH_GROUPS` config — it does **not** use `GroupedEntries`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/components/GroupedEntries.svelte.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import GroupedEntries from './GroupedEntries.svelte'

const groups = [
  { key: 'x', label: 'Group X', entries: [{ id: '1', title: 'First', summary: 's1', detail: 'd1' }] },
  { key: 'y', label: 'Group Y', entries: [{ id: '2', title: 'Second', summary: 's2', detail: 'd2' }] },
]

describe('GroupedEntries', () => {
  it('renders a header per group and an entry per item', () => {
    render(GroupedEntries, { props: { groups } })
    expect(screen.getByText('Group X')).toBeTruthy()
    expect(screen.getByText('Group Y')).toBeTruthy()
    expect(screen.getByText('First')).toBeTruthy()
    expect(screen.getByText('Second')).toBeTruthy()
  })

  it('shows an empty state when there are no groups', () => {
    render(GroupedEntries, { props: { groups: [] } })
    expect(screen.getByText('No matches.')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- GroupedEntries`
Expected: FAIL — the component does not exist.

- [ ] **Step 3: Create the shared tech-groups module**

Create `src/lib/techGroups.ts`:

```ts
import type { Technology } from '../content/schema'

export const TECH_GROUPS: { key: string; label: string; match: (t: Technology) => boolean }[] = [
  { key: 'blue', label: 'Propulsion (blue)', match: (t) => t.type === 'ability' && t.color === 'blue' },
  { key: 'green', label: 'Biotic (green)', match: (t) => t.type === 'ability' && t.color === 'green' },
  { key: 'yellow', label: 'Cybernetic (yellow)', match: (t) => t.type === 'ability' && t.color === 'yellow' },
  { key: 'red', label: 'Warfare (red)', match: (t) => t.type === 'ability' && t.color === 'red' },
  { key: 'unit', label: 'Unit Upgrades', match: (t) => t.type === 'unit-upgrade' },
]
```

- [ ] **Step 4: Create the GroupedEntries component**

Create `src/lib/components/GroupedEntries.svelte`:

```svelte
<script lang="ts">
  import ExpandableItem from './ExpandableItem.svelte'

  type Entry = { id: string; title: string; summary: string; detail: string }
  interface Props { groups: { key: string; label: string; entries: Entry[] }[] }
  let { groups }: Props = $props()
</script>

{#each groups as g (g.key)}
  <h4 style="font-weight:500;margin-top:12px;">{g.label}</h4>
  {#each g.entries as e (e.id)}
    <ExpandableItem title={e.title} summary={e.summary} detail={e.detail} />
  {/each}
{/each}
{#if groups.length === 0}<p style="color:var(--text-muted);font-size:14px;">No matches.</p>{/if}
```

- [ ] **Step 5: Use the shared config in ResearchPicker**

In `src/lib/components/ResearchPicker.svelte`, delete the local `const GROUPS: ... = [ ... ]` array (all five entries) and add this import below the existing `import type { Technology }` line:

```ts
  import { TECH_GROUPS } from '../techGroups'
```

Then change the `groups` derived to map over the imported config — replace `GROUPS.map(` with:

```ts
    TECH_GROUPS.map(
```

- [ ] **Step 6: Use both extractions in ReferenceBrowser**

In `src/lib/components/ReferenceBrowser.svelte`:

Add these imports below the existing `import ExpandableItem from './ExpandableItem.svelte'` line:

```ts
  import GroupedEntries from './GroupedEntries.svelte'
  import { TECH_GROUPS } from '../techGroups'
```

Delete the local `const TECH_GROUPS: ... = [ ... ]` array (all five entries) — the import replaces it.

In the template, replace the objective branch's group loop and empty state:

```svelte
{#if kind === 'objective'}
  <GroupedEntries groups={objectiveGroups} />
{:else if kind === 'tech'}
  <GroupedEntries groups={techGroups} />
{:else}
  {#each entries as e (kind + e.id)}
    <ExpandableItem title={e.title} summary={e.summary} detail={e.detail} />
  {/each}
  {#if entries.length === 0}<p style="color:var(--text-muted);font-size:14px;">No matches.</p>{/if}
{/if}
```

(The `objectiveGroups` and `techGroups` derived values already produce `{ key, label, entries }` objects, so they pass straight through. `ExpandableItem` is still used by the flat branch, so keep its import.)

- [ ] **Step 7: Run the full suite, check, and build**

Run: `npm test -- GroupedEntries ReferenceBrowser ResearchPicker` → Expected: PASS, including the pre-existing ReferenceBrowser and ResearchPicker tests unchanged
Run: `npm test` → Expected: all pass
Run: `npm run check` → Expected: 0 errors, 0 warnings
Run: `npm run build` → Expected: success

- [ ] **Step 8: Commit**

```bash
git add src/lib/techGroups.ts src/lib/components/GroupedEntries.svelte src/lib/components/GroupedEntries.svelte.test.ts src/lib/components/ReferenceBrowser.svelte src/lib/components/ResearchPicker.svelte
git commit -m "refactor: extract GroupedEntries + shared TECH_GROUPS"
```

---

## Task 9: Secrets reference tab

**Files:**
- Modify: `src/lib/components/ReferenceBrowser.svelte`
- Modify: `src/lib/components/MenuSheet.svelte`
- Modify: `src/App.svelte` (pass the catalog to MenuSheet)
- Test: `src/lib/components/ReferenceBrowser.svelte.test.ts`
- Modify: `src/lib/components/MenuSheet.svelte.test.ts` (prop)

**Interfaces:**
- Consumes: `content.secretObjectives` (Task 1), `GroupedEntries` (Task 8).
- Produces: a `Secrets` tab in `ReferenceBrowser`, grouped by scoring phase with headers `Status phase`, `Action phase`, `Agenda phase`; a new `secretObjectives: SecretObjective[]` prop on both `ReferenceBrowser` and `MenuSheet`.

- [ ] **Step 1: Write the failing test**

In `src/lib/components/ReferenceBrowser.svelte.test.ts`, add `SecretObjective` to the content-schema type import, add this fixture below the existing `publicObjectives` fixture:

```ts
const secretObjectives: SecretObjective[] = [
  { id: 'sa', name: 'Seize an Icon', points: 1, phase: 'status', expansion: 'pok', summary: 'Hold a legendary planet.' },
  { id: 'sb', name: 'Brave the Void', points: 1, phase: 'action', expansion: 'pok', summary: 'Win a fight inside an anomaly.' },
]
```

Then add `secretObjectives,` to the props object of **every** `render(ReferenceBrowser, ...)` call in the file, and append this test:

```ts
it('groups the secrets tab by scoring phase', async () => {
  render(ReferenceBrowser, { props: { factions, technologies, strategyCards, publicObjectives, secretObjectives, planets } })
  await fireEvent.click(screen.getByRole('button', { name: /Secrets/ }))
  expect(screen.getByText('Status phase')).toBeTruthy()
  expect(screen.getByText('Action phase')).toBeTruthy()
  expect(screen.getByText('Seize an Icon')).toBeTruthy()
  expect(screen.getByText('Brave the Void')).toBeTruthy()
})
```

In `src/lib/components/MenuSheet.svelte.test.ts`, add `secretObjectives: [],` to the props object beside the existing `publicObjectives: [],`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- ReferenceBrowser`
Expected: FAIL — there is no `Secrets` tab button to click.

- [ ] **Step 3: Add the tab to ReferenceBrowser**

In `src/lib/components/ReferenceBrowser.svelte`:

Add `SecretObjective` to the content-schema type import, add the prop to the `Props` interface (`secretObjectives: SecretObjective[]`) and to the destructure.

Add `'secret'` to the `Kind` union so it reads:

```ts
  type Kind = 'faction' | 'tech' | 'strategy' | 'objective' | 'secret' | 'planet'
```

Add this derived immediately after the existing `objectiveGroups` derived:

```ts
  const secretGroups = $derived(
    (['status', 'action', 'agenda'] as const)
      .map((phase) => ({
        key: phase,
        label: `${phase[0].toUpperCase()}${phase.slice(1)} phase`,
        entries: secretObjectives
          .filter((o) => o.phase === phase && o.name.toLowerCase().includes(q.toLowerCase()))
          .map((o) => ({
            id: o.id,
            title: o.name,
            summary: o.summary,
            detail: `1 VP · ${o.phase} phase · ${o.expansion.toUpperCase()}\n${o.summary}`,
          })),
      }))
      .filter((g) => g.entries.length > 0),
  )
```

Add the tab entry to the `tabs` array, immediately after the `objective` entry:

```ts
    { k: 'secret', label: 'Secrets' },
```

And add a branch to the template, immediately after the `{#if kind === 'objective'}` line's `<GroupedEntries groups={objectiveGroups} />`:

```svelte
{:else if kind === 'secret'}
  <GroupedEntries groups={secretGroups} />
```

- [ ] **Step 4: Thread the prop through MenuSheet and App**

In `src/lib/components/MenuSheet.svelte`: add `SecretObjective` to the content-schema type import, add `secretObjectives: SecretObjective[]` to the `Props` interface, add `secretObjectives,` to the destructure, and pass it to `ReferenceBrowser` so that line reads:

```svelte
        <ReferenceBrowser {factions} {technologies} {strategyCards} {publicObjectives} {secretObjectives} {planets} />
```

In `src/App.svelte`, add this line to the `<MenuSheet ... />` block immediately after `publicObjectives={content.publicObjectives}`:

```svelte
    secretObjectives={content.secretObjectives}
```

- [ ] **Step 5: Run the full suite, check, and build**

Run: `npm test -- ReferenceBrowser MenuSheet` → Expected: PASS
Run: `npm test` → Expected: all pass
Run: `npm run check` → Expected: 0 errors, 0 warnings
Run: `npm run build` → Expected: success

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/ReferenceBrowser.svelte src/lib/components/ReferenceBrowser.svelte.test.ts src/lib/components/MenuSheet.svelte src/lib/components/MenuSheet.svelte.test.ts src/App.svelte
git commit -m "feat: secrets reference tab grouped by scoring phase"
```

---

## Done criteria

- All 40 base + PoK secrets in `secretObjectives.ts` (26 status / 12 action / 2 agenda, every one 1 VP), validated by a standalone Zod schema, summaries in our own words.
- `scoredSecretThisRound` in state, seeded at init and defaulted for legacy saves on both load and import.
- `drawSecretObjective` holds a secret unscored and is idempotent; `scoreSecretObjective` scores a held secret once for exactly 1 VP, no-ops on unknown or already-scored ids, and marks the window only in the status phase; round rollover clears the flag.
- `getHeldSecretObjectives` returns held-unscored secrets tagged `scorableNow` per phase.
- Reminders cover scorable secrets, the used status window, a full hand, the action and agenda window rules, and the Imperial card; the agenda phase now reports reminders.
- `SecretPanel` shows the hand with phase tags, highlights scorable entries while keeping the rest clickable, draws through a picker, and discards a row — mounted in strategy, action, status, and agenda.
- The `secret-N` placeholder is gone from `StatusChecklist`.
- `GroupedEntries` and a shared `TECH_GROUPS` replace the duplicated grouped-render blocks; the Secrets reference tab uses them.
- `npm test` green, `npm run check` 0/0, `npm run build` OK.
