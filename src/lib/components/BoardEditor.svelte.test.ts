import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import BoardEditor from './BoardEditor.svelte'
import { createInitialState } from '../../domain/initialState'
import type { FactionStartingInfo } from '../../domain/types'
import type { Technology } from '../../content/schema'

const faction: FactionStartingInfo = {
  id: 'sol', name: 'Federation of Sol', combatModifier: 0,
  starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [{ id: 'jord', name: 'Jord', resources: 4, influence: 2, exhausted: false }], commodities: 4, tradeGoods: 0 },
}
const technologies: Technology[] = [
  { id: 'plasma-scoring', name: 'Plasma Scoring', color: 'red', type: 'ability', expansion: 'base', prerequisites: [], summary: 'Add 1 die.', hasAction: false },
]
const state = () => createInitialState(faction, { turnOrder: 1, speaker: false })
const planetCatalog = [
  { id: 'meer', name: 'Meer', resources: 0, influence: 4, trait: 'hazardous' as const, legendary: false, expansion: 'base' as const },
]

describe('BoardEditor', () => {
  it('increments victory points via editState', async () => {
    const onAction = vi.fn()
    render(BoardEditor, { props: { state: state(), technologies, onAction } })
    await fireEvent.click(screen.getByRole('button', { name: /increase victory points/ }))
    expect(onAction).toHaveBeenCalledWith({ type: 'editState', patch: { victoryPoints: 1 } })
  })

  it('toggles a planet exhausted state via editState', async () => {
    const onAction = vi.fn()
    render(BoardEditor, { props: { state: state(), technologies, onAction } })
    await fireEvent.click(screen.getByRole('button', { name: /toggle Jord/ }))
    const call = onAction.mock.calls[0][0]
    expect(call.patch.planets.find((p: { id: string }) => p.id === 'jord').exhausted).toBe(true)
  })

  it('adds a technology via editState', async () => {
    const onAction = vi.fn()
    render(BoardEditor, { props: { state: state(), technologies, onAction } })
    await fireEvent.click(screen.getByRole('button', { name: /add Plasma Scoring/ }))
    expect(onAction).toHaveBeenCalledWith({ type: 'editState', patch: { technologyIds: ['plasma-scoring'] } })
  })

  it('clamps trade goods at zero', async () => {
    const onAction = vi.fn()
    render(BoardEditor, { props: { state: state(), technologies, onAction } })
    await fireEvent.click(screen.getByRole('button', { name: /decrease trade goods/ }))
    expect(onAction).toHaveBeenCalledWith({ type: 'editState', patch: { tradeGoods: 0 } })
  })

  it('gains a catalog planet via the picker', async () => {
    const onAction = vi.fn()
    render(BoardEditor, { props: { state: state(), technologies, planetCatalog, onAction } })
    await fireEvent.click(screen.getByRole('button', { name: /add Meer/i }))
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'gainPlanet' }))
  })

  it('removes an owned planet', async () => {
    const onAction = vi.fn()
    render(BoardEditor, { props: { state: state(), technologies, planetCatalog, onAction } })
    await fireEvent.click(screen.getByRole('button', { name: /remove Jord/i }))
    expect(onAction).toHaveBeenCalledWith({ type: 'removePlanet', planetId: 'jord' })
  })
})
