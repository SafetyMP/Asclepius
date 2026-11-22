import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
for (const width of [390, 1280]) {
  test(`selected case and compact technical evidence work at ${width}px @smoke`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    const apiCalls: string[] = [];
    page.on('request', (request) => {
      if (/\/api\//.test(new URL(request.url()).pathname)) apiCalls.push(request.url());
    });
    await page.goto(`${base}/`);
    await expect(
      page.getByRole('heading', { name: 'Can Willow mark Maya’s report as received?' }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('link', { name: 'Inspect Task' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('FHIR record')).toHaveValue('Task/referral-handoff');
    await expect(page.getByText('completed', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'C16 · Coordination notice' }).click();
    await expect(page.getByText('Receipt unsupported', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'C40 · Signed return' }).click();
    await expect(page.getByText('Receipt supported', { exact: true })).toBeVisible();
    await expect(page.getByText(/did not attend the appointment/)).toBeVisible();
    await page.getByText('3. Test structure and inspect the boundary').click();
    await page.getByRole('button', { name: 'Validate without its status' }).click();
    await expect(page.getByRole('status')).toContainText('Structure rejected');
    await page.getByRole('button', { name: 'Validate authored fixture' }).click();
    await expect(page.getByRole('status')).toContainText('Passes the teaching subset');
    await page.getByLabel('FHIR record').selectOption('Encounter/referral-receiving-visit');
    await expect(page.getByText('planned', { exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(apiCalls).toEqual([]);
  });
}
