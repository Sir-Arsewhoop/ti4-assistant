import { describe, it, expect, beforeEach } from 'vitest'
import { loadPrefs, savePrefs, DEFAULT_PREFS } from './prefs'

beforeEach(() => localStorage.clear())

describe('prefs', () => {
  it('returns defaults when nothing is stored', () => {
    expect(loadPrefs()).toEqual(DEFAULT_PREFS)
  })

  it('persists a patch and merges over current', () => {
    const merged = savePrefs({ theme: 'dark' })
    expect(merged.theme).toBe('dark')
    expect(merged.overviewOpen).toBe(DEFAULT_PREFS.overviewOpen)
    expect(loadPrefs().theme).toBe('dark')
  })

  it('merges successive patches without dropping fields', () => {
    savePrefs({ theme: 'light' })
    savePrefs({ currentGameId: 'g1' })
    const p = loadPrefs()
    expect(p.theme).toBe('light')
    expect(p.currentGameId).toBe('g1')
  })

  it('falls back to defaults on corrupt storage', () => {
    localStorage.setItem('ti4:prefs', '{not json')
    expect(loadPrefs()).toEqual(DEFAULT_PREFS)
  })
})
