// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Any request starting with /api will be forwarded to the Vercel server
      '/api': {
        target: 'http://localhost:3000', // The port on the `vercel dev` command runs on
        changeOrigin: true,
      },
    },
  },
})