import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import AgendaHelper from './AgendaHelper.svelte'
import { createInitialState } from '../../domain/initialState'
import type { FactionStartingInfo, GameState } from '../../domain/types'

const faction: FactionStartingInfo = {
  id: 'sol', name: 'Federation of Sol', combatModifier: 0,
  starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], commodities: 4, tradeGoods: 0 },
}
const state = (over: Partial<GameState> = {}) => ({ ...createInitialState(faction, { turnOrder: 1, speaker: false }), phase: 'agenda' as const, ...over })

describe('AgendaHelper', () => {
  it('offers the custodians toggle when the token is not yet taken', async () => {
    const onAction = vi.fn()
    render(AgendaHelper, { props: { state: state({ custodiansTaken: false }), onAction } })
    await fireEvent.click(screen.getByRole('button', { name: /custodians token taken/ }))
    expect(onAction).toHaveBeenCalledWith({ type: 'editState', patch: { custodiansTaken: true } })
  })

  it('tallies votes once custodians is taken', async () => {
    render(AgendaHelper, { props: { state: state({ custodiansTaken: true }), onAction: () => {} } })
    await fireEvent.click(screen.getByRole('button', { name: /vote for/i }))
    await fireEvent.click(screen.getByRole('button', { name: /vote for/i }))
    expect(screen.getByText(/Total votes cast: 2/)).toBeTruthy()
  })
})
