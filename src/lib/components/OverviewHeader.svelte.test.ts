// src/lib/components/OverviewHeader.svelte.test.ts
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import OverviewHeader from './OverviewHeader.svelte'
import { createInitialState } from '../../domain/initialState'
import type { FactionStartingInfo } from '../../domain/types'

const faction: FactionStartingInfo = {
  id: 'sol', name: 'Federation of Sol', combatModifier: 0,
  starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], commodities: 4, tradeGoods: 0 },
}
const state = () => ({ ...createInitialState(faction, { turnOrder: 1, speaker: false }), phase: 'action' as const, victoryPoints: 5 })

describe('OverviewHeader', () => {
  it('always shows round, phase, and VP', () => {
    render(OverviewHeader, { props: { state: state(), open: false, onToggle: () => {} } })
    expect(screen.getByText(/Round 1/)).toBeTruthy()
    expect(screen.getByText(/action/)).toBeTruthy()
    expect(screen.getByText(/VP 5/)).toBeTruthy()
  })

  it('reveals token detail only when open', () => {
    const { rerender } = render(OverviewHeader, { props: { state: state(), open: false, onToggle: () => {} } })
    expect(screen.queryByText(/Commodities/)).toBeNull()
    rerender({ state: state(), open: true, onToggle: () => {} })
    expect(screen.getByText(/Commodities/)).toBeTruthy()
  })

  it('calls onToggle when the header is clicked', async () => {
    const onToggle = vi.fn()
    render(OverviewHeader, { props: { state: state(), open: false, onToggle } })
    await fireEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledOnce()
  })
})
