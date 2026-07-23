# TI4 Guided UX — Plan 2a: Guided Turn Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the unstyled vertical-slice `App.svelte` with a real, theme-aware, phase-driven guided UI that runs setup → strategy → action with inline teaching, reminders, and IndexedDB autosave.

**Architecture:** New presentational components under `src/lib/` consume the Plan 1 core (`domain`, `engine`, `state`, `content`, `persistence`) unchanged. Components are pure where practical — they take plain props and call back through function props — so they unit-test without a store. `App.svelte` owns the one `createGameStore` instance, computes engine output, wires callbacks to `store.dispatch`, routes by phase, and autosaves via a `$effect`. UI preferences (theme, header open/closed, current game id) live in `localStorage`, separate from game saves.

**Tech Stack:** Svelte 5 (runes), TypeScript 5 (strict), Vite 5, Vitest 2, `@testing-library/svelte` 5 (jsdom), `fake-indexeddb` (tests), the Plan 1 core modules.

## Global Constraints

- Svelte 5 **runes** only (`$props`, `$state`, `$derived`, `$effect`) — no Svelte 4 stores, no `createEventDispatcher`, no `export let`. Events are callback props (`onToggle`, `onAct`, `onComplete`).
- TypeScript `strict: true`; `import type` for type-only imports (`verbatimModuleSyntax` is on).
- **Consume the Plan 1 core unchanged** — do not modify `src/domain`, `src/engine`, `src/state`, `src/content`, `src/persistence` (except `src/App.svelte`, which this plan rewrites). If you think a core change is needed, stop and report it.
- **Theme-aware:** all colors come from CSS custom properties defined in `src/app.css`, which supplies a light default, a `@media (prefers-color-scheme: dark)` block, and `:root[data-theme="light"]` / `:root[data-theme="dark"]` overrides that win over the media query. Default theme = follow the phone (`'system'`), with a manual override.
- **Teaching pattern:** actions/phases show an always-visible one-line summary; full detail is behind a tap (`ExpandableItem`).
- **Assistant, not referee:** manual state changes go through the existing `editState` action; nothing forbids input.
- Components are presentational: props in, callbacks out. Engine/store/persistence wiring lives only in `App.svelte`.
- Tests colocated as `*.test.ts` / `*.svelte.test.ts`; `npm test` runs `vitest run`.

---

## File Structure

```
src/
  app.css                         # theme CSS variables + base (Task 2)
  main.ts                         # import './app.css' (Task 2 modifies)
  App.svelte                      # shell + phase router + autosave (Task 9 rewrites)
  lib/
    prefs.ts                      # localStorage prefs (Task 1)
    theme.ts                      # resolveTheme + applyTheme (Task 2)
    ui-types.ts                   # SetupConfig (Task 7)
    components/
      ExpandableItem.svelte       # teaching disclosure (Task 3)
      ReminderList.svelte         # reminders by severity (Task 4)
      OverviewHeader.svelte       # collapsible status header (Task 5)
      ActionPanel.svelte          # action-phase options (Task 6)
      StrategyPhase.svelte        # pick strategy card(s) (Task 7)
      SetupWizard.svelte          # new-game form (Task 8)
```

Tests sit beside each file (`prefs.test.ts`, `ExpandableItem.svelte.test.ts`, …).

---

### Task 1: `prefs.ts` — localStorage preferences

**Files:**
- Create: `src/lib/prefs.ts`, `src/lib/prefs.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type Theme = 'system' | 'light' | 'dark'`
  - `type Prefs = { theme: Theme; overviewOpen: boolean; currentGameId: string | null }`
  - `const DEFAULT_PREFS: Prefs`
  - `loadPrefs(): Prefs` — merges stored over defaults; on missing/corrupt storage returns `DEFAULT_PREFS`.
  - `savePrefs(patch: Partial<Prefs>): Prefs` — merges patch over current, persists, returns the merged prefs.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/prefs.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { loadPrefs, savePrefs, DEFAULT_PREFS } from './prefs'

beforeEach(() => localStorage.clear())

describe('prefs', () => {
  it('returns defaults when nothing is stored', () => {
    expect(loadPrefs()).toEqual(DEFAULT_PREFS)
  })

  it('persists a patch and merges over current', () => {
    const merged = savePrefs({ theme: 'dark' })
    expect(merged.theme).toBe('dark')
    expect(merged.overviewOpen).toBe(DEFAULT_PREFS.overviewOpen)
    expect(loadPrefs().theme).toBe('dark')
  })

  it('merges successive patches without dropping fields', () => {
    savePrefs({ theme: 'light' })
    savePrefs({ currentGameId: 'g1' })
    const p = loadPrefs()
    expect(p.theme).toBe('light')
    expect(p.currentGameId).toBe('g1')
  })

  it('falls back to defaults on corrupt storage', () => {
    localStorage.setItem('ti4:prefs', '{not json')
    expect(loadPrefs()).toEqual(DEFAULT_PREFS)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/prefs.test.ts`
Expected: FAIL — cannot find module `./prefs`.

- [ ] **Step 3: Write `src/lib/prefs.ts`**

```ts
export type Theme = 'system' | 'light' | 'dark'

export type Prefs = {
  theme: Theme
  overviewOpen: boolean
  currentGameId: string | null
}

export const DEFAULT_PREFS: Prefs = {
  theme: 'system',
  overviewOpen: true,
  currentGameId: null,
}

const KEY = 'ti4:prefs'

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    const parsed = JSON.parse(raw) as Partial<Prefs>
    return { ...DEFAULT_PREFS, ...parsed }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function savePrefs(patch: Partial<Prefs>): Prefs {
  const merged = { ...loadPrefs(), ...patch }
  localStorage.setItem(KEY, JSON.stringify(merged))
  return merged
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/prefs.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/prefs.ts src/lib/prefs.test.ts
git commit -m "feat: localStorage-backed UI preferences"
```

---

### Task 2: `theme.ts` + `app.css` — theme resolution and CSS variables

**Files:**
- Create: `src/lib/theme.ts`, `src/lib/theme.test.ts`, `src/app.css`
- Modify: `src/main.ts` (add `import './app.css'`)

**Interfaces:**
- Consumes: `Theme` from `./prefs`.
- Produces:
  - `resolveTheme(theme: Theme, prefersDark: boolean): 'light' | 'dark'` — `'system'` resolves via `prefersDark`; otherwise returns the theme.
  - `applyTheme(theme: Theme): void` — sets `document.documentElement.dataset.theme` to the resolved value (reads `window.matchMedia('(prefers-color-scheme: dark)').matches`).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/theme.test.ts
import { describe, it, expect, afterEach } from 'vitest'
import { resolveTheme, applyTheme } from './theme'

afterEach(() => {
  delete document.documentElement.dataset.theme
})

describe('resolveTheme', () => {
  it('honors an explicit theme regardless of system', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
  it('resolves system by the prefersDark flag', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })
})

describe('applyTheme', () => {
  it('writes the resolved theme onto the document element', () => {
    window.matchMedia = ((q: string) => ({
      matches: false,
      media: q,
      addEventListener() {},
      removeEventListener() {},
    })) as unknown as typeof window.matchMedia
    applyTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    applyTheme('system')
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/theme.test.ts`
Expected: FAIL — cannot find module `./theme`.

- [ ] **Step 3: Write `src/lib/theme.ts`**

```ts
import type { Theme } from './prefs'

export function resolveTheme(theme: Theme, prefersDark: boolean): 'light' | 'dark' {
  if (theme === 'system') return prefersDark ? 'dark' : 'light'
  return theme
}

export function applyTheme(theme: Theme): void {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.dataset.theme = resolveTheme(theme, prefersDark)
}
```

- [ ] **Step 4: Write `src/app.css`**

```css
:root {
  --bg: #f5f4ef;
  --surface: #ffffff;
  --surface-2: #eceadf;
  --text: #1c1c1a;
  --text-muted: #5f5e5a;
  --border: #d3d1c7;
  --accent: #185fa5;
  --warn: #a32d2d;
  --radius: 10px;
  color-scheme: light dark;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #14161a;
    --surface: #1e2127;
    --surface-2: #262a31;
    --text: #e8e8e6;
    --text-muted: #a0a09c;
    --border: #333842;
    --accent: #6aa6e6;
    --warn: #e88;
  }
}
:root[data-theme='light'] {
  --bg: #f5f4ef; --surface: #ffffff; --surface-2: #eceadf;
  --text: #1c1c1a; --text-muted: #5f5e5a; --border: #d3d1c7;
  --accent: #185fa5; --warn: #a32d2d;
}
:root[data-theme='dark'] {
  --bg: #14161a; --surface: #1e2127; --surface-2: #262a31;
  --text: #e8e8e6; --text-muted: #a0a09c; --border: #333842;
  --accent: #6aa6e6; --warn: #e88;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, sans-serif;
  -webkit-tap-highlight-color: transparent;
}
button { font: inherit; color: inherit; }
```

- [ ] **Step 5: Modify `src/main.ts` to import the stylesheet**

Add `import './app.css'` as the first line:

```ts
import './app.css'
import { mount } from 'svelte'
import App from './App.svelte'

const app = mount(App, { target: document.getElementById('app')! })
export default app
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/lib/theme.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add src/lib/theme.ts src/lib/theme.test.ts src/app.css src/main.ts
git commit -m "feat: theme resolution and themeable CSS variables"
```

---

### Task 3: `ExpandableItem.svelte` — teaching disclosure

**Files:**
- Create: `src/lib/components/ExpandableItem.svelte`, `src/lib/components/ExpandableItem.svelte.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces a component with props `{ title: string; summary: string; detail?: string; open?: boolean }`. Renders a button showing `title` (bold) and `summary` (muted, always visible) plus a chevron; clicking toggles a detail region containing `detail`. Detail is absent from the DOM until opened.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/components/ExpandableItem.svelte.test.ts
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import ExpandableItem from './ExpandableItem.svelte'

describe('ExpandableItem', () => {
  it('shows title and summary but hides detail until toggled', async () => {
    render(ExpandableItem, { props: { title: 'Tactical action', summary: 'Activate a system.', detail: 'Spend a tactic token to move, fight, then produce.' } })
    expect(screen.getByText('Tactical action')).toBeTruthy()
    expect(screen.getByText('Activate a system.')).toBeTruthy()
    expect(screen.queryByText(/Spend a tactic token/)).toBeNull()

    await fireEvent.click(screen.getByRole('button', { name: /Tactical action/ }))
    expect(screen.getByText(/Spend a tactic token/)).toBeTruthy()

    await fireEvent.click(screen.getByRole('button', { name: /Tactical action/ }))
    expect(screen.queryByText(/Spend a tactic token/)).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/components/ExpandableItem.svelte.test.ts`
Expected: FAIL — cannot find module `./ExpandableItem.svelte`.

- [ ] **Step 3: Write `src/lib/components/ExpandableItem.svelte`**

```svelte
<script lang="ts">
  interface Props {
    title: string
    summary: string
    detail?: string
    open?: boolean
  }
  let { title, summary, detail = '', open = false }: Props = $props()
  let isOpen = $state(open)
</script>

<div style="border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);margin-bottom:8px;">
  <button
    onclick={() => (isOpen = !isOpen)}
    aria-expanded={isOpen}
    style="width:100%;text-align:left;background:none;border:none;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px;cursor:pointer;"
  >
    <span>
      <span style="font-weight:500;display:block;">{title}</span>
      <span style="color:var(--text-muted);font-size:14px;">{summary}</span>
    </span>
    <span style="color:var(--text-muted);transform:rotate({isOpen ? 90 : 0}deg);transition:transform .15s;">›</span>
  </button>
  {#if isOpen && detail}
    <div style="padding:0 14px 12px;color:var(--text-muted);font-size:14px;line-height:1.5;">{detail}</div>
  {/if}
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/components/ExpandableItem.svelte.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/ExpandableItem.svelte src/lib/components/ExpandableItem.svelte.test.ts
git commit -m "feat: ExpandableItem teaching disclosure component"
```

---

### Task 4: `ReminderList.svelte` — reminders by severity

**Files:**
- Create: `src/lib/components/ReminderList.svelte`, `src/lib/components/ReminderList.svelte.test.ts`

**Interfaces:**
- Consumes: `Reminder` from `../../domain/types`.
- Produces a component with props `{ reminders: Reminder[] }`. Renders each reminder's text; `warn` severity gets `--warn` color, `info` gets `--text-muted`. Renders nothing (empty) when the array is empty.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/components/ReminderList.svelte.test.ts
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import ReminderList from './ReminderList.svelte'
import type { Reminder } from '../../domain/types'

describe('ReminderList', () => {
  it('renders each reminder text', () => {
    const reminders: Reminder[] = [
      { id: 'a', severity: 'info', text: 'Primary unused.' },
      { id: 'b', severity: 'warn', text: 'No tactic tokens.' },
    ]
    render(ReminderList, { props: { reminders } })
    expect(screen.getByText('Primary unused.')).toBeTruthy()
    expect(screen.getByText('No tactic tokens.')).toBeTruthy()
  })

  it('renders nothing when empty', () => {
    const { container } = render(ReminderList, { props: { reminders: [] } })
    expect(container.querySelectorAll('li').length).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/components/ReminderList.svelte.test.ts`
Expected: FAIL — cannot find module `./ReminderList.svelte`.

- [ ] **Step 3: Write `src/lib/components/ReminderList.svelte`**

```svelte
<script lang="ts">
  import type { Reminder } from '../../domain/types'
  interface Props { reminders: Reminder[] }
  let { reminders }: Props = $props()
</script>

{#if reminders.length}
  <ul style="list-style:none;padding:0;margin:12px 0 0;display:flex;flex-direction:column;gap:6px;">
    {#each reminders as r (r.id)}
      <li style="font-size:14px;display:flex;gap:8px;color:{r.severity === 'warn' ? 'var(--warn)' : 'var(--text-muted)'};">
        <span aria-hidden="true">{r.severity === 'warn' ? '⚠' : 'ℹ'}</span>
        <span>{r.text}</span>
      </li>
    {/each}
  </ul>
{/if}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/components/ReminderList.svelte.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/ReminderList.svelte src/lib/components/ReminderList.svelte.test.ts
git commit -m "feat: ReminderList component"
```

---

### Task 5: `OverviewHeader.svelte` — collapsible status header

**Files:**
- Create: `src/lib/components/OverviewHeader.svelte`, `src/lib/components/OverviewHeader.svelte.test.ts`

**Interfaces:**
- Consumes: `GameState` from `../../domain/types`.
- Produces a component with props `{ state: GameState; open: boolean; onToggle: () => void }`. Collapsed (`open === false`): a one-line strip showing `Round N · <phase> · VP <n>`. Expanded: adds command tokens (tactic/fleet/strategy), trade goods, and commodities. The header row is a button that calls `onToggle` (controlled component — parent owns `open`).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/components/OverviewHeader.svelte.test.ts
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import OverviewHeader from './OverviewHeader.svelte'
import { createInitialState } from '../../domain/initialState'
import type { FactionStartingInfo } from '../../domain/types'

const faction: FactionStartingInfo = {
  id: 'sol', name: 'Federation of Sol', combatModifier: 0,
  starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], commodities: 4, tradeGoods: 0 },
}
const state = () => ({ ...createInitialState(faction, { turnOrder: 1, speaker: false }), phase: 'action' as const, victoryPoints: 5 })

describe('OverviewHeader', () => {
  it('always shows round, phase, and VP', () => {
    render(OverviewHeader, { props: { state: state(), open: false, onToggle: () => {} } })
    expect(screen.getByText(/Round 1/)).toBeTruthy()
    expect(screen.getByText(/action/)).toBeTruthy()
    expect(screen.getByText(/VP 5/)).toBeTruthy()
  })

  it('reveals token detail only when open', () => {
    const { rerender } = render(OverviewHeader, { props: { state: state(), open: false, onToggle: () => {} } })
    expect(screen.queryByText(/Commodities/)).toBeNull()
    rerender({ state: state(), open: true, onToggle: () => {} })
    expect(screen.getByText(/Commodities/)).toBeTruthy()
  })

  it('calls onToggle when the header is clicked', async () => {
    const onToggle = vi.fn()
    render(OverviewHeader, { props: { state: state(), open: false, onToggle } })
    await fireEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/components/OverviewHeader.svelte.test.ts`
Expected: FAIL — cannot find module `./OverviewHeader.svelte`.

- [ ] **Step 3: Write `src/lib/components/OverviewHeader.svelte`**

```svelte
<script lang="ts">
  import type { GameState } from '../../domain/types'
  interface Props { state: GameState; open: boolean; onToggle: () => void }
  let { state, open, onToggle }: Props = $props()
</script>

<header style="background:var(--surface-2);border-bottom:1px solid var(--border);">
  <button
    onclick={onToggle}
    aria-expanded={open}
    style="width:100%;background:none;border:none;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;"
  >
    <span style="font-size:14px;">Round {state.round} · {state.phase} · VP {state.victoryPoints}</span>
    <span style="color:var(--text-muted);transform:rotate({open ? 180 : 0}deg);transition:transform .15s;">⌄</span>
  </button>
  {#if open}
    <div style="padding:0 14px 12px;display:flex;flex-wrap:wrap;gap:12px;font-size:13px;color:var(--text-muted);">
      <span>Tactic {state.command.tactic}</span>
      <span>Fleet {state.command.fleet}</span>
      <span>Strategy {state.command.strategy}</span>
      <span>Trade goods {state.tradeGoods}</span>
      <span>Commodities {state.commodities}</span>
    </div>
  {/if}
</header>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/components/OverviewHeader.svelte.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/OverviewHeader.svelte src/lib/components/OverviewHeader.svelte.test.ts
git commit -m "feat: collapsible OverviewHeader component"
```

---

### Task 6: `ActionPanel.svelte` — action-phase options

**Files:**
- Create: `src/lib/components/ActionPanel.svelte`, `src/lib/components/ActionPanel.svelte.test.ts`

**Interfaces:**
- Consumes: `AvailableAction` from `../../domain/types`.
- Produces a component with props `{ actions: AvailableAction[]; onAct: (a: AvailableAction) => void }`. For each action it renders an `ExpandableItem` (title = a UI one-liner keyed by `a.type`, summary short, detail = `a.explanation`) followed by a "Take" button that calls `onAct(a)`. When `actions` is empty it shows a muted "No options — advance the phase." message.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/components/ActionPanel.svelte.test.ts
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import ActionPanel from './ActionPanel.svelte'
import type { AvailableAction } from '../../domain/types'

const actions: AvailableAction[] = [
  { type: 'strategicAction', label: 'Strategic action', explanation: 'Resolve your strategy card primary.' },
  { type: 'tacticalAction', label: 'Tactical action', explanation: 'Spend a tactic token to activate a system.' },
]

describe('ActionPanel', () => {
  it('renders a Take control for each action and calls onAct with the action', async () => {
    const onAct = vi.fn()
    render(ActionPanel, { props: { actions, onAct } })
    const takeButtons = screen.getAllByRole('button', { name: /Take/ })
    expect(takeButtons.length).toBe(2)
    await fireEvent.click(takeButtons[1])
    expect(onAct).toHaveBeenCalledWith(actions[1])
  })

  it('shows an empty-state message when there are no actions', () => {
    render(ActionPanel, { props: { actions: [], onAct: () => {} } })
    expect(screen.getByText(/No options/)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/components/ActionPanel.svelte.test.ts`
Expected: FAIL — cannot find module `./ActionPanel.svelte`.

- [ ] **Step 3: Write `src/lib/components/ActionPanel.svelte`**

```svelte
<script lang="ts">
  import type { AvailableAction } from '../../domain/types'
  import ExpandableItem from './ExpandableItem.svelte'
  interface Props { actions: AvailableAction[]; onAct: (a: AvailableAction) => void }
  let { actions, onAct }: Props = $props()

  const SUMMARIES: Record<string, string> = {
    strategicAction: 'Resolve your strategy card’s primary ability.',
    tacticalAction: 'Activate a system to move, fight, then produce.',
    componentAction: 'Play an “Action:” ability from a card, tech, or leader.',
    pass: 'Stop taking turns for the rest of this action phase.',
  }
</script>

{#if actions.length === 0}
  <p style="color:var(--text-muted);font-size:14px;">No options — advance the phase.</p>
{:else}
  {#each actions as a (a.type + (a.sourceId ?? '') + a.label)}
    <div style="margin-bottom:10px;">
      <ExpandableItem title={a.label} summary={SUMMARIES[a.type] ?? ''} detail={a.explanation} />
      <button
        onclick={() => onAct(a)}
        style="margin-top:-4px;padding:8px 14px;border:1px solid var(--accent);border-radius:var(--radius);background:var(--accent);color:#fff;cursor:pointer;"
      >Take: {a.label}</button>
    </div>
  {/each}
{/if}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/components/ActionPanel.svelte.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/ActionPanel.svelte src/lib/components/ActionPanel.svelte.test.ts
git commit -m "feat: ActionPanel renders engine actions with teaching"
```

---

### Task 7: `StrategyPhase.svelte` — pick strategy card(s)

**Files:**
- Create: `src/lib/components/StrategyPhase.svelte`, `src/lib/components/StrategyPhase.svelte.test.ts`

**Interfaces:**
- Consumes: `StrategyCard` from `../../content/schema`.
- Produces a component with props `{ cards: StrategyCard[]; selected: number[]; onToggle: (initiative: number) => void }`. Renders each strategy card as an `ExpandableItem` (title = `initiative + '. ' + name`, summary = its primary, detail = `Primary: … / Secondary: …`) with a select button that calls `onToggle(card.initiative)`; selected cards are visually marked.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/components/StrategyPhase.svelte.test.ts
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import StrategyPhase from './StrategyPhase.svelte'
import type { StrategyCard } from '../../content/schema'

const cards: StrategyCard[] = [
  { initiative: 1, name: 'Leadership', primary: 'Gain command tokens.', secondary: 'Spend influence for tokens.' },
  { initiative: 7, name: 'Technology', primary: 'Research a technology.', secondary: 'Pay to research.' },
]

describe('StrategyPhase', () => {
  it('lists the cards and toggles selection by initiative', async () => {
    const onToggle = vi.fn()
    render(StrategyPhase, { props: { cards, selected: [], onToggle } })
    expect(screen.getByText(/1\. Leadership/)).toBeTruthy()
    expect(screen.getByText(/7\. Technology/)).toBeTruthy()
    await fireEvent.click(screen.getAllByRole('button', { name: /Select/ })[1])
    expect(onToggle).toHaveBeenCalledWith(7)
  })

  it('marks a selected card as chosen', () => {
    render(StrategyPhase, { props: { cards, selected: [1], onToggle: () => {} } })
    expect(screen.getByText(/Chosen/)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/components/StrategyPhase.svelte.test.ts`
Expected: FAIL — cannot find module `./StrategyPhase.svelte`.

- [ ] **Step 3: Write `src/lib/components/StrategyPhase.svelte`**

```svelte
<script lang="ts">
  import type { StrategyCard } from '../../content/schema'
  import ExpandableItem from './ExpandableItem.svelte'
  interface Props { cards: StrategyCard[]; selected: number[]; onToggle: (initiative: number) => void }
  let { cards, selected, onToggle }: Props = $props()
</script>

<h2 style="font-size:18px;font-weight:500;">Strategy phase — pick your card</h2>
{#each cards as c (c.initiative)}
  {@const chosen = selected.includes(c.initiative)}
  <div style="margin-bottom:10px;">
    <ExpandableItem
      title={`${c.initiative}. ${c.name}`}
      summary={c.primary}
      detail={`Primary: ${c.primary}\nSecondary: ${c.secondary}`}
    />
    <button
      onclick={() => onToggle(c.initiative)}
      style="margin-top:-4px;padding:8px 14px;border:1px solid var(--border);border-radius:var(--radius);background:{chosen ? 'var(--accent)' : 'var(--surface)'};color:{chosen ? '#fff' : 'var(--text)'};cursor:pointer;"
    >{chosen ? 'Chosen ✓' : 'Select'}</button>
  </div>
{/each}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/components/StrategyPhase.svelte.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/StrategyPhase.svelte src/lib/components/StrategyPhase.svelte.test.ts
git commit -m "feat: StrategyPhase card picker"
```

---

### Task 8: `SetupWizard.svelte` — new-game form

**Files:**
- Create: `src/lib/ui-types.ts`, `src/lib/components/SetupWizard.svelte`, `src/lib/components/SetupWizard.svelte.test.ts`

**Interfaces:**
- Consumes: `Faction` from `../../content/schema`.
- Produces:
  - `src/lib/ui-types.ts`: `export type SetupConfig = { factionId: string; playerCount: number; turnOrder: number; speaker: boolean }`
  - Component props `{ factions: Faction[]; onComplete: (cfg: SetupConfig) => void }`. A single scrollable form: faction `<select>`, player-count `<select>` (3–8), turn-order seat `<select>` (1..playerCount), speaker checkbox. A "Start game" button calls `onComplete` with the chosen values. (The enabled-content toggle from the design is deferred until PoK factions exist in content — there are none in the seed set, so it would be dead UI now.)

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/components/SetupWizard.svelte.test.ts
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import SetupWizard from './SetupWizard.svelte'
import type { Faction } from '../../content/schema'

const factions: Faction[] = [
  { id: 'jol-nar', name: 'Universities of Jol-Nar', combatModifier: -1, abilitySummaries: ['x'], starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], commodities: 4, tradeGoods: 0 } },
  { id: 'sol', name: 'Federation of Sol', combatModifier: 0, abilitySummaries: ['x'], starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], commodities: 4, tradeGoods: 0 } },
]

describe('SetupWizard', () => {
  it('completes with the selected faction and defaults', async () => {
    const onComplete = vi.fn()
    render(SetupWizard, { props: { factions, onComplete } })
    await fireEvent.click(screen.getByRole('button', { name: /Start game/ }))
    expect(onComplete).toHaveBeenCalledTimes(1)
    const cfg = onComplete.mock.calls[0][0]
    expect(cfg.factionId).toBe('jol-nar')
    expect(cfg.playerCount).toBeGreaterThanOrEqual(3)
    expect(typeof cfg.speaker).toBe('boolean')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/components/SetupWizard.svelte.test.ts`
Expected: FAIL — cannot find module `./SetupWizard.svelte`.

- [ ] **Step 3: Write `src/lib/ui-types.ts`**

```ts
export type SetupConfig = {
  factionId: string
  playerCount: number
  turnOrder: number
  speaker: boolean
}
```

- [ ] **Step 4: Write `src/lib/components/SetupWizard.svelte`**

```svelte
<script lang="ts">
  import type { Faction } from '../../content/schema'
  import type { SetupConfig } from '../ui-types'
  interface Props { factions: Faction[]; onComplete: (cfg: SetupConfig) => void }
  let { factions, onComplete }: Props = $props()

  let factionId = $state(factions[0]?.id ?? '')
  let playerCount = $state(6)
  let turnOrder = $state(1)
  let speaker = $state(false)

  const seats = $derived(Array.from({ length: playerCount }, (_, i) => i + 1))

  function start() {
    onComplete({ factionId, playerCount, turnOrder, speaker })
  }
</script>

<div style="padding:16px;max-width:480px;margin:0 auto;display:flex;flex-direction:column;gap:14px;">
  <h1 style="font-size:22px;font-weight:500;">New game</h1>

  <label style="display:flex;flex-direction:column;gap:4px;">Faction
    <select bind:value={factionId}>
      {#each factions as f (f.id)}<option value={f.id}>{f.name}</option>{/each}
    </select>
  </label>

  <label style="display:flex;flex-direction:column;gap:4px;">Players
    <select bind:value={playerCount}>
      {#each [3, 4, 5, 6, 7, 8] as n (n)}<option value={n}>{n}</option>{/each}
    </select>
  </label>

  <label style="display:flex;flex-direction:column;gap:4px;">Your seat (turn order)
    <select bind:value={turnOrder}>
      {#each seats as s (s)}<option value={s}>{s}</option>{/each}
    </select>
  </label>

  <label style="display:flex;gap:8px;align-items:center;">
    <input type="checkbox" bind:checked={speaker} /> I am the speaker
  </label>

  <button onclick={start} style="padding:12px;border:none;border-radius:var(--radius);background:var(--accent);color:#fff;font-weight:500;cursor:pointer;">Start game</button>
</div>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/components/SetupWizard.svelte.test.ts`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add src/lib/ui-types.ts src/lib/components/SetupWizard.svelte src/lib/components/SetupWizard.svelte.test.ts
git commit -m "feat: SetupWizard new-game form"
```

---

### Task 9: `App.svelte` — shell, phase router, autosave

**Files:**
- Modify (rewrite): `src/App.svelte`
- Create: `src/App.svelte.test.ts`

**Interfaces:**
- Consumes: `content`/`getFaction` (`./content/index`), `createInitialState` (`./domain/initialState`), `createGameStore` (`./state/store.svelte`), `getAvailableActions`/`getReminders` (`./engine/index`), `saveGame`/`loadGame` (`./persistence/storage`), `loadPrefs`/`savePrefs` (`./lib/prefs`), `applyTheme` (`./lib/theme`), all Plan 2a components, `SetupConfig` (`./lib/ui-types`), `AvailableAction`/`GameAction` types.
- Produces: the running app. No exports consumed by other tasks.

Behavior:
- On init: `applyTheme(prefs.theme)`; if `prefs.currentGameId` is set, `loadGame` it and, if valid, create the store from it; otherwise leave the store null.
- Store null → render `SetupWizard` (factions from `content.factions`). On complete: `createInitialState`, create the store, generate a game id (`` `game-${state.round}-${factionId}-${seq}` `` where `seq` is a module counter — avoid `Date.now()`), `savePrefs({ currentGameId })`, advance to strategy phase.
- Store present → render `OverviewHeader` (open from `prefs.overviewOpen`, toggle updates prefs), the phase body, `ReminderList`, and a bottom bar: Undo / Advance phase / theme toggle.
- Phase body: `strategy` → `StrategyPhase` (selected = `state.strategyCardIds`, toggle updates via `editState`); `action` → `ActionPanel` (actions from `getAvailableActions(state, { componentActionSources })`, `onAct` maps to `store.dispatch`); `status`/`agenda`/`setup` → a placeholder note ("Detailed UI arrives in Plan 2b — use Advance to continue.") plus the `ReminderList`.
- Autosave: `$effect(() => { if (store && gameId) saveGame(gameId, store.state) })`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/App.svelte.test.ts
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import App from './App.svelte'

beforeEach(() => localStorage.clear())

describe('App', () => {
  it('shows the setup wizard when there is no current game', () => {
    render(App)
    expect(screen.getByRole('button', { name: /Start game/ })).toBeTruthy()
  })

  it('starts a game from setup and lands in the strategy phase', async () => {
    render(App)
    await fireEvent.click(screen.getByRole('button', { name: /Start game/ }))
    expect(screen.getByText(/Strategy phase/)).toBeTruthy()
    expect(screen.getByText(/Round 1/)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/App.svelte.test.ts`
Expected: FAIL — the current slice `App.svelte` has no "Start game" button.

- [ ] **Step 3: Rewrite `src/App.svelte`**

```svelte
<script lang="ts">
  import { content, getFaction } from './content/index'
  import { createInitialState } from './domain/initialState'
  import { createGameStore } from './state/store.svelte'
  import { getAvailableActions, getReminders } from './engine/index'
  import { saveGame } from './persistence/storage'
  import { loadPrefs, savePrefs } from './lib/prefs'
  import { applyTheme } from './lib/theme'
  import type { Theme } from './lib/prefs'
  import type { AvailableAction, GameAction } from './domain/types'
  import type { SetupConfig } from './lib/ui-types'
  import OverviewHeader from './lib/components/OverviewHeader.svelte'
  import ReminderList from './lib/components/ReminderList.svelte'
  import ActionPanel from './lib/components/ActionPanel.svelte'
  import StrategyPhase from './lib/components/StrategyPhase.svelte'
  import SetupWizard from './lib/components/SetupWizard.svelte'

  let prefs = $state(loadPrefs())
  applyTheme(prefs.theme)

  let store = $state<ReturnType<typeof createGameStore> | null>(null)
  let gameId = $state<string | null>(null)
  let seq = 0

  const state = $derived(store ? store.state : null)

  const componentActionSources = $derived(
    state
      ? content.technologies
          .filter((t) => t.hasAction && state.technologyIds.includes(t.id))
          .map((t) => ({ id: t.id, summary: t.summary }))
      : [],
  )
  const actions = $derived(state ? getAvailableActions(state, { componentActionSources }) : [])
  const reminders = $derived(state ? getReminders(state) : [])

  $effect(() => {
    if (store && gameId) saveGame(gameId, store.state)
  })

  function onSetupComplete(cfg: SetupConfig) {
    const faction = getFaction(cfg.factionId)
    if (!faction) return
    const initial = createInitialState(faction, { turnOrder: cfg.turnOrder, speaker: cfg.speaker })
    const s = createGameStore({ ...initial, phase: 'strategy' })
    store = s
    gameId = `game-${cfg.factionId}-${++seq}`
    prefs = savePrefs({ currentGameId: gameId })
  }

  function toggleOverview() {
    prefs = savePrefs({ overviewOpen: !prefs.overviewOpen })
  }

  function cycleTheme() {
    const order: Theme[] = ['system', 'light', 'dark']
    const next = order[(order.indexOf(prefs.theme) + 1) % order.length]
    prefs = savePrefs({ theme: next })
    applyTheme(next)
  }

  function act(a: AvailableAction) {
    if (!store) return
    if (a.type === 'componentAction') store.dispatch({ type: 'componentAction', sourceId: a.sourceId ?? '', summary: a.explanation })
    else store.dispatch({ type: a.type } as GameAction)
  }

  function toggleStrategyCard(initiative: number) {
    if (!store) return
    const held = store.state.strategyCardIds
    const next = held.includes(initiative) ? held.filter((n) => n !== initiative) : [...held, initiative]
    store.dispatch({ type: 'editState', patch: { strategyCardIds: next } })
  }
</script>

{#if !store || !state}
  <SetupWizard factions={content.factions} onComplete={onSetupComplete} />
{:else}
  <OverviewHeader {state} open={prefs.overviewOpen} onToggle={toggleOverview} />

  <main style="padding:16px;max-width:480px;margin:0 auto;">
    {#if state.phase === 'strategy'}
      <StrategyPhase cards={content.strategyCards} selected={state.strategyCardIds} onToggle={toggleStrategyCard} />
    {:else if state.phase === 'action'}
      <h2 style="font-size:18px;font-weight:500;">Action phase — what can I do now?</h2>
      <ActionPanel {actions} onAct={act} />
    {:else}
      <h2 style="font-size:18px;font-weight:500;">{state.phase} phase</h2>
      <p style="color:var(--text-muted);font-size:14px;">Detailed UI arrives in Plan 2b — use Advance to continue.</p>
    {/if}

    <ReminderList {reminders} />
  </main>

  <nav style="position:sticky;bottom:0;display:flex;gap:8px;padding:12px 16px;background:var(--surface-2);border-top:1px solid var(--border);">
    <button onclick={() => store?.undo()} disabled={!store.canUndo()} style="flex:1;padding:10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Undo</button>
    <button onclick={() => store?.dispatch({ type: 'advancePhase' })} style="flex:1;padding:10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Advance phase</button>
    <button onclick={cycleTheme} aria-label="Toggle theme" style="padding:10px 14px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Theme: {prefs.theme}</button>
  </nav>
{/if}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/App.svelte.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full suite + check + build**

Run: `npm test`
Expected: all tests pass (Plan 1 tests + the 8 new Plan 2a test files).

Run: `npm run check`
Expected: 0 errors, 0 warnings.

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 6: Manual reasoning trace (browser not required)**

Confirm by reading the code: setup wizard seeds a Jol-Nar/Sol game → strategy phase shows the 8 cards → selecting a card updates `strategyCardIds` → Advance goes to action → `ActionPanel` shows Strategic + Tactical (Jol-Nar has no ACTION tech, so no component action) → taking Tactical decrements the tactic pool in the header → Advance walks status → strategy (round +1) → Undo reverts → autosave persists to IndexedDB on each change. Describe this trace in your report.

- [ ] **Step 7: Commit**

```bash
git add src/App.svelte src/App.svelte.test.ts
git commit -m "feat: guided phase-driven App shell with autosave"
```

---

## Self-review (completed by author)

- **Spec coverage (Plan 2a subset):** shell = phase-driven single screen ✓ (T9); collapsible persistent overview header ✓ (T5 + prefs T1 + wiring T9); follow-phone theme + toggle ✓ (T1/T2/T9); one-liner + expand teaching ✓ (T3, used by T6/T7); reminders ✓ (T4/T9); setup wizard ✓ (T8); autosave to IndexedDB ✓ (T9); prefs separate from saves ✓ (T1). Deferred by design to Plan 2b: StatusChecklist, AgendaHelper, MenuSheet (Reference/BoardEditor/Games) — the app shows a placeholder body for status/agenda and reaches board-edit/reference via that later menu. Documented deviation: the setup enabled-content toggle is deferred until PoK factions exist in content (would be dead UI now).
- **Type consistency:** `AvailableAction` (now with `sourceId`), `GameState`, `GameAction`, `Reminder`, `StrategyCard`, `Faction`, `SetupConfig` used identically across tasks. `ActionPanel`/`StrategyPhase` consume `ExpandableItem`'s `{title, summary, detail}` props exactly as defined in T3. `OverviewHeader`/`ActionPanel`/`StrategyPhase`/`SetupWizard` are controlled (props + callback), matching how T9 wires them.
- **Placeholder scan:** none — every step has runnable code/commands and expected output. `Date.now()` is avoided (game id uses a module counter) per the Plan 1 constraint.

---

## Roadmap (Plan 2b — written after 2a lands)

- **StatusChecklist**: guided status-phase steps (score objective → `scorePublicObjective`; ready planets / adjust tokens → `editState`; draw action card → acknowledge).
- **AgendaHelper** (stub): custodians flag + for/against/abstain tally.
- **MenuSheet**: ☰ slide-in hosting Reference (search content), Your board (`BoardEditor` via `editState`), Games (new/save/load/export/import). The bottom-bar theme toggle moves into this menu.
- Replaces the status/agenda placeholder body and the standalone theme button from 2a.
