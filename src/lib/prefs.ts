export type Theme = 'system' | 'light' | 'dark'

export type Prefs = {
  theme: Theme
  overviewOpen: boolean
  currentGameId: string | null
}

export const DEFAULT_PREFS: Prefs = {
  theme: 'system',
  overviewOpen: true,
  currentGameId: null,
}

const KEY = 'ti4:prefs'

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    const parsed = JSON.parse(raw) as Partial<Prefs>
    return { ...DEFAULT_PREFS, ...parsed }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function savePrefs(patch: Partial<Prefs>): Prefs {
  const merged = { ...loadPrefs(), ...patch }
  localStorage.setItem(KEY, JSON.stringify(merged))
  return merged
}
