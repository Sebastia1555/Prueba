import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // Rutas relativas para que la app funcione servida desde cualquier
  // subcarpeta (p. ej. GitHub Pages en /prueba/).
  base: './',
  plugins: [react(), tailwindcss()],
  // `--mode artifact`: vista previa en una sola página HTML (ver
  // scripts/inline-preview.mjs), con todos los recursos incrustados.
  build:
    mode === 'artifact'
      ? { assetsInlineLimit: Number.MAX_SAFE_INTEGER, cssCodeSplit: false, modulePreload: false }
      : undefined,
}))
