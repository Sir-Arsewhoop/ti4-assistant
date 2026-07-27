import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import StatusChecklist from './StatusChecklist.svelte'
import { createInitialState } from '../../domain/initialState'
import type { FactionStartingInfo, GameState } from '../../domain/types'
import type { Objective } from '../../content/schema'

const faction: FactionStartingInfo = {
  id: 'sol', name: 'Federation of Sol', combatModifier: 0,
  starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [{ id: 'jord', name: 'Jord', resources: 4, influence: 2, exhausted: true }], commodities: 4, tradeGoods: 0 },
}
const publicObjectives: Objective[] = [
  { id: 'obj-a', name: 'Diversify Research', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'Own 2 techs in 2 colors.' },
  { id: 'obj-b', name: 'Found a Golden Age', points: 2, stage: 'II', expansion: 'base', phase: 'status', summary: 'Pay out 16 resources.' },
]
const state = (overrides: Partial<GameState> = {}) => ({
  ...createInitialState(faction, { turnOrder: 1, speaker: false }),
  phase: 'status' as const,
  revealedPublicObjectiveIds: ['obj-a'],
  ...overrides,
})

describe('StatusChecklist', () => {
  it('scores a public objective by id and points', async () => {
    const onAction = vi.fn()
    render(StatusChecklist, { props: { state: state(), publicObjectives, onAction } })
    await fireEvent.click(screen.getByRole('button', { name: /Score: Diversify Research/ }))
    expect(onAction).toHaveBeenCalledWith({ type: 'scorePublicObjective', objectiveId: 'obj-a', points: 1 })
  })

  it('readies all planets via editState', async () => {
    const onAction = vi.fn()
    render(StatusChecklist, { props: { state: state(), publicObjectives, onAction } })
    await fireEvent.click(screen.getByRole('button', { name: /Ready all planets/ }))
    const call = onAction.mock.calls[0][0]
    expect(call.type).toBe('editState')
    expect(call.patch.planets.every((p: { exhausted: boolean }) => p.exhausted === false)).toBe(true)
  })

  it('marks the custodians token taken', async () => {
    const onAction = vi.fn()
    render(StatusChecklist, { props: { state: state(), publicObjectives, onAction } })
    await fireEvent.click(screen.getByRole('button', { name: /custodians token taken/ }))
    expect(onAction).toHaveBeenCalledWith({ type: 'editState', patch: { custodiansTaken: true } })
  })

  it('offers only revealed objectives for scoring', () => {
    render(StatusChecklist, { props: { state: state(), publicObjectives, onAction: vi.fn() } })
    expect(screen.getByRole('button', { name: /Score: Diversify Research/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Score: Found a Golden Age/ })).toBeNull()
  })

  it('reveals an unrevealed objective through the picker', async () => {
    const onAction = vi.fn()
    render(StatusChecklist, { props: { state: state(), publicObjectives, onAction } })
    await fireEvent.click(screen.getByRole('button', { name: /reveal Found a Golden Age/i }))
    expect(onAction).toHaveBeenCalledWith({ type: 'revealPublicObjective', objectiveId: 'obj-b', name: 'Found a Golden Age' })
  })

  it('groups revealed objectives by stage', () => {
    render(StatusChecklist, { props: { state: state({ revealedPublicObjectiveIds: ['obj-a', 'obj-b'] }), publicObjectives, onAction: vi.fn() } })
    expect(screen.getByText('Stage I')).toBeTruthy()
    expect(screen.getByText('Stage II')).toBeTruthy()
  })
})
