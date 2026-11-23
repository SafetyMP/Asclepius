import { expect, test } from '@playwright/test';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const worksheet = 'How should the next coordinators learn this?';

test('the educator can compare staff time and check how to assess learning independently', async ({
  page,
}) => {
  await page.goto(`${base}/referral-review/`);
  await expect(page.getByRole('slider', { name: 'Minutes saved per learner' })).toBeHidden();
  await page.getByText(worksheet, { exact: true }).click();
  await expect(page.getByText('Break-even at 24 learners.')).toBeVisible();
  for (const name of [
    'Keep the mentor walkthrough',
    'Trial a one-page status guide',
    'Pilot the interactive exercise',
  ]) {
    const option = page.getByRole('radio', { name, exact: true });
    await option.check();
    await expect(option).toBeChecked();
  }
  const minutes = page.getByRole('slider', { name: 'Minutes saved per learner' });
  await minutes.press('Home');
  await expect(page.getByText('6 staff hours', { exact: true })).toBeVisible();
  await expect(page.getByText('of additional time in year one')).toBeVisible();
  await expect(page.getByText(/learner volume cannot recover/)).toBeVisible();
  await minutes.press('End');
  await expect(page.getByText('18 staff hours', { exact: true })).toBeVisible();
  await expect(page.getByText('Break-even at 6 learners.')).toBeVisible();
});

test('the evidence permalink restores the selected report, decision, trial and sponsor worksheet', async ({
  page,
}) => {
  await page.goto(`${base}/`);
  await page.getByRole('radio', { name: 'Report B', exact: true }).check();
  await page.getByText('Read Cedar’s report', { exact: true }).click();
  await page.getByRole('button', { name: 'Keep tracking', exact: true }).click();
  await page.getByText(worksheet, { exact: true }).click();
  await page.getByRole('slider', { name: 'Minutes saved per learner' }).press('Home');
  await page.getByRole('radio', { name: 'Pilot the interactive exercise' }).check();
  await page.getByRole('link', { name: 'Trace this report and decision' }).click();
  await page.getByText('Replay filing trials', { exact: true }).click();
  await page.getByRole('button', { name: 'C16 · Coordination notice' }).click();
  await expect(page.getByText('Receipt unsupported', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'C40 · Signed return' }).click();
  await expect(page.getByText('Receipt supported', { exact: true })).toBeVisible();
  await expect(page.getByText(/did not attend the appointment/)).toBeVisible();
  await page.getByRole('button', { name: 'C24 · Filed to current' }).click();
  await expect(page.getByText('Receipt unsupported', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'C24 · Refiled to prior' }).click();
  await expect(page.getByText('Receipt supported', { exact: true })).toBeVisible();
  await expect(page.getByText(/earlier referral has a supported receipt/)).toBeVisible();
  const href = await page
    .getByRole('link', { name: 'Permalink to this evidence' })
    .getAttribute('href');
  expect(href).toContain('#trace?');
  const fresh = await page.context().newPage();
  await fresh.goto(new URL(href ?? '', page.url()).href);
  await expect(fresh.getByRole('button', { name: 'C24 · Refiled to prior' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(fresh.getByText('Receipt supported', { exact: true })).toBeVisible();
  await expect(fresh.getByRole('region', { name: 'Your selected case' })).toContainText('Report B');
  await fresh.getByRole('link', { name: 'Return to Maya’s review note' }).click();
  await expect(fresh.getByRole('radio', { name: 'Report B' })).toBeChecked();
  await expect(fresh.getByRole('button', { name: 'Keep tracking' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    fresh.getByRole('heading', { name: 'What Willow’s queue would show' }),
  ).toBeVisible();
  await fresh.close();
  await page.getByText('Education lead’s worksheet', { exact: true }).click();
  await expect(page.getByText(/24 learners × 0 minutes \/ 60 − 6 hours/)).toContainText(
    '-6 net hours',
  );
  await page.getByRole('link', { name: 'Return to the educator worksheet' }).click();
  const debrief = page.getByText(worksheet, { exact: true });
  if (!(await page.getByRole('radio', { name: 'Pilot the interactive exercise' }).isVisible())) {
    await debrief.click();
  }
  await expect(page.getByRole('radio', { name: 'Pilot the interactive exercise' })).toBeChecked();
  await expect(page.getByRole('slider', { name: 'Minutes saved per learner' })).toHaveValue('0');
});

test('source inspection resolves the selected fixture and the shared validator tests a copy @smoke', async ({
  page,
}) => {
  await page.goto(`${base}/`);
  await page.getByText('Inspect the three source records', { exact: true }).click();
  await page.getByRole('link', { name: 'Inspect Task', exact: true }).click();
  const record = page.getByLabel('FHIR record');
  await expect(record).toHaveValue('Task/referral-handoff');
  await expect(page.getByText('completed', { exact: true })).toBeVisible();
  await page.getByText('Run the shared validator', { exact: true }).click();
  await page.getByRole('button', { name: 'Validate without its status' }).click();
  await expect(page.getByRole('status')).toContainText('Structure rejected');
  await page.getByRole('button', { name: 'Validate authored fixture' }).click();
  await expect(page.getByRole('status')).toContainText('Passes the teaching subset');
  await record.selectOption('Encounter/referral-receiving-visit');
  await expect(page.getByText('planned', { exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toHaveCount(0);
});
