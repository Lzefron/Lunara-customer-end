import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const config = JSON.parse(readFileSync(new URL('./wrangler.json', import.meta.url), 'utf8'))
  const photoPattern = new RegExp('^' + (env.VITE_SUPABASE_URL ?? config.vars.SUPABASE_URL).replace(/\/$/, '').replaceAll('.', '\\.') + '/storage/v1/object/authenticated/product-photos/')
  return {
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL ?? config.vars.SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY ?? config.vars.SUPABASE_PUBLISHABLE_KEY),
    },
    plugins: [react(), VitePWA({
      registerType: 'autoUpdate', manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'], navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [{
          urlPattern: photoPattern,
          handler: 'CacheFirst', options: { cacheName: 'lunara-public-photos', cacheableResponse: { statuses: [200] }, expiration: { maxEntries: 120, maxAgeSeconds: 30 * 86400 } },
        }],
      },
    })],
  }
})
