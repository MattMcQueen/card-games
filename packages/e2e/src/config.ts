import { defineConfig, devices } from '@playwright/test';

/**
 * The Playwright set-up every game's end-to-end tests share. They run in WebKit, the engine behind Safari
 * and every browser on iPhone, against the production build served by `vite preview`, which sends the
 * same security headers as the live site, so a blocked resource shows up here. Each game has its own
 * `port`, so the games can be tested at the same time.
 */
export function e2eConfig(port: number) {
  return defineConfig({
    testDir: 'e2e',
    fullyParallel: true,
    // The tests mostly wait on the page, so CI's runner can take one per core rather than Playwright's half.
    workers: process.env.CI ? '100%' : undefined,
    // A whole hand against the computer takes a while, even with the animations off.
    timeout: 200_000,
    reporter: 'list',
    use: { baseURL: `http://localhost:${port}` },
    webServer: {
      // CI has just built the game (see .github/workflows/game.yml), so it only needs serving.
      command: `${process.env.CI ? '' : 'npm run build && '}npm run preview -- --port ${port} --strictPort`,
      url: `http://localhost:${port}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    projects: [
      { name: 'webkit', use: { ...devices['Desktop Safari'] } },
      { name: 'iphone', use: { ...devices['iPhone 13'] } },
    ],
  });
}
