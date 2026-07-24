import type { ManifestOptions } from 'vite-plugin-pwa'

export const manifest: Partial<ManifestOptions> = {
  name: 'TI4 Turn Assistant',
  short_name: 'TI4',
  description: 'A guided turn assistant for Twilight Imperium 4 — tracks your state and tells you your options each phase.',
  display: 'standalone',
  orientation: 'portrait',
  theme_color: '#14161a',
  background_color: '#14161a',
  start_url: '.',
  scope: '.',
  icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
}
