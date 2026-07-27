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
    expect(s.custodiansTaken).toBe(false)
  })

  it('deep-copies planets so the faction template is not mutated', () => {
    const s = createInitialState(fixture, { turnOrder: 1, speaker: false })
    s.planets[0].exhausted = true
    expect(fixture.starting.planets[0].exhausted).toBe(false)
  })

  it('seeds the public-objective tracking fields', () => {
    const s = createInitialState(fixture, { turnOrder: 1, speaker: false })
    expect(s.revealedPublicObjectiveIds).toEqual([])
    expect(s.scoredPublicThisRound).toBe(false)
  })
})
