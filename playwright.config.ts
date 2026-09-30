import { defineConfig, devices } from '@playwright/test';

// The tests run in WebKit, the engine behind Safari and every browser on iPhone. They use the
// production build served by `vite preview`, which sends the same security headers as the live
// site, so a blocked resource shows up here.
const PORT = 4173;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  // A whole hand against the computer players takes a while, even with the animations off.
  timeout: 200_000,
  reporter: 'list',
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'iphone', use: { ...devices['iPhone 13'] } },
  ],
});
