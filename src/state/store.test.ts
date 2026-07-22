import { describe, it, expect } from 'vitest'
import { createGameStore } from './store.svelte'
import { createInitialState } from '../domain/initialState'
import type { FactionStartingInfo } from '../domain/types'

const faction: FactionStartingInfo = {
  id: 'sol', name: 'Federation of Sol', combatModifier: 0,
  starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], commodities: 2, tradeGoods: 0 },
}
const start = () => ({ ...createInitialState(faction, { turnOrder: 1, speaker: false }), phase: 'action' as const, strategyCardIds: [1] })

describe('createGameStore', () => {
  it('applies actions through dispatch', () => {
    const store = createGameStore(start())
    store.dispatch({ type: 'tacticalAction' })
    expect(store.state.command.tactic).toBe(2)
  })

  it('undoes the last action', () => {
    const store = createGameStore(start())
    store.dispatch({ type: 'tacticalAction' })
    store.dispatch({ type: 'tacticalAction' })
    expect(store.state.command.tactic).toBe(1)
    store.undo()
    expect(store.state.command.tactic).toBe(2)
    expect(store.canUndo()).toBe(true)
    store.undo()
    expect(store.state.command.tactic).toBe(3)
    expect(store.canUndo()).toBe(false)
  })

  it('load replaces state and clears history', () => {
    const store = createGameStore(start())
    store.dispatch({ type: 'tacticalAction' })
    store.load({ ...start(), tradeGoods: 5 })
    expect(store.state.tradeGoods).toBe(5)
    expect(store.canUndo()).toBe(false)
  })
})
