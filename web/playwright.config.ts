import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 210000,
  use: {
    baseURL: process.env.WEB_BASE_URL ?? 'http://127.0.0.1:3001',
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
});

