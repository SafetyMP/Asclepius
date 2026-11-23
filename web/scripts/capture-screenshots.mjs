/** Capture the published case and technical evidence at the configured Pages subpath. */
import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = process.env.SCREENSHOT_OUTPUT_DIR ?? fileURLToPath(new URL('../../docs/assets/', import.meta.url));
const base = (process.env.SCREENSHOT_BASE_URL ?? 'http://127.0.0.1:3200').replace(/\/$/, '');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 }, reducedMotion: 'reduce' });
  await page.goto(base + '/');
  await expect(page.getByRole('heading', { name: 'Maya is waiting to hear from Willow' })).toBeVisible();
  await mkdir(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, 'referral-study.jpg'), type: 'jpeg', quality: 87 });

  await page.getByRole('radio', { name: 'Report B' }).check();
  await page.getByText('Read Cedar’s report', { exact: true }).click();
  await page.getByRole('button', { name: 'Keep tracking' }).click();
  await page.getByRole('link', { name: 'Trace this report and decision' }).click();
  await page.getByRole('button', { name: 'Queue entry' }).click();
  await expect(page.getByRole('heading', { name: 'What Willow’s next shift sees' })).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: path.join(dir, 'referral-trace.jpg'), type: 'jpeg', quality: 87 });
} finally {
  await browser.close();
}
