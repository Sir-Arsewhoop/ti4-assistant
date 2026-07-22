import { describe, it, expect } from 'vitest'
import { getAvailableActions } from './actions'
import { createInitialState } from '../domain/initialState'
import type { FactionStartingInfo, GameState } from '../domain/types'

const faction: FactionStartingInfo = {
  id: 'sol', name: 'Federation of Sol', combatModifier: 0,
  starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], commodities: 2, tradeGoods: 0 },
}

function actionPhase(overrides: Partial<GameState> = {}): GameState {
  const s = createInitialState(faction, { turnOrder: 1, speaker: false })
  return { ...s, phase: 'action', strategyCardIds: [1], ...overrides }
}

describe('getAvailableActions', () => {
  it('returns nothing outside the action phase', () => {
    const s = createInitialState(faction, { turnOrder: 1, speaker: false })
    expect(getAvailableActions(s)).toEqual([])
  })

  it('offers strategic action when the primary is unused', () => {
    const types = getAvailableActions(actionPhase()).map((a) => a.type)
    expect(types).toContain('strategicAction')
  })

  it('hides strategic action once the primary is used', () => {
    const types = getAvailableActions(actionPhase({ strategyPrimaryUsed: true })).map((a) => a.type)
    expect(types).not.toContain('strategicAction')
  })

  it('offers tactical action only when a tactic token is available', () => {
    expect(getAvailableActions(actionPhase({ command: { tactic: 1, fleet: 3, strategy: 2 } })).map((a) => a.type)).toContain('tacticalAction')
    expect(getAvailableActions(actionPhase({ command: { tactic: 0, fleet: 3, strategy: 2 } })).map((a) => a.type)).not.toContain('tacticalAction')
  })

  it('offers pass only after the strategic action is taken', () => {
    expect(getAvailableActions(actionPhase({ strategyPrimaryUsed: false })).map((a) => a.type)).not.toContain('pass')
    expect(getAvailableActions(actionPhase({ strategyPrimaryUsed: true })).map((a) => a.type)).toContain('pass')
  })

  it('offers a component action per provided source', () => {
    const acts = getAvailableActions(actionPhase(), { componentActionSources: [{ id: 'plasma-scoring', summary: 'Plasma Scoring: +1 die on bombardment/space cannon' }] })
    const comp = acts.filter((a) => a.type === 'componentAction')
    expect(comp).toHaveLength(1)
    expect(comp[0].explanation).toContain('Plasma Scoring')
  })
})
