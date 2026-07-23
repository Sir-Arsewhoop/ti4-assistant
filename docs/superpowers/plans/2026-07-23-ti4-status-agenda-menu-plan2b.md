# TI4 Guided UX — Plan 2b: Status / Agenda + Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the guided UX: an interactive Status-phase checklist, an Agenda-phase stub (gated on a new `custodiansTaken` flag), and the ☰ menu (reference browser, manual board editor, and game new/export/import).

**Architecture:** One targeted Plan 1 core change adds `custodiansTaken` to `GameState` and fixes `advancePhase` routing so the agenda phase is reachable. Everything else is new presentational components under `src/lib/components/` that take plain props and call back through function props; `App.svelte` routes status/agenda, hosts the menu, and owns the persistence/store handlers.

**Tech Stack:** Svelte 5 (runes), TypeScript 5 (strict), Vitest 2, `@testing-library/svelte` 5 (jsdom), the Plan 1 core + Plan 2a components (`ExpandableItem`).

## Global Constraints

- Svelte 5 **runes** only (`$props`, `$state`, `$derived`, `$effect`) — no stores, no `export let`, no `createEventDispatcher`. Events are callback props.
- TypeScript `strict: true`; `import type` for type-only imports.
- **The only core edit this plan makes is Task 1** (`custodiansTaken` + `advancePhase`). No other change to `src/domain`, `src/engine`, `src/content`, `src/persistence`, or `src/state/store.svelte.ts`.
- Presentational components: props in, callbacks out. Store/engine/persistence wiring lives only in `App.svelte`.
- Teaching via the existing `ExpandableItem` (`{title, summary, detail}`).
- Manual/override edits and status adjustments dispatch the existing `editState` action; components **clamp at 0** before dispatching where negatives are meaningless (command pools, trade goods, commodities, VP).
- Theme-aware: colors from the `src/app.css` variables (already defined).
- `npm run check` must stay at **0 errors / 0 warnings**; do not reintroduce the `state_referenced_locally` pattern (`$state` seeded from a prop) — wrap any such seed in `untrack`.
- Tests colocated; `npm test` runs `vitest run`.

---

## File Structure

```
src/
  domain/types.ts            # MODIFY: + custodiansTaken (Task 1)
  domain/initialState.ts     # MODIFY: custodiansTaken: false (Task 1)
  domain/initialState.test.ts# MODIFY: assert the default (Task 1)
  state/reducers.ts          # MODIFY: advancePhase routing (Task 1)
  state/reducers.test.ts     # MODIFY: routing tests (Task 1)
  lib/components/
    StatusChecklist.svelte   # Task 2
    AgendaHelper.svelte      # Task 3
    ReferenceBrowser.svelte  # Task 4
    BoardEditor.svelte       # Task 5
    GamesSheet.svelte        # Task 6
    MenuSheet.svelte         # Task 7 (composes Reference/Board/Games)
  App.svelte                 # MODIFY: routes + menu + game handlers (Task 8)
  App.svelte.test.ts         # MODIFY: status route + menu open (Task 8)
```

Tests sit beside each new component (`*.svelte.test.ts`).

---

### Task 1: Core — `custodiansTaken` + `advancePhase` routing

**Files:**
- Modify: `src/domain/types.ts`, `src/domain/initialState.ts`, `src/state/reducers.ts`
- Modify (tests): `src/domain/initialState.test.ts`, `src/state/reducers.test.ts`

**Interfaces:**
- Consumes: existing `GameState`, `GameAction`, `Phase`.
- Produces: `GameState` gains `custodiansTaken: boolean`. `advancePhase` routes `status → (custodiansTaken ? 'agenda' : 'strategy')`, `agenda → 'strategy'`, others unchanged; round increments and `strategyPrimaryUsed`/`passed` reset when entering `strategy` from a non-`setup` phase.

- [ ] **Step 1: Add the field to `GameState`** — in `src/domain/types.ts`, add `custodiansTaken: boolean` (place it right after `passed: boolean`):

```ts
  passed: boolean
  custodiansTaken: boolean
  log: LogEntry[]
```

- [ ] **Step 2: Seed it in `createInitialState`** — in `src/domain/initialState.ts`, add to the returned object (after `passed: false,`):

```ts
    passed: false,
    custodiansTaken: false,
    log: [],
```

- [ ] **Step 3: Update the failing reducer tests first** — in `src/state/reducers.test.ts`, replace the existing `advancePhase` test with these three:

```ts
  it('advancePhase status->strategy (no custodians) bumps the round and resets flags', () => {
    let s = base({ phase: 'status', strategyPrimaryUsed: true, passed: true, custodiansTaken: false })
    s = applyAction(s, { type: 'advancePhase' })
    expect(s.phase).toBe('strategy')
    expect(s.round).toBe(2)
    expect(s.strategyPrimaryUsed).toBe(false)
    expect(s.passed).toBe(false)
  })

  it('advancePhase status->agenda when custodians taken, without bumping the round', () => {
    let s = base({ phase: 'status', round: 3, custodiansTaken: true })
    s = applyAction(s, { type: 'advancePhase' })
    expect(s.phase).toBe('agenda')
    expect(s.round).toBe(3)
  })

  it('advancePhase agenda->strategy bumps the round and resets flags', () => {
    let s = base({ phase: 'agenda', round: 3, strategyPrimaryUsed: true, passed: true, custodiansTaken: true })
    s = applyAction(s, { type: 'advancePhase' })
    expect(s.phase).toBe('strategy')
    expect(s.round).toBe(4)
    expect(s.strategyPrimaryUsed).toBe(false)
    expect(s.passed).toBe(false)
  })
```

- [ ] **Step 4: Run tests to verify the new routing tests fail**

Run: `npx vitest run src/state/reducers.test.ts`
Expected: FAIL — the status→agenda test fails (current code sends status→strategy and bumps on leaving status).

- [ ] **Step 5: Rewrite the `advancePhase` case** in `src/state/reducers.ts`:

```ts
    case 'advancePhase': {
      const next: Phase =
        state.phase === 'status'
          ? state.custodiansTaken
            ? 'agenda'
            : 'strategy'
          : NEXT_PHASE[state.phase]
      const enteringNewRound = next === 'strategy' && state.phase !== 'setup'
      return {
        ...state,
        phase: next,
        round: state.round + (enteringNewRound ? 1 : 0),
        strategyPrimaryUsed: next === 'strategy' ? false : state.strategyPrimaryUsed,
        passed: next === 'strategy' ? false : state.passed,
        log: log(state, `Advanced to ${next} phase`),
      }
    }
```

(Leave the `NEXT_PHASE` map as-is; the `status` entry is now overridden by the conditional.)

- [ ] **Step 6: Add the initialState assertion** — in `src/domain/initialState.test.ts`, add to the first test's assertions:

```ts
    expect(s.custodiansTaken).toBe(false)
```

- [ ] **Step 7: Run the full suite**

Run: `npm test`
Expected: PASS — the three new routing tests pass, the initialState assertion passes, and no prior test regresses (every `GameState` is built via `createInitialState`, which now sets the field).

- [ ] **Step 8: Verify types + commit**

Run: `npm run check`
Expected: 0 errors, 0 warnings.

```bash
git add src/domain/types.ts src/domain/initialState.ts src/domain/initialState.test.ts src/state/reducers.ts src/state/reducers.test.ts
git commit -m "feat: custodiansTaken flag + agenda-aware advancePhase routing"
```

---

### Task 2: `StatusChecklist.svelte`

**Files:**
- Create: `src/lib/components/StatusChecklist.svelte`, `src/lib/components/StatusChecklist.svelte.test.ts`

**Interfaces:**
- Consumes: `GameState`, `GameAction` (`../../domain/types`); `Objective` (`../../content/schema`); `ExpandableItem`.
- Produces: props `{ state: GameState; objectives: Objective[]; onAction: (a: GameAction) => void }`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/components/StatusChecklist.svelte.test.ts
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import StatusChecklist from './StatusChecklist.svelte'
import { createInitialState } from '../../domain/initialState'
import type { FactionStartingInfo } from '../../domain/types'
import type { Objective } from '../../content/schema'

const faction: FactionStartingInfo = {
  id: 'sol', name: 'Federation of Sol', combatModifier: 0,
  starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [{ id: 'jord', name: 'Jord', resources: 4, influence: 2, exhausted: true }], commodities: 4, tradeGoods: 0 },
}
const objectives: Objective[] = [
  { id: 'obj-a', name: 'Diversify Research', points: 1, phase: 'status', summary: 'Own 2 techs in 2 colors.' },
]
const state = () => ({ ...createInitialState(faction, { turnOrder: 1, speaker: false }), phase: 'status' as const })

describe('StatusChecklist', () => {
  it('scores a public objective by id and points', async () => {
    const onAction = vi.fn()
    render(StatusChecklist, { props: { state: state(), objectives, onAction } })
    await fireEvent.click(screen.getByRole('button', { name: /Score: Diversify Research/ }))
    expect(onAction).toHaveBeenCalledWith({ type: 'scorePublicObjective', objectiveId: 'obj-a', points: 1 })
  })

  it('readies all planets via editState', async () => {
    const onAction = vi.fn()
    render(StatusChecklist, { props: { state: state(), objectives, onAction } })
    await fireEvent.click(screen.getByRole('button', { name: /Ready all planets/ }))
    const call = onAction.mock.calls[0][0]
    expect(call.type).toBe('editState')
    expect(call.patch.planets.every((p: { exhausted: boolean }) => p.exhausted === false)).toBe(true)
  })

  it('marks the custodians token taken', async () => {
    const onAction = vi.fn()
    render(StatusChecklist, { props: { state: state(), objectives, onAction } })
    await fireEvent.click(screen.getByRole('button', { name: /custodians token taken/ }))
    expect(onAction).toHaveBeenCalledWith({ type: 'editState', patch: { custodiansTaken: true } })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/components/StatusChecklist.svelte.test.ts`
Expected: FAIL — cannot find module `./StatusChecklist.svelte`.

- [ ] **Step 3: Write `src/lib/components/StatusChecklist.svelte`**

```svelte
<script lang="ts">
  import type { GameState, GameAction } from '../../domain/types'
  import type { Objective } from '../../content/schema'
  import ExpandableItem from './ExpandableItem.svelte'

  interface Props { state: GameState; objectives: Objective[]; onAction: (a: GameAction) => void }
  let { state, objectives, onAction }: Props = $props()

  const unscored = $derived(objectives.filter((o) => !state.scoredPublicObjectiveIds.includes(o.id)))

  let drewCards = $state(false)
  let repaired = $state(false)

  function scorePublic(o: Objective) {
    onAction({ type: 'scorePublicObjective', objectiveId: o.id, points: o.points })
  }
  function scoreSecret() {
    onAction({ type: 'editState', patch: {
      secretObjectives: [...state.secretObjectives, { id: `secret-${state.secretObjectives.length + 1}`, scored: true }],
      victoryPoints: state.victoryPoints + 1,
    } })
  }
  function adjustPool(pool: 'tactic' | 'fleet' | 'strategy', delta: number) {
    onAction({ type: 'editState', patch: { command: { ...state.command, [pool]: Math.max(0, state.command[pool] + delta) } } })
  }
  function readyAll() {
    onAction({ type: 'editState', patch: { planets: state.planets.map((p) => ({ ...p, exhausted: false })) } })
  }
</script>

<h2 style="font-size:18px;font-weight:500;">Status phase</h2>

<ExpandableItem title="Score a public objective" summary="If you qualify, claim 1 public objective for VP." detail="Once per status phase you may score a single public objective you meet the requirement for." />
{#each unscored as o (o.id)}
  <button onclick={() => scorePublic(o)} style="display:block;margin:4px 0;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Score: {o.name} (+{o.points})</button>
{/each}
{#if unscored.length === 0}<p style="color:var(--text-muted);font-size:14px;">All seeded public objectives scored.</p>{/if}

<ExpandableItem title="Score a secret objective" summary="If you completed one, reveal it for VP." detail="Secret objective content isn't loaded yet, so this just records a secret scored (+1 VP)." />
<button onclick={scoreSecret} style="padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Scored a secret (+1 VP)</button>

<ExpandableItem title="Gain + redistribute command tokens" summary="Gain 2 tokens, then place them across your pools." detail="In the status phase you gain 2 command tokens and redistribute your pools." />
{#each (['tactic', 'fleet', 'strategy'] as const) as pool (pool)}
  <div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
    <span style="width:80px;text-transform:capitalize;">{pool}</span>
    <button onclick={() => adjustPool(pool, -1)} aria-label={`decrease ${pool}`} style="width:32px;">-</button>
    <span style="width:24px;text-align:center;">{state.command[pool]}</span>
    <button onclick={() => adjustPool(pool, 1)} aria-label={`increase ${pool}`} style="width:32px;">+</button>
  </div>
{/each}

<ExpandableItem title="Ready planets" summary="Ready all your exhausted planets." detail="At the end of the status phase all your planets ready." />
<button onclick={readyAll} style="padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Ready all planets</button>

<div style="margin-top:12px;display:flex;flex-direction:column;gap:6px;color:var(--text-muted);font-size:14px;">
  <label><input type="checkbox" bind:checked={drewCards} /> Drew action card(s)</label>
  <label><input type="checkbox" bind:checked={repaired} /> Repaired units</label>
</div>

{#if !state.custodiansTaken}
  <ExpandableItem title="Custodians token" summary="Taken Mecatol Rex this game yet?" detail="Once a player takes the custodians token from Mecatol Rex, every following round ends with an agenda phase." />
  <button onclick={() => onAction({ type: 'editState', patch: { custodiansTaken: true } })} style="padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Mark custodians token taken</button>
{/if}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/components/StatusChecklist.svelte.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/StatusChecklist.svelte src/lib/components/StatusChecklist.svelte.test.ts
git commit -m "feat: interactive StatusChecklist"
```

---

### Task 3: `AgendaHelper.svelte`

**Files:**
- Create: `src/lib/components/AgendaHelper.svelte`, `src/lib/components/AgendaHelper.svelte.test.ts`

**Interfaces:**
- Consumes: `GameState`, `GameAction`.
- Produces: props `{ state: GameState; onAction: (a: GameAction) => void }`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/components/AgendaHelper.svelte.test.ts
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import AgendaHelper from './AgendaHelper.svelte'
import { createInitialState } from '../../domain/initialState'
import type { FactionStartingInfo, GameState } from '../../domain/types'

const faction: FactionStartingInfo = {
  id: 'sol', name: 'Federation of Sol', combatModifier: 0,
  starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], commodities: 4, tradeGoods: 0 },
}
const state = (over: Partial<GameState> = {}) => ({ ...createInitialState(faction, { turnOrder: 1, speaker: false }), phase: 'agenda' as const, ...over })

describe('AgendaHelper', () => {
  it('offers the custodians toggle when the token is not yet taken', async () => {
    const onAction = vi.fn()
    render(AgendaHelper, { props: { state: state({ custodiansTaken: false }), onAction } })
    await fireEvent.click(screen.getByRole('button', { name: /custodians token taken/ }))
    expect(onAction).toHaveBeenCalledWith({ type: 'editState', patch: { custodiansTaken: true } })
  })

  it('tallies votes once custodians is taken', async () => {
    render(AgendaHelper, { props: { state: state({ custodiansTaken: true }), onAction: () => {} } })
    await fireEvent.click(screen.getByRole('button', { name: /vote for/i }))
    await fireEvent.click(screen.getByRole('button', { name: /vote for/i }))
    expect(screen.getByText(/Total votes cast: 2/)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/components/AgendaHelper.svelte.test.ts`
Expected: FAIL — cannot find module `./AgendaHelper.svelte`.

- [ ] **Step 3: Write `src/lib/components/AgendaHelper.svelte`**

```svelte
<script lang="ts">
  import type { GameState, GameAction } from '../../domain/types'

  interface Props { state: GameState; onAction: (a: GameAction) => void }
  let { state, onAction }: Props = $props()

  let forV = $state(0)
  let against = $state(0)
  let abstain = $state(0)
  const total = $derived(forV + against + abstain)
</script>

<h2 style="font-size:18px;font-weight:500;">Agenda phase</h2>

{#if !state.custodiansTaken}
  <p style="color:var(--text-muted);font-size:14px;">The agenda phase begins only after a player takes the Mecatol Rex custodians token.</p>
  <button onclick={() => onAction({ type: 'editState', patch: { custodiansTaken: true } })} style="padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Mark custodians token taken</button>
{:else}
  <p style="color:var(--text-muted);font-size:14px;">Vote tally (scratchpad — not saved with the game).</p>
  <div style="display:flex;flex-direction:column;gap:6px;">
    <div><button aria-label="vote for" onclick={() => forV++} style="width:36px;">+</button> For: {forV}</div>
    <div><button aria-label="vote against" onclick={() => against++} style="width:36px;">+</button> Against: {against}</div>
    <div><button aria-label="vote abstain" onclick={() => abstain++} style="width:36px;">+</button> Abstain: {abstain}</div>
  </div>
  <p style="margin-top:8px;">Total votes cast: {total}</p>
  <button onclick={() => { forV = 0; against = 0; abstain = 0 }} style="padding:6px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Reset tally</button>
{/if}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/components/AgendaHelper.svelte.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/AgendaHelper.svelte src/lib/components/AgendaHelper.svelte.test.ts
git commit -m "feat: AgendaHelper stub with custodians toggle and vote tally"
```

---

### Task 4: `ReferenceBrowser.svelte`

**Files:**
- Create: `src/lib/components/ReferenceBrowser.svelte`, `src/lib/components/ReferenceBrowser.svelte.test.ts`

**Interfaces:**
- Consumes: `Faction`, `Technology`, `StrategyCard`, `Objective` (`../../content/schema`); `ExpandableItem`.
- Produces: props `{ factions: Faction[]; technologies: Technology[]; strategyCards: StrategyCard[]; objectives: Objective[] }`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/components/ReferenceBrowser.svelte.test.ts
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import ReferenceBrowser from './ReferenceBrowser.svelte'
import type { Faction, Technology, StrategyCard, Objective } from '../../content/schema'

const factions: Faction[] = [
  { id: 'jol-nar', name: 'Universities of Jol-Nar', combatModifier: -1, abilitySummaries: ['Fragile: -1 combat.'], starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], commodities: 4, tradeGoods: 0 } },
  { id: 'sol', name: 'Federation of Sol', combatModifier: 0, abilitySummaries: ['Orbital Drop.'], starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], commodities: 4, tradeGoods: 0 } },
]
const technologies: Technology[] = [
  { id: 'plasma-scoring', name: 'Plasma Scoring', color: 'red', prerequisites: [], summary: 'Add 1 die.', hasAction: false },
]
const strategyCards: StrategyCard[] = [{ initiative: 7, name: 'Technology', primary: 'Research.', secondary: 'Pay to research.' }]
const objectives: Objective[] = [{ id: 'o1', name: 'Diversify Research', points: 1, phase: 'status', summary: 'Own techs.' }]

describe('ReferenceBrowser', () => {
  it('shows factions by default and filters by search text', async () => {
    render(ReferenceBrowser, { props: { factions, technologies, strategyCards, objectives } })
    expect(screen.getByText('Universities of Jol-Nar')).toBeTruthy()
    expect(screen.getByText('Federation of Sol')).toBeTruthy()
    await fireEvent.input(screen.getByPlaceholderText('Search'), { target: { value: 'jol' } })
    expect(screen.getByText('Universities of Jol-Nar')).toBeTruthy()
    expect(screen.queryByText('Federation of Sol')).toBeNull()
  })

  it('switches to the technology list', async () => {
    render(ReferenceBrowser, { props: { factions, technologies, strategyCards, objectives } })
    await fireEvent.click(screen.getByRole('button', { name: /Tech/ }))
    expect(screen.getByText('Plasma Scoring')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/components/ReferenceBrowser.svelte.test.ts`
Expected: FAIL — cannot find module `./ReferenceBrowser.svelte`.

- [ ] **Step 3: Write `src/lib/components/ReferenceBrowser.svelte`**

```svelte
<script lang="ts">
  import type { Faction, Technology, StrategyCard, Objective } from '../../content/schema'
  import ExpandableItem from './ExpandableItem.svelte'

  interface Props { factions: Faction[]; technologies: Technology[]; strategyCards: StrategyCard[]; objectives: Objective[] }
  let { factions, technologies, strategyCards, objectives }: Props = $props()

  type Kind = 'faction' | 'tech' | 'strategy' | 'objective'
  type Entry = { id: string; title: string; summary: string; detail: string }

  let kind = $state<Kind>('faction')
  let q = $state('')

  const all = $derived<Entry[]>(
    kind === 'faction'
      ? factions.map((f) => ({ id: f.id, title: f.name, summary: f.abilitySummaries[0] ?? '', detail: f.abilitySummaries.join('\n') }))
      : kind === 'tech'
        ? technologies.map((t) => ({ id: t.id, title: t.name, summary: t.summary, detail: `${t.color} · prereqs: ${t.prerequisites.join(', ') || 'none'}\n${t.summary}` }))
        : kind === 'strategy'
          ? strategyCards.map((c) => ({ id: String(c.initiative), title: `${c.initiative}. ${c.name}`, summary: c.primary, detail: `Primary: ${c.primary}\nSecondary: ${c.secondary}` }))
          : objectives.map((o) => ({ id: o.id, title: o.name, summary: o.summary, detail: `${o.points} VP · ${o.phase}\n${o.summary}` })),
  )
  const entries = $derived(all.filter((e) => e.title.toLowerCase().includes(q.toLowerCase())))

  const tabs: { k: Kind; label: string }[] = [
    { k: 'faction', label: 'Factions' },
    { k: 'tech', label: 'Tech' },
    { k: 'strategy', label: 'Strategy' },
    { k: 'objective', label: 'Objectives' },
  ]
</script>

<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
  {#each tabs as t (t.k)}
    <button onclick={() => (kind = t.k)} style="padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:{kind === t.k ? 'var(--accent)' : 'var(--surface)'};color:{kind === t.k ? '#fff' : 'var(--text)'};cursor:pointer;">{t.label}</button>
  {/each}
</div>
<input placeholder="Search" bind:value={q} style="width:100%;padding:8px;margin-bottom:8px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--text);" />
{#each entries as e (kind + e.id)}
  <ExpandableItem title={e.title} summary={e.summary} detail={e.detail} />
{/each}
{#if entries.length === 0}<p style="color:var(--text-muted);font-size:14px;">No matches.</p>{/if}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/components/ReferenceBrowser.svelte.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/ReferenceBrowser.svelte src/lib/components/ReferenceBrowser.svelte.test.ts
git commit -m "feat: ReferenceBrowser with search and type filter"
```

---

### Task 5: `BoardEditor.svelte`

**Files:**
- Create: `src/lib/components/BoardEditor.svelte`, `src/lib/components/BoardEditor.svelte.test.ts`

**Interfaces:**
- Consumes: `GameState`, `GameAction` (`../../domain/types`); `Technology` (`../../content/schema`).
- Produces: props `{ state: GameState; technologies: Technology[]; onAction: (a: GameAction) => void }`. Every edit dispatches `editState`. Numeric fields clamp at 0.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/components/BoardEditor.svelte.test.ts
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import BoardEditor from './BoardEditor.svelte'
import { createInitialState } from '../../domain/initialState'
import type { FactionStartingInfo } from '../../domain/types'
import type { Technology } from '../../content/schema'

const faction: FactionStartingInfo = {
  id: 'sol', name: 'Federation of Sol', combatModifier: 0,
  starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [{ id: 'jord', name: 'Jord', resources: 4, influence: 2, exhausted: false }], commodities: 4, tradeGoods: 0 },
}
const technologies: Technology[] = [
  { id: 'plasma-scoring', name: 'Plasma Scoring', color: 'red', prerequisites: [], summary: 'Add 1 die.', hasAction: false },
]
const state = () => createInitialState(faction, { turnOrder: 1, speaker: false })

describe('BoardEditor', () => {
  it('increments victory points via editState', async () => {
    const onAction = vi.fn()
    render(BoardEditor, { props: { state: state(), technologies, onAction } })
    await fireEvent.click(screen.getByRole('button', { name: /increase victory points/ }))
    expect(onAction).toHaveBeenCalledWith({ type: 'editState', patch: { victoryPoints: 1 } })
  })

  it('toggles a planet exhausted state via editState', async () => {
    const onAction = vi.fn()
    render(BoardEditor, { props: { state: state(), technologies, onAction } })
    await fireEvent.click(screen.getByRole('button', { name: /toggle Jord/ }))
    const call = onAction.mock.calls[0][0]
    expect(call.patch.planets.find((p: { id: string }) => p.id === 'jord').exhausted).toBe(true)
  })

  it('adds a technology via editState', async () => {
    const onAction = vi.fn()
    render(BoardEditor, { props: { state: state(), technologies, onAction } })
    await fireEvent.click(screen.getByRole('button', { name: /add Plasma Scoring/ }))
    expect(onAction).toHaveBeenCalledWith({ type: 'editState', patch: { technologyIds: ['plasma-scoring'] } })
  })

  it('clamps trade goods at zero', async () => {
    const onAction = vi.fn()
    render(BoardEditor, { props: { state: state(), technologies, onAction } })
    await fireEvent.click(screen.getByRole('button', { name: /decrease trade goods/ }))
    expect(onAction).toHaveBeenCalledWith({ type: 'editState', patch: { tradeGoods: 0 } })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/components/BoardEditor.svelte.test.ts`
Expected: FAIL — cannot find module `./BoardEditor.svelte`.

- [ ] **Step 3: Write `src/lib/components/BoardEditor.svelte`**

```svelte
<script lang="ts">
  import type { GameState, GameAction } from '../../domain/types'
  import type { Technology } from '../../content/schema'

  interface Props { state: GameState; technologies: Technology[]; onAction: (a: GameAction) => void }
  let { state, technologies, onAction }: Props = $props()

  function setNum(field: 'victoryPoints' | 'tradeGoods' | 'commodities', delta: number) {
    onAction({ type: 'editState', patch: { [field]: Math.max(0, state[field] + delta) } })
  }
  function setPool(pool: 'tactic' | 'fleet' | 'strategy', delta: number) {
    onAction({ type: 'editState', patch: { command: { ...state.command, [pool]: Math.max(0, state.command[pool] + delta) } } })
  }
  function togglePlanet(id: string) {
    onAction({ type: 'editState', patch: { planets: state.planets.map((p) => (p.id === id ? { ...p, exhausted: !p.exhausted } : p)) } })
  }
  function toggleTech(id: string) {
    const owned = state.technologyIds.includes(id)
    onAction({ type: 'editState', patch: { technologyIds: owned ? state.technologyIds.filter((t) => t !== id) : [...state.technologyIds, id] } })
  }

  const numeric: { field: 'victoryPoints' | 'tradeGoods' | 'commodities'; label: string }[] = [
    { field: 'victoryPoints', label: 'victory points' },
    { field: 'tradeGoods', label: 'trade goods' },
    { field: 'commodities', label: 'commodities' },
  ]
</script>

<h3 style="font-size:16px;font-weight:500;">Edit your state</h3>
<p style="color:var(--text-muted);font-size:13px;">The app guides; it never locks you in. Fix anything here.</p>

{#each numeric as n (n.field)}
  <div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
    <span style="width:110px;">{n.label}</span>
    <button onclick={() => setNum(n.field, -1)} aria-label={`decrease ${n.label}`} style="width:32px;">-</button>
    <span style="width:24px;text-align:center;">{state[n.field]}</span>
    <button onclick={() => setNum(n.field, 1)} aria-label={`increase ${n.label}`} style="width:32px;">+</button>
  </div>
{/each}

{#each (['tactic', 'fleet', 'strategy'] as const) as pool (pool)}
  <div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
    <span style="width:110px;text-transform:capitalize;">{pool} pool</span>
    <button onclick={() => setPool(pool, -1)} aria-label={`decrease ${pool}`} style="width:32px;">-</button>
    <span style="width:24px;text-align:center;">{state.command[pool]}</span>
    <button onclick={() => setPool(pool, 1)} aria-label={`increase ${pool}`} style="width:32px;">+</button>
  </div>
{/each}

<h4 style="font-weight:500;margin-top:12px;">Planets</h4>
{#each state.planets as p (p.id)}
  <button onclick={() => togglePlanet(p.id)} aria-label={`toggle ${p.name}`} style="display:block;margin:4px 0;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">{p.name}: {p.exhausted ? 'exhausted' : 'ready'}</button>
{/each}

<h4 style="font-weight:500;margin-top:12px;">Technologies</h4>
{#each technologies as t (t.id)}
  {@const owned = state.technologyIds.includes(t.id)}
  <button onclick={() => toggleTech(t.id)} aria-label={`${owned ? 'remove' : 'add'} ${t.name}`} style="display:block;margin:4px 0;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:{owned ? 'var(--surface-2)' : 'var(--surface)'};cursor:pointer;">{owned ? '✓ ' : '+ '}{t.name}</button>
{/each}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/components/BoardEditor.svelte.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/BoardEditor.svelte src/lib/components/BoardEditor.svelte.test.ts
git commit -m "feat: BoardEditor manual state override"
```

---

### Task 6: `GamesSheet.svelte`

**Files:**
- Create: `src/lib/components/GamesSheet.svelte`, `src/lib/components/GamesSheet.svelte.test.ts`

**Interfaces:**
- Consumes: nothing beyond Svelte.
- Produces: props `{ onNewGame: () => void; onExport: () => void; onImport: (file: File) => void }`. "New game" requires a two-tap confirm before calling `onNewGame`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/components/GamesSheet.svelte.test.ts
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import GamesSheet from './GamesSheet.svelte'

describe('GamesSheet', () => {
  it('calls onExport', async () => {
    const onExport = vi.fn()
    render(GamesSheet, { props: { onNewGame: () => {}, onExport, onImport: () => {} } })
    await fireEvent.click(screen.getByRole('button', { name: /Export/ }))
    expect(onExport).toHaveBeenCalledOnce()
  })

  it('requires a confirm before calling onNewGame', async () => {
    const onNewGame = vi.fn()
    render(GamesSheet, { props: { onNewGame, onExport: () => {}, onImport: () => {} } })
    await fireEvent.click(screen.getByRole('button', { name: /New game/ }))
    expect(onNewGame).not.toHaveBeenCalled()
    await fireEvent.click(screen.getByRole('button', { name: /Confirm new game/ }))
    expect(onNewGame).toHaveBeenCalledOnce()
  })

  it('passes the imported file to onImport', async () => {
    const onImport = vi.fn()
    render(GamesSheet, { props: { onNewGame: () => {}, onExport: () => {}, onImport } })
    const file = new File(['{}'], 'save.json', { type: 'application/json' })
    const input = screen.getByLabelText(/Import game file/)
    await fireEvent.change(input, { target: { files: [file] } })
    expect(onImport).toHaveBeenCalledWith(file)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/components/GamesSheet.svelte.test.ts`
Expected: FAIL — cannot find module `./GamesSheet.svelte`.

- [ ] **Step 3: Write `src/lib/components/GamesSheet.svelte`**

```svelte
<script lang="ts">
  interface Props { onNewGame: () => void; onExport: () => void; onImport: (file: File) => void }
  let { onNewGame, onExport, onImport }: Props = $props()

  let confirming = $state(false)

  function handleFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (file) onImport(file)
  }
</script>

<h3 style="font-size:16px;font-weight:500;">Games</h3>

{#if confirming}
  <button onclick={() => { confirming = false; onNewGame() }} style="padding:8px 12px;border:1px solid var(--warn);border-radius:var(--radius);background:var(--surface);color:var(--warn);cursor:pointer;">Confirm new game (discards unsaved edits)</button>
  <button onclick={() => (confirming = false)} style="margin-left:8px;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Cancel</button>
{:else}
  <button onclick={() => (confirming = true)} style="padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">New game</button>
{/if}

<div style="margin-top:12px;display:flex;flex-direction:column;gap:8px;align-items:flex-start;">
  <button onclick={onExport} style="padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Export game (JSON)</button>
  <label style="font-size:14px;">Import game file
    <input type="file" accept="application/json,.json" aria-label="Import game file" onchange={handleFile} style="display:block;margin-top:4px;" />
  </label>
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/components/GamesSheet.svelte.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/GamesSheet.svelte src/lib/components/GamesSheet.svelte.test.ts
git commit -m "feat: GamesSheet new/export/import"
```

---

### Task 7: `MenuSheet.svelte`

**Files:**
- Create: `src/lib/components/MenuSheet.svelte`, `src/lib/components/MenuSheet.svelte.test.ts`

**Interfaces:**
- Consumes: `GameState`, `GameAction`; the content types; `ReferenceBrowser`, `BoardEditor`, `GamesSheet`.
- Produces: props
  `{ open: boolean; onClose: () => void; state: GameState; factions: Faction[]; technologies: Technology[]; strategyCards: StrategyCard[]; objectives: Objective[]; themeLabel: string; onToggleTheme: () => void; onAction: (a: GameAction) => void; onNewGame: () => void; onExport: () => void; onImport: (file: File) => void }`.
  Renders nothing when `open` is false. When open: a normal-flow overlay (no `position: fixed`) with a backdrop, a header with a close button, a section switcher (Reference / Your board / Games), a theme toggle, and the active section.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/components/MenuSheet.svelte.test.ts
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import MenuSheet from './MenuSheet.svelte'
import { createInitialState } from '../../domain/initialState'
import type { Faction } from '../../content/schema'

const faction: Faction = {
  id: 'sol', name: 'Federation of Sol', combatModifier: 0, abilitySummaries: ['Orbital Drop.'],
  starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], commodities: 4, tradeGoods: 0 },
}
const baseProps = () => ({
  open: true, onClose: vi.fn(), state: createInitialState(faction, { turnOrder: 1, speaker: false }),
  factions: [faction], technologies: [], strategyCards: [], objectives: [],
  themeLabel: 'system', onToggleTheme: vi.fn(), onAction: vi.fn(), onNewGame: vi.fn(), onExport: vi.fn(), onImport: vi.fn(),
})

describe('MenuSheet', () => {
  it('renders nothing when closed', () => {
    const { container } = render(MenuSheet, { props: { ...baseProps(), open: false } })
    expect(container.querySelector('button')).toBeNull()
  })

  it('calls onClose from the close button', async () => {
    const props = baseProps()
    render(MenuSheet, { props })
    await fireEvent.click(screen.getByRole('button', { name: /Close menu/ }))
    expect(props.onClose).toHaveBeenCalledOnce()
  })

  it('switches to the Games section', async () => {
    render(MenuSheet, { props: baseProps() })
    await fireEvent.click(screen.getByRole('button', { name: /^Games$/ }))
    expect(screen.getByRole('button', { name: /Export game/ })).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/components/MenuSheet.svelte.test.ts`
Expected: FAIL — cannot find module `./MenuSheet.svelte`.

- [ ] **Step 3: Write `src/lib/components/MenuSheet.svelte`**

```svelte
<script lang="ts">
  import type { GameState, GameAction } from '../../domain/types'
  import type { Faction, Technology, StrategyCard, Objective } from '../../content/schema'
  import ReferenceBrowser from './ReferenceBrowser.svelte'
  import BoardEditor from './BoardEditor.svelte'
  import GamesSheet from './GamesSheet.svelte'

  interface Props {
    open: boolean
    onClose: () => void
    state: GameState
    factions: Faction[]
    technologies: Technology[]
    strategyCards: StrategyCard[]
    objectives: Objective[]
    themeLabel: string
    onToggleTheme: () => void
    onAction: (a: GameAction) => void
    onNewGame: () => void
    onExport: () => void
    onImport: (file: File) => void
  }
  let { open, onClose, state, factions, technologies, strategyCards, objectives, themeLabel, onToggleTheme, onAction, onNewGame, onExport, onImport }: Props = $props()

  type Section = 'reference' | 'board' | 'games'
  let section = $state<Section>('reference')
  const sections: { s: Section; label: string }[] = [
    { s: 'reference', label: 'Reference' },
    { s: 'board', label: 'Your board' },
    { s: 'games', label: 'Games' },
  ]
</script>

{#if open}
  <div style="min-height:100vh;background:rgba(0,0,0,0.45);display:flex;justify-content:flex-end;">
    <div style="width:min(92%,420px);background:var(--bg);height:100vh;overflow-y:auto;padding:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <strong>Menu</strong>
        <button onclick={onClose} aria-label="Close menu" style="padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">✕</button>
      </div>

      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
        {#each sections as sec (sec.s)}
          <button onclick={() => (section = sec.s)} style="padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:{section === sec.s ? 'var(--accent)' : 'var(--surface)'};color:{section === sec.s ? '#fff' : 'var(--text)'};cursor:pointer;">{sec.label}</button>
        {/each}
        <button onclick={onToggleTheme} style="margin-left:auto;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Theme: {themeLabel}</button>
      </div>

      {#if section === 'reference'}
        <ReferenceBrowser {factions} {technologies} {strategyCards} {objectives} />
      {:else if section === 'board'}
        <BoardEditor {state} {technologies} {onAction} />
      {:else}
        <GamesSheet {onNewGame} {onExport} {onImport} />
      {/if}
    </div>
  </div>
{/if}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/components/MenuSheet.svelte.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/MenuSheet.svelte src/lib/components/MenuSheet.svelte.test.ts
git commit -m "feat: MenuSheet slide-in hosting reference/board/games"
```

---

### Task 8: `App.svelte` — routes, menu, game handlers

**Files:**
- Modify: `src/App.svelte`, `src/App.svelte.test.ts`

**Interfaces:**
- Consumes: everything from Plan 2a plus `StatusChecklist`, `AgendaHelper`, `MenuSheet`, and `exportGame`/`importGame` (`./persistence/storage`).
- Produces: the completed app.

Behavior added to the existing shell:
- `let menuOpen = $state(false)`; the bottom-bar ☰ button opens it; the standalone theme button is removed (theme toggle now lives in `MenuSheet`).
- Routes: `status → StatusChecklist` (`objectives={content.objectives}`, `onAction` → dispatch); `agenda → AgendaHelper` (`onAction` → dispatch). These replace the placeholder body for those phases.
- `MenuSheet` rendered inside the store-present branch with the content arrays, `gameState`, `cycleTheme`, and the three game handlers.
- `newGame()`: `savePrefs({ currentGameId: null })`, set `store = null`, `gameId = null`, `menuOpen = false` (returns to `SetupWizard`).
- `exportCurrent()`: build a JSON blob from `exportGame(store.state)` and trigger a download via a temporary anchor.
- `importFile(file)`: `await file.text()` → `importGame(...)` → `store.load(...)` → new `gameId` + `savePrefs` → close menu; on throw, set a brief `importError` message.

- [ ] **Step 1: Update the App tests (add status route + menu open)**

Add these two tests inside the existing `describe('App', ...)` in `src/App.svelte.test.ts`:

```ts
  it('routes to the status checklist after advancing there', async () => {
    render(App)
    await fireEvent.click(screen.getByRole('button', { name: /Start game/ }))
    await fireEvent.click(screen.getByRole('button', { name: /Advance phase/ })) // strategy -> action
    await fireEvent.click(screen.getByRole('button', { name: /Advance phase/ })) // action -> status
    expect(screen.getByText(/Status phase/)).toBeTruthy()
  })

  it('opens the menu from the bottom bar', async () => {
    render(App)
    await fireEvent.click(screen.getByRole('button', { name: /Start game/ }))
    await fireEvent.click(screen.getByRole('button', { name: /Open menu/ }))
    expect(screen.getByRole('button', { name: /Close menu/ })).toBeTruthy()
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/App.svelte.test.ts`
Expected: FAIL — no "Status phase" text (placeholder shown) and no "Open menu" button yet.

- [ ] **Step 3: Edit `src/App.svelte`** — apply these changes to the Plan 2a file:

Add imports (with the existing component imports):

```ts
  import { saveGame, loadGame, exportGame, importGame } from './persistence/storage'
  import StatusChecklist from './lib/components/StatusChecklist.svelte'
  import AgendaHelper from './lib/components/AgendaHelper.svelte'
  import MenuSheet from './lib/components/MenuSheet.svelte'
```

Add menu state near the other `$state` declarations:

```ts
  let menuOpen = $state(false)
  let importError = $state('')
```

Add the game handlers (near `onSetupComplete`):

```ts
  function newGame() {
    prefs = savePrefs({ currentGameId: null })
    store = null
    gameId = null
    menuOpen = false
  }

  function exportCurrent() {
    if (!store) return
    const blob = new Blob([exportGame(store.state)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${gameId ?? 'ti4-game'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importFile(file: File) {
    try {
      const loaded = importGame(await file.text())
      const s = createGameStore(loaded)
      store = s
      gameId = `game-import-${++seq}`
      prefs = savePrefs({ currentGameId: gameId })
      importError = ''
      menuOpen = false
    } catch {
      importError = 'Could not import that file.'
    }
  }
```

Replace the phase-body `{:else}` placeholder branch so status and agenda route to their components:

```svelte
    {#if gameState.phase === 'strategy'}
      <StrategyPhase cards={content.strategyCards} selected={gameState.strategyCardIds} onToggle={toggleStrategyCard} />
    {:else if gameState.phase === 'action'}
      <h2 style="font-size:18px;font-weight:500;">Action phase — what can I do now?</h2>
      <ActionPanel {actions} onAct={act} />
    {:else if gameState.phase === 'status'}
      <StatusChecklist state={gameState} objectives={content.objectives} onAction={(a) => store?.dispatch(a)} />
    {:else if gameState.phase === 'agenda'}
      <AgendaHelper state={gameState} onAction={(a) => store?.dispatch(a)} />
    {:else}
      <h2 style="font-size:18px;font-weight:500;">{gameState.phase} phase</h2>
    {/if}
```

In the bottom bar, replace the standalone theme button with an ☰ button, and render the menu. The bottom bar's third button becomes:

```svelte
    <button onclick={() => (menuOpen = true)} aria-label="Open menu" style="padding:10px 14px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">☰</button>
```

And immediately after the `</nav>`, add the menu + any import error:

```svelte
  {#if importError}<p style="color:var(--warn);text-align:center;font-size:13px;">{importError}</p>{/if}
  <MenuSheet
    open={menuOpen}
    onClose={() => (menuOpen = false)}
    state={gameState}
    factions={content.factions}
    technologies={content.technologies}
    strategyCards={content.strategyCards}
    objectives={content.objectives}
    themeLabel={prefs.theme}
    onToggleTheme={cycleTheme}
    onAction={(a) => store?.dispatch(a)}
    onNewGame={newGame}
    onExport={exportCurrent}
    onImport={importFile}
  />
```

(Note: `gameState` is the existing non-null-narrowed derived from Plan 2a; these additions live in the same store-present `{:else}` block. `cycleTheme` and `seq` already exist.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/App.svelte.test.ts`
Expected: PASS (6 tests — the 4 from Plan 2a + the 2 new).

- [ ] **Step 5: Full verification**

Run: `npm test` — all pass.
Run: `npm run check` — 0 errors, 0 warnings.
Run: `npm run build` — succeeds.

- [ ] **Step 6: Manual reasoning trace (no browser needed)**

Confirm by reading the code: advancing into status shows the checklist (score/tokens/ready/custodians); marking custodians then advancing routes status→agenda; the agenda helper tallies votes; ☰ opens the menu; the board editor dispatches `editState`; export builds a JSON blob; import loads a file and swaps the store. Describe this in the report.

- [ ] **Step 7: Commit**

```bash
git add src/App.svelte src/App.svelte.test.ts
git commit -m "feat: route status/agenda, add menu and game import/export"
```

---

## Self-review (completed by author)

- **Spec coverage:** interactive status checklist ✓ (T2); agenda stub + custodians ✓ (T3) reachable via the core routing ✓ (T1); reference browser ✓ (T4); board editor ✓ (T5); games new/export/import ✓ (T6); menu ✓ (T7); routing + wiring + theme-toggle move ✓ (T8). Secret-as-generic-+VP ✓ (T2). Import error handling ✓ (T8).
- **Type consistency:** `custodiansTaken` added in T1 flows through `GameState` everywhere (all state built via `createInitialState`). `GameAction`/`editState` patch shapes are consistent across T2/T3/T5/T8. `Objective`/`Faction`/`Technology`/`StrategyCard` prop types match `content/schema`. `MenuSheet` (T7) consumes the T4/T5/T6 components with the exact props they declare. `ExpandableItem {title,summary,detail}` used per T3's Plan 2a contract.
- **Placeholder scan:** none — every step has runnable code/commands and expected output. No `$state(prop)` without `untrack` (component state is seeded from literals/`$state(0)`), so no `state_referenced_locally` regression.
- **Count note:** Task 8 Step 4 — the App test file will have 6 tests total after the 2 additions; run confirms.

---

## Roadmap (after 2b)

- **Plan 3 — PWA + deploy:** service-worker offline precache, installable manifest + icons, GitHub Pages deploy (`base: '/ti4-assistant/'`), verified on a phone.
- **Content plans:** all PoK factions, full tech tree + real objectives + secret objectives, leaders/mechs/exploration actions and their component-action wiring.
- **Deferred Minors** (from `.superpowers/sdd/progress.md`): collision-free game ids (Games menu now owns creation — good place to fix); live OS theme-change tracking; structural validation of imported saves.
