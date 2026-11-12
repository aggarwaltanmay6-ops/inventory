import { defineConfig } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
process.env.E2E_PASSWORD ||= randomBytes(24).toString('hex');
process.env.E2E_RUN ||= String(Date.now());
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.resolve('.data/browsers');
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    channel: 'chromium',
    baseURL: 'http://localhost:3100',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: {
    command: 'node scripts/e2e-server.mjs',
    url: 'http://localhost:3100/api/health',
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      APP_ORIGIN: 'http://localhost:3100',
      PGLITE_DIR: `.data/e2e-${process.env.E2E_RUN}`,
      SEED_OWNER_USERNAME: 'e2e-owner',
      SEED_OWNER_PASSWORD: process.env.E2E_PASSWORD,
      SEED_DEMO: 'true',
      NEXT_TELEMETRY_DISABLED: '1',
      DATABASE_URL: '',
    },
  },
});
