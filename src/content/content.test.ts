import { describe, it, expect } from 'vitest'
import { content, getFaction } from './index'

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
})
