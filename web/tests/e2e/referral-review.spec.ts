import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
async function file(page: Page, id: string, request: string, purpose: 'note' | 'report') {
  await page.getByRole('button', { name: new RegExp(id) }).click();
  await page.getByLabel('Request register').selectOption(request);
  await page.getByLabel('Register entry').selectOption(purpose);
  await page.getByRole('button', { name: 'Save filing' }).click();
}
test('reconcile same-person letters, premature closure and retained follow-up @smoke', async ({
  page,
}) => {
  await page.goto(`${base}/`);
  await expect(page.getByRole('heading', { name: 'Open an envelope' })).toBeVisible();
  const check = page.getByRole('button', { name: 'Check this handoff' });
  const current = page.getByRole('article', { name: '13 Nov register' });
  const earlier = page.getByRole('article', { name: '06 Nov register' });
  await expect(page.getByText('Unsupported receipt entries')).toHaveCount(0);
  await file(page, 'C16', '0', 'report');
  await expect(current).toContainText('Receipt entered');
  await file(page, 'C24', '0', 'report');
  await check.click();
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Unsupported receipt entries' }),
  ).toHaveText('2Unsupported receipt entries');
  await expect(page.getByText(/consultant cited a different request/)).toBeVisible();
  await file(page, 'C16', '0', 'note');
  await file(page, 'C24', '1', 'report');
  await current.getByLabel('Follow-up owner').selectOption('Willow referral desk');
  await check.click();
  await expect(current).toContainText('Awaiting report');
  await expect(earlier).toContainText('Receipt entered');
  await expect(page.getByText('No matching report recorded.', { exact: false })).toContainText(
    'Willow referral desk',
  );
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Open requests without an owner' }),
  ).toHaveText('0Open requests without an owner');
  await page.getByRole('button', { name: 'Receive afternoon delivery' }).click();
  await expect(page.getByText('1 unfiled · 3 delivered')).toBeVisible();
  await file(page, 'C40', '0', 'report');
  await check.click();
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Supported report receipts' }),
  ).toHaveText('2 / 2Supported report receipts');
  await expect(page.getByText('The incoming tray is clear.')).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Unfile', exact: true }).click();
  await expect(current).toContainText('Awaiting report');
  await expect(page.getByText('1 unfiled · 3 delivered')).toBeVisible();
});

test('mobile follows documents through a keyboard filing and a compact technical detour', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${base}/referral-review/`);
  const first = page.getByRole('button', { name: /C16/ });
  await first.focus();
  await first.press('Enter');
  await expect(page.getByRole('heading', { name: 'Reading desk' })).toBeFocused();
  await page.getByLabel('Request register').selectOption('0');
  await page.getByLabel('Register entry').selectOption('note');
  await page.getByRole('button', { name: 'Save filing' }).press('Enter');
  await page.getByRole('link', { name: 'Technical reference' }).click();
  await expect(page.getByRole('heading', { name: 'Technical reference' })).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: /Source for/ })).toHaveCount(4);
  await expect(page.getByRole('main').getByRole('button')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('link', { name: 'Return to the referral desk' }).click();
  await expect(page.getByText('1 unfiled · 2 delivered')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
