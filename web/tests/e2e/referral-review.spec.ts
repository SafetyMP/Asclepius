import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

test('grade the cited request and the queue action only after exploring the inbox @smoke', async ({
  page,
}) => {
  await page.goto(`${base}/`);
  const document = page.getByRole('region', { name: 'Selected inbox document' });
  const note = page.getByRole('textbox', { name: 'Request cited by the inbox document' });
  const submit = page.getByRole('button', { name: 'Check my review note' });
  const supported = page.getByRole('heading', { name: 'Both parts of your note are supported.' });
  const track = page.getByRole('radio', { name: 'Continue tracking the report' });
  const received = page.getByRole('radio', { name: 'Mark report received' });
  await expect(note).toBeDisabled();
  await expect(submit).toBeDisabled();
  await expect(document.getByText('ServiceRequest/referral-request')).toBeHidden();
  await expect(supported).toHaveCount(0);
  const inspect = document.getByText('Inspect document details');
  await inspect.click();
  await expect(track).toBeDisabled();
  await note.fill('ServiceRequest/referral-request');
  await expect(submit).toBeDisabled();
  await track.check();
  await expect(supported).toHaveCount(0);
  await submit.click();
  await expect(supported).toBeVisible();

  await page.getByRole('radio', { name: 'Report B' }).check();
  await expect(note).toHaveValue('');
  await expect(note).toBeDisabled();
  await expect(document.getByText('ServiceRequest/earlier-request')).toBeHidden();
  await expect(submit).toBeDisabled();
  await expect(supported).toHaveCount(0);
  await inspect.click();
  await note.fill('ServiceRequest/referral-request');
  await track.check();
  await submit.click();
  await expect(page.getByText('Review your note.', { exact: true })).toBeVisible();
  await expect(page.getByText(/Reopen the inbox document and copy/)).toBeVisible();
  await expect(supported).toHaveCount(0);
  await note.fill('ServiceRequest/earlier-request');
  await expect(page.getByText('Review your note.', { exact: true })).toHaveCount(0);
  await received.check();
  await submit.click();
  await expect(page.getByText('Matches the inbox document.')).toBeVisible();
  await expect(page.getByText('Recheck the action.')).toBeVisible();
  await expect(supported).toHaveCount(0);
  await track.check();
  await submit.click();
  await expect(supported).toBeVisible();

  await page.getByRole('radio', { name: 'Report A' }).check();
  await inspect.click();
  await expect(document.getByText('ServiceRequest/referral-request')).toBeVisible();
  await note.fill('ServiceRequest/referral-request');
  await received.check();
  await submit.click();
  await expect(supported).toBeVisible();
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
