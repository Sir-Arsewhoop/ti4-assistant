import { describe, it, expect } from 'vitest'
import { getScorablePublicObjectives, getHeldSecretObjectives } from './objectives'
import { createInitialState } from '../domain/initialState'
import type { FactionStartingInfo, GameState } from '../domain/types'
import type { Objective, SecretObjective } from '../content/schema'

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

const secrets: SecretObjective[] = [
  { id: 's-status', name: 'S Status', points: 1, phase: 'status', expansion: 'base', summary: 'x' },
  { id: 's-action', name: 'S Action', points: 1, phase: 'action', expansion: 'pok', summary: 'y' },
]

describe('getHeldSecretObjectives', () => {
  it('returns nothing when the player holds no secrets', () => {
    expect(getHeldSecretObjectives(state(), secrets)).toEqual([])
  })

  it('returns held secrets and tags which are scorable in the current phase', () => {
    const s = state({ phase: 'status', secretObjectives: [{ id: 's-status', scored: false }, { id: 's-action', scored: false }] })
    const held = getHeldSecretObjectives(s, secrets)
    expect(held.map((h) => h.objective.id)).toEqual(['s-status', 's-action'])
    expect(held.map((h) => h.scorableNow)).toEqual([true, false])
  })

  it('re-tags scorableNow when the phase changes', () => {
    const s = state({ phase: 'action', secretObjectives: [{ id: 's-status', scored: false }, { id: 's-action', scored: false }] })
    expect(getHeldSecretObjectives(s, secrets).map((h) => h.scorableNow)).toEqual([false, true])
  })

  it('excludes secrets already scored', () => {
    const s = state({ phase: 'status', secretObjectives: [{ id: 's-status', scored: true }, { id: 's-action', scored: false }] })
    expect(getHeldSecretObjectives(s, secrets).map((h) => h.objective.id)).toEqual(['s-action'])
  })

  it('ignores a held id that is not in the catalog', () => {
    const s = state({ phase: 'status', secretObjectives: [{ id: 'unknown', scored: false }] })
    expect(getHeldSecretObjectives(s, secrets)).toEqual([])
  })
})
