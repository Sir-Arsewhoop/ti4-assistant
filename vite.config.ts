import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'
import { svelteTesting } from '@testing-library/svelte/vite'

export default defineConfig({
  base: '/ti4-assistant/',
  plugins: [
    svelte(),
    VitePWA({ registerType: 'autoUpdate', manifest: { name: 'TI4 Assistant', short_name: 'TI4', display: 'standalone' } }),
    // No-op outside Vitest (guarded internally on process.env.VITEST): resolves Svelte's
    // `browser` export condition so components mount client-side instead of SSR under jsdom,
    // and auto-cleans up the DOM between tests.
    svelteTesting(),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
