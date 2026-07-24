# TI4 Planet Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a catalog of all non-home base+PoK planets and let the player gain/remove planets from their tracked state, carrying trait + tech specialty.

**Architecture:** New content catalog (`src/content/planets.ts`) + two new state actions (`gainPlanet`/`removePlanet`) + a gain/remove picker in BoardEditor + a Planets tab in ReferenceBrowser. `content.planets` is threaded via App → MenuSheet → both components. Reducer stays content-free (the UI builds the `Planet` from a catalog entry).

**Tech Stack:** TypeScript (strict), Zod, Svelte 5, Vitest.

## Global Constraints

- Catalog values are **AsyncTI4-sourced** (`src/main/resources/planets/*.json`), filtered to `source∈{base,pok}` + `factionHomeworld==null`. Non-canonical variants excluded (Ordinian Rex, Illusion, Phantasm, Locked Mallice).
- **Legendary ability summaries are authored** (our words), never verbatim.
- Catalog is exactly **63 planets: 33 base (incl. Mecatol Rex) + 30 PoK**, of which **4 are legendary** (Primor, Hope's End, Mirage, Mallice).
- Trait enum: `cultural|industrial|hazardous` (Mecatol Rex has none). Tech specialty enum: `red|blue|yellow|green`.
- Catalog ids are the AsyncTI4 ids; they must be unique and disjoint from faction home-planet ids.
- Reducer stays pure/content-free. `gainPlanet` is idempotent by id; both new actions append a log entry.
- Strings with apostrophes use escaped single quotes (`'Tequ\'ran'`, `'Hope\'s End'`).
- All work on branch `planet-catalog`. `npm test`, `npm run check` (0/0), `npm run build` green before finishing.

## File Structure

- `src/content/schema.ts` — add `techSpecialty` to `planetSchema`; add `planetCatalogSchema` + `PlanetCatalogEntry`.
- `src/content/planets.ts` — NEW: the 63-entry catalog.
- `src/content/index.ts` — parse + expose `content.planets`.
- `src/content/content.test.ts` — catalog assertions.
- `src/domain/types.ts` — `Planet.techSpecialty?`; `gainPlanet`/`removePlanet` actions.
- `src/state/reducers.ts` — cases for the two actions.
- `src/state/reducers.test.ts` — gain/remove tests.
- `src/lib/components/BoardEditor.svelte` (+ test) — gain picker + remove.
- `src/lib/components/ReferenceBrowser.svelte` (+ test) — Planets tab.
- `src/lib/components/MenuSheet.svelte` (+ test) — new `planets` prop, thread to both.
- `src/App.svelte` — pass `content.planets` to MenuSheet.

---

### Task 1: Content catalog + schema

**Files:**
- Modify: `src/content/schema.ts`, `src/content/index.ts`, `src/content/content.test.ts`
- Create: `src/content/planets.ts`

**Interfaces:**
- Produces: `planetCatalogSchema`, `PlanetCatalogEntry`, `content.planets: PlanetCatalogEntry[]`. `planetSchema` gains optional `techSpecialty`.

- [ ] **Step 1: Extend `planetSchema` + add catalog schema**

In `src/content/schema.ts`, add `techSpecialty` to `planetSchema` (after the `trait` line):

```ts
  trait: z.enum(['cultural', 'industrial', 'hazardous']).optional(),
  techSpecialty: z.enum(['red', 'blue', 'yellow', 'green']).optional(),
```

Then append, at the end of the file:

```ts
export const planetCatalogSchema = z.object({
  id: z.string(),
  name: z.string(),
  resources: z.number().int().min(0),
  influence: z.number().int().min(0),
  trait: z.enum(['cultural', 'industrial', 'hazardous']).optional(),
  techSpecialty: z.enum(['red', 'blue', 'yellow', 'green']).optional(),
  legendary: z.boolean(),
  legendaryAbility: z.string().optional(),
  expansion: z.enum(['base', 'pok']),
})
export type PlanetCatalogEntry = z.infer<typeof planetCatalogSchema>
```

- [ ] **Step 2: Write failing catalog test**

In `src/content/content.test.ts`, add inside `describe('content registry', …)`:

```ts
  it('exposes the 63-planet catalog (33 base + 30 PoK, 4 legendary, Mecatol present)', () => {
    expect(content.planets).toHaveLength(63)
    expect(content.planets.filter((p) => p.expansion === 'base')).toHaveLength(33)
    expect(content.planets.filter((p) => p.expansion === 'pok')).toHaveLength(30)
    expect(content.planets.filter((p) => p.legendary)).toHaveLength(4)
    expect(content.planets.some((p) => p.name === 'Mecatol Rex')).toBe(true)
    for (const p of content.planets.filter((p) => p.legendary)) expect(p.legendaryAbility).toBeTruthy()
  })

  it('catalog ids are unique and disjoint from faction home-planet ids', () => {
    const ids = content.planets.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    const homeIds = new Set(content.factions.flatMap((f) => f.starting.planets.map((pl) => pl.id)))
    for (const id of ids) expect(homeIds.has(id)).toBe(false)
  })
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/content/content.test.ts`
Expected: FAIL (`content.planets` undefined).

- [ ] **Step 4: Create `src/content/planets.ts`**

Create the file with exactly:

```ts
import type { PlanetCatalogEntry } from './schema'

// Non-home base + PoK planets. Sourced from AsyncTI4 per-planet data
// (src/main/resources/planets/*.json), res/inf/trait/techSpecialty verified.
// Legendary ability summaries are authored (our words), not verbatim card text.
export const planets: PlanetCatalogEntry[] = [
  // ---------- Base game (33, incl. Mecatol Rex) ----------
  { id: 'abyz', name: 'Abyz', resources: 3, influence: 0, trait: 'hazardous', legendary: false, expansion: 'base' },
  { id: 'arinam', name: 'Arinam', resources: 1, influence: 2, trait: 'industrial', legendary: false, expansion: 'base' },
  { id: 'arnor', name: 'Arnor', resources: 2, influence: 1, trait: 'industrial', legendary: false, expansion: 'base' },
  { id: 'bereg', name: 'Bereg', resources: 3, influence: 1, trait: 'hazardous', legendary: false, expansion: 'base' },
  { id: 'centauri', name: 'Centauri', resources: 1, influence: 3, trait: 'cultural', legendary: false, expansion: 'base' },
  { id: 'corneeq', name: 'Corneeq', resources: 1, influence: 2, trait: 'cultural', legendary: false, expansion: 'base' },
  { id: 'dalbootha', name: 'Dal Bootha', resources: 0, influence: 2, trait: 'cultural', legendary: false, expansion: 'base' },
  { id: 'fria', name: 'Fria', resources: 2, influence: 0, trait: 'hazardous', legendary: false, expansion: 'base' },
  { id: 'gral', name: 'Gral', resources: 1, influence: 1, trait: 'industrial', techSpecialty: 'blue', legendary: false, expansion: 'base' },
  { id: 'lazar', name: 'Lazar', resources: 1, influence: 0, trait: 'industrial', techSpecialty: 'yellow', legendary: false, expansion: 'base' },
  { id: 'lirtaiv', name: 'Lirta IV', resources: 2, influence: 3, trait: 'hazardous', legendary: false, expansion: 'base' },
  { id: 'lodor', name: 'Lodor', resources: 3, influence: 1, trait: 'cultural', legendary: false, expansion: 'base' },
  { id: 'lor', name: 'Lor', resources: 1, influence: 2, trait: 'industrial', legendary: false, expansion: 'base' },
  { id: 'mr', name: 'Mecatol Rex', resources: 1, influence: 6, legendary: false, expansion: 'base' },
  { id: 'meer', name: 'Meer', resources: 0, influence: 4, trait: 'hazardous', techSpecialty: 'red', legendary: false, expansion: 'base' },
  { id: 'meharxull', name: 'Mehar Xull', resources: 1, influence: 3, trait: 'hazardous', techSpecialty: 'red', legendary: false, expansion: 'base' },
  { id: 'mellon', name: 'Mellon', resources: 0, influence: 2, trait: 'cultural', legendary: false, expansion: 'base' },
  { id: 'newalbion', name: 'New Albion', resources: 1, influence: 1, trait: 'industrial', techSpecialty: 'green', legendary: false, expansion: 'base' },
  { id: 'quann', name: 'Quann', resources: 2, influence: 1, trait: 'cultural', legendary: false, expansion: 'base' },
  { id: 'qucenn', name: 'Qucen\'n', resources: 1, influence: 2, trait: 'industrial', legendary: false, expansion: 'base' },
  { id: 'rarron', name: 'Rarron', resources: 0, influence: 3, trait: 'cultural', legendary: false, expansion: 'base' },
  { id: 'resculon', name: 'Resculon', resources: 2, influence: 0, trait: 'cultural', legendary: false, expansion: 'base' },
  { id: 'sakulag', name: 'Sakulag', resources: 2, influence: 1, trait: 'hazardous', legendary: false, expansion: 'base' },
  { id: 'saudor', name: 'Saudor', resources: 2, influence: 2, trait: 'industrial', legendary: false, expansion: 'base' },
  { id: 'starpoint', name: 'Starpoint', resources: 3, influence: 1, trait: 'hazardous', legendary: false, expansion: 'base' },
  { id: 'tarmann', name: 'Tar\'mann', resources: 1, influence: 1, trait: 'industrial', techSpecialty: 'green', legendary: false, expansion: 'base' },
  { id: 'tequran', name: 'Tequ\'ran', resources: 2, influence: 0, trait: 'hazardous', legendary: false, expansion: 'base' },
  { id: 'thibah', name: 'Thibah', resources: 1, influence: 1, trait: 'industrial', techSpecialty: 'blue', legendary: false, expansion: 'base' },
  { id: 'torkan', name: 'Torkan', resources: 0, influence: 3, trait: 'cultural', legendary: false, expansion: 'base' },
  { id: 'vefutii', name: 'Vefut II', resources: 2, influence: 2, trait: 'hazardous', legendary: false, expansion: 'base' },
  { id: 'wellon', name: 'Wellon', resources: 1, influence: 2, trait: 'industrial', techSpecialty: 'yellow', legendary: false, expansion: 'base' },
  { id: 'xxehan', name: 'Xxehan', resources: 1, influence: 1, trait: 'cultural', legendary: false, expansion: 'base' },
  { id: 'zohbat', name: 'Zohbat', resources: 3, influence: 1, trait: 'hazardous', legendary: false, expansion: 'base' },
  // ---------- Prophecy of Kings (30) ----------
  { id: 'abaddon', name: 'Abaddon', resources: 1, influence: 0, trait: 'cultural', legendary: false, expansion: 'pok' },
  { id: 'accoen', name: 'Accoen', resources: 2, influence: 3, trait: 'industrial', legendary: false, expansion: 'pok' },
  { id: 'alioprima', name: 'Alio Prima', resources: 1, influence: 1, trait: 'cultural', legendary: false, expansion: 'pok' },
  { id: 'ang', name: 'Ang', resources: 2, influence: 0, trait: 'industrial', techSpecialty: 'red', legendary: false, expansion: 'pok' },
  { id: 'archonvail', name: 'Archon Vail', resources: 1, influence: 3, trait: 'hazardous', techSpecialty: 'blue', legendary: false, expansion: 'pok' },
  { id: 'ashtroth', name: 'Ashtroth', resources: 2, influence: 0, trait: 'hazardous', legendary: false, expansion: 'pok' },
  { id: 'atlas', name: 'Atlas', resources: 3, influence: 1, trait: 'hazardous', legendary: false, expansion: 'pok' },
  { id: 'bakal', name: 'Bakal', resources: 3, influence: 2, trait: 'industrial', legendary: false, expansion: 'pok' },
  { id: 'cealdri', name: 'Cealdri', resources: 0, influence: 2, trait: 'cultural', techSpecialty: 'yellow', legendary: false, expansion: 'pok' },
  { id: 'cormund', name: 'Cormund', resources: 2, influence: 0, trait: 'hazardous', legendary: false, expansion: 'pok' },
  { id: 'everra', name: 'Everra', resources: 3, influence: 1, trait: 'cultural', legendary: false, expansion: 'pok' },
  { id: 'hopesend', name: 'Hope\'s End', resources: 3, influence: 0, trait: 'hazardous', legendary: true, legendaryAbility: 'Exhaust at the end of your turn to place 1 mech on a planet you control, or draw 1 action card.', expansion: 'pok' },
  { id: 'jeolir', name: 'Jeol Ir', resources: 2, influence: 3, trait: 'industrial', legendary: false, expansion: 'pok' },
  { id: 'kraag', name: 'Kraag', resources: 2, influence: 1, trait: 'hazardous', legendary: false, expansion: 'pok' },
  { id: 'lisis', name: 'Lisis', resources: 2, influence: 2, trait: 'industrial', legendary: false, expansion: 'pok' },
  { id: 'loki', name: 'Loki', resources: 1, influence: 2, trait: 'cultural', legendary: false, expansion: 'pok' },
  { id: 'mallice', name: 'Mallice', resources: 0, influence: 3, trait: 'cultural', legendary: true, legendaryAbility: 'Exhaust at the end of your turn to gain 2 trade goods, or convert all your commodities to trade goods.', expansion: 'pok' },
  { id: 'mirage', name: 'Mirage', resources: 1, influence: 2, trait: 'cultural', legendary: true, legendaryAbility: 'Exhaust at the end of your turn to place up to 2 fighters in any system that contains your ships.', expansion: 'pok' },
  { id: 'perimeter', name: 'Perimeter', resources: 2, influence: 1, trait: 'industrial', legendary: false, expansion: 'pok' },
  { id: 'primor', name: 'Primor', resources: 2, influence: 1, trait: 'cultural', legendary: true, legendaryAbility: 'Exhaust at the end of your turn to place up to 2 infantry on any planet you control.', expansion: 'pok' },
  { id: 'rigeli', name: 'Rigel I', resources: 0, influence: 1, trait: 'hazardous', legendary: false, expansion: 'pok' },
  { id: 'rigelii', name: 'Rigel II', resources: 1, influence: 2, trait: 'industrial', legendary: false, expansion: 'pok' },
  { id: 'rigeliii', name: 'Rigel III', resources: 1, influence: 1, trait: 'industrial', techSpecialty: 'green', legendary: false, expansion: 'pok' },
  { id: 'semlore', name: 'Sem-Lore', resources: 3, influence: 2, trait: 'cultural', techSpecialty: 'yellow', legendary: false, expansion: 'pok' },
  { id: 'siig', name: 'Siig', resources: 0, influence: 2, trait: 'hazardous', legendary: false, expansion: 'pok' },
  { id: 'vegamajor', name: 'Vega Major', resources: 2, influence: 1, trait: 'cultural', legendary: false, expansion: 'pok' },
  { id: 'vegaminor', name: 'Vega Minor', resources: 1, influence: 2, trait: 'cultural', techSpecialty: 'blue', legendary: false, expansion: 'pok' },
  { id: 'velnor', name: 'Velnor', resources: 2, influence: 1, trait: 'industrial', techSpecialty: 'red', legendary: false, expansion: 'pok' },
  { id: 'vorhal', name: 'Vorhal', resources: 0, influence: 2, trait: 'cultural', techSpecialty: 'green', legendary: false, expansion: 'pok' },
  { id: 'xanhact', name: 'Xanhact', resources: 0, influence: 1, trait: 'hazardous', legendary: false, expansion: 'pok' },
]
```

- [ ] **Step 5: Expose `content.planets`**

In `src/content/index.ts`: add `planetCatalogSchema` to the schema import, import the data, and add the parsed array. Change the imports + the `content` object:

```ts
import { factionSchema, objectiveSchema, strategyCardSchema, technologySchema, planetCatalogSchema, type Faction } from './schema'
import { strategyCards } from './strategyCards'
import { technologies } from './technologies'
import { factions } from './factions'
import { objectives } from './objectives'
import { planets } from './planets'

export const content = {
  strategyCards: z.array(strategyCardSchema).parse(strategyCards),
  technologies: z.array(technologySchema).parse(technologies),
  factions: z.array(factionSchema).parse(factions),
  objectives: z.array(objectiveSchema).parse(objectives),
  planets: z.array(planetCatalogSchema).parse(planets),
}
```

Also extend the re-export line:

```ts
export type { Faction, Technology, StrategyCard, Objective, PlanetCatalogEntry } from './schema'
```

- [ ] **Step 6: Run test to verify pass**

Run: `npx vitest run src/content/content.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/content/schema.ts src/content/planets.ts src/content/index.ts src/content/content.test.ts
git commit -m "feat: non-home base+PoK planet catalog (63 planets, AsyncTI4-sourced)"
```

---

### Task 2: gainPlanet / removePlanet actions

**Files:**
- Modify: `src/domain/types.ts`, `src/state/reducers.ts`
- Test: `src/state/reducers.test.ts`

**Interfaces:**
- Consumes: nothing new from Task 1 (reducer is content-free; UI builds the `Planet`).
- Produces: actions `{ type:'gainPlanet'; planet: Planet }`, `{ type:'removePlanet'; planetId: string }`; `Planet.techSpecialty?`.

- [ ] **Step 1: Extend types**

In `src/domain/types.ts`, add `techSpecialty` to `Planet`:

```ts
export type Planet = {
  id: string
  name: string
  resources: number
  influence: number
  exhausted: boolean
  trait?: 'cultural' | 'industrial' | 'hazardous'
  techSpecialty?: 'red' | 'blue' | 'yellow' | 'green'
}
```

(If `Planet` does not already carry `trait`, add both lines as shown.)

Add to the `GameAction` union (before `editState`):

```ts
  | { type: 'gainPlanet'; planet: Planet }
  | { type: 'removePlanet'; planetId: string }
```

- [ ] **Step 2: Write failing reducer tests**

In `src/state/reducers.test.ts`, add:

```ts
  it('gainPlanet adds a planet and is idempotent by id', () => {
    const planet = { id: 'meer', name: 'Meer', resources: 0, influence: 4, exhausted: false, trait: 'hazardous' as const }
    const s1 = applyAction(base(), { type: 'gainPlanet', planet })
    expect(s1.planets.some((p) => p.id === 'meer')).toBe(true)
    expect(s1.log.at(-1)?.summary).toBe('Gained Meer')
    const s2 = applyAction(s1, { type: 'gainPlanet', planet })
    expect(s2.planets.filter((p) => p.id === 'meer')).toHaveLength(1)
  })

  it('removePlanet removes by id and no-ops when absent', () => {
    const planet = { id: 'meer', name: 'Meer', resources: 0, influence: 4, exhausted: false }
    const withPlanet = applyAction(base(), { type: 'gainPlanet', planet })
    const removed = applyAction(withPlanet, { type: 'removePlanet', planetId: 'meer' })
    expect(removed.planets.some((p) => p.id === 'meer')).toBe(false)
    expect(removed.log.at(-1)?.summary).toBe('Removed Meer')
    const noop = applyAction(base(), { type: 'removePlanet', planetId: 'nope' })
    expect(noop).toBe(base_noopRef ?? noop) // no throw; state returned unchanged
  })
```

Note: this file already constructs a base `GameState` (see its existing `base()`/fixture). Reuse that fixture; if the fixture is a value rather than a factory, adapt the two tests to build from it the same way the existing tests do. Remove the `base_noopRef` placeholder line — assert instead `expect(noop.planets).toEqual(base().planets)` using whatever the file's base builder is.

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run src/state/reducers.test.ts`
Expected: FAIL (unknown action types).

- [ ] **Step 4: Add reducer cases**

In `src/state/reducers.ts`, add before `case 'editState':`:

```ts
    case 'gainPlanet': {
      if (state.planets.some((p) => p.id === action.planet.id)) return state
      return { ...state, planets: [...state.planets, action.planet], log: log(state, `Gained ${action.planet.name}`) }
    }

    case 'removePlanet': {
      const target = state.planets.find((p) => p.id === action.planetId)
      if (!target) return state
      return { ...state, planets: state.planets.filter((p) => p.id !== action.planetId), log: log(state, `Removed ${target.name}`) }
    }
```

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run src/state/reducers.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/types.ts src/state/reducers.ts src/state/reducers.test.ts
git commit -m "feat: gainPlanet/removePlanet actions + Planet.techSpecialty"
```

---

### Task 3: BoardEditor gain/remove + wiring

**Files:**
- Modify: `src/lib/components/BoardEditor.svelte`, `src/lib/components/MenuSheet.svelte`, `src/App.svelte`
- Test: `src/lib/components/BoardEditor.svelte.test.ts`, `src/lib/components/MenuSheet.svelte.test.ts`

**Interfaces:**
- Consumes: `content.planets` (`PlanetCatalogEntry[]`) from Task 1; `gainPlanet`/`removePlanet` from Task 2.

- [ ] **Step 1: Thread the `planets` prop (App → MenuSheet → BoardEditor)**

In `src/App.svelte`, add to the `<MenuSheet … />` props (after `objectives={content.objectives}`):

```svelte
    planets={content.planets}
```

In `src/lib/components/MenuSheet.svelte`: import the type and add the prop, then pass it to BoardEditor.
- Add to the type import: `import type { Faction, Technology, StrategyCard, Objective, PlanetCatalogEntry } from '../../content/schema'`
- Add `planets: PlanetCatalogEntry[]` to the `Props` interface (after `objectives`).
- Add `planets` to the destructure list.
- Change the BoardEditor call to: `<BoardEditor state={gameState} {technologies} planetCatalog={planets} {onAction} />`

- [ ] **Step 2: Write failing BoardEditor test**

In `src/lib/components/BoardEditor.svelte.test.ts`, add a `planetCatalog` to the render props and a test. Add near the top a catalog fixture:

```ts
const planetCatalog = [
  { id: 'meer', name: 'Meer', resources: 0, influence: 4, trait: 'hazardous' as const, legendary: false, expansion: 'base' as const },
]
```

Then a test (adapt `render` props to include `planetCatalog`; match how the file already renders BoardEditor):

```ts
  it('gains a catalog planet via the picker', async () => {
    const onAction = vi.fn()
    render(BoardEditor, { props: { state: baseState(), technologies: [], planetCatalog, onAction } })
    await fireEvent.click(screen.getByRole('button', { name: /add Meer/i }))
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'gainPlanet' }))
  })
```

(Use the file's existing state fixture in place of `baseState()`.)

- [ ] **Step 2b: Run to verify failure**

Run: `npx vitest run src/lib/components/BoardEditor.svelte.test.ts`
Expected: FAIL (`planetCatalog` unused / picker absent).

- [ ] **Step 3: Implement the picker + remove in BoardEditor**

In `src/lib/components/BoardEditor.svelte`:
- Extend the imports and props:

```ts
  import type { GameState, GameAction, Planet } from '../../domain/types'
  import type { Technology, PlanetCatalogEntry } from '../../content/schema'

  interface Props { state: GameState; technologies: Technology[]; planetCatalog: PlanetCatalogEntry[]; onAction: (a: GameAction) => void }
  let { state, technologies, planetCatalog, onAction }: Props = $props()
```

- Add state + handlers (after the existing `toggleTech`):

```ts
  let planetQuery = $state('')
  const ownedIds = $derived(new Set(state.planets.map((p) => p.id)))
  const catalogMatches = $derived(
    planetCatalog
      .filter((c) => !ownedIds.has(c.id) && c.name.toLowerCase().includes(planetQuery.toLowerCase()))
      .slice(0, 8),
  )
  function gain(c: PlanetCatalogEntry) {
    const planet: Planet = { id: c.id, name: c.name, resources: c.resources, influence: c.influence, exhausted: false, trait: c.trait, techSpecialty: c.techSpecialty }
    onAction({ type: 'gainPlanet', planet })
    planetQuery = ''
  }
  function removePlanet(id: string) {
    onAction({ type: 'removePlanet', planetId: id })
  }
```

- Replace the existing Planets block (`<h4>Planets</h4>` + the `{#each state.planets …}` button) with:

```svelte
<h4 style="font-weight:500;margin-top:12px;">Planets</h4>
{#each state.planets as p (p.id)}
  <div style="display:flex;align-items:center;gap:6px;margin:4px 0;">
    <button onclick={() => togglePlanet(p.id)} aria-label={`toggle ${p.name}`} style="flex:1;text-align:left;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">{p.name}: {p.exhausted ? 'exhausted' : 'ready'}</button>
    <button onclick={() => removePlanet(p.id)} aria-label={`remove ${p.name}`} style="padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">✕</button>
  </div>
{/each}

<input placeholder="Gain a planet…" bind:value={planetQuery} style="width:100%;padding:8px;margin-top:6px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--text);" />
{#each catalogMatches as c (c.id)}
  <button onclick={() => gain(c)} aria-label={`add ${c.name}`} style="display:block;width:100%;text-align:left;margin:4px 0;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">+ {c.name} ({c.resources}/{c.influence}{c.trait ? ` · ${c.trait}` : ''})</button>
{/each}
```

- [ ] **Step 4: Fix MenuSheet test props**

In `src/lib/components/MenuSheet.svelte.test.ts`, add `planets: []` to the `baseProps()` object (alongside `technologies: [], strategyCards: [], objectives: []`).

- [ ] **Step 5: Run tests to verify pass**

Run: `npx vitest run src/lib/components/BoardEditor.svelte.test.ts src/lib/components/MenuSheet.svelte.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/BoardEditor.svelte src/lib/components/BoardEditor.svelte.test.ts src/lib/components/MenuSheet.svelte src/lib/components/MenuSheet.svelte.test.ts src/App.svelte
git commit -m "feat: BoardEditor gain/remove planet picker + wiring"
```

---

### Task 4: ReferenceBrowser Planets tab

**Files:**
- Modify: `src/lib/components/ReferenceBrowser.svelte`, `src/lib/components/MenuSheet.svelte`
- Test: `src/lib/components/ReferenceBrowser.svelte.test.ts`

**Interfaces:**
- Consumes: `content.planets` via MenuSheet.

- [ ] **Step 1: Pass `planets` to ReferenceBrowser in MenuSheet**

In `src/lib/components/MenuSheet.svelte`, change the ReferenceBrowser call to:

```svelte
        <ReferenceBrowser {factions} {technologies} {strategyCards} {objectives} {planets} />
```

- [ ] **Step 2: Write failing ReferenceBrowser test**

In `src/lib/components/ReferenceBrowser.svelte.test.ts`, add a `planets` fixture and pass it in all `render` calls (add `planets` to the props object). Fixture:

```ts
const planets: PlanetCatalogEntry[] = [
  { id: 'meer', name: 'Meer', resources: 0, influence: 4, trait: 'hazardous', techSpecialty: 'red', legendary: false, expansion: 'base' },
  { id: 'primor', name: 'Primor', resources: 2, influence: 1, trait: 'cultural', legendary: true, legendaryAbility: 'Place up to 2 infantry.', expansion: 'pok' },
]
```

Add `PlanetCatalogEntry` to the schema type import. Then:

```ts
  it('lists catalog planets in the Planets tab', async () => {
    render(ReferenceBrowser, { props: { factions, technologies, strategyCards, objectives, planets } })
    await fireEvent.click(screen.getByRole('button', { name: /Planets/ }))
    expect(screen.getByText('Meer')).toBeTruthy()
    expect(screen.getByText('Primor')).toBeTruthy()
  })
```

Update the two existing `render` calls to include `planets` in their props object as well.

- [ ] **Step 2b: Run to verify failure**

Run: `npx vitest run src/lib/components/ReferenceBrowser.svelte.test.ts`
Expected: FAIL (no Planets tab / prop missing).

- [ ] **Step 3: Add the Planets tab**

In `src/lib/components/ReferenceBrowser.svelte`:
- Extend props + type import:

```ts
  import type { Faction, Technology, StrategyCard, Objective, PlanetCatalogEntry } from '../../content/schema'

  interface Props { factions: Faction[]; technologies: Technology[]; strategyCards: StrategyCard[]; objectives: Objective[]; planets: PlanetCatalogEntry[] }
  let { factions, technologies, strategyCards, objectives, planets }: Props = $props()
```

- Add `'planet'` to the `Kind` union: `type Kind = 'faction' | 'tech' | 'strategy' | 'objective' | 'planet'`
- Add a branch to the `all` derived (append after the `objective` branch, before the closing `,`). Change the final `: objectives.map(...)` ternary arm so it becomes `: kind === 'objective' ? objectives.map(...) : planets.map((pl) => ({ id: pl.id, title: pl.name, summary: `${pl.resources}/${pl.influence}${pl.trait ? ` · ${pl.trait}` : ''}`, detail: [`${pl.resources} resources / ${pl.influence} influence`, pl.trait ? `Trait: ${pl.trait}` : 'No trait', pl.techSpecialty ? `Tech specialty: ${pl.techSpecialty}` : null, pl.legendary && pl.legendaryAbility ? `Legendary: ${pl.legendaryAbility}` : null].filter(Boolean).join('\n') }))`
- Add a tab entry to `tabs`: `{ k: 'planet', label: 'Planets' }`

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/components/ReferenceBrowser.svelte.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/ReferenceBrowser.svelte src/lib/components/ReferenceBrowser.svelte.test.ts src/lib/components/MenuSheet.svelte
git commit -m "feat: reference browser Planets tab"
```

---

### Task 5: Full verification

- [ ] **Step 1:** Run `npm test` — all pass.
- [ ] **Step 2:** Run `npm run check` — 0 errors, 0 warnings.
- [ ] **Step 3:** Run `npm run build` — succeeds.
- [ ] **Step 4 (optional):** `npm run dev`; open menu → Your board → gain a planet; menu → Reference → Planets tab.

---

## Self-Review

- **Spec coverage:** catalog content (Task 1) ✓; techSpecialty on planet + gain/remove actions (Task 2) ✓; BoardEditor picker+remove + wiring (Task 3) ✓; ReferenceBrowser Planets tab (Task 4) ✓; tests each task ✓. AsyncTI4 sourcing + authored legendary + excluded variants captured in Global Constraints + data ✓.
- **Placeholder scan:** none. Task 2 Step 2 flags a fixture-adaptation note (the reducers test file's base-state builder) rather than a placeholder — the implementer reuses the existing fixture; the `base_noopRef` line is explicitly to be removed and replaced with the stated assertion.
- **Type consistency:** `PlanetCatalogEntry` (content) vs `Planet` (state) kept distinct — the picker maps catalog→Planet, dropping legendary/legendaryAbility/expansion and adding `exhausted:false`. `planets` prop threads App→MenuSheet→{BoardEditor as `planetCatalog`, ReferenceBrowser as `planets`}. Reducer stays content-free.
- **Counts:** 63 planets embedded (33 base incl. Mecatol + 30 PoK), 4 legendary — matches the content test assertions.
