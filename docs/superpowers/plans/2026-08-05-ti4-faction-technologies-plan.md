# Faction Technologies (3a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add all 48 faction technologies (2 per faction × 24) to the tech catalog so the research flow offers a player their own faction techs and stops offering generic unit upgrades their faction sheet replaces.

**Architecture:** Faction techs live in the existing `technologies.ts` alongside the generic ones, distinguished by an optional `factionId`, with an optional `replaces` naming the generic unit upgrade a faction variant supersedes. `getResearchableTechs` gains ownership and supersession filters ahead of its unchanged prerequisite maths. `TECH_GROUPS` gains a Faction group for the picker; the reference tech tab appends one group per faction, derived from the faction list. No new state and no persistence migration.

**Tech Stack:** Vite + Svelte 5 (runes), TypeScript, Zod, Vitest, @testing-library/svelte.

## Global Constraints

- `npm run check` must report **0 errors / 0 warnings** (svelte-check); `npm test` green; `npm run build` OK — run all three before the final commit of any task touching `.svelte`.
- Svelte 5 runes. A prop literally named `state` collides with the `$state` rune — alias it: `let { state: gameState } = $props()`.
- All game data lives in `src/content/` as data files. Never hardcode game data in components.
- Technology summaries are authored in **our own words — never verbatim card text** (copyright). The 48 summaries in Task 2 are already paraphrased; transcribe them exactly and do not "improve" them toward printed wording. Unit stat lines (Cost/Combat/Move/Capacity) are facts and may be stated plainly.
- `src/engine/` stays pure: no Svelte, no runtime content imports. Type-only imports are allowed; content arrays are passed in as parameters.
- Store / engine / persistence wiring lives **only** in `App.svelte`. Components are presentational (props + callbacks).
- Every content file has a Zod schema + a validation test.
- "Assistant, not referee": filtering governs only what is *offered*. Any technology stays addable and removable in the board editor, and every value stays editable and undoable.

## Verified source data (AsyncTI4 `data/technologies/pok.json`, entries with a `faction` key)

**48 faction technologies — exactly 2 per faction across all 24.** Reading notes, all verified:

- The file yields 52 such entries. Two are Nekro joke entries with corrupted names (`???\_NULL\_REFERENCE\_???`, `???\_ERROR\_ERROR\_???`) whose text matches no printed card — Nekro's real pair is its two Valefar Assimilators. Two more belong to `keleres`, a Codex faction absent from our 24-faction roster. Excluding all four leaves 48.
- **Expansion split:** 34 `base`, 14 `pok` (the PoK 14 being the two techs each for Argent, Empyrean, Mahact, Naaz-Rokha, Nomad, Titans, and Vuil'raith).
- **Type mapping:** `PROPULSION`→blue, `BIOTIC`→green, `CYBERNETIC`→yellow, `WARFARE`→red, `UNITUPGRADE`→`color:'none'` + `type:'unit-upgrade'`, `NONE`→`color:'none'` + `type:'ability'` (Nekro's two).
- **14 unit upgrades**, 13 with a `replaces` target; Nomad's Memoria II has none (it upgrades their unique flagship).
- **5 carry a component action** (`hasAction: true`): Wormhole Generator, Production Biomes, Lazax Gate Folding, Mageon Implants, Vortex.

---

## Task 1: Optional schema fields + relaxed type invariant

Schema-only change, landed before the catalog so the content in Task 2 has fields to fill.

**Files:**
- Modify: `src/content/schema.ts` (technologySchema)
- Test: `src/content/content.test.ts`

**Interfaces:**
- Produces: `Technology` gains `factionId?: string` (absent = generic) and `replaces?: string` (the generic tech id a faction unit upgrade supersedes).

- [ ] **Step 1: Write the failing test**

Append inside `describe('content registry', ...)` in `src/content/content.test.ts`:

```ts
it('accepts an optional factionId and replaces on a technology', () => {
  const withFaction = {
    id: 'x', name: 'X', color: 'none', type: 'unit-upgrade', expansion: 'base',
    prerequisites: ['blue', 'blue'], summary: 'y', hasAction: false,
    factionId: 'sol', replaces: 'carrier-ii',
  }
  const parsed = technologySchema.safeParse(withFaction)
  expect(parsed.success).toBe(true)
  if (parsed.success) {
    expect(parsed.data.factionId).toBe('sol')
    expect(parsed.data.replaces).toBe('carrier-ii')
  }
})

it('still accepts a generic technology with neither field', () => {
  const generic = {
    id: 'g', name: 'G', color: 'blue', type: 'ability', expansion: 'base',
    prerequisites: [], summary: 'y', hasAction: false,
  }
  const parsed = technologySchema.safeParse(generic)
  expect(parsed.success).toBe(true)
  if (parsed.success) expect(parsed.data.factionId).toBeUndefined()
})
```

Add `technologySchema` to the existing schema import at the top of that file so it reads:

```ts
import { objectiveSchema, secretObjectiveSchema, technologySchema } from './schema'
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- content.test`
Expected: FAIL — `technologySchema` rejects the unknown keys `factionId` and `replaces` (Zod objects strip/reject fields not in the shape, so the parsed data lacks them and the assertions fail).

- [ ] **Step 3: Add the two optional fields**

In `src/content/schema.ts`, in `technologySchema`, add these two lines immediately after the `prerequisites:` line:

```ts
  factionId: z.string().optional(),
  replaces: z.string().optional(),
```

- [ ] **Step 4: Relax the type invariant**

The existing test in `src/content/content.test.ts` titled `'keeps unit-upgrade and colorless in lockstep, and abilities colored'` asserts both directions of `unit-upgrade ⟺ color:'none'`. Nekro's two Valefar Assimilators are colourless *ability* cards, so the reverse direction is about to become false. Replace that whole test with the one-way form:

```ts
it('keeps every unit upgrade colorless (colorless abilities are allowed)', () => {
  for (const t of content.technologies) {
    if (t.type === 'unit-upgrade') expect(t.color).toBe('none')
  }
})
```

- [ ] **Step 5: Run tests + check, verify green**

Run: `npm test -- content.test` → Expected: PASS
Run: `npm test` → Expected: all pass
Run: `npm run check` → Expected: 0 errors, 0 warnings

- [ ] **Step 6: Commit**

```bash
git add src/content/schema.ts src/content/content.test.ts
git commit -m "feat: optional factionId + replaces on technologies; relax type invariant"
```

---

## Task 2: The 48 faction technologies

**Files:**
- Modify: `src/content/technologies.ts` (append 48 entries)
- Test: `src/content/content.test.ts`

**Interfaces:**
- Consumes: `factionId` / `replaces` (Task 1).
- Produces: `content.technologies` grows from 33 to **81** entries, 48 of which carry a `factionId`.

- [ ] **Step 1: Write the failing tests**

Append inside `describe('content registry', ...)` in `src/content/content.test.ts`:

```ts
it('carries 48 faction technologies, exactly 2 per faction', () => {
  const faction = content.technologies.filter((t) => t.factionId)
  expect(content.technologies).toHaveLength(81)
  expect(faction).toHaveLength(48)
  const counts = new Map<string, number>()
  for (const t of faction) counts.set(t.factionId!, (counts.get(t.factionId!) ?? 0) + 1)
  expect(counts.size).toBe(24)
  for (const [, n] of counts) expect(n).toBe(2)
})

it('splits faction technologies 34 base / 14 PoK', () => {
  const faction = content.technologies.filter((t) => t.factionId)
  expect(faction.filter((t) => t.expansion === 'base')).toHaveLength(34)
  expect(faction.filter((t) => t.expansion === 'pok')).toHaveLength(14)
})

it('gives every faction technology an owner that exists', () => {
  const factionIds = new Set(content.factions.map((f) => f.id))
  for (const t of content.technologies.filter((t) => t.factionId)) {
    expect(factionIds.has(t.factionId!)).toBe(true)
  }
})

it('points every replaces at a real generic unit upgrade', () => {
  const genericUpgrades = new Set(
    content.technologies.filter((t) => !t.factionId && t.type === 'unit-upgrade').map((t) => t.id),
  )
  const withReplaces = content.technologies.filter((t) => t.replaces)
  expect(withReplaces).toHaveLength(13)
  for (const t of withReplaces) {
    expect(t.factionId).toBeTruthy()
    expect(genericUpgrades.has(t.replaces!)).toBe(true)
  }
})

it('has 14 faction unit upgrades and flags the 5 with component actions', () => {
  const faction = content.technologies.filter((t) => t.factionId)
  expect(faction.filter((t) => t.type === 'unit-upgrade')).toHaveLength(14)
  expect(faction.filter((t) => t.hasAction).map((t) => t.id).sort()).toEqual([
    'lazax-gate-folding', 'mageon-implants', 'production-biomes', 'vortex', 'wormhole-generator',
  ])
})

it('excludes Keleres and the Nekro joke entries', () => {
  const ids = content.technologies.map((t) => t.id)
  expect(new Set(ids).size).toBe(ids.length)
  expect(ids.some((id) => id.includes('keleres'))).toBe(false)
  expect(ids.some((id) => id.includes('null') || id.includes('error'))).toBe(false)
  const nekro = content.technologies.filter((t) => t.factionId === 'nekro').map((t) => t.id).sort()
  expect(nekro).toEqual(['valefar-assimilator-x', 'valefar-assimilator-y'])
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- content.test`
Expected: FAIL — the catalog still holds 33 entries and none carry a `factionId`.

- [ ] **Step 3: Append the 48 faction technologies**

In `src/content/technologies.ts`, append these entries to the `technologies` array, after the existing generic unit upgrades and before the closing `]`:

```ts

  // ══ Faction technologies (48: 2 per faction) ══

  // ── Arborec ──
  { id: 'letani-warrior-ii', name: 'Letani Warrior II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['green', 'green'], summary: 'Upgraded Letani Warrior — Combat 7, and it carries Production 2; when killed, a 6-or-better roll brings it home to redeploy next turn.', hasAction: false, factionId: 'arborec', replaces: 'infantry-ii' },
  { id: 'bioplasmosis', name: 'Bioplasmosis', color: 'green', type: 'ability', expansion: 'base', prerequisites: ['green', 'green'], summary: 'End of the status phase: lift any number of your infantry and redeploy them among planets you hold in the same or neighbouring systems.', hasAction: false, factionId: 'arborec' },

  // ── Argent Flight ──
  { id: 'strike-wing-alpha-ii', name: 'Strike Wing Alpha II', color: 'none', type: 'unit-upgrade', expansion: 'pok', prerequisites: ['red', 'red'], summary: 'Upgraded Strike Wing Alpha — Combat 7, capacity 1, Anti-Fighter Barrage 6 (x3); barrage rolls of 9 or 10 also kill an enemy infantry floating in the active system.', hasAction: false, factionId: 'argent', replaces: 'destroyer-ii' },
  { id: 'aerie-hololattice', name: 'Aerie Hololattice', color: 'yellow', type: 'ability', expansion: 'pok', prerequisites: ['yellow'], summary: 'Enemy ships cannot pass through systems where you have structures, and each planet holding one produces as though it were a unit with Production 1.', hasAction: false, factionId: 'argent' },

  // ── Ghosts of Creuss ──
  { id: 'wormhole-generator', name: 'Wormhole Generator', color: 'blue', type: 'ability', expansion: 'base', prerequisites: ['blue', 'blue'], summary: 'ACTION: Exhaust to drop or relocate your Creuss wormhole token — onto a system where you hold a planet, or any non-home system clear of rival ships.', hasAction: true, factionId: 'creuss' },
  { id: 'dimensional-splicer', name: 'Dimensional Splicer', color: 'red', type: 'ability', expansion: 'base', prerequisites: ['red'], summary: 'When a space battle opens at a wormhole where you have ships, score one free hit against your opponent\'s ships.', hasAction: false, factionId: 'creuss' },

  // ── Empyrean ──
  { id: 'aetherstream', name: 'Aetherstream', color: 'blue', type: 'ability', expansion: 'pok', prerequisites: ['blue', 'blue'], summary: 'When you or a neighbour activates next to an anomaly, every one of that player\'s ships may move 1 further this action.', hasAction: false, factionId: 'empyrean' },
  { id: 'voidwatch', name: 'Voidwatch', color: 'green', type: 'ability', expansion: 'pok', prerequisites: ['green'], summary: 'Anyone moving ships into a system where you have units must hand you a promissory note from their hand if they hold one.', hasAction: false, factionId: 'empyrean' },

  // ── Emirates of Hacan ──
  { id: 'quantum-datahub-node', name: 'Quantum Datahub Node', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow', 'yellow', 'yellow'], summary: 'Closing the strategy phase, pay a strategy token and 3 trade goods to a rival to swap one of your strategy cards for one of theirs.', hasAction: false, factionId: 'hacan' },
  { id: 'production-biomes', name: 'Production Biomes', color: 'green', type: 'ability', expansion: 'base', prerequisites: ['green', 'green'], summary: 'ACTION: Exhaust and spend a strategy token for 4 trade goods, handing 2 to a rival of your choice.', hasAction: true, factionId: 'hacan' },

  // ── Universities of Jol-Nar ──
  { id: 'spatial-conduit-cylinders', name: 'Spatial Conduit Cylinders', color: 'blue', type: 'ability', expansion: 'base', prerequisites: ['blue', 'blue'], summary: 'Exhaust after activating a system where you have units: for that activation it counts as neighbouring every other system holding your units.', hasAction: false, factionId: 'jol-nar' },
  { id: 'e-res-siphons', name: 'E-Res Siphons', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow', 'yellow'], summary: 'Every time a rival activates a system where your ships sit, collect 4 trade goods.', hasAction: false, factionId: 'jol-nar' },

  // ── L1Z1X Mindnet ──
  { id: 'super-dreadnought-ii', name: 'Super Dreadnought II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['blue', 'blue', 'yellow'], summary: 'Upgraded Super Dreadnought — Combat 4, capacity 2, Sustain Damage and Bombardment 4; Direct Hit cannot touch it.', hasAction: false, factionId: 'l1z1x', replaces: 'dreadnought-ii' },
  { id: 'inheritance-systems', name: 'Inheritance Systems', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow', 'yellow'], summary: 'Exhaust plus 2 resources while researching to waive that technology\'s prerequisites entirely.', hasAction: false, factionId: 'l1z1x' },

  // ── Barony of Letnev ──
  { id: 'l4-disruptors', name: 'L4 Disruptors', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow'], summary: 'While you invade, no Space Cannon may fire on your units.', hasAction: false, factionId: 'letnev' },
  { id: 'non-euclidean-shielding', name: 'Non-Euclidean Shielding', color: 'red', type: 'ability', expansion: 'base', prerequisites: ['red', 'red'], summary: 'Each of your Sustain Damage uses soaks 2 hits rather than 1.', hasAction: false, factionId: 'letnev' },

  // ── Mahact Gene-Sorcerers ──
  { id: 'crimson-legionnaire-ii', name: 'Crimson Legionnaire II', color: 'none', type: 'unit-upgrade', expansion: 'pok', prerequisites: ['green', 'green'], summary: 'Upgraded Crimson Legionnaire — Combat 7; each death pays you a commodity (or turns one you hold into a trade good) and the trooper redeploys home next turn.', hasAction: false, factionId: 'mahact', replaces: 'infantry-ii' },
  { id: 'genetic-recombination', name: 'Genetic Recombination', color: 'green', type: 'ability', expansion: 'pok', prerequisites: ['green'], summary: 'Exhaust before someone votes: they either put at least one vote where you say, or give up a token from their fleet pool.', hasAction: false, factionId: 'mahact' },

  // ── Mentak Coalition ──
  { id: 'mirror-computing', name: 'Mirror Computing', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow', 'yellow', 'yellow'], summary: 'Your trade goods spend at double rate — 2 resources or influence apiece.', hasAction: false, factionId: 'mentak' },
  { id: 'salvage-operations', name: 'Salvage Operations', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow', 'yellow'], summary: 'Win or lose a space battle and you pocket a trade good; on a win you may also rebuild one ship type that died there, on the spot.', hasAction: false, factionId: 'mentak' },

  // ── Embers of Muaat ──
  { id: 'prototype-war-sun-ii', name: 'Prototype War Sun II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['red', 'red', 'red', 'yellow'], summary: 'Upgraded Prototype War Sun — cheaper at cost 10 and faster at move 3, Combat 3 (x3), Sustain Damage and Bombardment; enemies in its system lose Planetary Shield.', hasAction: false, factionId: 'muaat', replaces: 'war-sun' },
  { id: 'magmus-reactor', name: 'Magmus Reactor', color: 'red', type: 'ability', expansion: 'base', prerequisites: ['red', 'red'], summary: 'Supernovas stop being walls — your ships may enter them, and any holding your units produce as if a unit with Production 5.', hasAction: false, factionId: 'muaat' },

  // ── Naalu Collective ──
  { id: 'hybrid-crystal-fighter-ii', name: 'Hybrid Crystal Fighter II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['green', 'blue'], summary: 'Upgraded Hybrid Crystal Fighter — Combat 7, moves on its own, and overflow fighters weigh only half a ship against your fleet pool.', hasAction: false, factionId: 'naalu', replaces: 'fighter-ii' },
  { id: 'neuroglaive', name: 'Neuroglaive', color: 'green', type: 'ability', expansion: 'base', prerequisites: ['green', 'green', 'green'], summary: 'Any rival activating into your ships loses a token from their fleet pool.', hasAction: false, factionId: 'naalu' },

  // ── Naaz-Rokha Alliance ──
  { id: 'pre-fab-arcologies', name: 'Pre-Fab Arcologies', color: 'green', type: 'ability', expansion: 'pok', prerequisites: ['green', 'green', 'green'], summary: 'Exploring a planet leaves it readied.', hasAction: false, factionId: 'naaz-rokha' },
  { id: 'supercharge', name: 'Supercharge', color: 'red', type: 'ability', expansion: 'pok', prerequisites: ['red'], summary: 'Exhaust as a combat round opens for +1 on every combat roll you make that round.', hasAction: false, factionId: 'naaz-rokha' },

  // ── Nekro Virus ──
  { id: 'valefar-assimilator-x', name: 'Valefar Assimilator X', color: 'none', type: 'ability', expansion: 'base', prerequisites: [], summary: 'Instead of taking a rival\'s technology outright, park your X token on one of their faction techs; this card then behaves as that tech while the token sits there. One token per technology.', hasAction: false, factionId: 'nekro' },
  { id: 'valefar-assimilator-y', name: 'Valefar Assimilator Y', color: 'none', type: 'ability', expansion: 'base', prerequisites: [], summary: 'Instead of taking a rival\'s technology outright, park your Y token on one of their faction techs; this card then behaves as that tech while the token sits there. One token per technology.', hasAction: false, factionId: 'nekro' },

  // ── Nomad ──
  { id: 'memoria-ii', name: 'Memoria II', color: 'none', type: 'unit-upgrade', expansion: 'pok', prerequisites: ['green', 'blue', 'yellow'], summary: 'Upgraded Memoria — Combat 5 (x2), capacity 6, Sustain Damage and Anti-Fighter Barrage; it counts as neighbouring any system holding one of your mechs.', hasAction: false, factionId: 'nomad' },
  { id: 'temporal-command-suite', name: 'Temporal Command Suite', color: 'yellow', type: 'ability', expansion: 'pok', prerequisites: ['yellow'], summary: 'When any agent exhausts, exhaust this to stand it back up — and if it was a rival\'s, you may trade with them off the back of it.', hasAction: false, factionId: 'nomad' },

  // ── Clan of Saar ──
  { id: 'chaos-mapping', name: 'Chaos Mapping', color: 'blue', type: 'ability', expansion: 'base', prerequisites: ['blue'], summary: 'Asteroid fields holding your ships are off-limits to rivals, and each action-phase turn of yours opens with a free unit built wherever you have Production.', hasAction: false, factionId: 'saar' },
  { id: 'floating-factory-ii', name: 'Floating Factory II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['yellow', 'yellow'], summary: 'Upgraded Floating Factory — Production 7, move 2, capacity 5; it sits in space rather than on a planet and manoeuvres like a ship, but a blockade destroys it.', hasAction: false, factionId: 'saar', replaces: 'space-dock-ii' },

  // ── Sardakk N'orr ──
  { id: 'exotrireme-ii', name: 'Exotrireme II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['blue', 'blue', 'yellow'], summary: 'Upgraded Exotrireme — Bombardment 4 (x2), Sustain Damage, immune to Direct Hit, and after any space-combat round you may scuttle it to take up to 2 enemy ships down with it.', hasAction: false, factionId: 'sardakk-norr', replaces: 'dreadnought-ii' },
  { id: 'valkyrie-particle-weave', name: 'Valkyrie Particle Weave', color: 'red', type: 'ability', expansion: 'base', prerequisites: ['red', 'red'], summary: 'In ground combat, any round where your opponent lands a hit hands you one extra hit.', hasAction: false, factionId: 'sardakk-norr' },

  // ── Federation of Sol ──
  { id: 'advanced-carrier-ii', name: 'Advanced Carrier II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['blue', 'blue'], summary: 'Upgraded Advanced Carrier — capacity 8, move 2, and it gains Sustain Damage.', hasAction: false, factionId: 'sol', replaces: 'carrier-ii' },
  { id: 'spec-ops-ii', name: 'Spec Ops II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['green', 'green'], summary: 'Upgraded Spec Ops — Combat 6, and a 5-or-better roll after death sends the trooper home to redeploy next turn.', hasAction: false, factionId: 'sol', replaces: 'infantry-ii' },

  // ── Titans of Ul ──
  { id: 'saturn-engine-ii', name: 'Saturn Engine II', color: 'none', type: 'unit-upgrade', expansion: 'pok', prerequisites: ['green', 'yellow', 'red'], summary: 'Upgraded Saturn Engine — move 3, capacity 2, with Sustain Damage.', hasAction: false, factionId: 'titans', replaces: 'cruiser-ii' },
  { id: 'hel-titan-ii', name: 'Hel-Titan II', color: 'none', type: 'unit-upgrade', expansion: 'pok', prerequisites: ['yellow', 'red'], summary: 'Upgraded Hel-Titan — Space Cannon 5, Combat 6, Sustain Damage and Production 1; it counts as both structure and ground force, never travels, and can shoot into adjacent systems.', hasAction: false, factionId: 'titans', replaces: 'pds-ii' },

  // ── Vuil'raith Cabal ──
  { id: 'dimensional-tear-ii', name: 'Dimensional Tear II', color: 'none', type: 'unit-upgrade', expansion: 'pok', prerequisites: ['yellow', 'yellow'], summary: 'Upgraded Dimensional Tear — Production 7; its system becomes a gravity rift your own ships ignore, and up to 12 fighters there escape capacity limits.', hasAction: false, factionId: 'vuilraith', replaces: 'space-dock-ii' },
  { id: 'vortex', name: 'Vortex', color: 'red', type: 'ability', expansion: 'pok', prerequisites: ['red'], summary: 'ACTION: Exhaust to reach out from one of your space docks and seize a matching unit from a neighbouring rival\'s reinforcements.', hasAction: true, factionId: 'vuilraith' },

  // ── Winnu ──
  { id: 'lazax-gate-folding', name: 'Lazax Gate Folding', color: 'blue', type: 'ability', expansion: 'base', prerequisites: ['blue', 'blue'], summary: 'While Mecatol Rex is not yours, your tactical actions treat its system as carrying both wormhole types. ACTION: once it is yours, exhaust to drop an infantry there.', hasAction: true, factionId: 'winnu' },
  { id: 'hegemonic-trade-policy', name: 'Hegemonic Trade Policy', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow', 'yellow'], summary: 'Exhaust as you produce to flip one of your planets\' resource and influence figures for that build.', hasAction: false, factionId: 'winnu' },

  // ── Xxcha Kingdom ──
  { id: 'instinct-training', name: 'Instinct Training', color: 'green', type: 'ability', expansion: 'base', prerequisites: ['green'], summary: 'Exhaust plus a strategy token to kill a rival\'s action card as it is played.', hasAction: false, factionId: 'xxcha' },
  { id: 'nullification-field', name: 'Nullification Field', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow', 'yellow'], summary: 'When a rival activates into your ships, exhaust and spend a strategy token to end their turn on the spot.', hasAction: false, factionId: 'xxcha' },

  // ── Yin Brotherhood ──
  { id: 'yin-spinner-omega', name: 'Yin Spinner Omega', color: 'green', type: 'ability', expansion: 'base', prerequisites: ['green', 'green'], summary: 'Each time you produce, add up to 2 free infantry on a planet you hold or alongside your ships.', hasAction: false, factionId: 'yin' },
  { id: 'impulse-core', name: 'Impulse Core', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow', 'yellow'], summary: 'Opening a space battle, scuttle one of your cruisers or destroyers to land a hit that must fall on a non-fighter ship where possible.', hasAction: false, factionId: 'yin' },

  // ── Yssaril Tribes ──
  { id: 'mageon-implants', name: 'Mageon Implants', color: 'green', type: 'ability', expansion: 'base', prerequisites: ['green', 'green', 'green'], summary: 'ACTION: Exhaust to riffle through a rival\'s action cards and help yourself to one.', hasAction: true, factionId: 'yssaril' },
  { id: 'transparasteel-plating', name: 'Transparasteel Plating', color: 'green', type: 'ability', expansion: 'base', prerequisites: ['green'], summary: 'Once a player has passed, your action-phase turns lock them out of playing action cards.', hasAction: false, factionId: 'yssaril' },
```

- [ ] **Step 3: Run tests + check, verify green**

Run: `npm test -- content.test` → Expected: PASS
Run: `npm test` → Expected: all pass
Run: `npm run check` → Expected: 0 errors, 0 warnings

- [ ] **Step 4: Commit**

```bash
git add src/content/technologies.ts src/content/content.test.ts
git commit -m "feat: 48 faction technologies (2 per faction)"
```

---

## Task 3: Ownership + supersession filtering in the engine

**Files:**
- Modify: `src/engine/research.ts`
- Test: `src/engine/research.test.ts`

**Interfaces:**
- Consumes: `factionId` / `replaces` (Task 1), the catalog (Task 2), `GameState.factionId`.
- Produces: `getResearchableTechs(state, technologies)` keeps its existing signature and return shape (`{ techId: string; researchable: boolean }[]`) but now excludes another faction's techs entirely, and excludes a generic unit upgrade whose id is the `replaces` target of one of the player's own faction techs.

- [ ] **Step 1: Write the failing test**

Append this block at the end of `src/engine/research.test.ts` (it reuses the file's existing `state` helper and real `content`):

```ts
describe('getResearchableTechs faction filtering', () => {
  const idsFor = (factionId: string, overrides: Partial<GameState> = {}) =>
    getResearchableTechs({ ...state(overrides), factionId }, techs).map((r) => r.techId)

  it('offers your own faction techs and never another faction\'s', () => {
    const sol = idsFor('sol')
    expect(sol).toContain('advanced-carrier-ii')
    expect(sol).toContain('spec-ops-ii')
    expect(sol).not.toContain('super-dreadnought-ii') // L1Z1X
    expect(sol).not.toContain('neuroglaive') // Naalu
  })

  it('drops a generic unit upgrade the faction sheet supersedes', () => {
    // Sol's Advanced Carrier II replaces Carrier II, and Spec Ops II replaces Infantry II.
    const sol = idsFor('sol')
    expect(sol).not.toContain('carrier-ii')
    expect(sol).not.toContain('infantry-ii')
    // A faction with no carrier variant still sees the generic.
    expect(idsFor('hacan')).toContain('carrier-ii')
  })

  it('keeps generics that nothing of yours replaces', () => {
    const sol = idsFor('sol')
    expect(sol).toContain('cruiser-ii')
    expect(sol).toContain('war-sun')
  })

  it('applies the same prerequisites to a faction unit upgrade as to the generic', () => {
    const ready = (factionId: string, ids: string[]) =>
      new Set(
        getResearchableTechs({ ...state({ technologyIds: ids }), factionId }, techs)
          .filter((r) => r.researchable)
          .map((r) => r.techId),
      )
    // Advanced Carrier II needs 2 blue, exactly as Carrier II does.
    expect(ready('sol', ['antimass-deflectors']).has('advanced-carrier-ii')).toBe(false)
    expect(ready('sol', ['antimass-deflectors', 'gravity-drive']).has('advanced-carrier-ii')).toBe(true)
  })

  it('treats Nekro\'s colorless assimilators as free to research and icon-less', () => {
    const ready = new Set(
      getResearchableTechs({ ...state(), factionId: 'nekro' }, techs)
        .filter((r) => r.researchable)
        .map((r) => r.techId),
    )
    expect(ready.has('valefar-assimilator-x')).toBe(true) // no prerequisites
    // Owning one supplies no color icon, so a 1-blue tech stays out of reach.
    const withAssimilator = new Set(
      getResearchableTechs({ ...state({ technologyIds: ['valefar-assimilator-x'] }), factionId: 'nekro' }, techs)
        .filter((r) => r.researchable)
        .map((r) => r.techId),
    )
    expect(withAssimilator.has('gravity-drive')).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- research.test`
Expected: FAIL — with no filtering, `sol` is offered every faction's techs (so `super-dreadnought-ii` appears) and still sees `carrier-ii`.

- [ ] **Step 3: Add the two filters**

In `src/engine/research.ts`, replace the whole final statement — the one that currently begins `return technologies` and chains `.filter((t) => !owned.has(t.id))` into `.map((t) => { ... })` — with the following. Everything above it (the `owned` set and the `supply` loops) stays exactly as it is:

```ts
  // A faction may only research its own faction techs, and its faction sheet
  // replaces some generic unit upgrades outright — those are not researchable at all.
  const mine = technologies.filter((t) => !t.factionId || t.factionId === state.factionId)
  const superseded = new Set(
    mine.filter((t) => t.factionId && t.replaces).map((t) => t.replaces as string),
  )

  return mine
    .filter((t) => !owned.has(t.id) && !superseded.has(t.id))
    .map((t) => {
      const need: Record<Color, number> = { blue: 0, green: 0, yellow: 0, red: 0 }
      for (const c of t.prerequisites) need[c]++
      const researchable = COLORS.every((c) => supply[c] >= need[c])
      return { techId: t.id, researchable }
    })
```

Note: the supply loop above it still walks the full `technologies` array when counting icons from owned techs — leave it as is, since an owned tech's colour counts regardless of which list it came from.

- [ ] **Step 4: Run tests + check, verify green**

Run: `npm test -- research.test` → Expected: PASS, including the pre-existing generic tests
Run: `npm test` → Expected: all pass
Run: `npm run check` → Expected: 0 errors, 0 warnings

- [ ] **Step 5: Commit**

```bash
git add src/engine/research.ts src/engine/research.test.ts
git commit -m "feat: filter research by faction ownership and supersession"
```

---

## Task 4: Faction group in the picker

**Files:**
- Modify: `src/lib/techGroups.ts`
- Test: `src/lib/components/ResearchPicker.svelte.test.ts`

**Interfaces:**
- Consumes: `factionId` (Task 1).
- Produces: `TECH_GROUPS` gains a sixth entry `{ key: 'faction', label: 'Faction', match: (t) => t.factionId != null }`, appended last. `ResearchPicker` and the reference tech tab both consume `TECH_GROUPS` already, so both pick it up.

- [ ] **Step 1: Write the failing test**

In `src/lib/components/ResearchPicker.svelte.test.ts`, add a faction tech to the `technologies` fixture by appending this entry to that array:

```ts
  T({ id: 'advanced-carrier-ii', name: 'Advanced Carrier II', color: 'none', type: 'unit-upgrade', prerequisites: ['blue', 'blue'], factionId: 'sol', replaces: 'carrier-ii' }),
```

Then append this test inside `describe('ResearchPicker', ...)`:

```ts
it('gives faction technologies their own group', () => {
  render(ResearchPicker, { props: { technologies, ownedIds: new Set<string>(), researchableIds: new Set<string>(), onResearch: () => {}, onClose: () => {} } })
  expect(screen.getByText('Faction')).toBeTruthy()
  expect(screen.getByRole('button', { name: /research Advanced Carrier II/ })).toBeTruthy()
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- ResearchPicker`
Expected: FAIL — no `Faction` heading is rendered, because `TECH_GROUPS` has no group matching a tech with a `factionId` (the entry falls through all five and is dropped).

- [ ] **Step 3: Add the group**

In `src/lib/techGroups.ts`, add this entry to the end of the `TECH_GROUPS` array, after the `unit` entry:

```ts
  { key: 'faction', label: 'Faction', match: (t) => t.factionId != null },
```

Then narrow the five existing entries so a faction tech cannot also match them — change each of the five `match` functions to require `!t.factionId`. The array becomes:

```ts
export const TECH_GROUPS: { key: string; label: string; match: (t: Technology) => boolean }[] = [
  { key: 'blue', label: 'Propulsion (blue)', match: (t) => !t.factionId && t.type === 'ability' && t.color === 'blue' },
  { key: 'green', label: 'Biotic (green)', match: (t) => !t.factionId && t.type === 'ability' && t.color === 'green' },
  { key: 'yellow', label: 'Cybernetic (yellow)', match: (t) => !t.factionId && t.type === 'ability' && t.color === 'yellow' },
  { key: 'red', label: 'Warfare (red)', match: (t) => !t.factionId && t.type === 'ability' && t.color === 'red' },
  { key: 'unit', label: 'Unit Upgrades', match: (t) => !t.factionId && t.type === 'unit-upgrade' },
  { key: 'faction', label: 'Faction', match: (t) => t.factionId != null },
]
```

- [ ] **Step 4: Run tests + check + build, verify green**

Run: `npm test -- ResearchPicker` → Expected: PASS
Run: `npm test` → Expected: all pass
Run: `npm run check` → Expected: 0 errors, 0 warnings
Run: `npm run build` → Expected: success

- [ ] **Step 5: Commit**

```bash
git add src/lib/techGroups.ts src/lib/components/ResearchPicker.svelte.test.ts
git commit -m "feat: Faction group in the tech groups config"
```

---

## Task 5: Per-faction groups in the tech reference

The reference is deliberately unfiltered — an opponent's technology is exactly what a player needs to look up mid-game — so this appends one group per faction after the five generic groups.

**Files:**
- Modify: `src/lib/components/ReferenceBrowser.svelte`
- Test: `src/lib/components/ReferenceBrowser.svelte.test.ts`

**Interfaces:**
- Consumes: `factionId` (Task 1), the `factions` prop `ReferenceBrowser` already receives.
- Produces: the tech tab renders its five generic group headers, then one header per faction that has techs, labelled with the faction's `name`.

- [ ] **Step 1: Write the failing test**

In `src/lib/components/ReferenceBrowser.svelte.test.ts`, append a faction tech to the `technologies` fixture:

```ts
  { id: 'advanced-carrier-ii', name: 'Advanced Carrier II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['blue', 'blue'], summary: 'Upgraded carrier.', hasAction: false, factionId: 'sol', replaces: 'carrier-ii' },
```

Then append this test inside `describe('ReferenceBrowser', ...)`:

```ts
it('groups faction technologies under their faction in the tech tab', async () => {
  render(ReferenceBrowser, { props: { factions, technologies, strategyCards, publicObjectives, secretObjectives, planets } })
  await fireEvent.click(screen.getByRole('button', { name: /Tech/ }))
  expect(screen.getByText('Federation of Sol')).toBeTruthy()
  expect(screen.getByText('Advanced Carrier II')).toBeTruthy()
  expect(screen.getByText('Unit Upgrades')).toBeTruthy() // generic groups still render
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- ReferenceBrowser`
Expected: FAIL — no `Federation of Sol` heading appears in the tech tab. (The tech will show under `Faction` from Task 4's group, which is not what the reference wants.)

- [ ] **Step 3: Build the per-faction groups**

In `src/lib/components/ReferenceBrowser.svelte`, replace the `techGroups` derived with a version that keeps the generic groups and appends one per faction. Note the generic groups now come from `TECH_GROUPS` minus its `faction` entry, since the reference splits faction techs by owner instead:

```ts
  const techEntry = (t: Technology) => ({
    id: t.id,
    title: t.name,
    summary: t.summary,
    detail: `${t.type === 'unit-upgrade' ? 'Unit upgrade' : t.color} · ${t.expansion.toUpperCase()} · prereqs: ${t.prerequisites.join(', ') || 'none'}\n${t.summary}`,
  })
  const matchesQuery = (t: Technology) => t.name.toLowerCase().includes(q.toLowerCase())

  const techGroups = $derived([
    ...TECH_GROUPS.filter((g) => g.key !== 'faction').map((g) => ({
      key: g.key,
      label: g.label,
      entries: technologies
        .filter((t) => g.match(t) && matchesQuery(t))
        .sort((a, b) => a.prerequisites.length - b.prerequisites.length)
        .map(techEntry),
    })),
    ...factions.map((f) => ({
      key: `faction-${f.id}`,
      label: f.name,
      entries: technologies.filter((t) => t.factionId === f.id && matchesQuery(t)).map(techEntry),
    })),
  ].filter((g) => g.entries.length > 0))
```

- [ ] **Step 4: Run tests + check + build, verify green**

Run: `npm test -- ReferenceBrowser` → Expected: PASS, including the pre-existing tech-tab grouping test
Run: `npm test` → Expected: all pass
Run: `npm run check` → Expected: 0 errors, 0 warnings
Run: `npm run build` → Expected: success

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/ReferenceBrowser.svelte src/lib/components/ReferenceBrowser.svelte.test.ts
git commit -m "feat: group faction technologies by faction in the reference"
```

---

## Done criteria

- 81 technologies total: the 33 generic ones plus 48 faction techs, exactly 2 for each of the 24 factions, 34 base / 14 PoK, no Keleres and no Nekro joke entries.
- Every `factionId` resolves to a real faction; all 13 `replaces` values resolve to real generic unit upgrades.
- The type invariant is one-way, so Nekro's colourless ability cards validate.
- `getResearchableTechs` offers only your own faction's techs and never a generic your faction sheet supersedes; prerequisite maths is unchanged, and colourless techs still contribute no icons.
- The picker shows a Faction group last; the reference tech tab keeps its five generic groups and adds one per faction.
- Summaries are in our own words throughout.
- `npm test` green, `npm run check` 0/0, `npm run build` OK.
