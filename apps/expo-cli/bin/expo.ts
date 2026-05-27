#!/usr/bin/env bun
import { createApp } from '../src/index.js';

async function main() {
  const app = await createApp({
    headless: process.argv.includes('--headless'),
    localesDir: new URL('../../locales', import.meta.url).pathname,
  });

  await app.start();

  process.on('SIGINT', async () => {
    await app.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await app.shutdown();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
