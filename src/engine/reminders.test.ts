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
function statusPhase(overrides: Partial<GameState> = {}): GameState {
  const s = createInitialState(faction, { turnOrder: 1, speaker: false })
  return { ...s, phase: 'status', ...overrides }
}
function agendaPhase(overrides: Partial<GameState> = {}): GameState {
  const s = createInitialState(faction, { turnOrder: 1, speaker: false })
  return { ...s, phase: 'agenda', ...overrides }
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

  it('is quiet in phases with no reminders yet (setup, strategy)', () => {
    const s = createInitialState(faction, { turnOrder: 1, speaker: false }) // setup
    expect(getReminders(s)).toEqual([])
    expect(getReminders({ ...s, phase: 'strategy' })).toEqual([])
  })

  it('counts scorable secrets in each scoring phase', () => {
    expect(getReminders(statusPhase(), { scorableSecretCount: 2 }).map((r) => r.id)).toContain('scorable-secrets')
    expect(getReminders(actionPhase(), { scorableSecretCount: 1 }).map((r) => r.id)).toContain('scorable-secrets')
    expect(getReminders(agendaPhase(), { scorableSecretCount: 1 }).map((r) => r.id)).toContain('scorable-secrets')
    expect(getReminders(statusPhase(), { scorableSecretCount: 0 }).map((r) => r.id)).not.toContain('scorable-secrets')
  })

  it('warns once this round\'s secret window is used, in the status phase only', () => {
    expect(getReminders(statusPhase({ scoredSecretThisRound: true })).map((r) => r.id)).toContain('secret-window-used')
    expect(getReminders(actionPhase({ scoredSecretThisRound: true })).map((r) => r.id)).not.toContain('secret-window-used')
  })

  it('notes a full secret hand at three held', () => {
    expect(getReminders(statusPhase(), { heldSecretCount: 3 }).map((r) => r.id)).toContain('secret-hand-full')
    expect(getReminders(statusPhase(), { heldSecretCount: 2 }).map((r) => r.id)).not.toContain('secret-hand-full')
  })

  it('states the per-window rule for action and agenda secrets', () => {
    expect(getReminders(actionPhase()).map((r) => r.id)).toContain('action-secret-window')
    expect(getReminders(agendaPhase()).map((r) => r.id)).toContain('agenda-secret-window')
    expect(getReminders(statusPhase()).map((r) => r.id)).not.toContain('action-secret-window')
  })

  it('reminds about the Imperial strategy card only when held', () => {
    expect(getReminders(actionPhase({ strategyCardIds: [8] })).map((r) => r.id)).toContain('imperial-card')
    expect(getReminders(actionPhase({ strategyCardIds: [1] })).map((r) => r.id)).not.toContain('imperial-card')
  })

  it('includes a fleet-pool info reminder in the action phase', () => {
    const r = getReminders(actionPhase({ command: { tactic: 3, fleet: 5, strategy: 2 } }))
    const fleet = r.find((x) => x.id === 'fleet-pool')
    expect(fleet).toBeDefined()
    expect(fleet?.severity).toBe('info')
    expect(fleet?.text).toContain('5')
  })

  it('reminds about the Technology strategy card only when held', () => {
    expect(getReminders(actionPhase({ strategyCardIds: [7] })).map((r) => r.id)).toContain('tech-card')
    expect(getReminders(actionPhase({ strategyCardIds: [1] })).map((r) => r.id)).not.toContain('tech-card')
  })

  it('surfaces a researchable-count reminder only when a positive count is supplied', () => {
    const r = getReminders(actionPhase(), { researchableCount: 3 })
    expect(r.find((x) => x.id === 'researchable')?.text).toContain('3')
    expect(getReminders(actionPhase(), { researchableCount: 0 }).map((x) => x.id)).not.toContain('researchable')
    expect(getReminders(actionPhase()).map((x) => x.id)).not.toContain('researchable')
  })

  it('counts the public objectives you could still score this status phase', () => {
    const r = getReminders(statusPhase(), { scorablePublicCount: 2 })
    expect(r.find((x) => x.id === 'scorable-publics')?.text).toContain('2')
    expect(getReminders(statusPhase(), { scorablePublicCount: 0 }).map((x) => x.id)).not.toContain('scorable-publics')
  })

  it('warns once this round\'s public scoring window is used', () => {
    expect(getReminders(statusPhase({ scoredPublicThisRound: true })).map((x) => x.id)).toContain('public-window-used')
    expect(getReminders(statusPhase({ scoredPublicThisRound: false })).map((x) => x.id)).not.toContain('public-window-used')
  })

  it('reports victory-point progress in the status phase', () => {
    const vp = getReminders(statusPhase({ victoryPoints: 4 })).find((x) => x.id === 'vp-progress')
    expect(vp?.text).toContain('4')
    expect(vp?.text).toContain('10')
  })

  it('flags a scorable Stage II objective', () => {
    expect(getReminders(statusPhase(), { stageTwoScorable: true }).map((x) => x.id)).toContain('stage-two-available')
    expect(getReminders(statusPhase()).map((x) => x.id)).not.toContain('stage-two-available')
  })

  it('keeps the action phase free of status-phase reminders', () => {
    const ids = getReminders(actionPhase(), { scorablePublicCount: 3 }).map((x) => x.id)
    expect(ids).not.toContain('scorable-publics')
    expect(ids).toContain('fleet-pool')
  })
})
