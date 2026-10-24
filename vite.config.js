import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Electron loads the built files from dist/ using file:// protocol.
  // Setting base to './' ensures all asset paths are relative.
  base: './',
  server: {
    // Always use port 5173 so Electron knows exactly where to connect
    port: 5173,
    strictPort: true,
  },
})
