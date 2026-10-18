import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { apiLocal } from './dev/api-plugin'

export default defineConfig(({ mode }) => {
  // Make .env values visible to the local /api functions, as Vercel does in production.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  return {
    plugins: [react(), apiLocal()],
    build: { target: 'es2020' },
  }
})
