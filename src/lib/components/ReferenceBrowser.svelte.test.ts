import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import ReferenceBrowser from './ReferenceBrowser.svelte'
import type { Faction, Technology, StrategyCard, Objective } from '../../content/schema'

const factions: Faction[] = [
  { id: 'jol-nar', name: 'Universities of Jol-Nar', combatModifier: -1, abilitySummaries: ['Fragile: -1 combat.'], starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], commodities: 4, tradeGoods: 0 } },
  { id: 'sol', name: 'Federation of Sol', combatModifier: 0, abilitySummaries: ['Orbital Drop.'], starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], commodities: 4, tradeGoods: 0 } },
]
const technologies: Technology[] = [
  { id: 'plasma-scoring', name: 'Plasma Scoring', color: 'red', prerequisites: [], summary: 'Add 1 die.', hasAction: false },
]
const strategyCards: StrategyCard[] = [{ initiative: 7, name: 'Technology', primary: 'Research.', secondary: 'Pay to research.' }]
const objectives: Objective[] = [{ id: 'o1', name: 'Diversify Research', points: 1, phase: 'status', summary: 'Own techs.' }]

describe('ReferenceBrowser', () => {
  it('shows factions by default and filters by search text', async () => {
    render(ReferenceBrowser, { props: { factions, technologies, strategyCards, objectives } })
    expect(screen.getByText('Universities of Jol-Nar')).toBeTruthy()
    expect(screen.getByText('Federation of Sol')).toBeTruthy()
    await fireEvent.input(screen.getByPlaceholderText('Search'), { target: { value: 'jol' } })
    expect(screen.getByText('Universities of Jol-Nar')).toBeTruthy()
    expect(screen.queryByText('Federation of Sol')).toBeNull()
  })

  it('switches to the technology list', async () => {
    render(ReferenceBrowser, { props: { factions, technologies, strategyCards, objectives } })
    await fireEvent.click(screen.getByRole('button', { name: /Tech/ }))
    expect(screen.getByText('Plasma Scoring')).toBeTruthy()
  })
})
