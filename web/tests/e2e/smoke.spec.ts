import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const apiRequests = new WeakMap<Page, string[]>();
const resourceTypes = [
  'Patient',
  'Practitioner',
  'Organization',
  'Encounter',
  'Condition',
  'Observation',
  'MedicationRequest',
  'AllergyIntolerance',
  'DiagnosticReport',
];

async function checkAccessibility(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test.describe('Synthetic care journey @smoke', () => {
  test.beforeEach(async ({ page }) => {
    const requests: string[] = [];
    apiRequests.set(page, requests);
    page.on('request', (request) => {
      if (/(?:^|\/)api(?:\/|$)/.test(new URL(request.url()).pathname)) {
        requests.push(request.url());
      }
    });
  });

  test.afterEach(async ({ page }) => {
    expect(apiRequests.get(page), 'The hosted demo must not request an API').toEqual([]);
  });

  test('walk through all stages, use keyboard tabs, and start over', async ({ page }) => {
    await page.goto(`${base}/`);
    await expect(
      page.getByRole('heading', { name: 'One visit. The whole picture.' }),
    ).toBeVisible();
    await expect(page.getByText('1 of 3 stages')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Inspect Patient: Alex Morgan' })).toBeVisible();
    await page.getByRole('button', { name: 'Next: Assessment' }).click();
    await expect(page.getByRole('tab', { name: /Assessment/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(
      page.getByRole('heading', { name: 'A measurement means more with context.' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Inspect Observation: Temperature measurement' }),
    ).toBeVisible();
    await page.getByRole('tab', { name: /Assessment/ }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: /Follow-up/ })).toBeFocused();
    await expect(page.getByRole('tab', { name: /Follow-up/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByText('3 of 3 stages')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Inspect DiagnosticReport: Visit measurement summary' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Start over' }).click();
    await expect(page.getByText('1 of 3 stages')).toBeVisible();
    await expect(page.getByRole('tab', { name: /Check-in/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  test('inspect a report, follow its measurement, and open the matching validator', async ({
    page,
  }) => {
    await page.goto(`${base}/resources/`);
    await page
      .getByRole('button', { name: 'Inspect DiagnosticReport: Visit measurement summary' })
      .click();
    const report = page.getByRole('region', { name: 'DiagnosticReport details' });
    await report.getByRole('button', { name: 'View FHIR JSON' }).click();
    await expect(report.getByLabel('Resource JSON')).toContainText(
      '"reference": "Observation/demo-observation"',
    );
    await report.getByRole('button', { name: 'Observation Temperature measurement' }).click();
    const measurement = page.getByRole('region', { name: 'Observation details' });
    await expect(
      measurement.getByRole('heading', { name: 'Temperature measurement' }),
    ).toBeVisible();
    await expect(measurement.getByLabel('Resource JSON')).toHaveCount(0);
    await measurement.getByRole('link', { name: 'Validate', exact: true }).click();
    await expect(page.getByLabel('Resource type')).toHaveValue('Observation');
    await expect(page.getByLabel('FHIR resource JSON')).toHaveValue(/"id": "demo-observation"/);
    await page.reload();
    await expect(page.getByLabel('Resource type')).toHaveValue('Observation');
    await page.getByRole('button', { name: 'Validate resource', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Passes this teaching subset' })).toBeVisible();
  });

  test('search resources and recover from an empty result', async ({ page }) => {
    await page.goto(`${base}/resources/`);
    await expect(page.getByRole('button', { name: /^Inspect / })).toHaveCount(9);
    await page.getByRole('textbox', { name: 'Search resources' }).fill('Temperature');
    await expect(page.getByRole('button', { name: /^Inspect / })).toHaveCount(1);
    await expect(
      page.getByRole('button', { name: 'Inspect Observation: Temperature measurement' }),
    ).toBeVisible();
    await page.getByRole('textbox', { name: 'Search resources' }).fill('no-such-synthetic-record');
    await expect(page.getByRole('heading', { name: 'No matching records' })).toBeVisible();
    await checkAccessibility(page);
    await page.getByRole('button', { name: 'Clear search' }).click();
    await expect(page.getByRole('textbox', { name: 'Search resources' })).toHaveValue('');
    await expect(page.getByRole('button', { name: /^Inspect / })).toHaveCount(9);
  });

  test('all nine synthetic samples pass the shared teaching validator', async ({ page }) => {
    await page.goto(`${base}/validate/`);
    for (const type of resourceTypes) {
      await page.getByLabel('Resource type').selectOption(type);
      await expect(page.getByLabel('FHIR resource JSON')).toHaveValue(
        new RegExp(`"resourceType": "${type}"`),
      );
      await page.getByRole('button', { name: 'Validate resource', exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Passes this teaching subset' }),
        type,
      ).toBeVisible();
    }
    await page.getByText('View OperationOutcome JSON', { exact: true }).click();
    await expect(page.locator('.raw-outcome pre')).toContainText('"issue": []');
  });

  test('distinguish malformed JSON, repair a missing identity, and invalidate stale results', async ({
    page,
  }) => {
    await page.goto(`${base}/validate/`);
    const editor = page.getByRole('textbox', { name: 'FHIR resource JSON' });
    await editor.fill('{"resourceType":');
    await page.getByRole('button', { name: 'Validate resource', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Check your JSON syntax' })).toBeVisible();
    await page.getByRole('button', { name: 'Try a missing-identity example' }).click();
    await expect(page.getByRole('heading', { name: 'Ready when you are.' })).toBeVisible();
    await page.getByRole('button', { name: 'Validate resource', exact: true }).click();
    await expect(
      page.getByText('Patient must have at least one identifier or name', { exact: true }),
    ).toBeVisible();
    await editor.fill(
      JSON.stringify(
        {
          resourceType: 'Patient',
          id: 'demo-challenge',
          name: [{ family: 'Example' }],
          gender: 'unknown',
        },
        null,
        2,
      ),
    );
    await expect(page.getByRole('heading', { name: 'Ready when you are.' })).toBeVisible();
    await page.getByRole('button', { name: 'Validate resource', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Passes this teaching subset' })).toBeVisible();
    await editor.fill(
      '{"resourceType":"Patient","name":[{"family":"Example"}],"gender":"invalid-value"}',
    );
    await expect(page.getByRole('heading', { name: 'Passes this teaching subset' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Ready when you are.' })).toBeVisible();
    await page.getByRole('button', { name: 'Validate resource', exact: true }).click();
    await expect(page.getByRole('heading', { name: '1 issue to explore' })).toBeVisible();
    await expect(page.locator('.result-errors code')).toHaveText('gender');
    await page.getByRole('button', { name: 'Reset example' }).click();
    await expect(editor).toHaveValue(/"id": "demo-alex"/);
    await expect(page.getByRole('heading', { name: 'Ready when you are.' })).toBeVisible();
  });

  test('mobile navigation and record inspection fit the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/`);
    const menu = page.getByRole('button', { name: 'Toggle navigation' });
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await menu.click();
    await page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('link', { name: 'Resource explorer' })
      .click();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await page.getByRole('button', { name: 'Inspect Patient: Alex Morgan' }).click();
    const details = page.getByRole('region', { name: 'Patient details' });
    await details.getByRole('button', { name: 'View FHIR JSON' }).click();
    await expect(details.getByLabel('Resource JSON')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await details.getByRole('button', { name: 'Close resource details' }).click();
    await expect(details).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Inspect Patient: Alex Morgan' })).toBeFocused();
  });

  test('home, resource details, and validation errors meet automated accessibility checks', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.goto(`${base}/`);
    await expect(page.locator('#main-content')).toBeVisible();
    await checkAccessibility(page);
    await page.goto(`${base}/resources/`);
    await page.getByRole('button', { name: 'Inspect Patient: Alex Morgan' }).click();
    await checkAccessibility(page);
    await page.goto(`${base}/validate/`);
    await page.getByRole('button', { name: 'Try a missing-identity example' }).click();
    await page.getByRole('button', { name: 'Validate resource', exact: true }).click();
    await expect(page.getByRole('heading', { name: '1 issue to explore' })).toBeVisible();
    await checkAccessibility(page);
  });
});
