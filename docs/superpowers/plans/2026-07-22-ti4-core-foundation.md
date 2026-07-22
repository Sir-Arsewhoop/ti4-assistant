# TI4 Turn Assistant — Plan 1: Core Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the tested "brains" of the TI4 turn assistant — domain types, rules engine, reducers, state store, validated content, persistence — plus a bare vertical-slice UI that runs a full turn loop end-to-end.

**Architecture:** Framework-agnostic core (pure TypeScript: types, engine, reducers) that has **no dependency on Svelte or on the content data**. Content is validated with Zod. A thin Svelte layer wraps the pure state in reactive `$state` and dispatches pure reducers. This keeps the engine and reducers fully unit-testable with fixtures.

**Tech Stack:** Vite 5, Svelte 5 (runes), TypeScript 5, Vitest 2, Zod 3, idb 8, vite-plugin-pwa 0.20+, fake-indexeddb (test), jsdom (test).

## Global Constraints

- Node 20+ ; TypeScript `strict: true`.
- Svelte 5 with **runes** (`$state`, `$derived`) — not Svelte 4 stores.
- Core layers `src/domain`, `src/engine`, `src/state/reducers.ts` MUST NOT import Svelte or `src/content`. They operate on plain data and fixtures.
- **Assistant, not referee:** reducers never throw on "illegal" input; every state field is editable via an `editState` path. The engine reports what's *available*, it does not *forbid*.
- **Copyright:** all card/faction/tech text is a concise **mechanical summary** in our own words — never verbatim official text.
- Content is **data-driven**: adding a faction/tech/card is a data edit, not a code change.
- GitHub Pages base path is `/ti4-assistant/` (set in `vite.config.ts`).
- Tests colocated as `*.test.ts` next to source. `npm test` runs Vitest.

---

## File Structure

```
ti4-assistant/
  package.json
  tsconfig.json
  svelte.config.js
  vite.config.ts
  index.html
  src/
    main.ts                 # app entry (Task 1)
    App.svelte              # vertical-slice root (Task 9)
    domain/
      types.ts              # GameState, Phase, GameAction, AvailableAction, Reminder (Task 2)
      initialState.ts       # createInitialState(faction, opts) (Task 2)
    engine/
      actions.ts            # getAvailableActions(state, opts) (Task 3)
      reminders.ts          # getReminders(state) (Task 4)
      index.ts              # re-exports (Task 4)
    state/
      reducers.ts           # applyAction(state, action) — pure (Task 5)
      store.svelte.ts       # reactive wrapper + dispatch + undo (Task 6)
    content/
      schema.ts             # Zod schemas + inferred types (Task 7)
      strategyCards.ts      # 8 strategy cards (Task 7)
      technologies.ts       # seed techs (Task 7)
      factions.ts           # Jol-Nar, Sol, Sardakk N'orr (Task 7)
      objectives.ts         # a few public objectives (Task 7)
      index.ts              # validated registry (Task 7)
    persistence/
      storage.ts            # idb save/load + export/import (Task 8)
```

Each `*.test.ts` lives beside the file it tests.

---

### Task 1: Project scaffold + tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `svelte.config.js`, `vite.config.ts`, `index.html`, `src/main.ts`, `src/App.svelte`, `src/smoke.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a runnable dev server (`npm run dev`) and a passing test runner (`npm test`).

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "ti4-assistant",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "check": "svelte-check --tsconfig ./tsconfig.json"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^4.0.0",
    "@testing-library/svelte": "^5.2.0",
    "fake-indexeddb": "^6.0.0",
    "jsdom": "^25.0.0",
    "svelte": "^5.0.0",
    "svelte-check": "^4.0.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vite-plugin-pwa": "^0.20.0",
    "vitest": "^2.1.0"
  },
  "dependencies": {
    "idb": "^8.0.0",
    "zod": "^3.23.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "types": ["vite/client", "vitest/globals"],
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `svelte.config.js`**

```js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
export default { preprocess: vitePreprocess() }
```

- [ ] **Step 4: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/ti4-assistant/',
  plugins: [
    svelte(),
    VitePWA({ registerType: 'autoUpdate', manifest: { name: 'TI4 Assistant', short_name: 'TI4', display: 'standalone' } }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>TI4 Assistant</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `src/App.svelte` (placeholder) and `src/main.ts`**

```svelte
<!-- src/App.svelte -->
<script lang="ts">
</script>

<h1>TI4 Assistant</h1>
```

```ts
// src/main.ts
import { mount } from 'svelte'
import App from './App.svelte'

const app = mount(App, { target: document.getElementById('app')! })
export default app
```

- [ ] **Step 7: Write the smoke test**

```ts
// src/smoke.test.ts
import { describe, it, expect } from 'vitest'

describe('toolchain', () => {
  it('runs tests', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 8: Install and verify**

Run: `npm install && npm test`
Expected: Vitest reports `1 passed`.

Run: `npm run dev` (then Ctrl-C)
Expected: Vite prints a `localhost` URL with no errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + Svelte 5 + Vitest + PWA"
```

---

### Task 2: Domain types + `createInitialState`

**Files:**
- Create: `src/domain/types.ts`, `src/domain/initialState.ts`, `src/domain/initialState.test.ts`

**Interfaces:**
- Consumes: nothing (pure types).
- Produces:
  - `Phase = 'setup' | 'strategy' | 'action' | 'status' | 'agenda'`
  - `CommandPools = { tactic: number; fleet: number; strategy: number }`
  - `Planet = { id: string; name: string; resources: number; influence: number; exhausted: boolean }`
  - `GameState` (see code).
  - `FactionStartingInfo = { id: string; name: string; combatModifier: number; starting: { tokens: CommandPools; techIds: string[]; planets: Planet[]; commodities: number; tradeGoods: number } }`
  - `GameAction` discriminated union (see code).
  - `AvailableAction`, `Reminder`, `LogEntry`.
  - `createInitialState(faction: FactionStartingInfo, opts: { turnOrder: number; speaker: boolean }): GameState`

- [ ] **Step 1: Write `src/domain/types.ts`**

```ts
export type Phase = 'setup' | 'strategy' | 'action' | 'status' | 'agenda'

export type CommandPools = { tactic: number; fleet: number; strategy: number }

export type Planet = {
  id: string
  name: string
  resources: number
  influence: number
  exhausted: boolean
}

export type SecretObjective = { id: string; scored: boolean }

export type LeaderState = {
  agentUnlocked: boolean
  commanderUnlocked: boolean
  heroUnlocked: boolean
}

export type LogEntry = { seq: number; summary: string }

export type GameState = {
  round: number
  phase: Phase
  factionId: string
  turnOrder: number
  speaker: boolean
  command: CommandPools
  strategyCardIds: number[]
  strategyPrimaryUsed: boolean
  planets: Planet[]
  technologyIds: string[]
  tradeGoods: number
  commodities: number
  scoredPublicObjectiveIds: string[]
  secretObjectives: SecretObjective[]
  victoryPoints: number
  leaders: LeaderState
  actionCardCount: number
  passed: boolean
  log: LogEntry[]
}

export type FactionStartingInfo = {
  id: string
  name: string
  combatModifier: number
  starting: {
    tokens: CommandPools
    techIds: string[]
    planets: Planet[]
    commodities: number
    tradeGoods: number
  }
}

export type GameAction =
  | { type: 'strategicAction' }
  | { type: 'tacticalAction' }
  | { type: 'componentAction'; sourceId: string; summary: string }
  | { type: 'pass' }
  | { type: 'advancePhase' }
  | { type: 'gainTradeGoods'; amount: number }
  | { type: 'exhaustPlanet'; planetId: string }
  | { type: 'scorePublicObjective'; objectiveId: string; points: number }
  | { type: 'editState'; patch: Partial<GameState> }

export type AvailableAction = {
  type: 'strategicAction' | 'tacticalAction' | 'componentAction' | 'pass'
  label: string
  explanation: string
}

export type Reminder = { id: string; severity: 'info' | 'warn'; text: string }
```

- [ ] **Step 2: Write the failing test for `createInitialState`**

```ts
// src/domain/initialState.test.ts
import { describe, it, expect } from 'vitest'
import { createInitialState } from './initialState'
import type { FactionStartingInfo } from './types'

const fixture: FactionStartingInfo = {
  id: 'jol-nar',
  name: 'Universities of Jol-Nar',
  combatModifier: -1,
  starting: {
    tokens: { tactic: 3, fleet: 3, strategy: 2 },
    techIds: ['neural-motivator', 'antimass-deflectors', 'sarween-tools', 'plasma-scoring'],
    planets: [
      { id: 'jol', name: 'Jol', resources: 1, influence: 2, exhausted: false },
      { id: 'nar', name: 'Nar', resources: 2, influence: 3, exhausted: false },
    ],
    commodities: 4,
    tradeGoods: 0,
  },
}

describe('createInitialState', () => {
  it('seeds resources from the faction', () => {
    const s = createInitialState(fixture, { turnOrder: 1, speaker: true })
    expect(s.phase).toBe('setup')
    expect(s.round).toBe(1)
    expect(s.factionId).toBe('jol-nar')
    expect(s.command).toEqual({ tactic: 3, fleet: 3, strategy: 2 })
    expect(s.technologyIds).toHaveLength(4)
    expect(s.planets.map((p) => p.id)).toEqual(['jol', 'nar'])
    expect(s.commodities).toBe(4)
    expect(s.victoryPoints).toBe(0)
    expect(s.speaker).toBe(true)
  })

  it('deep-copies planets so the faction template is not mutated', () => {
    const s = createInitialState(fixture, { turnOrder: 1, speaker: false })
    s.planets[0].exhausted = true
    expect(fixture.starting.planets[0].exhausted).toBe(false)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/domain/initialState.test.ts`
Expected: FAIL — cannot find module `./initialState`.

- [ ] **Step 4: Write `src/domain/initialState.ts`**

```ts
import type { FactionStartingInfo, GameState } from './types'

export function createInitialState(
  faction: FactionStartingInfo,
  opts: { turnOrder: number; speaker: boolean },
): GameState {
  return {
    round: 1,
    phase: 'setup',
    factionId: faction.id,
    turnOrder: opts.turnOrder,
    speaker: opts.speaker,
    command: { ...faction.starting.tokens },
    strategyCardIds: [],
    strategyPrimaryUsed: false,
    planets: faction.starting.planets.map((p) => ({ ...p })),
    technologyIds: [...faction.starting.techIds],
    tradeGoods: faction.starting.tradeGoods,
    commodities: faction.starting.commodities,
    scoredPublicObjectiveIds: [],
    secretObjectives: [],
    victoryPoints: 0,
    leaders: { agentUnlocked: false, commanderUnlocked: false, heroUnlocked: false },
    actionCardCount: 0,
    passed: false,
    log: [],
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/domain/initialState.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/domain
git commit -m "feat: domain types and createInitialState"
```

---

### Task 3: Rules engine — `getAvailableActions`

**Files:**
- Create: `src/engine/actions.ts`, `src/engine/actions.test.ts`

**Interfaces:**
- Consumes: `GameState`, `AvailableAction` from `src/domain/types`.
- Produces: `getAvailableActions(state: GameState, opts?: { componentActionSources?: { id: string; summary: string }[] }): AvailableAction[]`
  - Returns the enabled action-phase options only. Empty array outside the `action` phase.

- [ ] **Step 1: Write the failing tests**

```ts
// src/engine/actions.test.ts
import { describe, it, expect } from 'vitest'
import { getAvailableActions } from './actions'
import { createInitialState } from '../domain/initialState'
import type { FactionStartingInfo, GameState } from '../domain/types'

const faction: FactionStartingInfo = {
  id: 'sol', name: 'Federation of Sol', combatModifier: 0,
  starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], commodities: 2, tradeGoods: 0 },
}

function actionPhase(overrides: Partial<GameState> = {}): GameState {
  const s = createInitialState(faction, { turnOrder: 1, speaker: false })
  return { ...s, phase: 'action', strategyCardIds: [1], ...overrides }
}

describe('getAvailableActions', () => {
  it('returns nothing outside the action phase', () => {
    const s = createInitialState(faction, { turnOrder: 1, speaker: false })
    expect(getAvailableActions(s)).toEqual([])
  })

  it('offers strategic action when the primary is unused', () => {
    const types = getAvailableActions(actionPhase()).map((a) => a.type)
    expect(types).toContain('strategicAction')
  })

  it('hides strategic action once the primary is used', () => {
    const types = getAvailableActions(actionPhase({ strategyPrimaryUsed: true })).map((a) => a.type)
    expect(types).not.toContain('strategicAction')
  })

  it('offers tactical action only when a tactic token is available', () => {
    expect(getAvailableActions(actionPhase({ command: { tactic: 1, fleet: 3, strategy: 2 } })).map((a) => a.type)).toContain('tacticalAction')
    expect(getAvailableActions(actionPhase({ command: { tactic: 0, fleet: 3, strategy: 2 } })).map((a) => a.type)).not.toContain('tacticalAction')
  })

  it('offers pass only after the strategic action is taken', () => {
    expect(getAvailableActions(actionPhase({ strategyPrimaryUsed: false })).map((a) => a.type)).not.toContain('pass')
    expect(getAvailableActions(actionPhase({ strategyPrimaryUsed: true })).map((a) => a.type)).toContain('pass')
  })

  it('offers a component action per provided source', () => {
    const acts = getAvailableActions(actionPhase(), { componentActionSources: [{ id: 'plasma-scoring', summary: 'Plasma Scoring: +1 die on bombardment/space cannon' }] })
    const comp = acts.filter((a) => a.type === 'componentAction')
    expect(comp).toHaveLength(1)
    expect(comp[0].explanation).toContain('Plasma Scoring')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/actions.test.ts`
Expected: FAIL — cannot find module `./actions`.

- [ ] **Step 3: Write `src/engine/actions.ts`**

```ts
import type { AvailableAction, GameState } from '../domain/types'

export function getAvailableActions(
  state: GameState,
  opts: { componentActionSources?: { id: string; summary: string }[] } = {},
): AvailableAction[] {
  if (state.phase !== 'action' || state.passed) return []
  const actions: AvailableAction[] = []

  if (state.strategyCardIds.length > 0 && !state.strategyPrimaryUsed) {
    actions.push({
      type: 'strategicAction',
      label: 'Strategic action',
      explanation:
        'Resolve the primary ability of your strategy card. You may do this once per round. After it, other players may pay to use the secondary.',
    })
  }

  if (state.command.tactic >= 1) {
    actions.push({
      type: 'tacticalAction',
      label: 'Tactical action',
      explanation:
        'Spend one command token from your tactic pool to activate a system: move ships, resolve combat, then produce or improve. Your main way to expand.',
    })
  }

  for (const src of opts.componentActionSources ?? []) {
    actions.push({
      type: 'componentAction',
      label: 'Component action',
      explanation: src.summary,
    })
  }

  if (state.strategyPrimaryUsed) {
    actions.push({
      type: 'pass',
      label: 'Pass',
      explanation:
        'Stop taking turns for the rest of this action phase. Allowed only after you have taken your strategic action. You can still resolve others’ secondaries.',
    })
  }

  return actions
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/actions.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/actions.ts src/engine/actions.test.ts
git commit -m "feat: engine getAvailableActions with availability predicates"
```

---

### Task 4: Rules engine — `getReminders` + engine barrel

**Files:**
- Create: `src/engine/reminders.ts`, `src/engine/reminders.test.ts`, `src/engine/index.ts`

**Interfaces:**
- Consumes: `GameState`, `Reminder`.
- Produces:
  - `getReminders(state: GameState): Reminder[]`
  - `src/engine/index.ts` re-exporting `getAvailableActions` and `getReminders`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/engine/reminders.test.ts
import { describe, it, expect } from 'vitest'
import { getReminders } from './reminders'
import { createInitialState } from '../domain/initialState'
import type { FactionStartingInfo, GameState } from '../domain/types'

const faction: FactionStartingInfo = {
  id: 'sol', name: 'Federation of Sol', combatModifier: 0,
  starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], commodities: 2, tradeGoods: 0 },
}
function actionPhase(overrides: Partial<GameState> = {}): GameState {
  const s = createInitialState(faction, { turnOrder: 1, speaker: false })
  return { ...s, phase: 'action', strategyCardIds: [1], ...overrides }
}

describe('getReminders', () => {
  it('reminds you to use your strategy primary if unused in the action phase', () => {
    const ids = getReminders(actionPhase({ strategyPrimaryUsed: false })).map((r) => r.id)
    expect(ids).toContain('strategy-primary-unused')
  })

  it('warns when no tactic tokens remain in the action phase', () => {
    const r = getReminders(actionPhase({ command: { tactic: 0, fleet: 3, strategy: 2 } }))
    const tok = r.find((x) => x.id === 'no-tactic-tokens')
    expect(tok?.severity).toBe('warn')
  })

  it('notes exhausted planets that will ready in the status phase', () => {
    const s = actionPhase({ planets: [{ id: 'jol', name: 'Jol', resources: 1, influence: 2, exhausted: true }] })
    expect(getReminders(s).map((r) => r.id)).toContain('exhausted-planets')
  })

  it('is quiet outside the action phase', () => {
    const s = createInitialState(faction, { turnOrder: 1, speaker: false }) // setup
    expect(getReminders(s)).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/reminders.test.ts`
Expected: FAIL — cannot find module `./reminders`.

- [ ] **Step 3: Write `src/engine/reminders.ts`**

```ts
import type { GameState, Reminder } from '../domain/types'

export function getReminders(state: GameState): Reminder[] {
  if (state.phase !== 'action') return []
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

  return out
}
```

- [ ] **Step 4: Write `src/engine/index.ts`**

```ts
export { getAvailableActions } from './actions'
export { getReminders } from './reminders'
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/engine/reminders.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/engine
git commit -m "feat: engine getReminders and barrel export"
```

---

### Task 5: Reducers — `applyAction`

**Files:**
- Create: `src/state/reducers.ts`, `src/state/reducers.test.ts`

**Interfaces:**
- Consumes: `GameState`, `GameAction`.
- Produces: `applyAction(state: GameState, action: GameAction): GameState` — pure; returns a new state. Appends a `LogEntry` for every action except `editState`. Never throws on "illegal" input (assistant-not-referee); clamps token spends at 0.

Phase order for `advancePhase`: `setup -> strategy -> action -> status -> strategy` (round + 1 on the status→strategy edge; Agenda phase is added in a later plan). Entering `strategy` resets `strategyPrimaryUsed` and `passed`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/state/reducers.test.ts
import { describe, it, expect } from 'vitest'
import { applyAction } from './reducers'
import { createInitialState } from '../domain/initialState'
import type { FactionStartingInfo, GameState } from '../domain/types'

const faction: FactionStartingInfo = {
  id: 'sol', name: 'Federation of Sol', combatModifier: 0,
  starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [{ id: 'jord', name: 'Jord', resources: 4, influence: 2, exhausted: false }], commodities: 4, tradeGoods: 0 },
}
function base(overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialState(faction, { turnOrder: 1, speaker: false }), phase: 'action', strategyCardIds: [1], ...overrides }
}

describe('applyAction', () => {
  it('strategicAction marks the primary used and logs', () => {
    const s = applyAction(base(), { type: 'strategicAction' })
    expect(s.strategyPrimaryUsed).toBe(true)
    expect(s.log.at(-1)?.summary).toMatch(/strategic/i)
  })

  it('tacticalAction spends one tactic token', () => {
    const s = applyAction(base({ command: { tactic: 2, fleet: 3, strategy: 2 } }), { type: 'tacticalAction' })
    expect(s.command.tactic).toBe(1)
  })

  it('tacticalAction clamps at zero, never negative', () => {
    const s = applyAction(base({ command: { tactic: 0, fleet: 3, strategy: 2 } }), { type: 'tacticalAction' })
    expect(s.command.tactic).toBe(0)
  })

  it('pass sets passed=true', () => {
    const s = applyAction(base({ strategyPrimaryUsed: true }), { type: 'pass' })
    expect(s.passed).toBe(true)
  })

  it('exhaustPlanet flips the flag by id', () => {
    const s = applyAction(base(), { type: 'exhaustPlanet', planetId: 'jord' })
    expect(s.planets.find((p) => p.id === 'jord')?.exhausted).toBe(true)
  })

  it('scorePublicObjective adds points once and records the id', () => {
    let s = applyAction(base(), { type: 'scorePublicObjective', objectiveId: 'obj-a', points: 1 })
    expect(s.victoryPoints).toBe(1)
    expect(s.scoredPublicObjectiveIds).toContain('obj-a')
    s = applyAction(s, { type: 'scorePublicObjective', objectiveId: 'obj-a', points: 1 }) // idempotent
    expect(s.victoryPoints).toBe(1)
  })

  it('advancePhase cycles and increments the round on status->strategy', () => {
    let s = base({ phase: 'action', strategyPrimaryUsed: true, passed: true })
    s = applyAction(s, { type: 'advancePhase' }) // action -> status
    expect(s.phase).toBe('status')
    s = applyAction(s, { type: 'advancePhase' }) // status -> strategy (new round)
    expect(s.phase).toBe('strategy')
    expect(s.round).toBe(2)
    expect(s.strategyPrimaryUsed).toBe(false)
    expect(s.passed).toBe(false)
  })

  it('editState merges a manual patch without logging', () => {
    const before = base()
    const s = applyAction(before, { type: 'editState', patch: { tradeGoods: 9 } })
    expect(s.tradeGoods).toBe(9)
    expect(s.log).toHaveLength(before.log.length)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/state/reducers.test.ts`
Expected: FAIL — cannot find module `./reducers`.

- [ ] **Step 3: Write `src/state/reducers.ts`**

```ts
import type { GameAction, GameState, LogEntry, Phase } from '../domain/types'

const NEXT_PHASE: Record<Phase, Phase> = {
  setup: 'strategy',
  strategy: 'action',
  action: 'status',
  status: 'strategy',
  agenda: 'strategy',
}

function log(state: GameState, summary: string): LogEntry[] {
  return [...state.log, { seq: state.log.length + 1, summary }]
}

export function applyAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'strategicAction':
      return { ...state, strategyPrimaryUsed: true, log: log(state, 'Took strategic action') }

    case 'tacticalAction':
      return {
        ...state,
        command: { ...state.command, tactic: Math.max(0, state.command.tactic - 1) },
        log: log(state, 'Took tactical action (spent 1 tactic token)'),
      }

    case 'componentAction':
      return { ...state, log: log(state, `Component action: ${action.summary}`) }

    case 'pass':
      return { ...state, passed: true, log: log(state, 'Passed for the rest of the action phase') }

    case 'gainTradeGoods':
      return { ...state, tradeGoods: state.tradeGoods + action.amount, log: log(state, `Gained ${action.amount} trade good(s)`) }

    case 'exhaustPlanet':
      return {
        ...state,
        planets: state.planets.map((p) => (p.id === action.planetId ? { ...p, exhausted: true } : p)),
        log: log(state, `Exhausted planet ${action.planetId}`),
      }

    case 'scorePublicObjective': {
      if (state.scoredPublicObjectiveIds.includes(action.objectiveId)) return state
      return {
        ...state,
        scoredPublicObjectiveIds: [...state.scoredPublicObjectiveIds, action.objectiveId],
        victoryPoints: state.victoryPoints + action.points,
        log: log(state, `Scored objective ${action.objectiveId} (+${action.points} VP)`),
      }
    }

    case 'advancePhase': {
      const next = NEXT_PHASE[state.phase]
      const roundInc = state.phase === 'status' ? 1 : 0
      const resetForNewRound = next === 'strategy'
      return {
        ...state,
        phase: next,
        round: state.round + roundInc,
        strategyPrimaryUsed: resetForNewRound ? false : state.strategyPrimaryUsed,
        passed: resetForNewRound ? false : state.passed,
        log: log(state, `Advanced to ${next} phase`),
      }
    }

    case 'editState':
      return { ...state, ...action.patch }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/state/reducers.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/state/reducers.ts src/state/reducers.test.ts
git commit -m "feat: pure applyAction reducers with logging and clamping"
```

---

### Task 6: Reactive state store + undo

**Files:**
- Create: `src/state/store.svelte.ts`, `src/state/store.test.ts`

**Interfaces:**
- Consumes: `applyAction`, `GameState`, `GameAction`, `createInitialState`, `FactionStartingInfo`.
- Produces a `createGameStore(initial: GameState)` factory returning:
  - `get state(): GameState` (reactive via `$state`)
  - `dispatch(action: GameAction): void` — pushes current state to history, then applies
  - `undo(): void` — reverts to the previous history entry
  - `canUndo(): boolean`
  - `load(next: GameState): void` — replace state (used by persistence), clears history

Note: `store.svelte.ts` is the ONLY core file allowed to use Svelte runes.

- [ ] **Step 1: Write the failing tests**

```ts
// src/state/store.test.ts
import { describe, it, expect } from 'vitest'
import { createGameStore } from './store.svelte'
import { createInitialState } from '../domain/initialState'
import type { FactionStartingInfo } from '../domain/types'

const faction: FactionStartingInfo = {
  id: 'sol', name: 'Federation of Sol', combatModifier: 0,
  starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], commodities: 2, tradeGoods: 0 },
}
const start = () => ({ ...createInitialState(faction, { turnOrder: 1, speaker: false }), phase: 'action' as const, strategyCardIds: [1] })

describe('createGameStore', () => {
  it('applies actions through dispatch', () => {
    const store = createGameStore(start())
    store.dispatch({ type: 'tacticalAction' })
    expect(store.state.command.tactic).toBe(2)
  })

  it('undoes the last action', () => {
    const store = createGameStore(start())
    store.dispatch({ type: 'tacticalAction' })
    store.dispatch({ type: 'tacticalAction' })
    expect(store.state.command.tactic).toBe(1)
    store.undo()
    expect(store.state.command.tactic).toBe(2)
    expect(store.canUndo()).toBe(true)
    store.undo()
    expect(store.state.command.tactic).toBe(3)
    expect(store.canUndo()).toBe(false)
  })

  it('load replaces state and clears history', () => {
    const store = createGameStore(start())
    store.dispatch({ type: 'tacticalAction' })
    store.load({ ...start(), tradeGoods: 5 })
    expect(store.state.tradeGoods).toBe(5)
    expect(store.canUndo()).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/state/store.test.ts`
Expected: FAIL — cannot find module `./store.svelte`.

- [ ] **Step 3: Write `src/state/store.svelte.ts`**

```ts
import type { GameAction, GameState } from '../domain/types'
import { applyAction } from './reducers'

export function createGameStore(initial: GameState) {
  let state = $state<GameState>(initial)
  let history = $state<GameState[]>([])

  return {
    get state() {
      return state
    },
    dispatch(action: GameAction) {
      history = [...history, state]
      state = applyAction(state, action)
    },
    undo() {
      const prev = history.at(-1)
      if (!prev) return
      state = prev
      history = history.slice(0, -1)
    },
    canUndo() {
      return history.length > 0
    },
    load(next: GameState) {
      state = next
      history = []
    },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/state/store.test.ts`
Expected: PASS (3 tests). (Vitest runs `.svelte.ts` runes via the Svelte Vite plugin; no extra config needed.)

- [ ] **Step 5: Commit**

```bash
git add src/state/store.svelte.ts src/state/store.test.ts
git commit -m "feat: reactive game store with undo and load"
```

---

### Task 7: Content — Zod schema + seed data + validated registry

**Files:**
- Create: `src/content/schema.ts`, `src/content/strategyCards.ts`, `src/content/technologies.ts`, `src/content/factions.ts`, `src/content/objectives.ts`, `src/content/index.ts`, `src/content/content.test.ts`

**Interfaces:**
- Consumes: nothing from core (content is standalone); its `Faction` shape is structurally compatible with `FactionStartingInfo`.
- Produces:
  - Zod schemas: `strategyCardSchema`, `technologySchema`, `factionSchema`, `objectiveSchema`.
  - Inferred types: `StrategyCard`, `Technology`, `Faction`, `Objective`.
  - `content` registry from `index.ts`: `{ strategyCards, technologies, factions, objectives }`, each validated at module load with `schema.parse(...)`.
  - `getFaction(id: string): Faction | undefined`.

- [ ] **Step 1: Write `src/content/schema.ts`**

```ts
import { z } from 'zod'

export const commandPoolsSchema = z.object({
  tactic: z.number().int().min(0),
  fleet: z.number().int().min(0),
  strategy: z.number().int().min(0),
})

export const planetSchema = z.object({
  id: z.string(),
  name: z.string(),
  resources: z.number().int().min(0),
  influence: z.number().int().min(0),
  exhausted: z.boolean(),
})

export const strategyCardSchema = z.object({
  initiative: z.number().int().min(1).max(8),
  name: z.string(),
  primary: z.string(),   // mechanical summary, our words
  secondary: z.string(),
})
export type StrategyCard = z.infer<typeof strategyCardSchema>

export const technologySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.enum(['blue', 'green', 'yellow', 'red', 'none']),
  prerequisites: z.array(z.enum(['blue', 'green', 'yellow', 'red'])),
  summary: z.string(),
  hasAction: z.boolean().default(false),
})
export type Technology = z.infer<typeof technologySchema>

export const factionSchema = z.object({
  id: z.string(),
  name: z.string(),
  combatModifier: z.number().int(),
  abilitySummaries: z.array(z.string()).min(1),
  starting: z.object({
    tokens: commandPoolsSchema,
    techIds: z.array(z.string()),
    planets: z.array(planetSchema),
    commodities: z.number().int().min(0),
    tradeGoods: z.number().int().min(0),
  }),
})
export type Faction = z.infer<typeof factionSchema>

export const objectiveSchema = z.object({
  id: z.string(),
  name: z.string(),
  points: z.number().int().min(1).max(2),
  phase: z.enum(['status', 'action', 'agenda']),
  summary: z.string(),
})
export type Objective = z.infer<typeof objectiveSchema>
```

- [ ] **Step 2: Write `src/content/strategyCards.ts`** (mechanical summaries, our words)

```ts
import type { StrategyCard } from './schema'

export const strategyCards: StrategyCard[] = [
  { initiative: 1, name: 'Leadership', primary: 'Gain 3 command tokens, then buy more by spending influence (1 token per 3 influence).', secondary: 'Spend influence to gain command tokens (1 per 3 influence).' },
  { initiative: 2, name: 'Diplomacy', primary: 'Choose a system; each other player places a command token there (they cannot activate it). Ready 2 of your planets.', secondary: 'Spend a token to ready 2 planets.' },
  { initiative: 3, name: 'Politics', primary: 'Draw and choose the new speaker, draw 2 action cards, and reorder the agenda deck top/bottom.', secondary: 'Spend a token to draw 2 action cards.' },
  { initiative: 4, name: 'Construction', primary: 'Place a structure (space dock or PDS) on a planet you control, plus a second one.', secondary: 'Spend a token to place 1 structure.' },
  { initiative: 5, name: 'Trade', primary: 'Gain 3 trade goods, replenish your commodities, and let chosen players replenish theirs.', secondary: 'Spend a token to replenish commodities.' },
  { initiative: 6, name: 'Warfare', primary: 'Remove one of your command tokens from the board and redistribute your tokens.', secondary: 'Spend a token to produce units at a space dock in your home system.' },
  { initiative: 7, name: 'Technology', primary: 'Research 1 technology; research a 2nd by paying 6 resources.', secondary: 'Spend a token and 4 resources to research 1 technology.' },
  { initiative: 8, name: 'Imperial', primary: 'Score 1 public objective you qualify for (if any), and gain 1 victory point if you control Mecatol Rex; draw a secret objective.', secondary: 'Spend a token to draw a secret objective.' },
]
```

- [ ] **Step 3: Write `src/content/technologies.ts`** (Jol-Nar's four starting techs + a couple more)

```ts
import type { Technology } from './schema'

export const technologies: Technology[] = [
  { id: 'neural-motivator', name: 'Neural Motivator', color: 'green', prerequisites: [], summary: 'Draw 2 action cards in the Status phase instead of 1.', hasAction: false },
  { id: 'antimass-deflectors', name: 'Antimass Deflectors', color: 'blue', prerequisites: [], summary: 'Ships may move through asteroid fields; -1 to enemy space cannon vs you.', hasAction: false },
  { id: 'sarween-tools', name: 'Sarween Tools', color: 'yellow', prerequisites: [], summary: 'Add 1 resource whenever you resolve production at a unit.', hasAction: false },
  { id: 'plasma-scoring', name: 'Plasma Scoring', color: 'red', prerequisites: [], summary: 'Add 1 die to one bombardment or space cannon roll.', hasAction: false },
  { id: 'fleet-logistics', name: 'Fleet Logistics', color: 'blue', prerequisites: ['blue', 'blue'], summary: 'Take 2 actions during each of your action-phase turns instead of 1.', hasAction: false },
  { id: 'sling-relay', name: 'Sling Relay', color: 'blue', prerequisites: ['blue'], summary: 'ACTION: Produce 1 ship at a space dock you control.', hasAction: true },
]
```

- [ ] **Step 4: Write `src/content/factions.ts`** (the three seed factions)

```ts
import type { Faction } from './schema'

export const factions: Faction[] = [
  {
    id: 'jol-nar',
    name: 'Universities of Jol-Nar',
    combatModifier: -1,
    abilitySummaries: [
      'Fragile: apply -1 to each of your unit’s combat rolls.',
      'Brilliant: when resolving the Technology strategy card’s secondary, you may resolve its primary instead.',
      'Analytical: when you research a non-unit-upgrade technology, you may ignore one prerequisite.',
    ],
    starting: {
      tokens: { tactic: 3, fleet: 3, strategy: 2 },
      techIds: ['neural-motivator', 'antimass-deflectors', 'sarween-tools', 'plasma-scoring'],
      planets: [
        { id: 'jol', name: 'Jol', resources: 1, influence: 2, exhausted: false },
        { id: 'nar', name: 'Nar', resources: 2, influence: 3, exhausted: false },
      ],
      commodities: 4,
      tradeGoods: 0,
    },
  },
  {
    id: 'sol',
    name: 'Federation of Sol',
    combatModifier: 0,
    abilitySummaries: [
      'Orbital Drop: ACTION — place up to 2 infantry on a planet you control in your home system.',
      'Versatile: when you gain command tokens from the Leadership secondary, gain 1 extra.',
    ],
    starting: {
      tokens: { tactic: 3, fleet: 3, strategy: 2 },
      techIds: ['neural-motivator', 'antimass-deflectors'],
      planets: [{ id: 'jord', name: 'Jord', resources: 4, influence: 2, exhausted: false }],
      commodities: 4,
      tradeGoods: 0,
    },
  },
  {
    id: 'sardakk-norr',
    name: "Sardakk N'orr",
    combatModifier: 1,
    abilitySummaries: ['Unrelenting: apply +1 to each of your unit’s combat rolls.'],
    starting: {
      tokens: { tactic: 3, fleet: 3, strategy: 2 },
      techIds: [],
      planets: [
        { id: 'quinarra', name: 'Quinarra', resources: 3, influence: 1, exhausted: false },
        { id: 'tren-lak', name: "Tren'lak", resources: 1, influence: 0, exhausted: false },
      ],
      commodities: 3,
      tradeGoods: 0,
    },
  },
]
```

- [ ] **Step 5: Write `src/content/objectives.ts`**

```ts
import type { Objective } from './schema'

export const objectives: Objective[] = [
  { id: 'diversify-research', name: 'Diversify Research', points: 1, phase: 'status', summary: 'Own 2 technologies in each of 2 colors.' },
  { id: 'develop-weaponry', name: 'Develop Weaponry', points: 1, phase: 'status', summary: 'Own 2 unit-upgrade technologies.' },
  { id: 'lead-from-front', name: 'Lead From the Front', points: 1, phase: 'status', summary: 'Spend a total of 3 command tokens from your pools.' },
]
```

- [ ] **Step 6: Write the failing validation test**

```ts
// src/content/content.test.ts
import { describe, it, expect } from 'vitest'
import { content, getFaction } from './index'

describe('content registry', () => {
  it('validates and exposes all 8 strategy cards', () => {
    expect(content.strategyCards).toHaveLength(8)
    expect(content.strategyCards.map((c) => c.initiative).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('includes the three seed factions', () => {
    expect(content.factions.map((f) => f.id).sort()).toEqual(['jol-nar', 'sardakk-norr', 'sol'])
  })

  it('gives Jol-Nar its four starting techs and -1 combat', () => {
    const jn = getFaction('jol-nar')!
    expect(jn.combatModifier).toBe(-1)
    expect(jn.starting.techIds).toHaveLength(4)
  })

  it('every faction starting techId resolves to a known technology', () => {
    const techIds = new Set(content.technologies.map((t) => t.id))
    for (const f of content.factions) {
      for (const id of f.starting.techIds) expect(techIds.has(id)).toBe(true)
    }
  })
})
```

- [ ] **Step 7: Write `src/content/index.ts`** (validates at load)

```ts
import { z } from 'zod'
import { factionSchema, objectiveSchema, strategyCardSchema, technologySchema, type Faction } from './schema'
import { strategyCards } from './strategyCards'
import { technologies } from './technologies'
import { factions } from './factions'
import { objectives } from './objectives'

export const content = {
  strategyCards: z.array(strategyCardSchema).parse(strategyCards),
  technologies: z.array(technologySchema).parse(technologies),
  factions: z.array(factionSchema).parse(factions),
  objectives: z.array(objectiveSchema).parse(objectives),
}

export function getFaction(id: string): Faction | undefined {
  return content.factions.find((f) => f.id === id)
}

export type { Faction, Technology, StrategyCard, Objective } from './schema'
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run src/content/content.test.ts`
Expected: PASS (4 tests). If a Zod `parse` throws at import, the data is malformed — fix the offending entry.

- [ ] **Step 9: Commit**

```bash
git add src/content
git commit -m "feat: Zod-validated content registry with seed data (Jol-Nar, Sol, N'orr)"
```

---

### Task 8: Persistence — IndexedDB save/load + export/import

**Files:**
- Create: `src/persistence/storage.ts`, `src/persistence/storage.test.ts`

**Interfaces:**
- Consumes: `GameState`.
- Produces:
  - `saveGame(id: string, state: GameState): Promise<void>`
  - `loadGame(id: string): Promise<GameState | undefined>`
  - `listGames(): Promise<string[]>`
  - `exportGame(state: GameState): string` (JSON)
  - `importGame(json: string): GameState` (throws on malformed JSON)

- [ ] **Step 1: Write the failing tests**

```ts
// src/persistence/storage.test.ts
import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { saveGame, loadGame, listGames, exportGame, importGame } from './storage'
import { createInitialState } from '../domain/initialState'
import type { FactionStartingInfo } from '../domain/types'

const faction: FactionStartingInfo = {
  id: 'sol', name: 'Federation of Sol', combatModifier: 0,
  starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], commodities: 2, tradeGoods: 0 },
}
const state = () => createInitialState(faction, { turnOrder: 1, speaker: false })

describe('persistence', () => {
  it('saves and loads a game by id', async () => {
    const s = { ...state(), tradeGoods: 7 }
    await saveGame('game-1', s)
    const loaded = await loadGame('game-1')
    expect(loaded?.tradeGoods).toBe(7)
  })

  it('lists saved game ids', async () => {
    await saveGame('game-a', state())
    await saveGame('game-b', state())
    const ids = await listGames()
    expect(ids).toEqual(expect.arrayContaining(['game-a', 'game-b']))
  })

  it('returns undefined for a missing game', async () => {
    expect(await loadGame('nope')).toBeUndefined()
  })

  it('exports to JSON and imports back to an equal state', () => {
    const s = { ...state(), victoryPoints: 3 }
    const round = importGame(exportGame(s))
    expect(round).toEqual(s)
  })

  it('throws importing malformed JSON', () => {
    expect(() => importGame('{not json')).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/persistence/storage.test.ts`
Expected: FAIL — cannot find module `./storage`.

- [ ] **Step 3: Write `src/persistence/storage.ts`**

```ts
import { openDB, type IDBPDatabase } from 'idb'
import type { GameState } from '../domain/types'

const DB_NAME = 'ti4-assistant'
const STORE = 'games'

let dbPromise: Promise<IDBPDatabase> | null = null
function db() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(d) {
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE)
      },
    })
  }
  return dbPromise
}

export async function saveGame(id: string, state: GameState): Promise<void> {
  await (await db()).put(STORE, state, id)
}

export async function loadGame(id: string): Promise<GameState | undefined> {
  return (await (await db()).get(STORE, id)) as GameState | undefined
}

export async function listGames(): Promise<string[]> {
  return (await (await db()).getAllKeys(STORE)) as string[]
}

export function exportGame(state: GameState): string {
  return JSON.stringify(state, null, 2)
}

export function importGame(json: string): GameState {
  return JSON.parse(json) as GameState
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/persistence/storage.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/persistence
git commit -m "feat: IndexedDB persistence with export/import"
```

---

### Task 9: Vertical-slice UI — run a full turn loop

**Files:**
- Modify: `src/App.svelte`
- Create: `src/App.test.ts`

**Interfaces:**
- Consumes: `content`/`getFaction`, `createInitialState`, `createGameStore`, `getAvailableActions`, `getReminders`, and (for component actions) the technologies with `hasAction`.
- Produces: a single screen that shows the phase/round/resources, lists available actions from the engine, applies them via the store, advances phases, and shows reminders. This is deliberately unstyled — Plan 2 replaces it with the guided UX.

- [ ] **Step 1: Write `src/App.svelte`**

```svelte
<script lang="ts">
  import { getFaction, content } from './content/index'
  import { createInitialState } from './domain/initialState'
  import { createGameStore } from './state/store.svelte'
  import { getAvailableActions, getReminders } from './engine/index'
  import type { GameAction } from './domain/types'

  // Vertical slice: start a Jol-Nar game and jump into the action phase.
  const faction = getFaction('jol-nar')!
  const store = createGameStore({
    ...createInitialState(faction, { turnOrder: 1, speaker: true }),
    phase: 'action',
    strategyCardIds: [7],
  })

  // Component-action sources = the player's techs that have an ACTION ability.
  const sources = $derived(
    content.technologies
      .filter((t) => t.hasAction && store.state.technologyIds.includes(t.id))
      .map((t) => ({ id: t.id, summary: t.summary })),
  )
  const actions = $derived(getAvailableActions(store.state, { componentActionSources: sources }))
  const reminders = $derived(getReminders(store.state))

  function run(type: GameAction['type']) {
    if (type === 'componentAction') store.dispatch({ type, sourceId: 'x', summary: 'component action' })
    else store.dispatch({ type } as GameAction)
  }
</script>

<main style="font-family: system-ui; max-width: 480px; margin: 0 auto; padding: 1rem;">
  <h1>{faction.name}</h1>
  <p>Round {store.state.round} — <strong>{store.state.phase}</strong> phase</p>
  <p>Tactic {store.state.command.tactic} · Fleet {store.state.command.fleet} · Strategy {store.state.command.strategy}
     · Trade goods {store.state.tradeGoods} · VP {store.state.victoryPoints}</p>

  <h2>What can I do now?</h2>
  {#if actions.length === 0}
    <p>No action-phase options. Advance the phase.</p>
  {/if}
  <ul>
    {#each actions as a (a.type + a.label)}
      <li>
        <button onclick={() => run(a.type)}>{a.label}</button>
        <small>{a.explanation}</small>
      </li>
    {/each}
  </ul>

  <button onclick={() => store.dispatch({ type: 'advancePhase' })}>Advance phase →</button>
  <button onclick={() => store.undo()} disabled={!store.canUndo()}>Undo</button>

  {#if reminders.length}
    <h3>Reminders</h3>
    <ul>
      {#each reminders as r (r.id)}
        <li>{r.severity === 'warn' ? '⚠️' : 'ℹ️'} {r.text}</li>
      {/each}
    </ul>
  {/if}
</main>
```

- [ ] **Step 2: Write the component test**

```ts
// src/App.test.ts
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import App from './App.svelte'

describe('App vertical slice', () => {
  it('renders the faction and the strategic-action option', async () => {
    render(App)
    expect(screen.getByText('Universities of Jol-Nar')).toBeTruthy()
    // Jol-Nar holds strategy card 7 and has not used the primary, so strategic action is offered.
    expect(screen.getByRole('button', { name: 'Strategic action' })).toBeTruthy()
  })
})
```

- [ ] **Step 3: Run the component test**

Run: `npx vitest run src/App.test.ts`
Expected: PASS (1 test).

- [ ] **Step 4: Manually verify the loop in the browser**

Run: `npm run dev`
Open the printed URL. Verify:
- Strategic action, Tactical action, and (since Jol-Nar has no ACTION tech) no component action are listed.
- Clicking Tactical action decrements the tactic count.
- After clicking Strategic action, a Pass button appears.
- "Advance phase" moves action → status → strategy and increments the round.
- Undo reverts the last change.
Ctrl-C when done.

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: all tests pass across domain, engine, state, content, persistence, App.

- [ ] **Step 6: Commit**

```bash
git add src/App.svelte src/App.test.ts
git commit -m "feat: vertical-slice UI running a full turn loop"
```

---

## Self-review (completed by author)

- **Spec coverage (Plan 1 subset):** state store ✓ (T2/T6), rules engine availability ✓ (T3), reminders ✓ (T4), data-driven content + validation ✓ (T7), persistence + export/import ✓ (T8), assistant-not-referee (editState, clamping, no throws) ✓ (T5), offline PWA scaffold ✓ (T1, full offline in Plan 3), seed factions incl. Jol-Nar ✓ (T7). Deferred to later plans by design: setup wizard, dashboard/turn-panel UX, status checklist, agenda, reference browser (Plan 2); service-worker offline + GitHub Pages deploy (Plan 3).
- **Type consistency:** `GameState`, `GameAction`, `CommandPools`, `Planet`, `FactionStartingInfo` used identically across T2–T9. Content `Faction` is structurally compatible with `FactionStartingInfo` (same `starting` shape) so `getFaction(...)` feeds `createInitialState(...)` directly (used in T9).
- **Placeholder scan:** none — every step has runnable code/commands and expected output.

---

## Roadmap (subsequent plans — written after Plan 1 lands)

- **Plan 2 — Guided UX:** setup wizard (content/player-count/faction → seed state), dashboard, turn panel with teaching explanations, status-phase checklist, agenda vote-tracker stub, reference browser, reminder surface. Replaces the Task 9 slice.
- **Plan 3 — PWA + deploy:** service-worker precache for full offline, install/manifest + icons, GitHub Pages deploy (`base: '/ti4-assistant/'`), first-load caching verified on a phone.
- **Beyond v1 (new spec cycles):** all PoK factions + full tech tree + leaders/mechs/exploration component actions + action/agenda card data; then Thunder's Edge content + galactic events; optional combat dice roller.
```