import { describe, it, expect, afterEach } from 'vitest'
import { resolveTheme, applyTheme } from './theme'

afterEach(() => {
  delete document.documentElement.dataset.theme
})

describe('resolveTheme', () => {
  it('honors an explicit theme regardless of system', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
  it('resolves system by the prefersDark flag', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })
})

describe('applyTheme', () => {
  it('writes the resolved theme onto the document element', () => {
    window.matchMedia = ((q: string) => ({
      matches: false,
      media: q,
      addEventListener() {},
      removeEventListener() {},
    })) as unknown as typeof window.matchMedia
    applyTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    applyTheme('system')
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
