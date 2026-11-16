// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  // Each test places a real sandbox order, and 3DS challenges are slow.
  timeout: 150000,
  // One store, one sandbox merchant: run in order so carts and attempt limits don't collide.
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.ARTSPAY_E2E_BASE_URL || 'http://lvh.me:8099',
    viewport: { width: 1200, height: 1600 },
    screenshot: 'only-on-failure',
  },
});
