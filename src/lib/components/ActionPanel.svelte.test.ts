import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import ActionPanel from './ActionPanel.svelte'
import type { AvailableAction } from '../../domain/types'

const actions: AvailableAction[] = [
  { type: 'strategicAction', label: 'Strategic action', explanation: 'Resolve your strategy card primary.' },
  { type: 'tacticalAction', label: 'Tactical action', explanation: 'Spend a tactic token to activate a system.' },
]

describe('ActionPanel', () => {
  it('renders a Take control for each action and calls onAct with the action', async () => {
    const onAct = vi.fn()
    render(ActionPanel, { props: { actions, onAct } })
    const takeButtons = screen.getAllByRole('button', { name: /Take/ })
    expect(takeButtons.length).toBe(2)
    await fireEvent.click(takeButtons[1])
    expect(onAct).toHaveBeenCalledWith(actions[1])
  })

  it('shows an empty-state message when there are no actions', () => {
    render(ActionPanel, { props: { actions: [], onAct: () => {} } })
    expect(screen.getByText(/No options/)).toBeTruthy()
  })
})
