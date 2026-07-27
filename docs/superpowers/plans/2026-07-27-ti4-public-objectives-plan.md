# Public Objectives (2a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the complete 40-card base + PoK public objective deck with reveal tracking and scoring awareness (what you can score now, whether this round's window is used, VP progress toward 10).

**Architecture:** Content grows from a 3-entry stub to all 40 objectives in a renamed `publicObjectives.ts` (Zod-validated, stage↔points enforced by `.refine()`). Two new `GameState` fields (`revealedPublicObjectiveIds`, `scoredPublicThisRound`) are defaulted for legacy saves by a new `withStateDefaults` in persistence. A pure `engine/objectives.ts` computes the scorable set; `getReminders` splits into per-phase helpers so it can serve the status phase. `StatusChecklist` scores from revealed objectives only and gains a reveal picker; wiring stays in `App.svelte`.

**Tech Stack:** Vite + Svelte 5 (runes), TypeScript, Zod, Vitest, @testing-library/svelte, idb (IndexedDB).

## Global Constraints

- `npm run check` must report **0 errors / 0 warnings** (svelte-check); `npm test` green; `npm run build` OK — run all three before the final commit of any task touching `.svelte`.
- Svelte 5 runes. A prop literally named `state` collides with the `$state` rune — alias it: `let { state: gameState } = $props()` (StatusChecklist already does this).
- All game data lives in `src/content/` as data files. Never hardcode game data in components.
- Objective requirement summaries are authored in **our own words — never verbatim card text** (copyright). The summaries in Task 1 are already paraphrased; transcribe them exactly and do not "restore" them to official wording.
- `src/engine/` stays pure: no Svelte, no runtime content imports. Type-only imports (`import type { Objective }`) are allowed; content arrays are passed in as parameters.
- Store / engine / persistence wiring lives **only** in `App.svelte`. Components are presentational (props + callbacks).
- `state/reducers.ts` stays a pure reducer: clamp, idempotent, append one log entry via the existing `log(state, summary)` helper.
- Every content file has a Zod schema + a validation test.
- "Assistant, not referee": nothing is enforced. Greyed options stay clickable; every value stays editable and undoable.

## Verified source data (AsyncTI4 `data/public_objectives/public_objectives.json`, `source` ∈ {base, pok})

40 official public objectives: **Stage I** ×20 (1 VP — 10 base, 10 PoK) and **Stage II** ×20 (2 VP — 10 base, 10 PoK). Every one is scored in the status phase (`phase: "Status"` across all 40). The file's other 40 entries are homebrew (`source: "other"`) and are excluded.

---

## Task 1: Full catalog, schema fields, and the `publicObjectives` rename

Schema fields, the 40-entry catalog, the registry/prop rename, and the two affected test fixtures ship together: adding required schema fields and renaming the registry key breaks every consumer at once, so they must move in one commit to keep the suite green.

**Files:**
- Modify: `src/content/schema.ts` (objectiveSchema)
- Create: `src/content/publicObjectives.ts`
- Delete: `src/content/objectives.ts`
- Modify: `src/content/index.ts`
- Modify: `src/App.svelte` (two prop sites)
- Modify: `src/lib/components/MenuSheet.svelte` (Props + destructure + two pass-downs)
- Modify: `src/lib/components/ReferenceBrowser.svelte` (Props + destructure + objective branch)
- Modify: `src/lib/components/StatusChecklist.svelte` (Props + destructure + `unscored` derived)
- Test: `src/content/content.test.ts`
- Modify: `src/lib/components/StatusChecklist.svelte.test.ts` (fixture + prop name)
- Modify: `src/lib/components/ReferenceBrowser.svelte.test.ts` (fixture + prop name)
- Modify: `src/lib/components/MenuSheet.svelte.test.ts` (prop name)

**Interfaces:**
- Produces: `Objective = { id: string; name: string; points: 1 | 2; stage: 'I' | 'II'; expansion: 'base' | 'pok'; phase: 'status' | 'action' | 'agenda'; summary: string }`; registry key `content.publicObjectives`; the prop name `publicObjectives` on MenuSheet, ReferenceBrowser, and StatusChecklist.

Note: after this task StatusChecklist lists all 40 objectives as scorable. Task 6 narrows that to revealed ones — that is the intended sequence, not a regression to fix here.

- [ ] **Step 1: Write the failing tests**

Append inside `describe('content registry', ...)` in `src/content/content.test.ts`:

```ts
it('exposes the full 40-card public objective deck (20 Stage I + 20 Stage II)', () => {
  expect(content.publicObjectives).toHaveLength(40)
  expect(content.publicObjectives.filter((o) => o.stage === 'I')).toHaveLength(20)
  expect(content.publicObjectives.filter((o) => o.stage === 'II')).toHaveLength(20)
})

it('splits each stage evenly between base and PoK', () => {
  for (const stage of ['I', 'II'] as const) {
    const inStage = content.publicObjectives.filter((o) => o.stage === stage)
    expect(inStage.filter((o) => o.expansion === 'base')).toHaveLength(10)
    expect(inStage.filter((o) => o.expansion === 'pok')).toHaveLength(10)
  }
})

it('keeps stage and points in lockstep, and scores every public in the status phase', () => {
  for (const o of content.publicObjectives) {
    expect(o.points).toBe(o.stage === 'I' ? 1 : 2)
    expect(o.phase).toBe('status')
  }
})

it('has unique public objective ids', () => {
  const ids = content.publicObjectives.map((o) => o.id)
  expect(new Set(ids).size).toBe(ids.length)
})

it('still includes the objectives the old stub carried', () => {
  const ids = new Set(content.publicObjectives.map((o) => o.id))
  for (const id of ['diversify-research', 'develop-weaponry', 'lead-from-the-front']) expect(ids.has(id)).toBe(true)
})
```

Add a schema test to the same file. First add this import at the top of `src/content/content.test.ts`, below the existing `import { content, getFaction } from './index'` line:

```ts
import { objectiveSchema } from './schema'
```

and this test:

```ts
it('rejects an objective whose stage and points disagree', () => {
  const bad = { id: 'x', name: 'X', points: 2, stage: 'I', expansion: 'base', phase: 'status', summary: 'y' }
  expect(objectiveSchema.safeParse(bad).success).toBe(false)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- content.test`
Expected: FAIL — `content.publicObjectives` is undefined and the schema has no `stage`/`expansion`.

- [ ] **Step 3: Extend the objective schema**

In `src/content/schema.ts`, replace the `objectiveSchema` block with:

```ts
export const objectiveSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    points: z.number().int().min(1).max(2),
    stage: z.enum(['I', 'II']),
    expansion: z.enum(['base', 'pok']),
    phase: z.enum(['status', 'action', 'agenda']),
    summary: z.string(),
  })
  .refine((o) => o.points === (o.stage === 'I' ? 1 : 2), {
    message: 'Stage I objectives are worth 1 point and Stage II objectives 2',
    path: ['points'],
  })
export type Objective = z.infer<typeof objectiveSchema>
```

- [ ] **Step 4: Create the catalog**

Create `src/content/publicObjectives.ts`:

```ts
import type { Objective } from './schema'

export const publicObjectives: Objective[] = [
  // ── Stage I · base ──
  { id: 'corner-the-market', name: 'Corner the Market', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'Hold 4 planets that all share one trait.' },
  { id: 'develop-weaponry', name: 'Develop Weaponry', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'Have researched any 2 unit upgrades.' },
  { id: 'diversify-research', name: 'Diversify Research', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'Hold a pair of techs in each of 2 different colors.' },
  { id: 'erect-a-monument', name: 'Erect a Monument', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'Pay out 8 resources.' },
  { id: 'expand-borders', name: 'Expand Borders', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'Hold 6 planets located outside home systems.' },
  { id: 'found-research-outposts', name: 'Found Research Outposts', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'Hold 3 planets bearing tech specialties.' },
  { id: 'intimidate-council', name: 'Intimidate Council', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'Keep ships in 2 separate systems next to Mecatol Rex.' },
  { id: 'lead-from-the-front', name: 'Lead From the Front', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'Use up 3 command tokens drawn from tactic, strategy, or both.' },
  { id: 'negotiate-trade-routes', name: 'Negotiate Trade Routes', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'Pay out 5 trade goods.' },
  { id: 'sway-the-council', name: 'Sway the Council', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'Pay out 8 influence.' },

  // ── Stage I · PoK ──
  { id: 'amass-wealth', name: 'Amass Wealth', points: 1, stage: 'I', expansion: 'pok', phase: 'status', summary: 'Pay 3 each of influence, resources, and trade goods.' },
  { id: 'build-defenses', name: 'Build Defenses', points: 1, stage: 'I', expansion: 'pok', phase: 'status', summary: 'Own at least 4 structures.' },
  { id: 'discover-lost-outposts', name: 'Discover Lost Outposts', points: 1, stage: 'I', expansion: 'pok', phase: 'status', summary: 'Hold 2 planets carrying attachment cards.' },
  { id: 'engineer-a-marvel', name: 'Engineer a Marvel', points: 1, stage: 'I', expansion: 'pok', phase: 'status', summary: 'Get your flagship, or a war sun, onto the board.' },
  { id: 'explore-deep-space', name: 'Explore Deep Space', points: 1, stage: 'I', expansion: 'pok', phase: 'status', summary: 'Station units across 3 planetless systems.' },
  { id: 'improve-infrastructure', name: 'Improve Infrastructure', points: 1, stage: 'I', expansion: 'pok', phase: 'status', summary: 'Build on 3 planets away from your home system.' },
  { id: 'make-history', name: 'Make History', points: 1, stage: 'I', expansion: 'pok', phase: 'status', summary: 'Station units in 2 systems holding an anomaly, a legendary planet, or Mecatol Rex.' },
  { id: 'populate-the-outer-rim', name: 'Populate the Outer Rim', points: 1, stage: 'I', expansion: 'pok', phase: 'status', summary: 'Station units in 3 board-edge systems that are not your home.' },
  { id: 'push-boundaries', name: 'Push Boundaries', points: 1, stage: 'I', expansion: 'pok', phase: 'status', summary: 'Out-planet 2 of your neighbors — hold more than each of them.' },
  { id: 'raise-a-fleet', name: 'Raise a Fleet', points: 1, stage: 'I', expansion: 'pok', phase: 'status', summary: 'Mass 5 or more non-fighter ships together in one system.' },

  // ── Stage II · base ──
  { id: 'centralize-galactic-trade', name: 'Centralize Galactic Trade', points: 2, stage: 'II', expansion: 'base', phase: 'status', summary: 'Pay out 10 trade goods.' },
  { id: 'conquer-the-weak', name: 'Conquer the Weak', points: 2, stage: 'II', expansion: 'base', phase: 'status', summary: 'Hold a planet inside someone else\'s home system.' },
  { id: 'form-galactic-brain-trust', name: 'Form Galactic Brain Trust', points: 2, stage: 'II', expansion: 'base', phase: 'status', summary: 'Hold 5 planets bearing tech specialties.' },
  { id: 'found-a-golden-age', name: 'Found a Golden Age', points: 2, stage: 'II', expansion: 'base', phase: 'status', summary: 'Pay out 16 resources.' },
  { id: 'galvanize-the-people', name: 'Galvanize the People', points: 2, stage: 'II', expansion: 'base', phase: 'status', summary: 'Use up 6 command tokens drawn from tactic, strategy, or both.' },
  { id: 'manipulate-galactic-law', name: 'Manipulate Galactic Law', points: 2, stage: 'II', expansion: 'base', phase: 'status', summary: 'Pay out 16 influence.' },
  { id: 'master-the-sciences', name: 'Master the Sciences', points: 2, stage: 'II', expansion: 'base', phase: 'status', summary: 'Hold a pair of techs in each of all 4 colors.' },
  { id: 'revolutionize-warfare', name: 'Revolutionize Warfare', points: 2, stage: 'II', expansion: 'base', phase: 'status', summary: 'Have researched any 3 unit upgrades.' },
  { id: 'subdue-the-galaxy', name: 'Subdue the Galaxy', points: 2, stage: 'II', expansion: 'base', phase: 'status', summary: 'Hold 11 planets located outside home systems.' },
  { id: 'unify-the-colonies', name: 'Unify the Colonies', points: 2, stage: 'II', expansion: 'base', phase: 'status', summary: 'Hold 6 planets that all share one trait.' },

  // ── Stage II · PoK ──
  { id: 'achieve-supremacy', name: 'Achieve Supremacy', points: 2, stage: 'II', expansion: 'pok', phase: 'status', summary: 'Park your flagship or a war sun in Mecatol Rex\'s system or a rival\'s home system.' },
  { id: 'become-a-legend', name: 'Become a Legend', points: 2, stage: 'II', expansion: 'pok', phase: 'status', summary: 'Station units in 4 systems holding an anomaly, a legendary planet, or Mecatol Rex.' },
  { id: 'command-an-armada', name: 'Command an Armada', points: 2, stage: 'II', expansion: 'pok', phase: 'status', summary: 'Mass 8 or more non-fighter ships together in one system.' },
  { id: 'construct-massive-cities', name: 'Construct Massive Cities', points: 2, stage: 'II', expansion: 'pok', phase: 'status', summary: 'Own at least 7 structures.' },
  { id: 'control-the-borderlands', name: 'Control the Borderlands', points: 2, stage: 'II', expansion: 'pok', phase: 'status', summary: 'Station units in 5 board-edge systems that are not your home.' },
  { id: 'hold-vast-reserves', name: 'Hold Vast Reserves', points: 2, stage: 'II', expansion: 'pok', phase: 'status', summary: 'Pay 6 each of influence, resources, and trade goods.' },
  { id: 'patrol-vast-territories', name: 'Patrol Vast Territories', points: 2, stage: 'II', expansion: 'pok', phase: 'status', summary: 'Station units across 5 planetless systems.' },
  { id: 'protect-the-border', name: 'Protect the Border', points: 2, stage: 'II', expansion: 'pok', phase: 'status', summary: 'Build on 5 planets away from your home system.' },
  { id: 'reclaim-ancient-monuments', name: 'Reclaim Ancient Monuments', points: 2, stage: 'II', expansion: 'pok', phase: 'status', summary: 'Hold 3 planets carrying attachment cards.' },
  { id: 'rule-distant-lands', name: 'Rule Distant Lands', points: 2, stage: 'II', expansion: 'pok', phase: 'status', summary: 'Hold 2 planets, each in or beside a different rival\'s home system.' },
]
```

Then delete `src/content/objectives.ts`.

- [ ] **Step 5: Rename the registry key**

In `src/content/index.ts`, change the import line `import { objectives } from './objectives'` to:

```ts
import { publicObjectives } from './publicObjectives'
```

and change the registry entry `objectives: z.array(objectiveSchema).parse(objectives),` to:

```ts
  publicObjectives: z.array(objectiveSchema).parse(publicObjectives),
```

- [ ] **Step 6: Rename the prop through the component chain**

In `src/App.svelte`, change the StatusChecklist line to:

```svelte
      <StatusChecklist state={gameState} publicObjectives={content.publicObjectives} onAction={(a) => store?.dispatch(a)} />
```

and in the `<MenuSheet ... />` block change `objectives={content.objectives}` to:

```svelte
    publicObjectives={content.publicObjectives}
```

In `src/lib/components/MenuSheet.svelte`: in the `Props` interface change `objectives: Objective[]` to `publicObjectives: Objective[]`; in the destructure change `objectives,` to `publicObjectives,`; and in the template change `<ReferenceBrowser {factions} {technologies} {strategyCards} {objectives} {planets} />` to:

```svelte
        <ReferenceBrowser {factions} {technologies} {strategyCards} {publicObjectives} {planets} />
```

In `src/lib/components/ReferenceBrowser.svelte`: in the `Props` interface change `objectives: Objective[]` to `publicObjectives: Objective[]`; in the destructure change `objectives,` to `publicObjectives,`; and in the `kind === 'objective'` branch change `objectives.map(...)` to `publicObjectives.map(...)`.

In `src/lib/components/StatusChecklist.svelte`: in the `Props` interface change `objectives: Objective[]` to `publicObjectives: Objective[]`; in the destructure change `objectives,` to `publicObjectives,`; and change the `unscored` derived to:

```ts
  const unscored = $derived(publicObjectives.filter((o) => !gameState.scoredPublicObjectiveIds.includes(o.id)))
```

- [ ] **Step 7: Update the three component-test fixtures**

In `src/lib/components/StatusChecklist.svelte.test.ts`, replace the `objectives` fixture with:

```ts
const publicObjectives: Objective[] = [
  { id: 'obj-a', name: 'Diversify Research', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'Own 2 techs in 2 colors.' },
]
```

and in all three `render(...)` calls in that file change `props: { state: state(), objectives, onAction }` to `props: { state: state(), publicObjectives, onAction }`.

In `src/lib/components/ReferenceBrowser.svelte.test.ts`, replace the `objectives` fixture with:

```ts
const publicObjectives: Objective[] = [{ id: 'o1', name: 'Diversify Research', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'Own techs.' }]
```

and in all four `render(...)` calls change `objectives,` to `publicObjectives,` inside the props object.

In `src/lib/components/MenuSheet.svelte.test.ts`, change `objectives: [],` to `publicObjectives: [],` in the props object.

- [ ] **Step 8: Run tests + check, verify green**

Run: `npm test -- content.test` → Expected: PASS
Run: `npm test` → Expected: all pass
Run: `npm run check` → Expected: 0 errors, 0 warnings

- [ ] **Step 9: Commit**

```bash
git add src/content src/App.svelte src/lib/components
git commit -m "feat: full 40-card public objective deck + publicObjectives rename"
```

---

## Task 2: New state fields + legacy-save migration

**Files:**
- Modify: `src/domain/types.ts` (GameState)
- Modify: `src/domain/initialState.ts`
- Modify: `src/persistence/storage.ts`
- Test: `src/persistence/storage.test.ts`
- Test: `src/domain/initialState.test.ts`

**Interfaces:**
- Produces: `GameState.revealedPublicObjectiveIds: string[]` and `GameState.scoredPublicThisRound: boolean`, both seeded by `createInitialState` (`[]` / `false`); `withStateDefaults(raw: Partial<GameState>): GameState` exported from `src/persistence/storage.ts` and applied inside both `loadGame` and `importGame`.

- [ ] **Step 1: Write the failing tests**

Append inside `describe('persistence', ...)` in `src/persistence/storage.test.ts`:

```ts
it('fills defaults for fields missing from a legacy save on load', async () => {
  const legacy = { ...state() } as Record<string, unknown>
  delete legacy.revealedPublicObjectiveIds
  delete legacy.scoredPublicThisRound
  await saveGame('legacy-1', legacy as never)
  const loaded = await loadGame('legacy-1')
  expect(loaded?.revealedPublicObjectiveIds).toEqual([])
  expect(loaded?.scoredPublicThisRound).toBe(false)
})

it('fills defaults for fields missing from a legacy import', () => {
  const legacy = { ...state() } as Record<string, unknown>
  delete legacy.revealedPublicObjectiveIds
  delete legacy.scoredPublicThisRound
  const imported = importGame(JSON.stringify(legacy))
  expect(imported.revealedPublicObjectiveIds).toEqual([])
  expect(imported.scoredPublicThisRound).toBe(false)
})

it('does not clobber values that are present', () => {
  const s = { ...state(), revealedPublicObjectiveIds: ['corner-the-market'], scoredPublicThisRound: true }
  const imported = importGame(exportGame(s))
  expect(imported.revealedPublicObjectiveIds).toEqual(['corner-the-market'])
  expect(imported.scoredPublicThisRound).toBe(true)
})
```

Append inside the existing `describe` in `src/domain/initialState.test.ts`:

```ts
it('seeds the public-objective tracking fields', () => {
  const s = createInitialState(faction, { turnOrder: 1, speaker: false })
  expect(s.revealedPublicObjectiveIds).toEqual([])
  expect(s.scoredPublicThisRound).toBe(false)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- storage.test initialState.test`
Expected: FAIL — the fields do not exist and loaded legacy saves return `undefined` for them.

- [ ] **Step 3: Add the state fields**

In `src/domain/types.ts`, inside the `GameState` type, add these two lines immediately after `scoredPublicObjectiveIds: string[]`:

```ts
  revealedPublicObjectiveIds: string[]
  scoredPublicThisRound: boolean
```

In `src/domain/initialState.ts`, add these two lines immediately after `scoredPublicObjectiveIds: [],`:

```ts
    revealedPublicObjectiveIds: [],
    scoredPublicThisRound: false,
```

- [ ] **Step 4: Add the migration and apply it**

In `src/persistence/storage.ts`, add this exported function immediately after the `db()` function:

```ts
// Saves written before a field existed load as `undefined`; fill them so older
// games keep working instead of crashing on a missing array.
export function withStateDefaults(raw: Partial<GameState>): GameState {
  return {
    ...(raw as GameState),
    revealedPublicObjectiveIds: raw.revealedPublicObjectiveIds ?? [],
    scoredPublicThisRound: raw.scoredPublicThisRound ?? false,
  }
}
```

Replace the body of `loadGame` with:

```ts
export async function loadGame(id: string): Promise<GameState | undefined> {
  const raw = (await (await db()).get(STORE, id)) as Partial<GameState> | undefined
  return raw ? withStateDefaults(raw) : undefined
}
```

and replace the `return parsed` line at the end of `importGame` with:

```ts
  return withStateDefaults(parsed)
```

(also change `const parsed = JSON.parse(json) as GameState` to `const parsed = JSON.parse(json) as Partial<GameState>` so the validation guard and the defaulting agree on the type).

- [ ] **Step 5: Run tests + check, verify green**

Run: `npm test -- storage.test initialState.test` → Expected: PASS
Run: `npm test` → Expected: all pass
Run: `npm run check` → Expected: 0 errors, 0 warnings

- [ ] **Step 6: Commit**

```bash
git add src/domain/types.ts src/domain/initialState.ts src/domain/initialState.test.ts src/persistence/storage.ts src/persistence/storage.test.ts
git commit -m "feat: reveal + scoring-window state with legacy-save defaults"
```

---

## Task 3: Reveal action, scoring flag, round reset

**Files:**
- Modify: `src/domain/types.ts` (GameAction union)
- Modify: `src/state/reducers.ts`
- Test: `src/state/reducers.test.ts`

**Interfaces:**
- Consumes: `revealedPublicObjectiveIds`, `scoredPublicThisRound` (Task 2).
- Produces: `GameAction` variant `{ type: 'revealPublicObjective'; objectiveId: string; name: string }` — appends the id, idempotent (returns the same state reference when already revealed), logs `Revealed <name>`. `scorePublicObjective` additionally sets `scoredPublicThisRound: true`. Round rollover in `advancePhase` resets it to `false`.

- [ ] **Step 1: Write the failing tests**

Append inside `describe('applyAction', ...)` in `src/state/reducers.test.ts`:

```ts
it('revealPublicObjective records the id, logs, and is idempotent', () => {
  const s1 = applyAction(base(), { type: 'revealPublicObjective', objectiveId: 'corner-the-market', name: 'Corner the Market' })
  expect(s1.revealedPublicObjectiveIds).toContain('corner-the-market')
  expect(s1.log.at(-1)?.summary).toBe('Revealed Corner the Market')
  const s2 = applyAction(s1, { type: 'revealPublicObjective', objectiveId: 'corner-the-market', name: 'Corner the Market' })
  expect(s2).toBe(s1)
})

it('scorePublicObjective marks this round\'s public window used', () => {
  const s = applyAction(base(), { type: 'scorePublicObjective', objectiveId: 'obj-a', points: 1 })
  expect(s.scoredPublicThisRound).toBe(true)
})

it('advancePhase clears the public scoring window on round rollover', () => {
  const s = applyAction(base({ phase: 'status', scoredPublicThisRound: true, custodiansTaken: false }), { type: 'advancePhase' })
  expect(s.phase).toBe('strategy')
  expect(s.scoredPublicThisRound).toBe(false)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- reducers.test`
Expected: FAIL — no `revealPublicObjective` case, and `scoredPublicThisRound` is never set or cleared.

- [ ] **Step 3: Add the action variant**

In `src/domain/types.ts`, add to the `GameAction` union immediately after the `scorePublicObjective` line:

```ts
  | { type: 'revealPublicObjective'; objectiveId: string; name: string }
```

- [ ] **Step 4: Add the reducer case and the flag updates**

In `src/state/reducers.ts`, add this case immediately before `case 'advancePhase': {`:

```ts
    case 'revealPublicObjective': {
      if (state.revealedPublicObjectiveIds.includes(action.objectiveId)) return state
      return {
        ...state,
        revealedPublicObjectiveIds: [...state.revealedPublicObjectiveIds, action.objectiveId],
        log: log(state, `Revealed ${action.name}`),
      }
    }
```

In the existing `case 'scorePublicObjective'`, add `scoredPublicThisRound: true,` to the returned object (immediately after the `scoredPublicObjectiveIds: [...]` line).

In the existing `case 'advancePhase'`, add this line to the returned object immediately after the `passed: next === 'strategy' ? false : state.passed,` line:

```ts
        scoredPublicThisRound: enteringNewRound ? false : state.scoredPublicThisRound,
```

- [ ] **Step 5: Run tests + check, verify green**

Run: `npm test -- reducers.test` → Expected: PASS
Run: `npm run check` → Expected: 0 errors, 0 warnings

- [ ] **Step 6: Commit**

```bash
git add src/domain/types.ts src/state/reducers.ts src/state/reducers.test.ts
git commit -m "feat: revealPublicObjective + per-round public scoring flag"
```

---

## Task 4: Scorable-objectives engine helper

**Files:**
- Create: `src/engine/objectives.ts`
- Modify: `src/engine/index.ts` (re-export)
- Test: `src/engine/objectives.test.ts`

**Interfaces:**
- Consumes: `Objective` (Task 1), `revealedPublicObjectiveIds` (Task 2).
- Produces: `getScorablePublicObjectives(state: GameState, objectives: Objective[]): Objective[]` — returns the revealed-and-not-yet-scored objectives, in catalog order. Exported from `src/engine/index.ts`.

- [ ] **Step 1: Write the failing test**

Create `src/engine/objectives.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getScorablePublicObjectives } from './objectives'
import { createInitialState } from '../domain/initialState'
import type { FactionStartingInfo, GameState } from '../domain/types'
import type { Objective } from '../content/schema'

const faction: FactionStartingInfo = {
  id: 'sol', name: 'Federation of Sol', combatModifier: 0,
  starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], commodities: 2, tradeGoods: 0 },
}
const objectives: Objective[] = [
  { id: 'a', name: 'A', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'a' },
  { id: 'b', name: 'B', points: 2, stage: 'II', expansion: 'pok', phase: 'status', summary: 'b' },
]
function state(overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialState(faction, { turnOrder: 1, speaker: false }), ...overrides }
}
const ids = (s: GameState) => getScorablePublicObjectives(s, objectives).map((o) => o.id)

describe('getScorablePublicObjectives', () => {
  it('returns nothing when nothing is revealed', () => {
    expect(ids(state())).toEqual([])
  })

  it('returns revealed objectives that are not yet scored', () => {
    expect(ids(state({ revealedPublicObjectiveIds: ['a', 'b'] }))).toEqual(['a', 'b'])
  })

  it('drops objectives already scored', () => {
    expect(ids(state({ revealedPublicObjectiveIds: ['a', 'b'], scoredPublicObjectiveIds: ['a'] }))).toEqual(['b'])
  })

  it('ignores a scored id that was never revealed', () => {
    expect(ids(state({ revealedPublicObjectiveIds: ['a'], scoredPublicObjectiveIds: ['b'] }))).toEqual(['a'])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- objectives.test`
Expected: FAIL — `getScorablePublicObjectives` is not defined (module missing).

- [ ] **Step 3: Implement the helper**

Create `src/engine/objectives.ts`:

```ts
import type { GameState } from '../domain/types'
import type { Objective } from '../content/schema'

export function getScorablePublicObjectives(state: GameState, objectives: Objective[]): Objective[] {
  const revealed = new Set(state.revealedPublicObjectiveIds)
  const scored = new Set(state.scoredPublicObjectiveIds)
  return objectives.filter((o) => revealed.has(o.id) && !scored.has(o.id))
}
```

- [ ] **Step 4: Re-export from the engine barrel**

Read `src/engine/index.ts` and add this line alongside the existing exports (keep the existing ones):

```ts
export { getScorablePublicObjectives } from './objectives'
```

- [ ] **Step 5: Run test + check, verify green**

Run: `npm test -- objectives.test` → Expected: PASS
Run: `npm run check` → Expected: 0 errors, 0 warnings

- [ ] **Step 6: Commit**

```bash
git add src/engine/objectives.ts src/engine/objectives.test.ts src/engine/index.ts
git commit -m "feat: getScorablePublicObjectives (revealed minus scored)"
```

---

## Task 5: Status-phase reminders

`getReminders` currently early-returns for any phase other than `action`. This task splits its body into per-phase helpers so the status phase can be served without disturbing the action-phase reminders.

**Files:**
- Modify: `src/engine/reminders.ts`
- Test: `src/engine/reminders.test.ts`

**Interfaces:**
- Consumes: `scoredPublicThisRound`, `victoryPoints`.
- Produces: `getReminders(state: GameState, opts?: { researchableCount?: number; scorablePublicCount?: number; stageTwoScorable?: boolean }): Reminder[]`. New status-phase reminder ids: `scorable-publics`, `public-window-used`, `vp-progress`, `stage-two-available`. The `opts` argument stays optional and backward-compatible, and the existing `researchableCount` behavior in the action phase is unchanged.

- [ ] **Step 1: Write the failing tests**

In `src/engine/reminders.test.ts`, add this helper immediately after the existing `actionPhase` helper:

```ts
function statusPhase(overrides: Partial<GameState> = {}): GameState {
  const s = createInitialState(faction, { turnOrder: 1, speaker: false })
  return { ...s, phase: 'status', ...overrides }
}
```

Then append these tests inside `describe('getReminders', ...)`:

```ts
it('counts the public objectives you could still score this status phase', () => {
  const r = getReminders(statusPhase(), { scorablePublicCount: 2 })
  expect(r.find((x) => x.id === 'scorable-publics')?.text).toContain('2')
  expect(getReminders(statusPhase(), { scorablePublicCount: 0 }).map((x) => x.id)).not.toContain('scorable-publics')
})

it('warns once this round\'s public scoring window is used', () => {
  expect(getReminders(statusPhase({ scoredPublicThisRound: true })).map((x) => x.id)).toContain('public-window-used')
  expect(getReminders(statusPhase({ scoredPublicThisRound: false })).map((x) => x.id)).not.toContain('public-window-used')
})

it('reports victory-point progress in the status phase', () => {
  const vp = getReminders(statusPhase({ victoryPoints: 4 })).find((x) => x.id === 'vp-progress')
  expect(vp?.text).toContain('4')
  expect(vp?.text).toContain('10')
})

it('flags a scorable Stage II objective', () => {
  expect(getReminders(statusPhase(), { stageTwoScorable: true }).map((x) => x.id)).toContain('stage-two-available')
  expect(getReminders(statusPhase()).map((x) => x.id)).not.toContain('stage-two-available')
})

it('keeps the action phase free of status-phase reminders', () => {
  const ids = getReminders(actionPhase(), { scorablePublicCount: 3 }).map((x) => x.id)
  expect(ids).not.toContain('scorable-publics')
  expect(ids).toContain('fleet-pool')
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- reminders.test`
Expected: FAIL — `getReminders` returns `[]` for the status phase, so none of the new ids appear.

- [ ] **Step 3: Restructure into per-phase helpers and add the status reminders**

In `src/engine/reminders.ts`, replace the whole file with:

```ts
import type { GameState, Reminder } from '../domain/types'

type Opts = { researchableCount?: number; scorablePublicCount?: number; stageTwoScorable?: boolean }

function actionReminders(state: GameState, opts: Opts): Reminder[] {
  const out: Reminder[] = []

  if (state.strategyCardIds.length > 0 && !state.strategyPrimaryUsed) {
    out.push({ id: 'strategy-primary-unused', severity: 'info', text: "You haven't used your strategy card's primary ability yet." })
  }

  if (state.command.tactic === 0) {
    out.push({ id: 'no-tactic-tokens', severity: 'warn', text: 'No tactic tokens left — you cannot take a tactical action. Consider passing.' })
  }

  const exhausted = state.planets.filter((p) => p.exhausted).length
  if (exhausted > 0) {
    out.push({ id: 'exhausted-planets', severity: 'info', text: `${exhausted} planet(s) exhausted; they ready during the Status phase.` })
  }

  out.push({ id: 'fleet-pool', severity: 'info', text: `Fleet pool: ${state.command.fleet} (your non-fighter ship limit per system).` })

  if (state.strategyCardIds.includes(7)) {
    out.push({
      id: 'tech-card',
      severity: 'info',
      text: 'You hold the Technology card: its primary researches one technology (a second costs 6 resources); after you play it, other players may pay 4 resources and a strategy token to research one.',
    })
  }

  const researchable = opts.researchableCount ?? 0
  if (researchable > 0) {
    out.push({
      id: 'researchable',
      severity: 'info',
      text: `${researchable} technolog${researchable === 1 ? 'y is' : 'ies are'} researchable now — use "Research technology".`,
    })
  }

  return out
}

function statusReminders(state: GameState, opts: Opts): Reminder[] {
  const out: Reminder[] = []

  const scorable = opts.scorablePublicCount ?? 0
  if (scorable > 0) {
    out.push({
      id: 'scorable-publics',
      severity: 'info',
      text: `${scorable} revealed public objective${scorable === 1 ? '' : 's'} you haven't scored yet.`,
    })
  }

  if (state.scoredPublicThisRound) {
    out.push({ id: 'public-window-used', severity: 'info', text: 'You already scored a public objective this round.' })
  }

  if (opts.stageTwoScorable) {
    out.push({ id: 'stage-two-available', severity: 'info', text: 'A Stage II objective is available — those are worth 2 victory points.' })
  }

  out.push({ id: 'vp-progress', severity: 'info', text: `${state.victoryPoints} of 10 victory points.` })

  return out
}

export function getReminders(state: GameState, opts: Opts = {}): Reminder[] {
  if (state.phase === 'action') return actionReminders(state, opts)
  if (state.phase === 'status') return statusReminders(state, opts)
  return []
}
```

- [ ] **Step 4: Run tests + check, verify green**

Run: `npm test -- reminders.test` → Expected: PASS (the pre-existing action-phase tests included)
Run: `npm test` → Expected: all pass
Run: `npm run check` → Expected: 0 errors, 0 warnings

- [ ] **Step 5: Commit**

```bash
git add src/engine/reminders.ts src/engine/reminders.test.ts
git commit -m "feat: status-phase reminders (scorable publics, window, VP progress)"
```

---

## Task 6: StatusChecklist reveal picker + revealed-only scoring, and App wiring

**Files:**
- Modify: `src/lib/components/StatusChecklist.svelte`
- Test: `src/lib/components/StatusChecklist.svelte.test.ts`
- Modify: `src/App.svelte`

**Interfaces:**
- Consumes: `getScorablePublicObjectives` (Task 4), `revealPublicObjective` action (Task 3), `getReminders` opts `scorablePublicCount` / `stageTwoScorable` (Task 5), the `publicObjectives` prop (Task 1).
- Produces: StatusChecklist score buttons keep their existing `Score: <name>` label and `scorePublicObjective` payload; reveal buttons are labelled `reveal <name>` via `aria-label`; the reveal search input has placeholder `Reveal a public objective…`.

- [ ] **Step 1: Write the failing tests**

In `src/lib/components/StatusChecklist.svelte.test.ts`, replace the `publicObjectives` fixture and `state` helper with:

```ts
const publicObjectives: Objective[] = [
  { id: 'obj-a', name: 'Diversify Research', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'Own 2 techs in 2 colors.' },
  { id: 'obj-b', name: 'Found a Golden Age', points: 2, stage: 'II', expansion: 'base', phase: 'status', summary: 'Pay out 16 resources.' },
]
const state = (overrides: Partial<GameState> = {}) => ({
  ...createInitialState(faction, { turnOrder: 1, speaker: false }),
  phase: 'status' as const,
  revealedPublicObjectiveIds: ['obj-a'],
  ...overrides,
})
```

Add `GameState` to the type import at the top of the file so it reads:

```ts
import type { FactionStartingInfo, GameState } from '../../domain/types'
```

Then append these tests inside `describe('StatusChecklist', ...)`:

```ts
it('offers only revealed objectives for scoring', () => {
  render(StatusChecklist, { props: { state: state(), publicObjectives, onAction: vi.fn() } })
  expect(screen.getByRole('button', { name: /Score: Diversify Research/ })).toBeTruthy()
  expect(screen.queryByRole('button', { name: /Score: Found a Golden Age/ })).toBeNull()
})

it('reveals an unrevealed objective through the picker', async () => {
  const onAction = vi.fn()
  render(StatusChecklist, { props: { state: state(), publicObjectives, onAction } })
  await fireEvent.click(screen.getByRole('button', { name: /reveal Found a Golden Age/i }))
  expect(onAction).toHaveBeenCalledWith({ type: 'revealPublicObjective', objectiveId: 'obj-b', name: 'Found a Golden Age' })
})

it('groups revealed objectives by stage', () => {
  render(StatusChecklist, { props: { state: state({ revealedPublicObjectiveIds: ['obj-a', 'obj-b'] }), publicObjectives, onAction: vi.fn() } })
  expect(screen.getByText('Stage I')).toBeTruthy()
  expect(screen.getByText('Stage II')).toBeTruthy()
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- StatusChecklist`
Expected: FAIL — every objective is still offered for scoring, and there is no reveal picker or stage heading.

- [ ] **Step 3: Rework the scoring section of StatusChecklist**

In `src/lib/components/StatusChecklist.svelte`, replace the `unscored` derived line with:

```ts
  const revealed = $derived(publicObjectives.filter((o) => gameState.revealedPublicObjectiveIds.includes(o.id)))
  const stageGroups = $derived(
    (['I', 'II'] as const)
      .map((stage) => ({ stage, objectives: revealed.filter((o) => o.stage === stage) }))
      .filter((g) => g.objectives.length > 0),
  )

  let revealQuery = $state('')
  const revealMatches = $derived(
    publicObjectives
      .filter((o) => !gameState.revealedPublicObjectiveIds.includes(o.id) && o.name.toLowerCase().includes(revealQuery.toLowerCase()))
      .slice(0, 8),
  )
  function reveal(o: Objective) {
    onAction({ type: 'revealPublicObjective', objectiveId: o.id, name: o.name })
    revealQuery = ''
  }
```

Then replace the scoring block in the template (the `<ExpandableItem title="Score a public objective" .../>` line together with the `{#each unscored ...}` loop and the `{#if unscored.length === 0}` line) with:

```svelte
<ExpandableItem title="Score a public objective" summary="If you qualify, claim 1 revealed public objective for VP." detail="Once per status phase you may score a single public objective you meet the requirement for. Only objectives the table has revealed are listed; reveal more below." />
{#each stageGroups as g (g.stage)}
  <h4 style="font-weight:500;margin-top:10px;">Stage {g.stage}</h4>
  {#each g.objectives as o (o.id)}
    {@const scored = gameState.scoredPublicObjectiveIds.includes(o.id)}
    <button
      onclick={() => scorePublic(o)}
      style="display:block;width:100%;text-align:left;margin:4px 0;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:{scored ? 'var(--surface-2)' : 'var(--surface)'};color:{scored ? 'var(--text-muted)' : 'var(--text)'};cursor:pointer;"
    >{scored ? '✓ ' : ''}Score: {o.name} (+{o.points})</button>
  {/each}
{/each}
{#if stageGroups.length === 0}<p style="color:var(--text-muted);font-size:14px;">No public objectives revealed yet — reveal one below.</p>{/if}

<input placeholder="Reveal a public objective…" bind:value={revealQuery} style="width:100%;padding:8px;margin-top:8px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--text);" />
{#each revealMatches as o (o.id)}
  <button onclick={() => reveal(o)} aria-label={`reveal ${o.name}`} style="display:block;width:100%;text-align:left;margin:4px 0;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">+ {o.name} (Stage {o.stage}, +{o.points})</button>
{/each}
```

- [ ] **Step 4: Run the component test, verify green**

Run: `npm test -- StatusChecklist` → Expected: PASS

- [ ] **Step 5: Wire App.svelte**

In `src/App.svelte`:

(a) change the engine import line to:

```ts
  import { getAvailableActions, getReminders, getResearchableTechs, getScorablePublicObjectives } from './engine/index'
```

(b) replace the `reminders` derived line with these three lines:

```ts
  const scorablePublics = $derived(gameState ? getScorablePublicObjectives(gameState, content.publicObjectives) : [])
  const stageTwoScorable = $derived(scorablePublics.some((o) => o.stage === 'II'))
  const reminders = $derived(
    gameState
      ? getReminders(gameState, { researchableCount: researchableIds.size, scorablePublicCount: scorablePublics.length, stageTwoScorable })
      : [],
  )
```

- [ ] **Step 6: Run the full suite, check, and build**

Run: `npm test` → Expected: all pass
Run: `npm run check` → Expected: 0 errors, 0 warnings
Run: `npm run build` → Expected: success

- [ ] **Step 7: Commit**

```bash
git add src/lib/components/StatusChecklist.svelte src/lib/components/StatusChecklist.svelte.test.ts src/App.svelte
git commit -m "feat: reveal picker + revealed-only public scoring, wired to reminders"
```

---

## Task 7: Grouped objectives reference

**Files:**
- Modify: `src/lib/components/ReferenceBrowser.svelte`
- Test: `src/lib/components/ReferenceBrowser.svelte.test.ts`

**Interfaces:**
- Consumes: `Objective` fields `stage`, `expansion`, `points` (Task 1).
- Produces: the Objectives tab renders `Stage I` and `Stage II` headers, Stage I first, each entry's detail tagged with points and expansion.

- [ ] **Step 1: Write the failing test**

In `src/lib/components/ReferenceBrowser.svelte.test.ts`, replace the `publicObjectives` fixture with:

```ts
const publicObjectives: Objective[] = [
  { id: 'o1', name: 'Diversify Research', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'Own techs.' },
  { id: 'o2', name: 'Found a Golden Age', points: 2, stage: 'II', expansion: 'base', phase: 'status', summary: 'Pay out 16 resources.' },
]
```

and append this test inside `describe('ReferenceBrowser', ...)`:

```ts
it('groups the objectives tab by stage', async () => {
  render(ReferenceBrowser, { props: { factions, technologies, strategyCards, publicObjectives, planets } })
  await fireEvent.click(screen.getByRole('button', { name: /Objectives/ }))
  expect(screen.getByText('Stage I')).toBeTruthy()
  expect(screen.getByText('Stage II')).toBeTruthy()
  expect(screen.getByText('Diversify Research')).toBeTruthy()
  expect(screen.getByText('Found a Golden Age')).toBeTruthy()
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- ReferenceBrowser`
Expected: FAIL — no `Stage I` / `Stage II` headers are rendered.

- [ ] **Step 3: Implement grouped rendering**

In `src/lib/components/ReferenceBrowser.svelte`, change the `kind === 'objective'` branch of the `all` ternary so it returns an empty list (objectives no longer flow through the flat path):

```ts
            ? []
```

Then add this derived immediately after the existing `techGroups` derived:

```ts
  const objectiveGroups = $derived(
    (['I', 'II'] as const)
      .map((stage) => ({
        key: stage,
        label: `Stage ${stage}`,
        entries: publicObjectives
          .filter((o) => o.stage === stage && o.name.toLowerCase().includes(q.toLowerCase()))
          .map((o) => ({
            id: o.id,
            title: o.name,
            summary: o.summary,
            detail: `${o.points} VP · Stage ${o.stage} · ${o.expansion.toUpperCase()}\n${o.summary}`,
          })),
      }))
      .filter((g) => g.entries.length > 0),
  )
```

In the template, change the opening of the grouped block from `{#if kind === 'tech'}` to a three-way branch by replacing that line with:

```svelte
{#if kind === 'objective'}
  {#each objectiveGroups as g (g.key)}
    <h4 style="font-weight:500;margin-top:12px;">{g.label}</h4>
    {#each g.entries as e (e.id)}
      <ExpandableItem title={e.title} summary={e.summary} detail={e.detail} />
    {/each}
  {/each}
  {#if objectiveGroups.length === 0}<p style="color:var(--text-muted);font-size:14px;">No matches.</p>{/if}
{:else if kind === 'tech'}
```

(the rest of the existing tech block and the final `{:else}` flat block stay exactly as they are).

- [ ] **Step 4: Run the full suite, check, and build**

Run: `npm test -- ReferenceBrowser` → Expected: PASS
Run: `npm test` → Expected: all pass
Run: `npm run check` → Expected: 0 errors, 0 warnings
Run: `npm run build` → Expected: success

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/ReferenceBrowser.svelte src/lib/components/ReferenceBrowser.svelte.test.ts
git commit -m "feat: group the objectives reference by stage"
```

---

## Done criteria

- All 40 base + PoK public objectives in `publicObjectives.ts`, stage↔points enforced by the schema, summaries in our own words.
- `content.objectives` renamed to `content.publicObjectives` throughout the prop chain.
- `revealedPublicObjectiveIds` + `scoredPublicThisRound` in state, seeded at init, defaulted for legacy saves on both load and import.
- `revealPublicObjective` action logs and is idempotent; scoring marks the round's window; round rollover clears it.
- Status phase reminds: scorable count, window used, Stage II available, VP toward 10 — with action-phase reminders unchanged.
- StatusChecklist scores from revealed objectives only, grouped by stage, with a reveal picker.
- Reference Objectives tab grouped by stage.
- `npm test` green, `npm run check` 0/0, `npm run build` OK.
