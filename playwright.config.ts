import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 15000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4300',
    trace: 'retain-on-failure'
  },
  webServer: [
    {
      // starts the mock server itself, no separate terminal or global install needed
      command: 'npx go-mokapi',
      url: 'http://localhost:8080',
      reuseExistingServer: !process.env.CI,
      timeout: 10000
    },
    {
      command: 'node server.ts',
      url: 'http://localhost:4300',
      reuseExistingServer: !process.env.CI
    }
  ]
})