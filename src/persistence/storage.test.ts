import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { saveGame, loadGame, listGames, exportGame, importGame } from './storage'
import { createInitialState } from '../domain/initialState'
import type { FactionStartingInfo } from '../domain/types'

const faction: FactionStartingInfo = {
  id: 'sol', name: 'Federation of Sol', combatModifier: 0,
  starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], commodities: 2, tradeGoods: 0 },
}
const state = () => createInitialState(faction, { turnOrder: 1, speaker: false })

describe('persistence', () => {
  it('saves and loads a game by id', async () => {
    const s = { ...state(), tradeGoods: 7 }
    await saveGame('game-1', s)
    const loaded = await loadGame('game-1')
    expect(loaded?.tradeGoods).toBe(7)
  })

  it('lists saved game ids', async () => {
    await saveGame('game-a', state())
    await saveGame('game-b', state())
    const ids = await listGames()
    expect(ids).toEqual(expect.arrayContaining(['game-a', 'game-b']))
  })

  it('returns undefined for a missing game', async () => {
    expect(await loadGame('nope')).toBeUndefined()
  })

  it('exports to JSON and imports back to an equal state', () => {
    const s = { ...state(), victoryPoints: 3 }
    const round = importGame(exportGame(s))
    expect(round).toEqual(s)
  })

  it('throws importing malformed JSON', () => {
    expect(() => importGame('{not json')).toThrow()
  })
})
