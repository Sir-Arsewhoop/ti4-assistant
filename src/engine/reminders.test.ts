import { describe, it, expect } from 'vitest'
import { getReminders } from './reminders'
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

describe('getReminders', () => {
  it('reminds you to use your strategy primary if unused in the action phase', () => {
    const ids = getReminders(actionPhase({ strategyPrimaryUsed: false })).map((r) => r.id)
    expect(ids).toContain('strategy-primary-unused')
  })

  it('warns when no tactic tokens remain in the action phase', () => {
    const r = getReminders(actionPhase({ command: { tactic: 0, fleet: 3, strategy: 2 } }))
    const tok = r.find((x) => x.id === 'no-tactic-tokens')
    expect(tok?.severity).toBe('warn')
  })

  it('notes exhausted planets that will ready in the status phase', () => {
    const s = actionPhase({ planets: [{ id: 'jol', name: 'Jol', resources: 1, influence: 2, exhausted: true }] })
    expect(getReminders(s).map((r) => r.id)).toContain('exhausted-planets')
  })

  it('is quiet outside the action phase', () => {
    const s = createInitialState(faction, { turnOrder: 1, speaker: false }) // setup
    expect(getReminders(s)).toEqual([])
  })

  it('includes a fleet-pool info reminder in the action phase', () => {
    const r = getReminders(actionPhase({ command: { tactic: 3, fleet: 5, strategy: 2 } }))
    const fleet = r.find((x) => x.id === 'fleet-pool')
    expect(fleet).toBeDefined()
    expect(fleet?.severity).toBe('info')
    expect(fleet?.text).toContain('5')
  })
})
