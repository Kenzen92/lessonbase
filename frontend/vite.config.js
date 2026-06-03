import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

const apiProxyTarget = process.env.VITE_PROXY_API_TARGET || 'http://localhost:8000'
const wsProxyTarget = process.env.VITE_PROXY_WS_TARGET || 'ws://localhost:8000'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    css: false,
    include: ["src/**/*.test.{js,jsx}"],
    exclude: ["tests/**", "node_modules/**"],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/ws': {
        target: wsProxyTarget,
        ws: true,
        changeOrigin: true,
        // Vite will automatically upgrade to wss:// when the page is served over https://
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT || 4173,
    allowedHosts: [
      'https://teach.jkenny.tech'
    ]
  }
})
