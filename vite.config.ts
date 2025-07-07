import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const vercelBackendPort = 3000;

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Any request starting with /api will be forwarded to the Vercel server
      '/api': {
        target: `http://localhost:${vercelBackendPort}`, // The port on the `vercel dev` command runs on
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      // This maps the '@' alias to your 'src' directory for frontend code
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
})