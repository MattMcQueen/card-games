import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// The same security headers the live site sends (public/staticwebapp.config.json), so
// `npm run preview` behaves like production and a blocked resource shows up locally.
const live = JSON.parse(readFileSync('public/staticwebapp.config.json', 'utf-8')) as {
  globalHeaders: Record<string, string>;
};
const previewHeaders = { ...live.globalHeaders };
// The plain-http local preview must not be forced onto https.
previewHeaders['Content-Security-Policy'] = (previewHeaders['Content-Security-Policy'] ?? '')
  .replace('; upgrade-insecure-requests', '');
delete previewHeaders['Strict-Transport-Security'];

export default defineConfig({
  plugins: [svelte()],
  preview: { headers: previewHeaders },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
