import { describe, it, expect } from 'vitest'
import { content, getFaction } from './index'
import { objectiveSchema } from './schema'

describe('content registry', () => {
  it('validates and exposes all 8 strategy cards', () => {
    expect(content.strategyCards).toHaveLength(8)
    expect(content.strategyCards.map((c) => c.initiative).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('exposes all 24 base + PoK factions with a 17/7 split', () => {
    expect(content.factions).toHaveLength(24)
    expect(content.factions.filter((f) => f.expansion === 'base')).toHaveLength(17)
    expect(content.factions.filter((f) => f.expansion === 'pok')).toHaveLength(7)
  })

  it('still includes the original seed factions', () => {
    const ids = new Set(content.factions.map((f) => f.id))
    for (const id of ['jol-nar', 'sol', 'sardakk-norr']) expect(ids.has(id)).toBe(true)
  })

  it('gives Jol-Nar its four starting techs and -1 combat', () => {
    const jn = getFaction('jol-nar')!
    expect(jn.combatModifier).toBe(-1)
    expect(jn.starting.techIds).toHaveLength(4)
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

  it('includes the starting technologies referenced by factions', () => {
    const ids = new Set(content.technologies.map((t) => t.id))
    for (const id of [
      'magen-defense-grid', 'gravity-drive', 'dacxive-animators', 'graviton-laser-system',
      'dark-energy-tap', 'bio-stims', 'predictive-intelligence', 'psychoarchaeology',
      'ai-development-algorithm', 'scanlink-drone-network', 'self-assembly-routines',
    ]) expect(ids.has(id)).toBe(true)
  })

  it('every faction starting techId resolves to a known technology', () => {
    const techIds = new Set(content.technologies.map((t) => t.id))
    for (const f of content.factions) {
      for (const id of f.starting.techIds) expect(techIds.has(id)).toBe(true)
    }
  })

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

  it('covers the objectives the old stub carried', () => {
    const ids = new Set(content.publicObjectives.map((o) => o.id))
    for (const id of ['diversify-research', 'develop-weaponry', 'lead-from-the-front']) expect(ids.has(id)).toBe(true)
  })

  it('rejects an objective whose stage and points disagree', () => {
    const bad = { id: 'x', name: 'X', points: 2, stage: 'I', expansion: 'base', phase: 'status', summary: 'y' }
    expect(objectiveSchema.safeParse(bad).success).toBe(false)
  })
})
