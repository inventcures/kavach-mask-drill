import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

// Sandboxes ship Chromium here; elsewhere (CI, laptops) Playwright uses its own download.
const LOCAL_CHROMIUM = '/opt/pw-browsers/chromium';

const PORT = 4173;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}/`,
    viewport: { width: 360, height: 800 },
    trace: 'off',
    launchOptions: existsSync(LOCAL_CHROMIUM) ? { executablePath: LOCAL_CHROMIUM } : {},
  },
  webServer: {
    // The service worker only exists in the production build.
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
