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
  await expect(page.getByLabel('FHIR record')).toHaveValue('Encounter/referral-receiving-visit');
  await expect(page.getByText('planned', { exact: true })).toBeVisible();
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

test('sponsor choice, checked note and assumptions survive the round trip', async ({ page }) => {
  await page.goto(`${base}/`);
  await page.getByRole('radio', { name: 'Report B' }).check();
  await page.getByText('Inspect document details').click();
  await page
    .getByLabel('Request cited by the inbox document')
    .fill('ServiceRequest/earlier-request');
  await page.getByRole('radio', { name: 'Continue tracking the report' }).check();
  await page.getByRole('button', { name: 'Check my review note' }).click();
  await page.getByRole('slider', { name: 'Minutes saved per learner' }).press('Home');
  await page.getByRole('radio', { name: 'Pilot the interactive exercise' }).check();
  await page.getByRole('link', { name: 'Trace this case and sponsor choice' }).click();
  const selected = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Your selected case' }) });
  await expect(selected).toContainText('Report B · C24');
  await expect(selected).toContainText('ServiceRequest/earlier-request');
  await expect(selected).toContainText('Continue tracking · checked');
  await expect(selected).toContainText(
    'Pilot the interactive exercise · 24 learners × 0 minutes / 60 − 6 hours = -6 net hours',
  );
  await page.getByRole('button', { name: 'C24 · Filed to current' }).click();
  await expect(page.getByText('Receipt unsupported', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'C24 · Refiled to prior' }).click();
  await expect(page.getByText('Receipt supported', { exact: true })).toBeVisible();
  await expect(page.getByText(/earlier referral has a supported receipt/)).toBeVisible();
  const share = await page
    .getByRole('link', { name: 'Permalink to this evidence' })
    .getAttribute('href');
  expect(share).toContain('#trace?');
  const fresh = await page.context().newPage();
  await fresh.goto(new URL(share ?? '', page.url()).href);
  await expect(fresh.getByRole('button', { name: 'C24 · Refiled to prior' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(fresh.getByText('Receipt supported', { exact: true })).toBeVisible();
  await expect(fresh.getByText(/24 learners × 0 minutes/)).toBeVisible();
  await fresh.getByRole('link', { name: 'Return to Maya’s review note' }).click();
  await expect(fresh.getByRole('radio', { name: 'Report B' })).toBeChecked();
  await expect(fresh.getByLabel('Request cited by the inbox document')).toHaveValue(
    'ServiceRequest/earlier-request',
  );
  await fresh.close();
  await page.getByRole('link', { name: 'Return to the educator worksheet' }).click();
  await expect(page.getByRole('radio', { name: 'Report B' })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'Pilot the interactive exercise' })).toBeChecked();
  await expect(page.getByLabel('Request cited by the inbox document')).toHaveValue(
    'ServiceRequest/earlier-request',
  );
  await expect(page.getByRole('slider', { name: 'Minutes saved per learner' })).toHaveValue('0');
});
