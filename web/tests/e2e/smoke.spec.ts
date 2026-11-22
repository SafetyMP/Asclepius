import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { examples } from '../../src/lib/examples';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const apiRequests = new WeakMap<Page, string[]>();

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
    await page.goto(`${base}/journeys/`);
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

  test('keyboard Next keeps focus on the new stage, including the final transition', async ({
    page,
  }) => {
    await page.goto(`${base}/journeys/`);
    await page.getByRole('button', { name: 'Next: Assessment' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('tabpanel')).toBeFocused();
    await expect(page.getByRole('tabpanel')).toContainText(
      'A measurement means more with context.',
    );
    await page.getByRole('button', { name: 'Next: Follow-up' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('tabpanel')).toBeFocused();
    await expect(page.getByRole('tabpanel')).toContainText('Follow the record back to its source.');
    await page.getByRole('button', { name: 'Explore the report', exact: true }).click();
    await expect(page.getByRole('region', { name: 'DiagnosticReport details' })).toBeFocused();
    // Reopening the same selected record is still a deliberate focus action.
    await page.getByRole('button', { name: 'Explore the report', exact: true }).click();
    await expect(page.getByRole('region', { name: 'DiagnosticReport details' })).toBeFocused();
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
    await measurement.getByRole('link', { name: 'Check record structure', exact: true }).click();
    await expect(page.getByLabel('Sample record')).toHaveValue('Observation/demo-observation');
    await page.getByText('View or edit JSON (advanced)', { exact: true }).click();
    await expect(page.getByLabel('FHIR resource JSON')).toHaveValue(/"id": "demo-observation"/);
    await page.reload();
    await expect(page.getByLabel('Sample record')).toHaveValue('Observation/demo-observation');
    await page.getByRole('button', { name: 'Check record structure', exact: true }).click();
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
    await page.getByText('View or edit JSON (advanced)', { exact: true }).click();
    for (const { type, resource } of examples) {
      await page.getByLabel('Sample record').selectOption(`${type}/${resource.id}`);
      await expect(page.getByLabel('FHIR resource JSON')).toHaveValue(
        new RegExp(`"resourceType": "${type}"`),
      );
      await page.getByRole('button', { name: 'Check record structure', exact: true }).click();
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
    await page.getByText('View or edit JSON (advanced)', { exact: true }).click();
    const editor = page.getByRole('textbox', { name: 'FHIR resource JSON' });
    await editor.fill('{"resourceType":');
    await page.getByRole('button', { name: 'Check record structure', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Check your JSON syntax' })).toBeVisible();
    await page.getByRole('button', { name: 'Try a missing-identity example' }).click();
    await expect(page.getByRole('heading', { name: 'Ready when you are.' })).toBeVisible();
    await page.getByRole('button', { name: 'Check record structure', exact: true }).click();
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
    await page.getByRole('button', { name: 'Check record structure', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Passes this teaching subset' })).toBeVisible();
    await editor.fill(
      '{"resourceType":"Patient","name":[{"family":"Example"}],"gender":"invalid-value"}',
    );
    await expect(page.getByRole('heading', { name: 'Passes this teaching subset' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Ready when you are.' })).toBeVisible();
    await page.getByRole('button', { name: 'Check record structure', exact: true }).click();
    await expect(page.getByRole('heading', { name: '1 issue to explore' })).toBeVisible();
    await expect(page.locator('.result-errors code')).toHaveText('gender');
    await page.getByRole('button', { name: 'Reset example' }).click();
    await expect(editor).toHaveValue(/"id": "demo-alex"/);
    await expect(page.getByRole('heading', { name: 'Ready when you are.' })).toBeVisible();
  });

  test('mobile navigation and record inspection fit the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/journeys/`);
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

  test('follow incoming patient links and return through the inspector history', async ({
    page,
  }) => {
    await page.goto(`${base}/resources/`);
    await page.getByRole('button', { name: 'Inspect Patient: Alex Morgan' }).click();
    const patient = page.getByRole('region', { name: 'Patient details' });
    await expect(patient.getByRole('heading', { name: 'At a glance' })).toBeVisible();
    await expect(patient.getByText('Date of birth', { exact: true })).toBeVisible();
    await expect(patient.getByText('Visit for this person', { exact: true })).toBeVisible();
    await expect(patient.getByText('Measurement for this person', { exact: true })).toBeVisible();
    await patient.getByRole('button', { name: 'Observation Temperature measurement' }).click();
    const measurement = page.getByRole('region', { name: 'Observation details' });
    await expect(measurement.getByText('Illustrative measurement', { exact: true })).toBeVisible();
    await expect(measurement.getByText('Measured at', { exact: true })).toBeVisible();
    await expect(measurement.getByLabel('Resource JSON')).toHaveCount(0);
    await measurement
      .getByRole('button', { name: 'DiagnosticReport Visit measurement summary' })
      .click();
    const report = page.getByRole('region', { name: 'DiagnosticReport details' });
    await expect(report.getByText('Report issued', { exact: true })).toBeVisible();
    await report.getByRole('button', { name: 'Back to Temperature measurement' }).click();
    await expect(measurement).toBeFocused();
    await measurement.getByRole('button', { name: 'Back to Alex Morgan' }).click();
    await expect(patient).toBeFocused();
    await patient.getByRole('button', { name: 'Close resource details' }).click();
    await expect(page.getByRole('button', { name: 'Inspect Patient: Alex Morgan' })).toBeFocused();
  });

  test('repair the missing identity without opening JSON and preserve other draft fields', async ({
    page,
  }) => {
    await page.goto(`${base}/validate/`);
    const editor = page.getByLabel('FHIR resource JSON');
    const check = page.getByRole('button', { name: 'Check record structure', exact: true });
    const repair = page.getByRole('button', { name: 'Add a fictional name' });
    await expect(editor).not.toBeVisible();
    await page.getByRole('button', { name: 'Try a missing-identity example' }).click();
    await check.click();
    await expect(page.getByRole('heading', { name: '1 issue to explore' })).toBeVisible();
    await repair.click();
    await expect(page.getByRole('heading', { name: 'Ready when you are.' })).toBeVisible();
    await expect(editor).not.toBeVisible();
    await check.click();
    await expect(page.getByRole('heading', { name: 'Passes this teaching subset' })).toBeVisible();

    await page.getByRole('button', { name: 'Try a missing-identity example' }).click();
    await page.getByText('View or edit JSON (advanced)', { exact: true }).click();
    const draft = {
      resourceType: 'Patient',
      id: 'my-fictional-draft',
      gender: 'unknown',
      active: false,
    };
    await editor.fill(JSON.stringify(draft));
    await repair.click();
    expect(JSON.parse(await editor.inputValue())).toEqual({
      ...draft,
      name: [{ family: 'Example' }],
    });
    const repaired = await editor.inputValue();
    await repair.click();
    await expect(editor).toHaveValue(repaired);
    await expect(
      page.getByRole('status').filter({ hasText: 'A name is already present' }),
    ).toBeVisible();
    await editor.fill('{"resourceType":');
    await repair.click();
    await expect(editor).toHaveValue('{"resourceType":');
    await expect(
      page.getByRole('status').filter({ hasText: 'The JSON needs a syntax fix first' }),
    ).toContainText('Your edits have been kept');
  });

  test('return from the lab to the same journey stage and selected record', async ({ page }) => {
    await page.goto(`${base}/journeys/`);
    await page.getByRole('button', { name: 'Next: Assessment' }).click();
    await page
      .getByRole('button', { name: 'Inspect Observation: Temperature measurement' })
      .click();
    await page
      .getByRole('region', { name: 'Observation details' })
      .getByRole('link', { name: 'Check record structure' })
      .click();
    await expect(page.getByLabel('Sample record')).toHaveValue('Observation/demo-observation');
    await page.getByRole('link', { name: 'Back to care journey' }).click();
    await expect(page.getByRole('tab', { name: /Assessment/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByRole('region', { name: 'Observation details' })).toBeVisible();
    await page.getByRole('tab', { name: /Follow-up/ }).click();
    await page.getByRole('button', { name: 'Explore the report', exact: true }).click();
    const report = page.getByRole('region', { name: 'DiagnosticReport details' });
    await expect(report).toBeFocused();
    await expect(page).toHaveURL(new RegExp(`${base}/journeys/$`));
    await report.getByRole('link', { name: 'Check record structure', exact: true }).click();
    await expect(page.getByLabel('Sample record')).toHaveValue('DiagnosticReport/demo-report');
    await page.getByRole('link', { name: 'Back to care journey' }).click();
    await expect(page.getByRole('tab', { name: /Follow-up/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByRole('region', { name: 'DiagnosticReport details' })).toBeVisible();
    await page.getByRole('button', { name: 'Start over' }).click();
    await expect(page.getByText('1 of 3 stages')).toBeVisible();
    await expect(page.getByRole('region', { name: 'DiagnosticReport details' })).toHaveCount(0);
  });

  test('return from the lab with the explorer search and selection intact', async ({ page }) => {
    await page.goto(`${base}/resources/`);
    await page.getByRole('textbox', { name: 'Search resources' }).fill('Temperature');
    await page
      .getByRole('button', { name: 'Inspect Observation: Temperature measurement' })
      .click();
    await page
      .getByRole('region', { name: 'Observation details' })
      .getByRole('link', { name: 'Check record structure' })
      .click();
    await page.getByRole('link', { name: 'Back to resource explorer' }).click();
    await expect(page.getByRole('textbox', { name: 'Search resources' })).toHaveValue(
      'Temperature',
    );
    await expect(page.getByRole('button', { name: /^Inspect / })).toHaveCount(1);
    const details = page.getByRole('region', { name: 'Observation details' });
    await expect(details).toBeVisible();
    await details.getByRole('button', { name: 'Close resource details' }).click();
    await expect(
      page.getByRole('button', { name: 'Inspect Observation: Temperature measurement' }),
    ).toBeFocused();
  });

  test('opening the lab from navigation resets a record-specific draft and result', async ({
    page,
  }) => {
    await page.goto(`${base}/validate/?resource=Observation&from=explorer`);
    await expect(page.getByLabel('Sample record')).toHaveValue('Observation/demo-observation');
    await page.getByRole('button', { name: 'Check record structure', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Passes this teaching subset' })).toBeVisible();
    await page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('link', { name: 'Validation lab' })
      .click();
    await expect(page.getByLabel('Sample record')).toHaveValue('Patient/demo-alex');
    await expect(page.getByRole('heading', { name: 'Ready when you are.' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Passes this teaching subset' })).toHaveCount(0);
    await expect(
      page
        .getByRole('region', { name: 'Practice draft' })
        .getByRole('heading', { name: 'Alex Morgan' }),
    ).toBeVisible();
  });

  test('mobile repair keeps the draft and result in focus with a full-width check action', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/validate/`);
    const draft = page.getByRole('region', { name: 'Practice draft' });
    const result = page.getByRole('region', { name: 'Structure check result' });
    const check = page.getByRole('button', { name: 'Check record structure', exact: true });
    await page.getByRole('button', { name: 'Try a missing-identity example' }).click();
    await expect(draft).toBeFocused();
    await expect(
      draft.getByRole('heading', { name: 'Missing identity exercise' }),
    ).toBeInViewport();
    await check.click();
    await expect(result).toBeFocused();
    await expect(result.getByRole('heading', { name: '1 issue to explore' })).toBeInViewport();
    await page.getByRole('button', { name: 'Add a fictional name' }).click();
    await expect(draft).toBeFocused();
    await expect(draft.getByRole('status')).toContainText('Added the fictional family name');
    await check.click();
    await expect(result).toBeFocused();
    await expect(
      result.getByRole('heading', { name: 'Passes this teaching subset' }),
    ).toBeInViewport();
    await expect(page.getByLabel('FHIR resource JSON')).not.toBeVisible();
    expect(
      await check.evaluate((button) => {
        const parent = button.parentElement!;
        const style = getComputedStyle(parent);
        const available =
          parent.clientWidth -
          Number.parseFloat(style.paddingLeft) -
          Number.parseFloat(style.paddingRight);
        return Math.abs(button.getBoundingClientRect().width - available) <= 1;
      }),
    ).toBe(true);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });

  test('mobile orientation explains the demo before optional developer details', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/architecture/`);
    await expect(
      page.getByRole('heading', { name: 'Understand the story behind a record.' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Four questions to guide your exploration' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'What you can learn here' })).toBeVisible();
    for (const term of ['FHIR', 'Resource', 'Reference', 'Status']) {
      await expect(
        page.getByRole('term').filter({ hasText: new RegExp(`^${term}$`) }),
      ).toBeVisible();
    }
    const developerDetails = page
      .locator('details')
      .filter({ hasText: 'For developers: architecture and source code' });
    await expect(developerDetails).not.toHaveAttribute('open', '');
    await expect(page.getByRole('link', { name: 'Read the resource parser' })).not.toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await checkAccessibility(page);
    await developerDetails
      .getByText('For developers: architecture and source code', { exact: true })
      .click();
    await expect(page.getByRole('link', { name: 'Read the resource parser' })).toBeVisible();
    await page.getByRole('link', { name: 'Open resource explorer', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Search resources' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Inspect / })).toHaveCount(9);
  });

  test('home, resource details, and validation errors meet automated accessibility checks', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.goto(`${base}/journeys/`);
    await expect(page.locator('#main-content')).toBeVisible();
    await checkAccessibility(page);
    await page.goto(`${base}/resources/`);
    await page.getByRole('button', { name: 'Inspect Patient: Alex Morgan' }).click();
    await checkAccessibility(page);
    await page.goto(`${base}/validate/`);
    await page.getByRole('button', { name: 'Try a missing-identity example' }).click();
    await page.getByRole('button', { name: 'Check record structure', exact: true }).click();
    await expect(page.getByRole('heading', { name: '1 issue to explore' })).toBeVisible();
    await checkAccessibility(page);
  });
});
