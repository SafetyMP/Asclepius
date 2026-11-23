import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

async function tabTo(page: Page, target: Locator) {
  await expect(target).toBeVisible();
  for (let index = 0; index < 42; index++) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  await expect(target).toBeFocused();
}

async function activate(page: Page, control: Locator) {
  await tabTo(page, control);
  await page.keyboard.press('Enter');
}

for (const width of [390, 1280]) {
  test(`inspect two reports and trace the queue decision by keyboard at ${width}px @smoke`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    const apiCalls: string[] = [];
    page.on('request', (request) => {
      if (/\/api\//.test(new URL(request.url()).pathname)) apiCalls.push(request.url());
    });
    await page.goto(`${base}/`);
    const story = page.getByRole('heading', { name: 'Maya is waiting to hear from Willow' });
    const reportA = page.getByRole('radio', { name: 'Report A', exact: true });
    const reportB = page.getByRole('radio', { name: 'Report B', exact: true });
    const letter = page.getByRole('region', { name: 'Selected inbox document' });
    const inspect = page.getByText('Read Cedar’s report', { exact: true });
    const hint = page.getByText('Where should I look?', { exact: true });
    const result = page.getByRole('region', { name: 'What Willow’s queue would show' });
    const received = page.getByRole('button', { name: 'Mark report received', exact: true });
    const track = page.getByRole('button', { name: 'Keep tracking', exact: true });
    await expect(story).toBeVisible();
    const context = page.getByRole('region', { name: 'Why is Maya still on the list?' });
    await expect(context).toContainText('Willow’s coordinator');
    await expect(context).toContainText('consultant report');
    await expect(context).toContainText('work queue');
    const request = page.getByRole('region', { name: 'Open referral' });
    await expect(request).toContainText('ServiceRequest/referral-request');
    await expect(reportA).toBeChecked();
    await expect(result).toHaveCount(0);
    await expect(received).toBeDisabled();
    await activate(page, hint);
    await expect(hint.locator('..')).toHaveAttribute('open', '');
    await activate(page, inspect);
    await expect(
      letter.getByText('ServiceRequest/referral-request', { exact: true }),
    ).toBeVisible();
    await expect(result).toHaveCount(0);

    await activate(page, track);
    await expect(result).toBeVisible();
    await expect(track).toHaveAttribute('aria-pressed', 'true');
    await expect(result).toContainText('Still tracking');
    await expect(result).toContainText('Needs correction');
    await expect(result).toContainText(
      /Willow’s coordinator would keep chasing a letter already on file/,
    );
    await activate(page, received);
    await expect(received).toHaveAttribute('aria-pressed', 'true');
    await expect(result).toContainText('Report received');
    await expect(result).toContainText('Supported by this document');
    await expect(result).toContainText(/Willow’s clinician, Sam Rivera/);
    await tabTo(page, reportA);
    await page.keyboard.press('ArrowRight');
    await expect(reportB).toBeChecked();
    await expect(result).toHaveCount(0);
    await expect(track).toBeDisabled();
    await expect(request).toContainText('ServiceRequest/referral-request');
    await activate(page, inspect);
    await expect(letter.getByText('ServiceRequest/earlier-request', { exact: true })).toBeVisible();
    await activate(page, received);
    await expect(result).toBeVisible();
    await expect(received).toHaveAttribute('aria-pressed', 'true');
    await expect(result).toContainText('Report received');
    await expect(result).toContainText('Needs correction');
    await expect(result).toContainText(/Willow’s coordinator needs to reopen this item/);
    await activate(page, track);
    await expect(track).toHaveAttribute('aria-pressed', 'true');
    await expect(result).toContainText('Still tracking');
    await expect(result).toContainText('Supported by this document');
    await expect(result).toContainText(/Willow’s coordinator keeps this request/);
    await expect(
      page.getByText('Both letters against the same request', { exact: true }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

    await activate(page, page.getByRole('link', { name: 'Trace this report and decision' }));
    const selected = page.getByRole('region', { name: 'Your selected case' });
    const steps = page.getByRole('group', { name: 'Technical steps' });
    await expect(selected).toContainText('Report B');
    await expect(selected).toContainText(/keep tracking|continue tracking/i);
    await expect(selected.getByRole('link', { name: 'Selected FHIR fixture' })).toHaveAttribute(
      'href',
      /referral-examples\.ts#L/,
    );
    await activate(page, steps.getByRole('button', { name: 'Receipt rule' }));
    await expect(steps.getByRole('button', { name: 'Receipt rule' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(selected).toContainText('ServiceRequest/earlier-request');
    await expect(selected).toContainText('ServiceRequest/referral-request');
    await expect(
      selected.getByRole('link', { name: 'Document type and reference check' }),
    ).toHaveAttribute('href', /shift\.tsx#L/);
    await activate(page, steps.getByRole('button', { name: 'Queue entry' }));
    await expect(steps.getByRole('button', { name: 'Queue entry' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(selected.getByText('Still tracking', { exact: true })).toBeVisible();
    await expect(selected.getByText('Supported', { exact: true })).toBeVisible();
    await expect(selected).toContainText(/Willow’s coordinator keeps this request/);
    await expect(
      selected.getByRole('link', { name: 'Queue decision and follow-up logic' }),
    ).toHaveAttribute('href', /shift\.tsx#L/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await activate(page, page.getByRole('link', { name: 'Return to Maya’s review note' }));
    await expect(reportB).toBeChecked();
    await expect(track).toHaveAttribute('aria-pressed', 'true');
    await expect(result).toBeVisible();
    expect(apiCalls).toEqual([]);
  });
}
