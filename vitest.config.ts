import { defineConfig } from 'vitest/config';

// Every workspace's unit tests in one run of `npm test`, each with its own set-up (vite.config.ts), rather than
// starting Vitest once per workspace. CI still tests one game's workspaces with `npm test -w ...`.
export default defineConfig({
  test: {
    projects: ['apps/*', 'packages/card-kit', 'packages/cards-core'],
    // Keep the transformed modules between runs, so only what changed is transformed again.
    fsModuleCache: true,
  },
});
