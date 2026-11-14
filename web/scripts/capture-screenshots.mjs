/**
 * Capture the current synthetic journeys for the README.
 *
 * From web/: npm run build && npm run start (keep the server running), then
 * npx playwright install chromium && npm run screenshots
 *
 * SCREENSHOT_BASE_URL may include /Asclepius/ for a project-subpath preview.
 * SCREENSHOT_OUTPUT_DIR may target a review directory before updating docs/assets.
 * Historical PNGs and demo.gif are never overwritten by this script.
 */
import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const outputDirectory = process.env.SCREENSHOT_OUTPUT_DIR
  ? path.resolve(process.env.SCREENSHOT_OUTPUT_DIR)
  : path.resolve(scriptDirectory, '../../docs/assets');
const baseURL = `${(process.env.SCREENSHOT_BASE_URL ?? 'http://127.0.0.1:3200').replace(/\/$/, '')}/`;

async function captureJourneys() {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'One visit. The whole picture.' })).toBeVisible();
    const referralChoice = page.getByRole('button', { name: 'A referral and handoff', exact: true });
    await expect(referralChoice).toBeEnabled();
    const routine = await page.screenshot({ type: 'jpeg', quality: 85, fullPage: true });

    await referralChoice.click();
    await expect(page.getByRole('heading', { name: 'Two teams. One connected story.' })).toBeVisible();
    await page.getByRole('tab', { name: /Handoff/ }).click();
    await page.getByRole('button', { name: 'Explore the handoff', exact: true }).click();
    await expect(page.getByText('Follow this handoff', { exact: true })).toBeVisible();
    // Opening the inspector moves focus and scrolls it into view. Capture the
    // whole document from the top so sticky navigation keeps its normal position.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForFunction(() => window.scrollY === 0);
    const referral = await page.screenshot({ type: 'jpeg', quality: 85, fullPage: true });

    // Write only after both journeys have rendered successfully.
    await mkdir(outputDirectory, { recursive: true });
    await writeFile(path.join(outputDirectory, 'care-journey.jpg'), routine);
    await writeFile(path.join(outputDirectory, 'referral-handoff.jpg'), referral);
    console.log(`Captured both synthetic journeys in ${outputDirectory}`);
  } finally {
    await browser.close();
  }
}

captureJourneys().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
