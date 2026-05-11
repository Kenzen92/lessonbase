import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
    trace: "on-first-retry",
  },
  globalSetup: "./tests/e2e/global-setup.js",
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    port: 4173,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_REACT_APP_API_URL: "/api",
      VITE_REACT_APP_WEBSOCKET_URL: "ws://127.0.0.1:4173/ws",
      VITE_PROXY_API_TARGET: "http://127.0.0.1:8010",
      VITE_PROXY_WS_TARGET: "ws://127.0.0.1:8010",
      VITE_GOOGLE_CLIENT_ID: "playwright-google-client-id",
      VITE_SENTRY_DSN: "",
    },
  },
});