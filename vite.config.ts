/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves the app from /<repo-name>/
export default defineConfig({
  base: process.env.VITE_BASE ?? '/devfest-departures/',
  plugins: [react()],
  test: { environment: 'node' },
})
