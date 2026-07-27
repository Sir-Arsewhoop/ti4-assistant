import { describe, it, expect } from 'vitest'
import { getScorablePublicObjectives } from './objectives'
import { createInitialState } from '../domain/initialState'
import type { FactionStartingInfo, GameState } from '../domain/types'
import type { Objective } from '../content/schema'

const faction: FactionStartingInfo = {
  id: 'sol', name: 'Federation of Sol', combatModifier: 0,
  starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], commodities: 2, tradeGoods: 0 },
}
const objectives: Objective[] = [
  { id: 'a', name: 'A', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'a' },
  { id: 'b', name: 'B', points: 2, stage: 'II', expansion: 'pok', phase: 'status', summary: 'b' },
]
function state(overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialState(faction, { turnOrder: 1, speaker: false }), ...overrides }
}
const ids = (s: GameState) => getScorablePublicObjectives(s, objectives).map((o) => o.id)

describe('getScorablePublicObjectives', () => {
  it('returns nothing when nothing is revealed', () => {
    expect(ids(state())).toEqual([])
  })

  it('returns revealed objectives that are not yet scored', () => {
    expect(ids(state({ revealedPublicObjectiveIds: ['a', 'b'] }))).toEqual(['a', 'b'])
  })

  it('drops objectives already scored', () => {
    expect(ids(state({ revealedPublicObjectiveIds: ['a', 'b'], scoredPublicObjectiveIds: ['a'] }))).toEqual(['b'])
  })

  it('ignores a scored id that was never revealed', () => {
    expect(ids(state({ revealedPublicObjectiveIds: ['a'], scoredPublicObjectiveIds: ['b'] }))).toEqual(['a'])
  })
})
