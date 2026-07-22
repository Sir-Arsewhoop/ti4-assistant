import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/ti4-assistant/',
  plugins: [
    svelte(),
    VitePWA({ registerType: 'autoUpdate', manifest: { name: 'TI4 Assistant', short_name: 'TI4', display: 'standalone' } }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
