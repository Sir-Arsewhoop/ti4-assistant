# TI4 Faction Breadth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand faction content from 3 to all 24 base + Prophecy of Kings factions, at current data depth, with wiki-verified starting data.

**Architecture:** Pure content + schema change. No engine/reducer/store/persistence change. Adds three fields (`expansion`, `starting.startingUnits`, optional planet `trait`), 11 starting technologies, 21 factions, and a small ReferenceBrowser detail enhancement so the new data is visible.

**Tech Stack:** TypeScript (strict), Zod (content validation), Svelte 5, Vitest.

## Global Constraints

- **Values are wiki-sourced** (twilight-imperium.fandom.com). The community JSON dataset had verified value errors and must NOT be used for numeric values.
- **Ability summaries are authored** (our own concise mechanical wording) — never verbatim card/wiki text.
- **Starting command tokens are constant** `{ tactic: 3, fleet: 3, strategy: 2 }` for every faction.
- **Starting trade goods are constant** `0` for every faction.
- **Combat modifier is `0`** for every faction EXCEPT `jol-nar` (`-1`) and `sardakk-norr` (`+1`).
- **`expansion`** is `'base'` for the 17 base factions, `'pok'` for the 7 PoK factions.
- **Planet `trait` is deferred** — the schema field is added (optional) but left unpopulated this cycle (no reliable low-cost source; dataset traits are wrong).
- **Faction names omit the leading "The"** (matches existing seeds: `Federation of Sol`, `Sardakk N'orr`).
- **Strings containing apostrophes use double quotes** in TS (`"Sardakk N'orr"`, `"Vuil'raith Cabal"`, `"Tren'lak"`).
- Every faction `starting.techIds` id MUST resolve to a `technologies` entry (enforced by test).
- All work on branch `faction-breadth`. `npm test`, `npm run check` (0 errors/0 warnings), `npm run build` green before finishing.

## File Structure

- `src/content/schema.ts` — add `trait?` to `planetSchema`; add `expansion` + `starting.startingUnits` to `factionSchema`.
- `src/content/technologies.ts` — add 11 starting technologies referenced by new factions.
- `src/content/factions.ts` — replace 3-faction array with all 24.
- `src/content/index.ts` — unchanged (its zod parse already validates; id-resolution is covered by test).
- `src/content/content.test.ts` — rewrite faction assertions for 24 + invariants + uniqueness.
- `src/lib/components/ReferenceBrowser.svelte` — faction detail shows starting planets/tech/units.
- `src/lib/components/ReferenceBrowser.svelte.test.ts`, `SetupWizard.svelte.test.ts`, `MenuSheet.svelte.test.ts` — add new required fields to `Faction` fixtures.

---

### Task 1: Schema + types, fixtures, backfill existing 3

**Files:**
- Modify: `src/content/schema.ts`
- Modify: `src/content/factions.ts` (backfill the 3 existing entries)
- Modify: `src/lib/components/ReferenceBrowser.svelte.test.ts`
- Modify: `src/lib/components/SetupWizard.svelte.test.ts`
- Modify: `src/lib/components/MenuSheet.svelte.test.ts`
- Test: `src/content/content.test.ts` (unchanged this task; still passes with 3 factions)

**Interfaces:**
- Produces: `factionSchema` now requires `expansion: 'base' | 'pok'` and `starting.startingUnits: string[]` (min 1); `planetSchema` gains optional `trait: 'cultural' | 'industrial' | 'hazardous'`.
- Consumes: nothing from later tasks.

- [ ] **Step 1: Edit `planetSchema` — add optional trait**

In `src/content/schema.ts`, replace:

```ts
export const planetSchema = z.object({
  id: z.string(),
  name: z.string(),
  resources: z.number().int().min(0),
  influence: z.number().int().min(0),
  exhausted: z.boolean(),
})
```

with:

```ts
export const planetSchema = z.object({
  id: z.string(),
  name: z.string(),
  resources: z.number().int().min(0),
  influence: z.number().int().min(0),
  exhausted: z.boolean(),
  trait: z.enum(['cultural', 'industrial', 'hazardous']).optional(),
})
```

- [ ] **Step 2: Edit `factionSchema` — add expansion + startingUnits**

In `src/content/schema.ts`, replace:

```ts
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
```

with:

```ts
export const factionSchema = z.object({
  id: z.string(),
  name: z.string(),
  expansion: z.enum(['base', 'pok']),
  combatModifier: z.number().int(),
  abilitySummaries: z.array(z.string()).min(1),
  starting: z.object({
    tokens: commandPoolsSchema,
    techIds: z.array(z.string()),
    planets: z.array(planetSchema),
    startingUnits: z.array(z.string()).min(1),
    commodities: z.number().int().min(0),
    tradeGoods: z.number().int().min(0),
  }),
})
```

- [ ] **Step 3: Run check — expect failures in factions.ts + 3 fixtures**

Run: `npm run check`
Expected: TS errors — `factions.ts` (3 entries missing `expansion`/`startingUnits`) and the 3 test fixtures. This confirms the required fields bite. (Do not commit yet.)

- [ ] **Step 4: Backfill the 3 existing factions**

Replace the full body of `src/content/factions.ts` with:

```ts
import type { Faction } from './schema'

export const factions: Faction[] = [
  {
    id: 'jol-nar',
    name: 'Universities of Jol-Nar',
    expansion: 'base',
    combatModifier: -1,
    abilitySummaries: [
      'Fragile: apply -1 to each of your unit\'s combat rolls.',
      'Brilliant: when resolving the Technology strategy card\'s secondary, you may resolve its primary instead.',
      'Analytical: when you research a non-unit-upgrade technology, you may ignore one prerequisite.',
    ],
    starting: {
      tokens: { tactic: 3, fleet: 3, strategy: 2 },
      techIds: ['neural-motivator', 'antimass-deflectors', 'sarween-tools', 'plasma-scoring'],
      planets: [
        { id: 'jol', name: 'Jol', resources: 1, influence: 2, exhausted: false },
        { id: 'nar', name: 'Nar', resources: 2, influence: 3, exhausted: false },
      ],
      startingUnits: ['1 Dreadnought', '2 Carriers', '1 Fighter', '2 Infantry', '1 Space Dock', '2 PDS'],
      commodities: 4,
      tradeGoods: 0,
    },
  },
  {
    id: 'sol',
    name: 'Federation of Sol',
    expansion: 'base',
    combatModifier: 0,
    abilitySummaries: [
      'Orbital Drop (ACTION): spend 1 strategy token to place 2 infantry on a planet you control.',
      'Versatile: when you gain command tokens during the Status phase, gain 1 extra.',
    ],
    starting: {
      tokens: { tactic: 3, fleet: 3, strategy: 2 },
      techIds: ['neural-motivator', 'antimass-deflectors'],
      planets: [{ id: 'jord', name: 'Jord', resources: 4, influence: 2, exhausted: false }],
      startingUnits: ['2 Carriers', '1 Destroyer', '3 Fighters', '5 Infantry', '1 Space Dock'],
      commodities: 4,
      tradeGoods: 0,
    },
  },
  {
    id: 'sardakk-norr',
    name: "Sardakk N'orr",
    expansion: 'base',
    combatModifier: 1,
    abilitySummaries: ['Unrelenting: apply +1 to each of your unit\'s combat rolls.'],
    starting: {
      tokens: { tactic: 3, fleet: 3, strategy: 2 },
      techIds: [],
      planets: [
        { id: 'quinarra', name: 'Quinarra', resources: 3, influence: 1, exhausted: false },
        { id: 'tren-lak', name: "Tren'lak", resources: 1, influence: 0, exhausted: false },
      ],
      startingUnits: ['2 Carriers', '1 Cruiser', '5 Infantry', '1 Space Dock', '1 PDS'],
      commodities: 3,
      tradeGoods: 0,
    },
  },
]
```

(Note: Sol's `Versatile` wording is corrected here — the old seed said "Leadership secondary", which was wrong.)

- [ ] **Step 5: Fix the 3 Faction-typed test fixtures**

In `src/lib/components/MenuSheet.svelte.test.ts`, replace the `faction` const (lines 7–10) with:

```ts
const faction: Faction = {
  id: 'sol', name: 'Federation of Sol', expansion: 'base', combatModifier: 0, abilitySummaries: ['Orbital Drop.'],
  starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], startingUnits: ['1 Space Dock'], commodities: 4, tradeGoods: 0 },
}
```

In `src/lib/components/ReferenceBrowser.svelte.test.ts`, replace the two faction literals with:

```ts
  { id: 'jol-nar', name: 'Universities of Jol-Nar', expansion: 'base', combatModifier: -1, abilitySummaries: ['Fragile: -1 combat.'], starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], startingUnits: ['1 Space Dock'], commodities: 4, tradeGoods: 0 } },
  { id: 'sol', name: 'Federation of Sol', expansion: 'base', combatModifier: 0, abilitySummaries: ['Orbital Drop.'], starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], startingUnits: ['1 Space Dock'], commodities: 4, tradeGoods: 0 } },
```

In `src/lib/components/SetupWizard.svelte.test.ts`, replace the two faction literals with:

```ts
  { id: 'jol-nar', name: 'Universities of Jol-Nar', expansion: 'base', combatModifier: -1, abilitySummaries: ['x'], starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], startingUnits: ['1 Space Dock'], commodities: 4, tradeGoods: 0 } },
  { id: 'sol', name: 'Federation of Sol', expansion: 'base', combatModifier: 0, abilitySummaries: ['x'], starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], startingUnits: ['1 Space Dock'], commodities: 4, tradeGoods: 0 } },
```

- [ ] **Step 6: Verify check + tests green**

Run: `npm run check`
Expected: 0 errors, 0 warnings.
Run: `npm test`
Expected: all pass (content.test still sees exactly 3 factions).

- [ ] **Step 7: Commit**

```bash
git add src/content/schema.ts src/content/factions.ts src/lib/components/MenuSheet.svelte.test.ts src/lib/components/ReferenceBrowser.svelte.test.ts src/lib/components/SetupWizard.svelte.test.ts
git commit -m "feat: faction schema gains expansion, startingUnits, optional planet trait"
```

---

### Task 2: Add 11 starting technologies

**Files:**
- Modify: `src/content/technologies.ts`
- Test: `src/content/content.test.ts`

**Interfaces:**
- Produces these technology ids (consumed by Task 3 factions): `magen-defense-grid`, `gravity-drive`, `dacxive-animators`, `graviton-laser-system`, `dark-energy-tap`, `bio-stims`, `predictive-intelligence`, `psychoarchaeology`, `ai-development-algorithm`, `scanlink-drone-network`, `self-assembly-routines`. (`sling-relay` already exists and is reused by Nomad.)

- [ ] **Step 1: Write a failing test for the new tech ids**

In `src/content/content.test.ts`, add inside the `describe('content registry', …)` block:

```ts
  it('includes the starting technologies referenced by factions', () => {
    const ids = new Set(content.technologies.map((t) => t.id))
    for (const id of [
      'magen-defense-grid', 'gravity-drive', 'dacxive-animators', 'graviton-laser-system',
      'dark-energy-tap', 'bio-stims', 'predictive-intelligence', 'psychoarchaeology',
      'ai-development-algorithm', 'scanlink-drone-network', 'self-assembly-routines',
    ]) expect(ids.has(id)).toBe(true)
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/content/content.test.ts`
Expected: FAIL (ids not found).

- [ ] **Step 3: Append the 11 technologies**

In `src/content/technologies.ts`, add these entries to the `technologies` array (before the closing `]`). Prerequisites are display-only (the engine does not consume them); values marked `// verify` should be sheet-checked but are non-blocking:

```ts
  { id: 'magen-defense-grid', name: 'Magen Defense Grid', color: 'red', prerequisites: ['red'], summary: 'At the start of ground combat on a planet with your structure, deal 1 hit to enemy ground forces; when a system with your structure is activated, add 1 free infantry there.', hasAction: false }, // verify prereq
  { id: 'gravity-drive', name: 'Gravity Drive', color: 'blue', prerequisites: ['blue'], summary: 'After you activate a system, add +1 to the move value of one of your ships this action.', hasAction: false },
  { id: 'dacxive-animators', name: 'Dacxive Animators', color: 'green', prerequisites: ['green'], summary: 'After you win a ground combat, place 1 free infantry on that planet.', hasAction: false },
  { id: 'graviton-laser-system', name: 'Graviton Laser System', color: 'yellow', prerequisites: ['yellow'], summary: 'Exhaust before your units fire Space Cannon; those hits must be assigned to non-fighter ships.', hasAction: false },
  { id: 'dark-energy-tap', name: 'Dark Energy Tap', color: 'blue', prerequisites: [], summary: 'After a tactical action in a system with a frontier token and your ships, explore it; your ships may also retreat into empty adjacent systems.', hasAction: false },
  { id: 'bio-stims', name: 'Bio-Stims', color: 'green', prerequisites: ['green'], summary: 'Exhaust at end of your turn to ready one of your planets with a tech specialty, or one of your other technologies.', hasAction: false },
  { id: 'predictive-intelligence', name: 'Predictive Intelligence', color: 'yellow', prerequisites: ['yellow'], summary: 'Exhaust at end of turn to redistribute your command tokens; or cast 3 extra votes in the agenda phase.', hasAction: false },
  { id: 'psychoarchaeology', name: 'Psychoarchaeology', color: 'green', prerequisites: [], summary: 'Use planets\' tech specialties without exhausting them; during the action phase exhaust specialty planets for 1 trade good each.', hasAction: false },
  { id: 'ai-development-algorithm', name: 'AI Development Algorithm', color: 'red', prerequisites: [], summary: 'Exhaust to ignore 1 prerequisite when researching a unit upgrade, or to reduce produced-unit cost by your number of unit upgrades.', hasAction: false },
  { id: 'scanlink-drone-network', name: 'Scanlink Drone Network', color: 'yellow', prerequisites: [], summary: 'When you activate a system, explore a planet there that contains your units.', hasAction: false }, // verify prereq
  { id: 'self-assembly-routines', name: 'Self Assembly Routines', color: 'red', prerequisites: [], summary: 'After your units use Production, exhaust to place a free mech on a planet you control there; gain 1 trade good when one of your mechs is destroyed.', hasAction: false }, // verify prereq
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/content/content.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/content/technologies.ts src/content/content.test.ts
git commit -m "feat: add 11 starting technologies referenced by new factions"
```

---

### Task 3: All 24 factions

**Files:**
- Modify: `src/content/factions.ts` (replace entire array with 24)
- Test: `src/content/content.test.ts` (rewrite faction assertions)

**Interfaces:**
- Consumes: the 11 technology ids from Task 2 + the pre-existing generic tech ids (`neural-motivator`, `antimass-deflectors`, `sarween-tools`, `plasma-scoring`, `sling-relay`).
- Produces: `content.factions` of length 24 (17 base + 7 PoK).

- [ ] **Step 1: Rewrite `content.test.ts` faction assertions (failing first)**

In `src/content/content.test.ts`, replace the `it('includes the three seed factions', …)` block with these blocks:

```ts
  it('exposes all 24 base + PoK factions with a 17/7 split', () => {
    expect(content.factions).toHaveLength(24)
    expect(content.factions.filter((f) => f.expansion === 'base')).toHaveLength(17)
    expect(content.factions.filter((f) => f.expansion === 'pok')).toHaveLength(7)
  })

  it('still includes the original seed factions', () => {
    const ids = new Set(content.factions.map((f) => f.id))
    for (const id of ['jol-nar', 'sol', 'sardakk-norr']) expect(ids.has(id)).toBe(true)
  })

  it('has unique faction ids and unique planet ids', () => {
    const factionIds = content.factions.map((f) => f.id)
    expect(new Set(factionIds).size).toBe(factionIds.length)
    const planetIds = content.factions.flatMap((f) => f.starting.planets.map((pl) => pl.id))
    expect(new Set(planetIds).size).toBe(planetIds.length)
  })

  it('holds the faction invariants (tokens 3/3/2, 0 trade goods, combat mod only Jol-Nar/Sardakk)', () => {
    for (const f of content.factions) {
      expect(f.starting.tokens).toEqual({ tactic: 3, fleet: 3, strategy: 2 })
      expect(f.starting.tradeGoods).toBe(0)
      expect(f.starting.startingUnits.length).toBeGreaterThan(0)
      const expected = f.id === 'jol-nar' ? -1 : f.id === 'sardakk-norr' ? 1 : 0
      expect(f.combatModifier).toBe(expected)
    }
  })
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/content/content.test.ts`
Expected: FAIL (length 3 ≠ 24).

- [ ] **Step 3: Replace `factions.ts` with all 24**

Replace the ENTIRE contents of `src/content/factions.ts` with:

```ts
import type { Faction } from './schema'

const tokens = { tactic: 3, fleet: 3, strategy: 2 }
const p = (id: string, name: string, resources: number, influence: number): Faction['starting']['planets'][number] =>
  ({ id, name, resources, influence, exhausted: false })

export const factions: Faction[] = [
  // ---------- Base game (17) ----------
  {
    id: 'arborec', name: 'Arborec', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      "Mitosis: your space docks can't build infantry, but each Status phase you place 1 free infantry on a planet you control.",
    ],
    starting: {
      tokens, techIds: ['magen-defense-grid'],
      planets: [p('nestphar', 'Nestphar', 3, 2)],
      startingUnits: ['1 Carrier', '1 Cruiser', '2 Fighters', '4 Infantry', '1 Space Dock', '1 PDS'],
      commodities: 3, tradeGoods: 0,
    },
  },
  {
    id: 'letnev', name: 'Barony of Letnev', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      'Munitions Reserves: at the start of any combat round you may spend 2 trade goods to reroll any of your dice.',
      'Armada: your non-fighter ship limit per system is 2 higher than your fleet-pool token count.',
    ],
    starting: {
      tokens, techIds: ['antimass-deflectors', 'plasma-scoring'],
      planets: [p('arc-prime', 'Arc Prime', 4, 0), p('wren-terra', 'Wren Terra', 2, 1)],
      startingUnits: ['1 Dreadnought', '1 Carrier', '1 Destroyer', '1 Fighter', '3 Infantry', '1 Space Dock'],
      commodities: 2, tradeGoods: 0,
    },
  },
  {
    id: 'saar', name: 'Clan of Saar', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      'Scavenge: gain 1 trade good each time you gain control of a planet.',
      'Nomadic: you can score objectives even without controlling the planets in your home system.',
    ],
    starting: {
      tokens, techIds: ['antimass-deflectors'],
      planets: [p('lisis-ii', 'Lisis II', 1, 0), p('ragh', 'Ragh', 2, 1)],
      startingUnits: ['2 Carriers', '1 Cruiser', '2 Fighters', '4 Infantry', '1 Space Dock'],
      commodities: 3, tradeGoods: 0,
    },
  },
  {
    id: 'muaat', name: 'Embers of Muaat', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      'Star Forge (ACTION): spend 1 strategy token to place 2 fighters or 1 destroyer in a system with one of your war suns.',
      'Gashlai Physiology: your ships can move through supernovas.',
    ],
    starting: {
      tokens, techIds: ['plasma-scoring'],
      planets: [p('muaat', 'Muaat', 4, 1)],
      startingUnits: ['1 War Sun', '2 Fighters', '4 Infantry', '1 Space Dock'],
      commodities: 4, tradeGoods: 0,
    },
  },
  {
    id: 'hacan', name: 'Emirates of Hacan', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      "Masters of Trade: you don't spend a command token for the Trade strategy card's secondary.",
      "Guild Ships: you may make transactions with players who aren't your neighbors.",
      'Arbiters: you may include action cards in your transactions.',
    ],
    starting: {
      tokens, techIds: ['antimass-deflectors', 'sarween-tools'],
      planets: [p('arretze', 'Arretze', 2, 0), p('hercant', 'Hercant', 1, 1), p('kamdorn', 'Kamdorn', 0, 1)],
      startingUnits: ['2 Carriers', '1 Cruiser', '2 Fighters', '4 Infantry', '1 Space Dock'],
      commodities: 6, tradeGoods: 0,
    },
  },
  {
    id: 'sol', name: 'Federation of Sol', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      'Orbital Drop (ACTION): spend 1 strategy token to place 2 infantry on a planet you control.',
      'Versatile: when you gain command tokens during the Status phase, gain 1 extra.',
    ],
    starting: {
      tokens, techIds: ['neural-motivator', 'antimass-deflectors'],
      planets: [p('jord', 'Jord', 4, 2)],
      startingUnits: ['2 Carriers', '1 Destroyer', '3 Fighters', '5 Infantry', '1 Space Dock'],
      commodities: 4, tradeGoods: 0,
    },
  },
  {
    id: 'creuss', name: 'Ghosts of Creuss', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      'Quantum Entanglement: all systems with an alpha or beta wormhole are adjacent to each other for you.',
      'Slipstream: +1 movement to each of your ships that starts in your home system or a wormhole system.',
      'Creuss Gate: your home system starts in your play area; the Creuss Gate tile stands in for it on the board.',
    ],
    starting: {
      tokens, techIds: ['gravity-drive'],
      planets: [p('creuss', 'Creuss', 4, 2)],
      startingUnits: ['1 Carrier', '2 Destroyers', '2 Fighters', '4 Infantry', '1 Space Dock'],
      commodities: 4, tradeGoods: 0,
    },
  },
  {
    id: 'l1z1x', name: 'L1Z1X Mindnet', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      'Assimilate: when you take a planet, its PDS and space docks become yours instead of being destroyed.',
      "Harrow: after each ground-combat round, your ships in the active system bombard the enemy's ground forces.",
    ],
    starting: {
      tokens, techIds: ['neural-motivator', 'plasma-scoring'],
      planets: [p('l1z1x-home', '[0.0.0]', 5, 0)], // verify planet name/values against faction sheet
      startingUnits: ['1 Dreadnought', '1 Carrier', '3 Fighters', '5 Infantry', '1 Space Dock', '1 PDS'],
      commodities: 2, tradeGoods: 0,
    },
  },
  {
    id: 'mentak', name: 'Mentak Coalition', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      'Ambush: at the start of space combat, roll for up to 2 of your cruisers/destroyers to score pre-combat hits.',
      'Pillage: when a neighbor with 3+ trade goods gains goods or trades, you may take 1 of their trade goods or commodities.',
    ],
    starting: {
      tokens, techIds: ['sarween-tools', 'plasma-scoring'],
      planets: [p('moll-primus', 'Moll Primus', 4, 1)],
      startingUnits: ['1 Carrier', '2 Cruisers', '3 Fighters', '4 Infantry', '1 Space Dock', '1 PDS'],
      commodities: 2, tradeGoods: 0,
    },
  },
  {
    id: 'naalu', name: 'Naalu Collective', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      "Telepathic: you're always first in initiative (the Naalu '0' token) regardless of your strategy card.",
      'Foresight: when a player moves into a system with your ships, you may dodge your ships to an adjacent empty system.',
    ],
    starting: {
      tokens, techIds: ['neural-motivator', 'sarween-tools'],
      planets: [p('maaluuk', 'Maaluuk', 0, 2), p('druaa', 'Druaa', 3, 1)],
      startingUnits: ['1 Carrier', '1 Cruiser', '1 Destroyer', '3 Fighters', '4 Infantry', '1 Space Dock', '1 PDS'],
      commodities: 3, tradeGoods: 0,
    },
  },
  {
    id: 'nekro', name: 'Nekro Virus', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      "Galactic Threat: you can't vote; once per agenda you may predict the outcome to steal a technology if right.",
      "Technological Singularity: once per combat, when you destroy an enemy unit you may take one of that player's techs.",
      "Propagation: you can't research; each research you'd do gives you 3 command tokens instead.",
    ],
    starting: {
      tokens, techIds: ['dacxive-animators'],
      planets: [p('mordai-ii', 'Mordai II', 4, 0)],
      startingUnits: ['1 Dreadnought', '1 Carrier', '1 Cruiser', '2 Fighters', '2 Infantry', '1 Space Dock'],
      commodities: 3, tradeGoods: 0,
    },
  },
  {
    id: 'sardakk-norr', name: "Sardakk N'orr", expansion: 'base', combatModifier: 1,
    abilitySummaries: ["Unrelenting: apply +1 to each of your unit's combat rolls."],
    starting: {
      tokens, techIds: [],
      planets: [p('quinarra', 'Quinarra', 3, 1), p('tren-lak', "Tren'lak", 1, 0)],
      startingUnits: ['2 Carriers', '1 Cruiser', '5 Infantry', '1 Space Dock', '1 PDS'],
      commodities: 3, tradeGoods: 0,
    },
  },
  {
    id: 'jol-nar', name: 'Universities of Jol-Nar', expansion: 'base', combatModifier: -1,
    abilitySummaries: [
      "Fragile: apply -1 to each of your unit's combat rolls.",
      "Brilliant: when resolving the Technology strategy card's secondary, you may resolve its primary instead.",
      'Analytical: when you research a non-unit-upgrade technology, you may ignore one prerequisite.',
    ],
    starting: {
      tokens, techIds: ['neural-motivator', 'antimass-deflectors', 'sarween-tools', 'plasma-scoring'],
      planets: [p('jol', 'Jol', 1, 2), p('nar', 'Nar', 2, 3)],
      startingUnits: ['1 Dreadnought', '2 Carriers', '1 Fighter', '2 Infantry', '1 Space Dock', '2 PDS'],
      commodities: 4, tradeGoods: 0,
    },
  },
  {
    id: 'winnu', name: 'Winnu', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      "Blood Ties: you don't spend influence to remove the custodians token from Mecatol Rex.",
      'Reclamation: after a tactical action where you take Mecatol Rex, place 1 free PDS and 1 space dock there.',
    ],
    starting: {
      tokens, techIds: [],
      planets: [p('winnu', 'Winnu', 3, 4)],
      startingUnits: ['1 Carrier', '1 Cruiser', '2 Fighters', '2 Infantry', '1 Space Dock', '1 PDS'],
      commodities: 3, tradeGoods: 0,
    },
  },
  {
    id: 'xxcha', name: 'Xxcha Kingdom', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      'Peace Accords: after resolving Diplomacy (primary or secondary), you may claim an empty planet adjacent to one you control.',
      'Quash: spend 1 strategy token when an agenda is revealed to discard it and reveal a new one.',
    ],
    starting: {
      tokens, techIds: ['graviton-laser-system'],
      planets: [p('archon-ren', 'Archon Ren', 2, 3), p('archon-tau', 'Archon Tau', 1, 1)],
      startingUnits: ['1 Carrier', '2 Cruisers', '3 Fighters', '4 Infantry', '1 Space Dock', '1 PDS'],
      commodities: 4, tradeGoods: 0,
    },
  },
  {
    id: 'yin', name: 'Yin Brotherhood', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      'Indoctrination: at the start of ground combat, spend 2 influence to convert 1 enemy infantry into yours.',
      'Devotion: after each space-combat round, destroy one of your cruisers/destroyers to score 1 hit on the enemy.',
    ],
    starting: {
      tokens, techIds: ['sarween-tools'],
      planets: [p('darien', 'Darien', 4, 4)],
      startingUnits: ['2 Carriers', '1 Destroyer', '4 Fighters', '4 Infantry', '1 Space Dock'],
      commodities: 2, tradeGoods: 0,
    },
  },
  {
    id: 'yssaril', name: 'Yssaril Tribes', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      'Stall Tactics (ACTION): discard an action card from your hand (a do-nothing action to keep turns going).',
      'Scheming: when you draw action cards, draw 1 extra, then discard 1 card from your hand.',
      'Crafty: you have no hand-size limit on action cards.',
    ],
    starting: {
      tokens, techIds: ['neural-motivator'],
      planets: [p('retillion', 'Retillion', 2, 3), p('shalloq', 'Shalloq', 1, 2)],
      startingUnits: ['2 Carriers', '1 Cruiser', '2 Fighters', '5 Infantry', '1 Space Dock', '1 PDS'],
      commodities: 3, tradeGoods: 0,
    },
  },
  // ---------- Prophecy of Kings (7) ----------
  {
    id: 'argent', name: 'Argent Flight', expansion: 'pok', combatModifier: 0,
    abilitySummaries: [
      'Zeal: you always vote first, and cast 1 extra vote per player in the game.',
      'Raid Formation: excess Anti-Fighter Barrage hits damage enemy ships that have Sustain Damage.',
    ],
    starting: {
      tokens, techIds: ['neural-motivator', 'sarween-tools', 'plasma-scoring'],
      planets: [p('valk', 'Valk', 2, 0), p('avar', 'Avar', 1, 1), p('ylir', 'Ylir', 0, 2)],
      startingUnits: ['1 Carrier', '2 Destroyers', '2 Fighters', '5 Infantry', '1 Space Dock', '1 PDS'],
      commodities: 3, tradeGoods: 0,
    },
  },
  {
    id: 'empyrean', name: 'Empyrean', expansion: 'pok', combatModifier: 0,
    abilitySummaries: [
      "Voidborn: nebulae don't slow your ships' movement.",
      'Aetherpassage: after a player activates a system, you may let them move through systems containing your ships.',
      'Dark Whispers: you start with 2 faction promissory notes instead of 1.',
    ],
    starting: {
      tokens, techIds: ['dark-energy-tap'],
      planets: [p('the-dark', 'The Dark', 3, 4)],
      startingUnits: ['2 Carriers', '1 Destroyer', '2 Fighters', '4 Infantry', '1 Space Dock'],
      commodities: 4, tradeGoods: 0,
    },
  },
  {
    id: 'mahact', name: 'Mahact Gene-Sorcerers', expansion: 'pok', combatModifier: 0,
    abilitySummaries: [
      'Edict: when you win combat, take an enemy command token into your fleet pool (raising your fleet limit).',
      "Imperia: while you hold another player's command token in your fleet pool, you may use their unlocked commander.",
      "Hubris: you purge your Alliance promissory at setup and can't receive others' Alliance notes.",
    ],
    starting: {
      tokens, techIds: ['bio-stims', 'predictive-intelligence'],
      planets: [p('ixth', 'Ixth', 3, 5)],
      startingUnits: ['1 Dreadnought', '1 Carrier', '1 Cruiser', '2 Fighters', '3 Infantry', '1 Space Dock'],
      commodities: 3, tradeGoods: 0,
    },
  },
  {
    id: 'naaz-rokha', name: 'Naaz-Rokha Alliance', expansion: 'pok', combatModifier: 0,
    abilitySummaries: [
      'Distant Suns: when you explore a planet with your mech, draw an extra explore card and pick one.',
      'Fabrication (ACTION): purge 2 matching relic fragments for a relic, or 1 fragment for a command token.',
    ],
    starting: {
      tokens, techIds: ['psychoarchaeology', 'ai-development-algorithm'],
      planets: [p('naazir', 'Naazir', 2, 1), p('rokha', 'Rokha', 1, 2)],
      startingUnits: ['2 Carriers', '1 Destroyer', '2 Fighters', '1 Mech', '3 Infantry', '1 Space Dock'],
      commodities: 3, tradeGoods: 0,
    },
  },
  {
    id: 'nomad', name: 'Nomad', expansion: 'pok', combatModifier: 0,
    abilitySummaries: [
      'The Company: you start with 3 agents (2 extra Nomad agents).',
      'Future Sight: gain 1 trade good whenever an agenda outcome you voted or predicted resolves.',
    ],
    starting: {
      tokens, techIds: ['sling-relay'],
      planets: [p('arcturus', 'Arcturus', 4, 4)],
      startingUnits: ['1 Flagship', '1 Carrier', '1 Destroyer', '3 Fighters', '4 Infantry', '1 Space Dock'],
      commodities: 4, tradeGoods: 0,
    },
  },
  {
    id: 'titans', name: 'Titans of Ul', expansion: 'pok', combatModifier: 0,
    abilitySummaries: [
      'Terragenesis: after exploring a planet with no sleeper token, place or move a sleeper token onto it.',
      'Awaken: when you activate a system with your sleeper tokens, turn each into a free PDS.',
      'Coalescence: units your flagship or Awaken drop alongside enemies must fight that turn.',
    ],
    starting: {
      tokens, techIds: ['antimass-deflectors', 'scanlink-drone-network'],
      planets: [p('elysium', 'Elysium', 4, 1)],
      startingUnits: ['1 Dreadnought', '2 Cruisers', '2 Fighters', '3 Infantry', '1 Space Dock'],
      commodities: 2, tradeGoods: 0,
    },
  },
  {
    id: 'vuilraith', name: "Vuil'raith Cabal", expansion: 'pok', combatModifier: 0,
    abilitySummaries: [
      "Devour: capture the enemy's non-structure units you destroy in combat.",
      'Amalgamation: when producing a unit, return a captured unit of that type to build it for free.',
      'Riftmeld: when researching a unit upgrade, return a captured unit of that type to ignore its prerequisites.',
    ],
    starting: {
      tokens, techIds: ['self-assembly-routines'],
      planets: [p('acheron', 'Acheron', 4, 0)],
      startingUnits: ['1 Dreadnought', '1 Carrier', '1 Cruiser', '3 Fighters', '3 Infantry', '1 Space Dock'],
      commodities: 2, tradeGoods: 0,
    },
  },
]
```

- [ ] **Step 4: Run content tests to verify pass**

Run: `npx vitest run src/content/content.test.ts`
Expected: PASS (24 factions, 17/7 split, seeds present, uniqueness, invariants, all techIds resolve).

- [ ] **Step 5: Commit**

```bash
git add src/content/factions.ts src/content/content.test.ts
git commit -m "feat: all 24 base + PoK factions (wiki-sourced starting data)"
```

---

### Task 4: Surface starting data in the reference browser

**Files:**
- Modify: `src/lib/components/ReferenceBrowser.svelte`
- Test: `src/lib/components/ReferenceBrowser.svelte.test.ts`

**Interfaces:**
- Consumes: `Faction.starting` (planets/techIds/startingUnits) + `technologies` prop (to map techId → name).

**Rationale:** without this, `startingUnits` and starting planets are stored but never shown. This makes the new data useful as a setup reference.

- [ ] **Step 1: Write a failing test**

In `src/lib/components/ReferenceBrowser.svelte.test.ts`, give the first fixture real starting data so the detail can render it. Replace the `jol-nar` fixture line with:

```ts
  { id: 'jol-nar', name: 'Universities of Jol-Nar', expansion: 'base', combatModifier: -1, abilitySummaries: ['Fragile: -1 combat.'], starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: ['neural-motivator'], planets: [{ id: 'jol', name: 'Jol', resources: 1, influence: 2, exhausted: false }], startingUnits: ['2 Carriers'], commodities: 4, tradeGoods: 0 } },
```

Then add this test inside the `describe` (ensure `fireEvent` and `screen` are imported from `@testing-library/svelte`):

```ts
  it('shows a faction\'s starting units and planets when expanded', async () => {
    render(ReferenceBrowser, { props: { factions, technologies, strategyCards, objectives } })
    await fireEvent.click(screen.getByText('Universities of Jol-Nar'))
    expect(screen.getByText(/2 Carriers/)).toBeTruthy()
    expect(screen.getByText(/Jol/)).toBeTruthy()
  })
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/components/ReferenceBrowser.svelte.test.ts`
Expected: FAIL (starting units/planet not rendered).

- [ ] **Step 3: Build the faction detail string**

In `src/lib/components/ReferenceBrowser.svelte`, replace the faction branch of the `all` derived (the `kind === 'faction' ? factions.map(...)` expression) with:

```ts
    kind === 'faction'
      ? factions.map((f) => {
          const techName = (id: string) => technologies.find((t) => t.id === id)?.name ?? id
          const planets = f.starting.planets.map((pl) => `${pl.name} (${pl.resources}/${pl.influence})`).join(', ') || 'none'
          const techs = f.starting.techIds.map(techName).join(', ') || 'none'
          const setup = `Home planets: ${planets}\nStarting tech: ${techs}\nStarting units: ${f.starting.startingUnits.join(', ')}`
          return { id: f.id, title: f.name, summary: f.abilitySummaries[0] ?? '', detail: `${f.abilitySummaries.join('\n')}\n\n${setup}` }
        })
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/components/ReferenceBrowser.svelte.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/ReferenceBrowser.svelte src/lib/components/ReferenceBrowser.svelte.test.ts
git commit -m "feat: reference browser shows faction starting planets/tech/units"
```

---

### Task 5: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: all pass.

- [ ] **Step 2: Type check**

Run: `npm run check`
Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Manual sanity (optional)**

Run: `npm run dev`, open the app, confirm the setup dropdown lists all 24 factions and the reference browser shows a faction's starting units.

---

## Self-Review

- **Spec coverage:** 24 factions (Task 3) ✓; wiki sourcing + authored abilities (Global Constraints + data) ✓; schema `expansion`/`startingUnits`/optional `trait` (Task 1) ✓; faction-specific starting techs added (Task 2) ✓; id-resolution + count/split + invariants tests (Tasks 2–3) ✓; reference visibility (Task 4) ✓; no engine/UI-flow change ✓.
- **Deviations from spec:** (1) planet `trait` field added but left unpopulated (no reliable source; dataset traits proven wrong) — surfaced to user. (2) Small ReferenceBrowser enhancement added (Task 4) so `startingUnits`/planets are visible — the spec listed this as an optional follow-up; pulled in so the chosen data isn't invisible.
- **Placeholder scan:** none. `// verify` comments on 3 tech prereqs + L1Z1X planet are intentional non-blocking flags, not gaps.
- **Type consistency:** `Faction` type gains `expansion` + `starting.startingUnits`; `FactionStartingInfo` (domain) unchanged and remains assignable from `Faction`. Tech ids produced in Task 2 exactly match `techIds` consumed in Task 3.
