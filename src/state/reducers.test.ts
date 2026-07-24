import { describe, it, expect } from 'vitest'
import { applyAction } from './reducers'
import { createInitialState } from '../domain/initialState'
import type { FactionStartingInfo, GameAction, GameState } from '../domain/types'

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

  it('editState merges a manual patch without logging', () => {
    const before = base()
    const s = applyAction(before, { type: 'editState', patch: { tradeGoods: 9 } })
    expect(s.tradeGoods).toBe(9)
    expect(s.log).toHaveLength(before.log.length)
  })

  it('returns the same state object for an unknown action type', () => {
    const s = base()
    expect(applyAction(s, { type: 'nope' } as unknown as GameAction)).toBe(s)
  })

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
    expect(noop.planets).toEqual(base().planets)
  })
})
