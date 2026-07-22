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
