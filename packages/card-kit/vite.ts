import { readdirSync, readFileSync } from 'node:fs';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

// The Vite set-up every game shares. A game's vite.config.ts is just `export default gameConfig();`.

/** Files every site serves as they are: the Azure headers and routes, the favicon, robots.txt, the 404 page's CSS. */
const shared = new URL('./public/', import.meta.url);
const sharedFiles = readdirSync(shared);
const types: Record<string, string> = {
  css: 'text/css',
  json: 'application/json',
  svg: 'image/svg+xml',
  txt: 'text/plain',
};

/**
 * Adds the shared files to each game's own public/ folder (which holds only its 404 page): served
 * while developing, and copied into the build.
 */
function sharedPublic(): Plugin {
  return {
    name: 'card-kit-shared-public',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = new URL(req.url ?? '/', 'http://localhost').pathname.slice(1);
        if (!sharedFiles.includes(name)) return next();
        res.setHeader('Content-Type', types[name.split('.').pop() as string] as string);
        res.end(readFileSync(new URL(name, shared)));
      });
    },
    generateBundle() {
      for (const fileName of sharedFiles) {
        this.emitFile({ type: 'asset', fileName, source: readFileSync(new URL(fileName, shared)) });
      }
    },
  };
}

/**
 * The same security headers the live site sends (public/staticwebapp.config.json), so
 * `npm run preview` behaves like production and a blocked resource shows up locally.
 */
function previewHeaders(): Record<string, string> {
  const live = JSON.parse(readFileSync(new URL('staticwebapp.config.json', shared), 'utf-8')) as {
    globalHeaders: Record<string, string>;
  };
  const headers = { ...live.globalHeaders };
  // The plain-http local preview must not be forced onto https.
  headers['Content-Security-Policy'] = (headers['Content-Security-Policy'] ?? '').replace('; upgrade-insecure-requests', '');
  delete headers['Strict-Transport-Security'];
  return headers;
}

export function gameConfig() {
  return defineConfig({
    plugins: [svelte(), sharedPublic()],
    // Which build is running, shown on the About page: the commit GitHub Actions built it from.
    define: { __BUILD__: JSON.stringify(process.env.GITHUB_SHA?.slice(0, 7) ?? 'local') },
    // Keep the card images as real, separately cached files rather than data inside the script.
    build: { assetsInlineLimit: 0 },
    // The port can be chosen with PORT (the preview tool does), which Vite does not read by itself.
    server: { port: Number(process.env.PORT) || 5173 },
    preview: { headers: previewHeaders() },
    test: {
      include: ['src/**/*.test.ts'],
      // Keep the transformed modules between runs, so only what changed is transformed again.
      fsModuleCache: true,
    },
  });
}
