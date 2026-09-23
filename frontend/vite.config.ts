import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vuetify({ autoImport: true }), tailwindcss()],
  build: {
    // Amostra online: sem sourcemaps para não expor o fonte no deploy.
    // A ofuscação pesada é feita depois por scripts/ofuscar-dist.mjs.
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
