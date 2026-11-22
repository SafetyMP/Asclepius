import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

test('compare the fixed snapshot with a hypothetical receipt and trace its records @smoke', async ({
  page,
}) => {
  await page.goto(`${base}/`);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Can Willow mark Maya’s report as received?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Mark report received' }).click();
  await expect(page.getByText('Recheck the evidence.')).toBeVisible();
  await page.getByRole('button', { name: 'Continue tracking the report' }).click();
  await expect(page.getByText('Supported by this evidence.')).toBeVisible();
  await page.getByRole('radio', { name: 'Report A' }).check();
  await expect(page.getByText('Supported by this evidence.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Mark report received' }).click();
  await expect(page.getByText('Supported by this evidence.')).toBeVisible();
  await page.getByRole('radio', { name: 'Report B' }).check();
  await expect(page.getByRole('region', { name: 'Selected inbox document' })).toContainText(
    'ServiceRequest/earlier-request',
  );
  await expect(page.getByRole('region', { name: 'Open referral' })).toContainText(
    'ServiceRequest/referral-request',
  );
  await page.getByRole('button', { name: 'Mark report received' }).click();
  await expect(page.getByText('Recheck the evidence.')).toBeVisible();
  await page.getByRole('button', { name: 'Continue tracking the report' }).click();
  await expect(page.getByText('Supported by this evidence.')).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('link', { name: 'Inspect Encounter' }).click();
  const detail = page.getByRole('region', { name: 'Encounter details' });
  await expect(
    detail.getByRole('heading', { name: 'Planned receiving visit at Cedar' }),
  ).toBeVisible();
});

test('training assumptions expose break-even and zero time savings', async ({ page }) => {
  await page.goto(`${base}/referral-review/`);
  await expect(page.getByText('Break-even at 24 learners.')).toBeVisible();
  await page.getByRole('slider', { name: 'Minutes saved per learner' }).press('Home');
  await expect(page.getByText('6 staff hours', { exact: true })).toBeVisible();
  await expect(page.getByText('of additional time in year one')).toBeVisible();
  await expect(page.getByText(/learner volume cannot recover/)).toBeVisible();
  await page.getByRole('slider', { name: 'Minutes saved per learner' }).press('End');
  await expect(page.getByText('18 staff hours', { exact: true })).toBeVisible();
  await expect(page.getByText('Break-even at 6 learners.')).toBeVisible();
});

test('home opens the exercise and the technical guide reveals the full teaching tools', async ({
  page,
}) => {
  await page.goto(`${base}/`);
  await page.getByRole('link', { name: 'Technical workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Technical workspace' })).toBeVisible();
  await page.getByText('Fixtures and evidence', { exact: true }).click();
  await expect(page.getByRole('link', { name: 'Inspect Maya’s fixture records' })).toBeVisible();
  await page.getByRole('main').getByRole('link', { name: 'Care journeys', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Choose a synthetic journey' })).toBeVisible();
  await page.getByRole('link', { name: 'Asclepius home' }).click();
  await expect(page.getByRole('radio', { name: 'Original inbox' })).toBeChecked();
});
