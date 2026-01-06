import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // For GitHub Pages at root domain
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})

