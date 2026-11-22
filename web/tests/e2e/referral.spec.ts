import { expect, test } from '@playwright/test';
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
for (const route of [
  'journeys',
  'resources',
  'validate',
  'architecture',
  'patients',
  'cds',
  'auth',
  'interactions',
]) {
  test(`saved /${route}/ bookmark opens the compact implementation trace`, async ({ page }) => {
    await page.goto(`${base}/${route}/`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Trace Maya’s review note');
    await expect(page.getByRole('navigation').getByRole('link')).toHaveCount(2);
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      'https://safetymp.github.io/Asclepius/workspace/',
    );
    await page.getByRole('link', { name: 'Return to Maya’s review note' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Can Willow mark Maya’s report as received?',
    );
  });
}

test('a saved validation link preserves the supported record and opens its test controls', async ({
  page,
}) => {
  await page.goto(`${base}/validate/?journey=referral&record=Task%2Freferral-handoff`);
  await expect(page.getByLabel('FHIR record')).toHaveValue('Task/referral-handoff');
  await expect(page.getByRole('button', { name: 'Validate authored fixture' })).toBeVisible();
});
