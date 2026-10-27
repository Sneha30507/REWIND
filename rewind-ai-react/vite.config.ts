import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // strictPort: if 3000 is busy, fail instead of moving to 3001 (the backend CORS list only allows 3000).
  server: { port: 3000, strictPort: true },
})
