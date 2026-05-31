import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Add this block to allow Render's domain bypass
  preview: {
    allowedHosts: true
  }
})
