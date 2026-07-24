import { openDB, type IDBPDatabase } from 'idb'
import type { GameState } from '../domain/types'

const DB_NAME = 'ti4-assistant'
const STORE = 'games'

let dbPromise: Promise<IDBPDatabase> | null = null
function db() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(d) {
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE)
      },
    })
  }
  return dbPromise
}

export async function saveGame(id: string, state: GameState): Promise<void> {
  await (await db()).put(STORE, state, id)
}

export async function loadGame(id: string): Promise<GameState | undefined> {
  return (await (await db()).get(STORE, id)) as GameState | undefined
}

export async function listGames(): Promise<string[]> {
  return (await (await db()).getAllKeys(STORE)) as string[]
}

export function exportGame(state: GameState): string {
  return JSON.stringify(state, null, 2)
}

export function importGame(json: string): GameState {
  const parsed = JSON.parse(json) as GameState
  if (typeof parsed?.phase !== 'string' || !parsed.command || !Array.isArray(parsed.planets)) {
    throw new Error('Not a valid TI4 game save')
  }
  return parsed
}
