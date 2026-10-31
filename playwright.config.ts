import { defineConfig } from '@playwright/test'

const externalMokapi = process.env.MOKAPI_EXTERNAL === 'true'
 
const webServer = []

if (!externalMokapi) {
  webServer.push({
    command: 'npx go-mokapi asyncapi.yaml collab.js',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  })
}
 
webServer.push({
  command: 'node server.ts',
  url: 'http://localhost:4300',
  reuseExistingServer: !process.env.CI
})

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
  webServer
})