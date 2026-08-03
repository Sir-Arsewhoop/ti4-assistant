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

  it('throws importing structurally-invalid JSON (valid JSON, wrong shape)', () => {
    expect(() => importGame('{}')).toThrow()
    expect(() => importGame('{"phase":"strategy"}')).toThrow()
  })

  it('fills defaults for fields missing from a legacy save on load', async () => {
    const legacy = { ...state() } as Record<string, unknown>
    delete legacy.revealedPublicObjectiveIds
    delete legacy.scoredPublicThisRound
    await saveGame('legacy-1', legacy as never)
    const loaded = await loadGame('legacy-1')
    expect(loaded?.revealedPublicObjectiveIds).toEqual([])
    expect(loaded?.scoredPublicThisRound).toBe(false)
  })

  it('fills defaults for fields missing from a legacy import', () => {
    const legacy = { ...state() } as Record<string, unknown>
    delete legacy.revealedPublicObjectiveIds
    delete legacy.scoredPublicThisRound
    const imported = importGame(JSON.stringify(legacy))
    expect(imported.revealedPublicObjectiveIds).toEqual([])
    expect(imported.scoredPublicThisRound).toBe(false)
  })

  it('defaults the secret scoring-window flag for a legacy save on load', async () => {
    const legacy = { ...state() } as Record<string, unknown>
    delete legacy.scoredSecretThisRound
    await saveGame('legacy-secret', legacy as never)
    const loaded = await loadGame('legacy-secret')
    expect(loaded?.scoredSecretThisRound).toBe(false)
  })

  it('defaults the secret scoring-window flag for a legacy import, and keeps a present value', () => {
    const legacy = { ...state() } as Record<string, unknown>
    delete legacy.scoredSecretThisRound
    expect(importGame(JSON.stringify(legacy)).scoredSecretThisRound).toBe(false)
    const present = importGame(exportGame({ ...state(), scoredSecretThisRound: true }))
    expect(present.scoredSecretThisRound).toBe(true)
  })

  it('does not clobber values that are present', () => {
    const s = { ...state(), revealedPublicObjectiveIds: ['corner-the-market'], scoredPublicThisRound: true }
    const imported = importGame(exportGame(s))
    expect(imported.revealedPublicObjectiveIds).toEqual(['corner-the-market'])
    expect(imported.scoredPublicThisRound).toBe(true)
  })
})
