import { describe, it, expect } from 'vitest'
import { manifest } from './manifest'

describe('pwa manifest', () => {
  it('has the fields a browser needs to offer install', () => {
    expect(manifest.name).toBe('TI4 Turn Assistant')
    expect(manifest.short_name).toBe('TI4')
    expect(manifest.display).toBe('standalone')
    expect(manifest.theme_color).toBeTruthy()
    expect(manifest.background_color).toBeTruthy()
    expect(manifest.icons?.length ?? 0).toBeGreaterThan(0)
    expect(manifest.icons?.[0]?.src).toBe('icon.svg')
  })
})
