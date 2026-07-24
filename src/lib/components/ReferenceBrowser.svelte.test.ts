import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import ReferenceBrowser from './ReferenceBrowser.svelte'
import type { Faction, Technology, StrategyCard, Objective, PlanetCatalogEntry } from '../../content/schema'

const factions: Faction[] = [
  { id: 'jol-nar', name: 'Universities of Jol-Nar', expansion: 'base', combatModifier: -1, abilitySummaries: ['Fragile: -1 combat.'], starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: ['neural-motivator'], planets: [{ id: 'jol', name: 'Jol', resources: 1, influence: 2, exhausted: false }], startingUnits: ['2 Carriers'], commodities: 4, tradeGoods: 0 } },
  { id: 'sol', name: 'Federation of Sol', expansion: 'base', combatModifier: 0, abilitySummaries: ['Orbital Drop.'], starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], startingUnits: ['1 Space Dock'], commodities: 4, tradeGoods: 0 } },
]
const technologies: Technology[] = [
  { id: 'plasma-scoring', name: 'Plasma Scoring', color: 'red', prerequisites: [], summary: 'Add 1 die.', hasAction: false },
]
const strategyCards: StrategyCard[] = [{ initiative: 7, name: 'Technology', primary: 'Research.', secondary: 'Pay to research.' }]
const objectives: Objective[] = [{ id: 'o1', name: 'Diversify Research', points: 1, phase: 'status', summary: 'Own techs.' }]
const planets: PlanetCatalogEntry[] = [
  { id: 'meer', name: 'Meer', resources: 0, influence: 4, trait: 'hazardous', techSpecialty: 'red', legendary: false, expansion: 'base' },
  { id: 'primor', name: 'Primor', resources: 2, influence: 1, trait: 'cultural', legendary: true, legendaryAbility: 'Place up to 2 infantry.', expansion: 'pok' },
]

describe('ReferenceBrowser', () => {
  it('shows factions by default and filters by search text', async () => {
    render(ReferenceBrowser, { props: { factions, technologies, strategyCards, objectives, planets } })
    expect(screen.getByText('Universities of Jol-Nar')).toBeTruthy()
    expect(screen.getByText('Federation of Sol')).toBeTruthy()
    await fireEvent.input(screen.getByPlaceholderText('Search'), { target: { value: 'jol' } })
    expect(screen.getByText('Universities of Jol-Nar')).toBeTruthy()
    expect(screen.queryByText('Federation of Sol')).toBeNull()
  })

  it('switches to the technology list', async () => {
    render(ReferenceBrowser, { props: { factions, technologies, strategyCards, objectives, planets } })
    await fireEvent.click(screen.getByRole('button', { name: /Tech/ }))
    expect(screen.getByText('Plasma Scoring')).toBeTruthy()
  })

  it('shows a faction\'s starting units and planets when expanded', async () => {
    render(ReferenceBrowser, { props: { factions, technologies, strategyCards, objectives, planets } })
    await fireEvent.click(screen.getByText('Universities of Jol-Nar'))
    expect(screen.getByText(/2 Carriers/)).toBeTruthy()
    expect(screen.getByText(/Home planets: Jol/)).toBeTruthy()
  })

  it('lists catalog planets in the Planets tab', async () => {
    render(ReferenceBrowser, { props: { factions, technologies, strategyCards, objectives, planets } })
    await fireEvent.click(screen.getByRole('button', { name: /Planets/ }))
    expect(screen.getByText('Meer')).toBeTruthy()
    expect(screen.getByText('Primor')).toBeTruthy()
  })
})
