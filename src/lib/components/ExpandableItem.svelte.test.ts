import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import ExpandableItem from './ExpandableItem.svelte'

describe('ExpandableItem', () => {
  it('shows title and summary but hides detail until toggled', async () => {
    render(ExpandableItem, { props: { title: 'Tactical action', summary: 'Activate a system.', detail: 'Spend a tactic token to move, fight, then produce.' } })
    expect(screen.getByText('Tactical action')).toBeTruthy()
    expect(screen.getByText('Activate a system.')).toBeTruthy()
    expect(screen.queryByText(/Spend a tactic token/)).toBeNull()

    await fireEvent.click(screen.getByRole('button', { name: /Tactical action/ }))
    expect(screen.getByText(/Spend a tactic token/)).toBeTruthy()

    await fireEvent.click(screen.getByRole('button', { name: /Tactical action/ }))
    expect(screen.queryByText(/Spend a tactic token/)).toBeNull()
  })
})
