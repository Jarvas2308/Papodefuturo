import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // Ambiente padrao continua 'node' - a maioria da suite e teste de
    // dominio/logica pura, sem DOM. Teste de interacao opta no jsdom por
    // arquivo com o pragma `// @vitest-environment jsdom` no topo, em vez
    // de pagar o custo de jsdom nos 141+ arquivos que nao precisam dele.
    setupFiles: ['./src/testSetup.ts'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router') ||
              id.includes('/scheduler/')
            ) {
              return 'react-vendor'
            }
            if (id.includes('/@supabase/')) {
              return 'supabase-vendor'
            }
          }
          return undefined
        },
      },
    },
  },
})
