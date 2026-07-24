import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import MenuSheet from './MenuSheet.svelte'
import { createInitialState } from '../../domain/initialState'
import type { Faction } from '../../content/schema'

const faction: Faction = {
  id: 'sol', name: 'Federation of Sol', expansion: 'base', combatModifier: 0, abilitySummaries: ['Orbital Drop.'],
  starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], startingUnits: ['1 Space Dock'], commodities: 4, tradeGoods: 0 },
}
const baseProps = () => ({
  open: true, onClose: vi.fn(), state: createInitialState(faction, { turnOrder: 1, speaker: false }),
  factions: [faction], technologies: [], strategyCards: [], objectives: [],
  themeLabel: 'system', onToggleTheme: vi.fn(), onAction: vi.fn(), onNewGame: vi.fn(), onExport: vi.fn(), onImport: vi.fn(),
})

describe('MenuSheet', () => {
  it('renders nothing when closed', () => {
    const { container } = render(MenuSheet, { props: { ...baseProps(), open: false } })
    expect(container.querySelector('button')).toBeNull()
  })

  it('calls onClose from the close button', async () => {
    const props = baseProps()
    render(MenuSheet, { props })
    await fireEvent.click(screen.getByRole('button', { name: /Close menu/ }))
    expect(props.onClose).toHaveBeenCalledOnce()
  })

  it('switches to the Games section', async () => {
    render(MenuSheet, { props: baseProps() })
    await fireEvent.click(screen.getByRole('button', { name: /^Games$/ }))
    expect(screen.getByRole('button', { name: /Export game/ })).toBeTruthy()
  })
})
