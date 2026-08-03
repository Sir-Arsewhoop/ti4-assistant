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

// Saves written before a field existed load as `undefined`; fill them so older
// games keep working instead of crashing on a missing array.
export function withStateDefaults(raw: Partial<GameState>): GameState {
  return {
    ...(raw as GameState),
    revealedPublicObjectiveIds: raw.revealedPublicObjectiveIds ?? [],
    scoredPublicThisRound: raw.scoredPublicThisRound ?? false,
    scoredSecretThisRound: raw.scoredSecretThisRound ?? false,
  }
}

export async function saveGame(id: string, state: GameState): Promise<void> {
  await (await db()).put(STORE, state, id)
}

export async function loadGame(id: string): Promise<GameState | undefined> {
  const raw = (await (await db()).get(STORE, id)) as Partial<GameState> | undefined
  return raw ? withStateDefaults(raw) : undefined
}

export async function listGames(): Promise<string[]> {
  return (await (await db()).getAllKeys(STORE)) as string[]
}

export function exportGame(state: GameState): string {
  return JSON.stringify(state, null, 2)
}

export function importGame(json: string): GameState {
  const parsed = JSON.parse(json) as Partial<GameState>
  if (typeof parsed?.phase !== 'string' || !parsed.command || !Array.isArray(parsed.planets)) {
    throw new Error('Not a valid TI4 game save')
  }
  return withStateDefaults(parsed)
}
