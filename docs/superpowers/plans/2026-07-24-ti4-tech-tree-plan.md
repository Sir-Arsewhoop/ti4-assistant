# Full Generic Tech Tree Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the generic (base + PoK) technology catalog and make the assistant tech-aware — show which technologies are researchable now and let the player research one via a logged, undoable action.

**Architecture:** Data lives in `src/content/technologies.ts` (Zod-validated). A new pure engine module `src/engine/research.ts` computes researchable-now from owned techs + readied specialty planets. A new `researchTechnology` reducer action grants + logs. `getAvailableActions` offers a `'research'` trigger; `App.svelte` opens a presentational `ResearchPicker` and dispatches. `getReminders` gains a Technology-card reminder and a researchable-count reminder. Existing boundaries hold: engine pure (type-only content import), reducers pure + logging, components presentational, wiring only in `App.svelte`.

**Tech Stack:** Vite + Svelte 5 (runes), TypeScript, Zod, Vitest, @testing-library/svelte.

## Global Constraints

- `npm run check` must report **0 errors / 0 warnings** (svelte-check); `npm test` green; `npm run build` OK — run all three before the final commit of any task that touches `.svelte`.
- Svelte 5 runes. A prop literally named `state` collides with the `$state` rune — alias it: `let { state: gameState } = $props()`.
- All game data lives in `src/content/` as data files. Never hardcode game data in components.
- Ability/effect summaries are authored in **our own words — never verbatim card text** (copyright). Unit stat lines (Cost/Combat/Move) are facts and may be stated plainly.
- Engine (`src/engine/`) stays pure: no Svelte, no runtime content imports. Type-only imports (`import type { Technology }`) are allowed.
- Store / engine / persistence wiring lives **only** in `App.svelte`. Components are presentational (props + callbacks).
- `state/reducers.ts` stays a pure reducer: clamp, idempotent, append one log entry.
- Every content file has a Zod schema + a validation test.
- Tech color icons: an **ability** tech provides one icon of its own `color`; a **unit-upgrade** tech (`color: 'none'`) provides no icon. Prerequisites are a multiset of colors.

## Verified source data (AsyncTI4 `data/technologies/pok.json`, codex Ω/ΩΩ excluded)

Full generic catalog = **33** technologies: 24 abilities (6 per color) + 9 unit upgrades. Base = 25, PoK = 8.
PoK techs: `dark-energy-tap, sling-relay, psychoarchaeology, bio-stims, scanlink-drone-network, predictive-intelligence, ai-development-algorithm, self-assembly-routines`. All others base.

**Correction vs current file:** `self-assembly-routines` requires **1 red** (`['red']`) — the current `[]` was wrong. `scanlink-drone-network` (none) and `magen-defense-grid` (`['red']`) are confirmed correct; drop their `// verify prereq` comments. Component actions (`hasAction: true`) exist only on `sling-relay` and `x-89-bacterial-weapon`.

---

## Task 1: Complete, typed tech catalog

Adds `type` + `expansion` to the schema and completes the catalog to all 33 generic techs. Bundled as one task because adding required schema fields forces the content and the two test fixtures to update together to keep the suite green.

**Files:**
- Modify: `src/content/schema.ts` (technologySchema)
- Modify: `src/content/technologies.ts` (full rewrite: 33 entries)
- Modify: `src/lib/components/BoardEditor.svelte.test.ts:12-14` (fixture)
- Modify: `src/lib/components/ReferenceBrowser.svelte.test.ts:10-12` (fixture)
- Test: `src/content/content.test.ts` (new tech assertions)

**Interfaces:**
- Produces: `Technology = { id: string; name: string; color: 'blue'|'green'|'yellow'|'red'|'none'; type: 'ability'|'unit-upgrade'; expansion: 'base'|'pok'; prerequisites: ('blue'|'green'|'yellow'|'red')[]; summary: string; hasAction: boolean }`

- [ ] **Step 1: Write the failing tests**

Append inside the `describe('content registry', ...)` block in `src/content/content.test.ts`:

```ts
it('exposes the full 33-tech generic catalog (25 base + 8 PoK, 24 abilities + 9 unit upgrades)', () => {
  expect(content.technologies).toHaveLength(33)
  expect(content.technologies.filter((t) => t.expansion === 'base')).toHaveLength(25)
  expect(content.technologies.filter((t) => t.expansion === 'pok')).toHaveLength(8)
  expect(content.technologies.filter((t) => t.type === 'ability')).toHaveLength(24)
  expect(content.technologies.filter((t) => t.type === 'unit-upgrade')).toHaveLength(9)
})

it('keeps unit-upgrade and colorless in lockstep, and abilities colored', () => {
  for (const t of content.technologies) {
    if (t.type === 'unit-upgrade') expect(t.color).toBe('none')
    else expect(t.color).not.toBe('none')
  }
})

it('has unique tech ids', () => {
  const ids = content.technologies.map((t) => t.id)
  expect(new Set(ids).size).toBe(ids.length)
})

it('carries the corrected/spot-checked prerequisites', () => {
  const byId = new Map(content.technologies.map((t) => [t.id, t]))
  expect(byId.get('self-assembly-routines')!.prerequisites).toEqual(['red'])
  expect(byId.get('scanlink-drone-network')!.prerequisites).toEqual([])
  expect(byId.get('fighter-ii')!.prerequisites).toEqual(['green', 'blue'])
  expect(byId.get('war-sun')!.prerequisites).toEqual(['red', 'red', 'red', 'yellow'])
  expect(byId.get('dreadnought-ii')!.prerequisites).toEqual(['blue', 'blue', 'yellow'])
})

it('flags component actions only on sling-relay and x-89-bacterial-weapon', () => {
  const withAction = content.technologies.filter((t) => t.hasAction).map((t) => t.id).sort()
  expect(withAction).toEqual(['sling-relay', 'x-89-bacterial-weapon'])
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- content.test`
Expected: FAIL — current catalog has 17 techs and no `type`/`expansion` fields.

- [ ] **Step 3: Add the two schema fields**

In `src/content/schema.ts`, replace the `technologySchema` block with:

```ts
export const technologySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.enum(['blue', 'green', 'yellow', 'red', 'none']),
  type: z.enum(['ability', 'unit-upgrade']),
  expansion: z.enum(['base', 'pok']),
  prerequisites: z.array(z.enum(['blue', 'green', 'yellow', 'red'])),
  summary: z.string(),
  hasAction: z.boolean().default(false),
})
export type Technology = z.infer<typeof technologySchema>
```

- [ ] **Step 4: Rewrite the catalog**

Replace the entire contents of `src/content/technologies.ts` with:

```ts
import type { Technology } from './schema'

export const technologies: Technology[] = [
  // ── Propulsion (blue) ──
  { id: 'antimass-deflectors', name: 'Antimass Deflectors', color: 'blue', type: 'ability', expansion: 'base', prerequisites: [], summary: 'Ships may move through asteroid fields; -1 to enemy space cannon vs you.', hasAction: false },
  { id: 'dark-energy-tap', name: 'Dark Energy Tap', color: 'blue', type: 'ability', expansion: 'pok', prerequisites: [], summary: 'After a tactical action in a system with a frontier token and your ships, explore it; your ships may also retreat into empty adjacent systems.', hasAction: false },
  { id: 'gravity-drive', name: 'Gravity Drive', color: 'blue', type: 'ability', expansion: 'base', prerequisites: ['blue'], summary: 'After you activate a system, add +1 to the move value of one of your ships this action.', hasAction: false },
  { id: 'sling-relay', name: 'Sling Relay', color: 'blue', type: 'ability', expansion: 'pok', prerequisites: ['blue'], summary: 'ACTION: Produce 1 ship at a space dock you control.', hasAction: true },
  { id: 'fleet-logistics', name: 'Fleet Logistics', color: 'blue', type: 'ability', expansion: 'base', prerequisites: ['blue', 'blue'], summary: 'Take 2 actions during each of your action-phase turns instead of 1.', hasAction: false },
  { id: 'light-wave-deflector', name: 'Light/Wave Deflector', color: 'blue', type: 'ability', expansion: 'base', prerequisites: ['blue', 'blue', 'blue'], summary: 'Your ships may move through systems that contain other players\' ships.', hasAction: false },

  // ── Biotic (green) ──
  { id: 'neural-motivator', name: 'Neural Motivator', color: 'green', type: 'ability', expansion: 'base', prerequisites: [], summary: 'Draw 2 action cards in the Status phase instead of 1.', hasAction: false },
  { id: 'psychoarchaeology', name: 'Psychoarchaeology', color: 'green', type: 'ability', expansion: 'pok', prerequisites: [], summary: 'Use planets\' tech specialties without exhausting them; during the action phase exhaust specialty planets for 1 trade good each.', hasAction: false },
  { id: 'dacxive-animators', name: 'Dacxive Animators', color: 'green', type: 'ability', expansion: 'base', prerequisites: ['green'], summary: 'After you win a ground combat, place 1 free infantry on that planet.', hasAction: false },
  { id: 'bio-stims', name: 'Bio-Stims', color: 'green', type: 'ability', expansion: 'pok', prerequisites: ['green'], summary: 'Exhaust at end of your turn to ready one of your planets with a tech specialty, or one of your other technologies.', hasAction: false },
  { id: 'hyper-metabolism', name: 'Hyper Metabolism', color: 'green', type: 'ability', expansion: 'base', prerequisites: ['green', 'green'], summary: 'Gain 3 command tokens during the Status phase instead of 2.', hasAction: false },
  { id: 'x-89-bacterial-weapon', name: 'X-89 Bacterial Weapon', color: 'green', type: 'ability', expansion: 'base', prerequisites: ['green', 'green', 'green'], summary: 'ACTION: Exhaust and choose a planet in a system with your bombardment ships to destroy all infantry on it.', hasAction: true },

  // ── Cybernetic (yellow) ──
  { id: 'sarween-tools', name: 'Sarween Tools', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: [], summary: 'Add 1 resource whenever you resolve production at a unit.', hasAction: false },
  { id: 'scanlink-drone-network', name: 'Scanlink Drone Network', color: 'yellow', type: 'ability', expansion: 'pok', prerequisites: [], summary: 'When you activate a system, explore a planet there that contains your units.', hasAction: false },
  { id: 'graviton-laser-system', name: 'Graviton Laser System', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow'], summary: 'Exhaust before your units fire Space Cannon; those hits must be assigned to non-fighter ships.', hasAction: false },
  { id: 'predictive-intelligence', name: 'Predictive Intelligence', color: 'yellow', type: 'ability', expansion: 'pok', prerequisites: ['yellow'], summary: 'Exhaust at end of turn to redistribute your command tokens; or cast 3 extra votes in the agenda phase.', hasAction: false },
  { id: 'transit-diodes', name: 'Transit Diodes', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow', 'yellow'], summary: 'Exhaust at the start of your action-phase turn to move up to 4 of your ground forces to any planets you control.', hasAction: false },
  { id: 'integrated-economy', name: 'Integrated Economy', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow', 'yellow', 'yellow'], summary: 'After you gain control of a planet, immediately produce units there with combined cost up to its resource value.', hasAction: false },

  // ── Warfare (red) ──
  { id: 'plasma-scoring', name: 'Plasma Scoring', color: 'red', type: 'ability', expansion: 'base', prerequisites: [], summary: 'Add 1 die to one bombardment or space cannon roll.', hasAction: false },
  { id: 'ai-development-algorithm', name: 'AI Development Algorithm', color: 'red', type: 'ability', expansion: 'pok', prerequisites: [], summary: 'Exhaust to ignore 1 prerequisite when researching a unit upgrade, or to reduce produced-unit cost by your number of unit upgrades.', hasAction: false },
  { id: 'magen-defense-grid', name: 'Magen Defense Grid', color: 'red', type: 'ability', expansion: 'base', prerequisites: ['red'], summary: 'At the start of ground combat on a planet with your structure, deal 1 hit to enemy ground forces; when a system with your structure is activated, add 1 free infantry there.', hasAction: false },
  { id: 'self-assembly-routines', name: 'Self Assembly Routines', color: 'red', type: 'ability', expansion: 'pok', prerequisites: ['red'], summary: 'After your units use Production, exhaust to place a free mech on a planet you control there; gain 1 trade good when one of your mechs is destroyed.', hasAction: false },
  { id: 'duranium-armor', name: 'Duranium Armor', color: 'red', type: 'ability', expansion: 'base', prerequisites: ['red', 'red'], summary: 'Each combat round, after assigning hits, repair 1 of your damaged units that did not use Sustain Damage that round.', hasAction: false },
  { id: 'assault-cannon', name: 'Assault Cannon', color: 'red', type: 'ability', expansion: 'base', prerequisites: ['red', 'red', 'red'], summary: 'At the start of space combat where you have 3+ non-fighter ships, your opponent must destroy 1 of their non-fighter ships.', hasAction: false },

  // ── Unit upgrades (colorless) ──
  { id: 'infantry-ii', name: 'Infantry II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['green', 'green'], summary: 'Upgraded Infantry — Combat 7; when destroyed, roll a die and on 6+ it returns to your home system next turn.', hasAction: false },
  { id: 'fighter-ii', name: 'Fighter II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['green', 'blue'], summary: 'Upgraded Fighter — Move 2 and may move on its own; excess fighters count against your fleet pool.', hasAction: false },
  { id: 'space-dock-ii', name: 'Space Dock II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['yellow', 'yellow'], summary: 'Upgraded Space Dock — Production equals planet resources + 4; up to 3 fighters here ignore capacity.', hasAction: false },
  { id: 'pds-ii', name: 'PDS II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['red', 'yellow'], summary: 'Upgraded PDS — Space Cannon 5 and may fire into adjacent systems.', hasAction: false },
  { id: 'carrier-ii', name: 'Carrier II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['blue', 'blue'], summary: 'Upgraded Carrier — Move 2 (up from 1), capacity 6.', hasAction: false },
  { id: 'destroyer-ii', name: 'Destroyer II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['red', 'red'], summary: 'Upgraded Destroyer — Combat 8, Anti-Fighter Barrage 6 (x3).', hasAction: false },
  { id: 'cruiser-ii', name: 'Cruiser II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['green', 'yellow', 'red'], summary: 'Upgraded Cruiser — Move 3, Combat 6, capacity 1.', hasAction: false },
  { id: 'dreadnought-ii', name: 'Dreadnought II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['blue', 'blue', 'yellow'], summary: 'Upgraded Dreadnought — Move 2, capacity 1, Sustain Damage; cannot be destroyed by Direct Hit.', hasAction: false },
  { id: 'war-sun', name: 'War Sun', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['red', 'red', 'red', 'yellow'], summary: 'Unlocks War Suns — Combat 3 (x3), Sustain Damage, Bombardment; enemy units in its system lose Planetary Shield.', hasAction: false },
]
```

- [ ] **Step 5: Fix the two component-test fixtures**

In `src/lib/components/BoardEditor.svelte.test.ts`, replace the `technologies` fixture (lines 12-14):

```ts
const technologies: Technology[] = [
  { id: 'plasma-scoring', name: 'Plasma Scoring', color: 'red', type: 'ability', expansion: 'base', prerequisites: [], summary: 'Add 1 die.', hasAction: false },
]
```

In `src/lib/components/ReferenceBrowser.svelte.test.ts`, replace the `technologies` fixture (lines 10-12):

```ts
const technologies: Technology[] = [
  { id: 'plasma-scoring', name: 'Plasma Scoring', color: 'red', type: 'ability', expansion: 'base', prerequisites: [], summary: 'Add 1 die.', hasAction: false },
]
```

- [ ] **Step 6: Run tests + check, verify green**

Run: `npm test -- content.test` → Expected: PASS
Run: `npm test` → Expected: all pass
Run: `npm run check` → Expected: 0 errors, 0 warnings

- [ ] **Step 7: Commit**

```bash
git add src/content/schema.ts src/content/technologies.ts src/content/content.test.ts src/lib/components/BoardEditor.svelte.test.ts src/lib/components/ReferenceBrowser.svelte.test.ts
git commit -m "feat: complete 33-tech generic catalog + type/expansion fields"
```

---

## Task 2: Researchable-now engine

**Files:**
- Create: `src/engine/research.ts`
- Modify: `src/engine/index.ts` (re-export)
- Test: `src/engine/research.test.ts`

**Interfaces:**
- Consumes: `Technology` (Task 1), `GameState`.
- Produces: `getResearchableTechs(state: GameState, technologies: Technology[]): { techId: string; researchable: boolean }[]` — one entry per **unowned** technology; `researchable` true iff its prerequisite multiset fits the available color-icon supply (owned colored techs + readied specialty planets).

- [ ] **Step 1: Write the failing test**

Create `src/engine/research.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getResearchableTechs } from './research'
import { content } from '../content/index'
import { createInitialState } from '../domain/initialState'
import type { FactionStartingInfo, GameState, Planet } from '../domain/types'

const faction: FactionStartingInfo = {
  id: 'sol', name: 'Federation of Sol', combatModifier: 0,
  starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], commodities: 2, tradeGoods: 0 },
}
const techs = content.technologies
function state(overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialState(faction, { turnOrder: 1, speaker: false }), ...overrides }
}
const ready = (s: GameState) => new Set(getResearchableTechs(s, techs).filter((r) => r.researchable).map((r) => r.techId))
const specialty = (color: Planet['techSpecialty'], exhausted: boolean): Planet =>
  ({ id: 'p', name: 'P', resources: 0, influence: 0, exhausted, techSpecialty: color })

describe('getResearchableTechs', () => {
  it('a no-prerequisite tech is researchable from scratch, a 1-blue tech is not', () => {
    const r = ready(state())
    expect(r.has('dark-energy-tap')).toBe(true)
    expect(r.has('gravity-drive')).toBe(false)
  })

  it('owning a blue tech supplies one blue icon and excludes the owned tech', () => {
    const r = ready(state({ technologyIds: ['antimass-deflectors'] }))
    expect(r.has('gravity-drive')).toBe(true)     // needs 1 blue
    expect(r.has('antimass-deflectors')).toBe(false) // already owned → not a candidate
  })

  it('a two-blue tech needs two owned blue techs', () => {
    expect(ready(state({ technologyIds: ['antimass-deflectors'] })).has('fleet-logistics')).toBe(false)
    expect(ready(state({ technologyIds: ['antimass-deflectors', 'gravity-drive'] })).has('fleet-logistics')).toBe(true)
  })

  it('a readied specialty planet supplies an icon; an exhausted one does not', () => {
    expect(ready(state({ planets: [specialty('blue', false)] })).has('gravity-drive')).toBe(true)
    expect(ready(state({ planets: [specialty('blue', true)] })).has('gravity-drive')).toBe(false)
  })

  it('a unit upgrade needs its mixed prerequisites', () => {
    // fighter-ii needs green + blue
    expect(ready(state({ technologyIds: ['neural-motivator', 'antimass-deflectors'] })).has('fighter-ii')).toBe(true)
    expect(ready(state({ technologyIds: ['neural-motivator'] })).has('fighter-ii')).toBe(false)
  })

  it('owning a unit upgrade supplies no icons (colorless)', () => {
    expect(ready(state({ technologyIds: ['carrier-ii'] })).has('gravity-drive')).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- research.test`
Expected: FAIL — `getResearchableTechs` is not defined (module missing).

- [ ] **Step 3: Implement the engine module**

Create `src/engine/research.ts`:

```ts
import type { GameState } from '../domain/types'
import type { Technology } from '../content/schema'

type Color = 'blue' | 'green' | 'yellow' | 'red'
const COLORS: Color[] = ['blue', 'green', 'yellow', 'red']

export function getResearchableTechs(
  state: GameState,
  technologies: Technology[],
): { techId: string; researchable: boolean }[] {
  const owned = new Set(state.technologyIds)

  const supply: Record<Color, number> = { blue: 0, green: 0, yellow: 0, red: 0 }
  for (const t of technologies) {
    if (owned.has(t.id) && t.color !== 'none') supply[t.color]++
  }
  for (const p of state.planets) {
    if (p.techSpecialty && !p.exhausted) supply[p.techSpecialty]++
  }

  return technologies
    .filter((t) => !owned.has(t.id))
    .map((t) => {
      const need: Record<Color, number> = { blue: 0, green: 0, yellow: 0, red: 0 }
      for (const c of t.prerequisites) need[c]++
      const researchable = COLORS.every((c) => supply[c] >= need[c])
      return { techId: t.id, researchable }
    })
}
```

- [ ] **Step 4: Re-export from the engine barrel**

Read `src/engine/index.ts` and add this line alongside the existing exports:

```ts
export { getResearchableTechs } from './research'
```

- [ ] **Step 5: Run test + check, verify green**

Run: `npm test -- research.test` → Expected: PASS
Run: `npm run check` → Expected: 0 errors, 0 warnings

- [ ] **Step 6: Commit**

```bash
git add src/engine/research.ts src/engine/index.ts src/engine/research.test.ts
git commit -m "feat: getResearchableTechs (owned techs + readied specialty planets)"
```

---

## Task 3: researchTechnology action + reducer

**Files:**
- Modify: `src/domain/types.ts` (GameAction union)
- Modify: `src/state/reducers.ts` (new case)
- Test: `src/state/reducers.test.ts`

**Interfaces:**
- Produces: `GameAction` variant `{ type: 'researchTechnology'; techId: string; name: string }`. Reducer appends `techId` to `technologyIds` (idempotent by id) and logs `Researched <name>`; a re-research returns the same state reference.

- [ ] **Step 1: Write the failing test**

Append inside `describe('applyAction', ...)` in `src/state/reducers.test.ts`:

```ts
it('researchTechnology adds the tech, logs, and is idempotent', () => {
  const s1 = applyAction(base(), { type: 'researchTechnology', techId: 'gravity-drive', name: 'Gravity Drive' })
  expect(s1.technologyIds).toContain('gravity-drive')
  expect(s1.log.at(-1)?.summary).toBe('Researched Gravity Drive')
  const s2 = applyAction(s1, { type: 'researchTechnology', techId: 'gravity-drive', name: 'Gravity Drive' })
  expect(s2).toBe(s1) // no-op returns same reference
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- reducers.test`
Expected: FAIL — TypeScript rejects the unknown action type / no `researchTechnology` case.

- [ ] **Step 3: Add the action variant**

In `src/domain/types.ts`, add to the `GameAction` union (after the `removePlanet` line):

```ts
  | { type: 'researchTechnology'; techId: string; name: string }
```

- [ ] **Step 4: Add the reducer case**

In `src/state/reducers.ts`, add before the `case 'editState':` line:

```ts
    case 'researchTechnology': {
      if (state.technologyIds.includes(action.techId)) return state
      return { ...state, technologyIds: [...state.technologyIds, action.techId], log: log(state, `Researched ${action.name}`) }
    }
```

- [ ] **Step 5: Run test + check, verify green**

Run: `npm test -- reducers.test` → Expected: PASS
Run: `npm run check` → Expected: 0 errors, 0 warnings

- [ ] **Step 6: Commit**

```bash
git add src/domain/types.ts src/state/reducers.ts src/state/reducers.test.ts
git commit -m "feat: researchTechnology action (grant + log, idempotent)"
```

---

## Task 4: 'research' available-action

**Files:**
- Modify: `src/domain/types.ts` (AvailableAction union)
- Modify: `src/engine/actions.ts` (push research)
- Test: `src/engine/actions.test.ts`

**Interfaces:**
- Produces: an `AvailableAction` with `type: 'research'`, label `Research technology`, present whenever `getAvailableActions` returns anything in the action phase (i.e. action phase and not passed). It is a UI trigger — no `sourceId`.

- [ ] **Step 1: Write the failing test**

Append inside `describe('getAvailableActions', ...)` in `src/engine/actions.test.ts`:

```ts
it('offers research in the action phase, but not once passed', () => {
  expect(getAvailableActions(actionPhase()).map((a) => a.type)).toContain('research')
  expect(getAvailableActions(actionPhase({ passed: true })).map((a) => a.type)).not.toContain('research')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- actions.test`
Expected: FAIL — `'research'` is not produced (and not yet a valid `AvailableAction` type).

- [ ] **Step 3: Widen the AvailableAction type**

In `src/domain/types.ts`, update the `AvailableAction` type's `type` field:

```ts
export type AvailableAction = {
  type: 'strategicAction' | 'tacticalAction' | 'componentAction' | 'research' | 'pass'
  label: string
  explanation: string
  sourceId?: string
}
```

- [ ] **Step 4: Push the research action**

In `src/engine/actions.ts`, insert this block immediately after the tactical-action `if` block (before the `for (const src of opts.componentActionSources ...)` loop):

```ts
  actions.push({
    type: 'research',
    label: 'Research technology',
    explanation:
      'Add a technology to your play area. Prerequisites you meet now are highlighted, but you can pick any — the app never blocks you. Remember to pay its cost (exhaust planets for resources; the Technology card\'s second research costs 6).',
  })
```

- [ ] **Step 5: Run test + check, verify green**

Run: `npm test -- actions.test` → Expected: PASS
Run: `npm run check` → Expected: 0 errors, 0 warnings

- [ ] **Step 6: Commit**

```bash
git add src/domain/types.ts src/engine/actions.ts src/engine/actions.test.ts
git commit -m "feat: 'research' available-action in the action phase"
```

---

## Task 5: Tech reminders

**Files:**
- Modify: `src/engine/reminders.ts` (optional opts + two reminders)
- Test: `src/engine/reminders.test.ts`

**Interfaces:**
- Produces: `getReminders(state: GameState, opts?: { researchableCount?: number }): Reminder[]`. Adds reminder id `tech-card` when `strategyCardIds` includes 7 (Technology), and reminder id `researchable` when `opts.researchableCount > 0`. The opts argument is optional and backward-compatible.

- [ ] **Step 1: Write the failing test**

Append inside `describe('getReminders', ...)` in `src/engine/reminders.test.ts`:

```ts
it('reminds about the Technology strategy card only when held', () => {
  expect(getReminders(actionPhase({ strategyCardIds: [7] })).map((r) => r.id)).toContain('tech-card')
  expect(getReminders(actionPhase({ strategyCardIds: [1] })).map((r) => r.id)).not.toContain('tech-card')
})

it('surfaces a researchable-count reminder only when a positive count is supplied', () => {
  const r = getReminders(actionPhase(), { researchableCount: 3 })
  expect(r.find((x) => x.id === 'researchable')?.text).toContain('3')
  expect(getReminders(actionPhase(), { researchableCount: 0 }).map((x) => x.id)).not.toContain('researchable')
  expect(getReminders(actionPhase()).map((x) => x.id)).not.toContain('researchable')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- reminders.test`
Expected: FAIL — neither `tech-card` nor `researchable` reminders exist; `getReminders` takes no opts.

- [ ] **Step 3: Implement the reminders**

In `src/engine/reminders.ts`, change the signature line:

```ts
export function getReminders(state: GameState, opts: { researchableCount?: number } = {}): Reminder[] {
```

Then, immediately before the final `return out`, add:

```ts
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
```

- [ ] **Step 4: Run test + check, verify green**

Run: `npm test -- reminders.test` → Expected: PASS
Run: `npm run check` → Expected: 0 errors, 0 warnings (the App call site still compiles — the opts arg is optional; it is wired in Task 6).

- [ ] **Step 5: Commit**

```bash
git add src/engine/reminders.ts src/engine/reminders.test.ts
git commit -m "feat: Technology-card + researchable-count reminders"
```

---

## Task 6: ResearchPicker component + App wiring

Delivers the user-facing research flow: a presentational picker plus the only wiring layer (`App.svelte`).

**Files:**
- Create: `src/lib/components/ResearchPicker.svelte`
- Test: `src/lib/components/ResearchPicker.svelte.test.ts`
- Modify: `src/lib/components/ActionPanel.svelte` (SUMMARIES entry)
- Modify: `src/App.svelte` (imports, derived, act(), picker render)

**Interfaces:**
- Consumes: `getResearchableTechs` (Task 2), `researchTechnology` action (Task 3), `'research'` action (Task 4), `getReminders` opts (Task 5).
- Produces: `ResearchPicker` props `{ technologies: Technology[]; ownedIds: Set<string>; researchableIds: Set<string>; onResearch: (techId: string, name: string) => void; onClose: () => void }`. Each tech button has `aria-label={"research " + name}`; the close button `aria-label="close research picker"`. Owned techs are excluded; researchable techs highlighted; every shown button is clickable.

- [ ] **Step 1: Write the failing component test**

Create `src/lib/components/ResearchPicker.svelte.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import ResearchPicker from './ResearchPicker.svelte'
import type { Technology } from '../../content/schema'

const T = (o: Partial<Technology> & { id: string; name: string }): Technology =>
  ({ color: 'blue', type: 'ability', expansion: 'base', prerequisites: [], summary: '', hasAction: false, ...o })

const technologies: Technology[] = [
  T({ id: 'antimass-deflectors', name: 'Antimass Deflectors', color: 'blue', prerequisites: [] }),
  T({ id: 'fleet-logistics', name: 'Fleet Logistics', color: 'blue', prerequisites: ['blue', 'blue'] }),
  T({ id: 'carrier-ii', name: 'Carrier II', color: 'none', type: 'unit-upgrade', prerequisites: ['blue', 'blue'] }),
  T({ id: 'sarween-tools', name: 'Sarween Tools', color: 'yellow', prerequisites: [] }),
]

describe('ResearchPicker', () => {
  it('groups techs, tags expansion, and excludes owned ones', () => {
    render(ResearchPicker, { props: { technologies, ownedIds: new Set(['sarween-tools']), researchableIds: new Set(['antimass-deflectors']), onResearch: () => {}, onClose: () => {} } })
    expect(screen.getByText('Unit Upgrades')).toBeTruthy()
    expect(screen.getByRole('button', { name: /research Antimass Deflectors/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /research Sarween Tools/ })).toBeNull()
  })

  it('researches on click even a non-researchable tech (assistant, not referee)', async () => {
    const onResearch = vi.fn()
    render(ResearchPicker, { props: { technologies, ownedIds: new Set(), researchableIds: new Set(['antimass-deflectors']), onResearch, onClose: () => {} } })
    await fireEvent.click(screen.getByRole('button', { name: /research Fleet Logistics/ }))
    expect(onResearch).toHaveBeenCalledWith('fleet-logistics', 'Fleet Logistics')
  })

  it('closes via the close button', async () => {
    const onClose = vi.fn()
    render(ResearchPicker, { props: { technologies, ownedIds: new Set(), researchableIds: new Set(), onResearch: () => {}, onClose } })
    await fireEvent.click(screen.getByRole('button', { name: /close research picker/ }))
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- ResearchPicker`
Expected: FAIL — component file does not exist.

- [ ] **Step 3: Implement the component**

Create `src/lib/components/ResearchPicker.svelte`:

```svelte
<script lang="ts">
  import type { Technology } from '../../content/schema'

  interface Props {
    technologies: Technology[]
    ownedIds: Set<string>
    researchableIds: Set<string>
    onResearch: (techId: string, name: string) => void
    onClose: () => void
  }
  let { technologies, ownedIds, researchableIds, onResearch, onClose }: Props = $props()

  const GROUPS: { key: string; label: string; match: (t: Technology) => boolean }[] = [
    { key: 'blue', label: 'Propulsion (blue)', match: (t) => t.type === 'ability' && t.color === 'blue' },
    { key: 'green', label: 'Biotic (green)', match: (t) => t.type === 'ability' && t.color === 'green' },
    { key: 'yellow', label: 'Cybernetic (yellow)', match: (t) => t.type === 'ability' && t.color === 'yellow' },
    { key: 'red', label: 'Warfare (red)', match: (t) => t.type === 'ability' && t.color === 'red' },
    { key: 'unit', label: 'Unit Upgrades', match: (t) => t.type === 'unit-upgrade' },
  ]

  const groups = $derived(
    GROUPS.map((g) => ({
      key: g.key,
      label: g.label,
      techs: technologies
        .filter((t) => !ownedIds.has(t.id) && g.match(t))
        .sort((a, b) => a.prerequisites.length - b.prerequisites.length),
    })).filter((g) => g.techs.length > 0),
  )
</script>

<div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:flex-end;justify-content:center;z-index:20;">
  <div role="dialog" aria-label="Research technology" style="background:var(--surface);max-width:480px;width:100%;max-height:80vh;overflow:auto;border-radius:12px 12px 0 0;padding:16px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <h3 style="font-size:16px;font-weight:500;">Research technology</h3>
      <button onclick={onClose} aria-label="close research picker" style="padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">✕</button>
    </div>
    <p style="color:var(--text-muted);font-size:13px;">Highlighted techs meet their prerequisites now. Others are greyed but still selectable — the app never blocks you.</p>

    {#each groups as g (g.key)}
      <h4 style="font-weight:500;margin-top:12px;">{g.label}</h4>
      {#each g.techs as t (t.id)}
        {@const ok = researchableIds.has(t.id)}
        <button
          onclick={() => onResearch(t.id, t.name)}
          aria-label={`research ${t.name}`}
          style="display:block;width:100%;text-align:left;margin:4px 0;padding:8px 10px;border:1px solid {ok ? 'var(--accent)' : 'var(--border)'};border-radius:var(--radius);background:{ok ? 'var(--surface-2)' : 'var(--surface)'};color:{ok ? 'var(--text)' : 'var(--text-muted)'};cursor:pointer;"
        >
          <span style="font-weight:{ok ? 500 : 400};">{t.name}</span>
          <span style="font-size:12px;color:var(--text-muted);"> · {t.prerequisites.length ? t.prerequisites.join('/') : 'no prereq'} · {t.expansion.toUpperCase()}</span>
        </button>
      {/each}
    {/each}

    {#if groups.length === 0}<p style="color:var(--text-muted);font-size:14px;">You already own every technology in the catalog.</p>{/if}
  </div>
</div>
```

- [ ] **Step 4: Run the component test, verify green**

Run: `npm test -- ResearchPicker` → Expected: PASS

- [ ] **Step 5: Add the ActionPanel summary**

In `src/lib/components/ActionPanel.svelte`, add a `research` entry to the `SUMMARIES` record (after the `componentAction` line):

```ts
    research: 'Add a technology; researchable ones are highlighted.',
```

- [ ] **Step 6: Wire App.svelte**

In `src/App.svelte`:

(a) Add the engine import — change the engine import line to:

```ts
  import { getAvailableActions, getReminders, getResearchableTechs } from './engine/index'
```

(b) Add the component import after the `MenuSheet` import:

```ts
  import ResearchPicker from './lib/components/ResearchPicker.svelte'
```

(c) Add a picker-open flag near the other `$state` declarations (after `let importError = $state('')`):

```ts
  let researchOpen = $state(false)
```

(d) Replace the `actions`/`reminders` derived lines with researchable-aware versions:

```ts
  const researchResults = $derived(gameState ? getResearchableTechs(gameState, content.technologies) : [])
  const researchableIds = $derived(new Set(researchResults.filter((r) => r.researchable).map((r) => r.techId)))
  const actions = $derived(gameState ? getAvailableActions(gameState, { componentActionSources }) : [])
  const reminders = $derived(gameState ? getReminders(gameState, { researchableCount: researchableIds.size }) : [])
```

(e) Update `act()` to open the picker for research instead of dispatching:

```ts
  function act(a: AvailableAction) {
    if (!store) return
    if (a.type === 'research') { researchOpen = true; return }
    if (a.type === 'componentAction') store.dispatch({ type: 'componentAction', sourceId: a.sourceId ?? '', summary: a.explanation })
    else store.dispatch({ type: a.type } as GameAction)
  }
```

(f) Render the picker — add immediately after the `<MenuSheet ... />` element (before the closing `{/if}`):

```svelte
  {#if researchOpen && gameState}
    <ResearchPicker
      technologies={content.technologies}
      ownedIds={new Set(gameState.technologyIds)}
      {researchableIds}
      onResearch={(techId, name) => { store?.dispatch({ type: 'researchTechnology', techId, name }); researchOpen = false }}
      onClose={() => (researchOpen = false)}
    />
  {/if}
```

- [ ] **Step 7: Run the full suite, check, and build**

Run: `npm test` → Expected: all pass
Run: `npm run check` → Expected: 0 errors, 0 warnings
Run: `npm run build` → Expected: success

- [ ] **Step 8: Commit**

```bash
git add src/lib/components/ResearchPicker.svelte src/lib/components/ResearchPicker.svelte.test.ts src/lib/components/ActionPanel.svelte src/App.svelte
git commit -m "feat: research picker + App wiring (researchable hints, research dispatch)"
```

---

## Task 7: Grouped tech reference

**Files:**
- Modify: `src/lib/components/ReferenceBrowser.svelte` (grouped tech tab)
- Test: `src/lib/components/ReferenceBrowser.svelte.test.ts`

**Interfaces:**
- Consumes: `Technology` fields `type`, `color`, `expansion`, `prerequisites` (Task 1).
- Produces: the Tech tab renders technologies under color group headers plus a `Unit Upgrades` header, ordered by tier (prerequisite count), each detail line tagged with expansion.

- [ ] **Step 1: Write the failing test**

In `src/lib/components/ReferenceBrowser.svelte.test.ts`, replace the `technologies` fixture (from Task 1) with a multi-group set:

```ts
const technologies: Technology[] = [
  { id: 'plasma-scoring', name: 'Plasma Scoring', color: 'red', type: 'ability', expansion: 'base', prerequisites: [], summary: 'Add 1 die.', hasAction: false },
  { id: 'carrier-ii', name: 'Carrier II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['blue', 'blue'], summary: 'Upgraded Carrier.', hasAction: false },
]
```

Then add this test inside `describe('ReferenceBrowser', ...)`:

```ts
it('groups the technology tab with a Unit Upgrades header', async () => {
  render(ReferenceBrowser, { props: { factions, technologies, strategyCards, objectives, planets } })
  await fireEvent.click(screen.getByRole('button', { name: /Tech/ }))
  expect(screen.getByText('Unit Upgrades')).toBeTruthy()
  expect(screen.getByText('Warfare (red)')).toBeTruthy()
  expect(screen.getByText('Plasma Scoring')).toBeTruthy()
  expect(screen.getByText('Carrier II')).toBeTruthy()
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- ReferenceBrowser`
Expected: FAIL — no group headers ("Unit Upgrades", "Warfare (red)") are rendered.

- [ ] **Step 3: Implement grouped rendering**

In `src/lib/components/ReferenceBrowser.svelte`, within `<script>`, remove the `kind === 'tech'` branch from the `all` ternary so tech returns an empty entry list there:

```ts
      : kind === 'tech'
        ? []
```

Then add, after the `entries` derived line:

```ts
  const TECH_GROUPS: { key: string; label: string; match: (t: Technology) => boolean }[] = [
    { key: 'blue', label: 'Propulsion (blue)', match: (t) => t.type === 'ability' && t.color === 'blue' },
    { key: 'green', label: 'Biotic (green)', match: (t) => t.type === 'ability' && t.color === 'green' },
    { key: 'yellow', label: 'Cybernetic (yellow)', match: (t) => t.type === 'ability' && t.color === 'yellow' },
    { key: 'red', label: 'Warfare (red)', match: (t) => t.type === 'ability' && t.color === 'red' },
    { key: 'unit', label: 'Unit Upgrades', match: (t) => t.type === 'unit-upgrade' },
  ]
  const techGroups = $derived(
    TECH_GROUPS.map((g) => ({
      key: g.key,
      label: g.label,
      entries: technologies
        .filter((t) => g.match(t) && t.name.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => a.prerequisites.length - b.prerequisites.length)
        .map((t) => ({
          id: t.id,
          title: t.name,
          summary: t.summary,
          detail: `${t.type === 'unit-upgrade' ? 'Unit upgrade' : t.color} · ${t.expansion.toUpperCase()} · prereqs: ${t.prerequisites.join(', ') || 'none'}\n${t.summary}`,
        })),
    })).filter((g) => g.entries.length > 0),
  )
```

In the template, replace the single `{#each entries as e (kind + e.id)} ... {/each}` / `{#if entries.length === 0}` block with:

```svelte
{#if kind === 'tech'}
  {#each techGroups as g (g.key)}
    <h4 style="font-weight:500;margin-top:12px;">{g.label}</h4>
    {#each g.entries as e (e.id)}
      <ExpandableItem title={e.title} summary={e.summary} detail={e.detail} />
    {/each}
  {/each}
  {#if techGroups.length === 0}<p style="color:var(--text-muted);font-size:14px;">No matches.</p>{/if}
{:else}
  {#each entries as e (kind + e.id)}
    <ExpandableItem title={e.title} summary={e.summary} detail={e.detail} />
  {/each}
  {#if entries.length === 0}<p style="color:var(--text-muted);font-size:14px;">No matches.</p>{/if}
{/if}
```

- [ ] **Step 4: Run the full suite, check, and build**

Run: `npm test -- ReferenceBrowser` → Expected: PASS
Run: `npm test` → Expected: all pass
Run: `npm run check` → Expected: 0 errors, 0 warnings
Run: `npm run build` → Expected: success

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/ReferenceBrowser.svelte src/lib/components/ReferenceBrowser.svelte.test.ts
git commit -m "feat: group the tech reference by color + unit upgrades"
```

---

## Done criteria

- 33-tech generic catalog, correctly typed, `self-assembly-routines` prerequisite fixed.
- `getResearchableTechs` computes researchable-now from owned techs + readied specialty planets.
- Action phase offers "Research technology" → picker (researchable highlighted, any selectable) → logged `researchTechnology`.
- Reminders: Technology-card note when held; researchable count.
- Reference Tech tab grouped by color + unit upgrades.
- `npm test` green, `npm run check` 0/0, `npm run build` OK.
