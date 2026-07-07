import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Rutas relativas para que la app funcione servida desde cualquier
  // subcarpeta (p. ej. GitHub Pages en /prueba/).
  base: './',
  plugins: [react(), tailwindcss()],
})
