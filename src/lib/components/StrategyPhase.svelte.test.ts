import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import StrategyPhase from './StrategyPhase.svelte'
import type { StrategyCard } from '../../content/schema'

const cards: StrategyCard[] = [
  { initiative: 1, name: 'Leadership', primary: 'Gain command tokens.', secondary: 'Spend influence for tokens.' },
  { initiative: 7, name: 'Technology', primary: 'Research a technology.', secondary: 'Pay to research.' },
]

describe('StrategyPhase', () => {
  it('lists the cards and toggles selection by initiative', async () => {
    const onToggle = vi.fn()
    render(StrategyPhase, { props: { cards, selected: [], onToggle } })
    expect(screen.getByText(/1\. Leadership/)).toBeTruthy()
    expect(screen.getByText(/7\. Technology/)).toBeTruthy()
    await fireEvent.click(screen.getAllByRole('button', { name: /Select/ })[1])
    expect(onToggle).toHaveBeenCalledWith(7)
  })

  it('marks a selected card as chosen', () => {
    render(StrategyPhase, { props: { cards, selected: [1], onToggle: () => {} } })
    expect(screen.getByText(/Chosen/)).toBeTruthy()
  })
})
