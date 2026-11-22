import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { getJourney, journeys, recordKey } from '../../src/lib/journeys';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const referral = getJourney('referral');
const routine = getJourney('routine');
const receivingPractitioner = referral.records.find(
  (sample) => sample.resource.id === 'referral-taylor',
)!;
const apiRequests = new WeakMap<Page, string[]>();

function references(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) =>
    key === 'reference' && typeof child === 'string' ? [child] : references(child),
  );
}

async function selectReferral(page: Page) {
  await page.getByRole('button', { name: referral.label, exact: true }).click();
  await expect(page.getByRole('button', { name: referral.label, exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
}

async function checkAccessibility(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test('each journey has an isolated, fully linked synthetic record graph @smoke', () => {
  const allKeys: string[] = [];
  for (const journey of journeys) {
    const keys = journey.records.map(recordKey);
    expect(keys).toHaveLength(9);
    expect(new Set(keys).size).toBe(keys.length);
    for (const sample of journey.records) {
      expect(sample.resource.resourceType).toBe(sample.type);
      for (const reference of references(sample.resource)) {
        expect(keys, `${recordKey(sample)} -> ${reference}`).toContain(reference);
      }
    }
    for (const stage of journey.stages) {
      expect(stage.recordKeys.length).toBeGreaterThan(0);
      for (const key of stage.recordKeys) expect(keys).toContain(key);
    }
    expect(keys).toContain(journey.finalRecordKey);
    allKeys.push(...keys);
  }
  expect(new Set(allKeys).size).toBe(allKeys.length);
  expect(referral.records.find((sample) => sample.type === 'ServiceRequest')?.resource.status).toBe(
    'active',
  );
  expect(referral.records.find((sample) => sample.type === 'Task')?.resource.status).toBe(
    'completed',
  );
  expect(
    referral.records.find((sample) => sample.resource.id === 'referral-receiving-visit')?.resource
      .status,
  ).toBe('planned');
});

test.describe('Referral and handoff journey @smoke', () => {
  test.beforeEach(async ({ page }) => {
    const requests: string[] = [];
    apiRequests.set(page, requests);
    page.on('request', (request) => {
      if (/(?:^|\/)api(?:\/|$)/.test(new URL(request.url()).pathname)) requests.push(request.url());
    });
  });

  test.afterEach(async ({ page }) => {
    expect(apiRequests.get(page), 'The referral demo must remain browser-only').toEqual([]);
  });

  test('follow referral preparation, receiving team review, and a recorded handoff', async ({
    page,
  }) => {
    await page.goto(`${base}/journeys/`);
    await selectReferral(page);
    await expect(page.getByRole('heading', { name: referral.headline })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Referral/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.locator('.handoff-context')).toContainText('Willow');
    await page.getByRole('button', { name: 'Next: Team review' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('tabpanel')).toBeFocused();
    await expect(page.getByRole('tab', { name: /Team review/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.locator('.handoff-context')).toContainText('Cedar');
    await page.getByRole('button', { name: 'Next: Handoff' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('tabpanel')).toBeFocused();
    await expect(page.getByText('3 of 3 stages')).toBeVisible();
    await expect(page.locator('.handoff-context')).toContainText('Cedar');
    const handoff = referral.records.find((sample) => sample.type === 'Task')!;
    await expect(page.getByRole('button', { name: /^Inspect / }).first()).toHaveAttribute(
      'aria-label',
      `Inspect Task: ${handoff.title}`,
    );
    await page.getByRole('button', { name: `Inspect Task: ${handoff.title}` }).click();
    const task = page.getByRole('region', { name: 'Task details' });
    await expect(task).toContainText('Coordination completed');
    const receiving = referral.records.find(
      (sample) => sample.resource.id === 'referral-receiving-visit',
    )!;
    await task.getByRole('button', { name: `Encounter ${receiving.title}`, exact: true }).click();
    const encounter = page.getByRole('region', { name: 'Encounter details' });
    await expect(encounter).toContainText('Planned visit');
    await expect(encounter).not.toContainText('Completed visit');
  });

  test('validate each of the nine referral record instances, including the new resource types', async ({
    page,
  }) => {
    await page.goto(`${base}/validate/?journey=referral&record=ServiceRequest%2Freferral-request`);
    const select = page.getByLabel('Sample record');
    await expect(select.locator('option')).toHaveCount(9);
    await page.getByText('View or edit JSON (advanced)', { exact: true }).click();
    for (const sample of referral.records) {
      await select.selectOption(recordKey(sample));
      const draft = JSON.parse(await page.getByLabel('FHIR resource JSON').inputValue());
      expect(draft.id).toBe(sample.resource.id);
      expect(draft.resourceType).toBe(sample.type);
      await page.getByRole('button', { name: 'Check record structure', exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Passes this teaching subset' }),
        recordKey(sample),
      ).toBeVisible();
    }
  });

  test('keep same-type team and visit records distinct and follow the handoff back to the referral', async ({
    page,
  }) => {
    await page.goto(`${base}/resources/`);
    await selectReferral(page);
    await expect(page.getByRole('button', { name: /^Inspect / })).toHaveCount(9);
    for (const type of ['Practitioner', 'Organization', 'Encounter']) {
      const records = referral.records.filter((sample) => sample.type === type);
      expect(records).toHaveLength(2);
      for (const sample of records) {
        await page.getByRole('button', { name: `Inspect ${type}: ${sample.title}` }).click();
        const details = page.getByRole('region', { name: `${type} details` });
        await expect(
          details.getByRole('heading', { name: sample.title, exact: true }),
        ).toBeVisible();
        await details.getByRole('button', { name: 'View FHIR JSON' }).click();
        await expect(details.getByLabel('Resource JSON')).toContainText(
          `"id": "${sample.resource.id}"`,
        );
      }
    }
    const handoff = referral.records.find((sample) => sample.type === 'Task')!;
    const request = referral.records.find((sample) => sample.type === 'ServiceRequest')!;
    await page.getByRole('button', { name: `Inspect Task: ${handoff.title}` }).click();
    await page
      .getByRole('region', { name: 'Task details' })
      .getByRole('button', { name: `ServiceRequest ${request.title}`, exact: true })
      .click();
    const details = page.getByRole('region', { name: 'ServiceRequest details' });
    await expect(details).toContainText('Active');
    await details.getByRole('button', { name: `Back to ${handoff.title}` }).click();
    await expect(page.getByRole('region', { name: 'Task details' })).toBeFocused();
  });

  test('preserve each journey’s stage and selection separately across the lab and journey switching', async ({
    page,
  }) => {
    await page.goto(`${base}/journeys/`);
    await page.getByRole('button', { name: 'Next: Assessment' }).click();
    await page
      .getByRole('button', { name: 'Inspect Observation: Temperature measurement' })
      .click();
    await selectReferral(page);
    await page.getByRole('tab', { name: /Handoff/ }).click();
    await page.getByRole('button', { name: 'Explore the handoff', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Task details' })).toBeFocused();
    await expect(page).toHaveURL(new RegExp(`${base}/journeys/$`));
    await page
      .getByRole('region', { name: 'Task details' })
      .getByRole('link', { name: 'Check record structure', exact: true })
      .click();
    await expect(page.getByLabel('Sample record')).toHaveValue('Task/referral-handoff');
    await page.getByRole('link', { name: 'Back to care journey' }).click();
    await expect(page.getByRole('tab', { name: /Handoff/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByRole('region', { name: 'Task details' })).toBeVisible();
    await page.getByRole('button', { name: routine.label, exact: true }).click();
    await expect(page.getByRole('tab', { name: /Assessment/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByRole('region', { name: 'Observation details' })).toBeVisible();
    await expect(page.getByRole('button', { name: routine.label, exact: true })).toBeFocused();
    await expect(page.getByRole('button', { name: routine.label, exact: true })).toBeInViewport();
    await expect(page.getByRole('region', { name: 'Task details' })).toHaveCount(0);
    await selectReferral(page);
    await expect(page.getByRole('tab', { name: /Handoff/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByRole('region', { name: 'Task details' })).toBeVisible();
    await expect(page.getByRole('button', { name: referral.label, exact: true })).toBeFocused();
    await expect(page.getByRole('button', { name: referral.label, exact: true })).toBeInViewport();
  });

  test('keep explorer searches separate and return to the correct record after a direct-link reload', async ({
    page,
  }) => {
    await page.goto(`${base}/resources/`);
    await page.getByRole('textbox', { name: 'Search resources' }).fill('Temperature');
    await selectReferral(page);
    await expect(page.getByRole('textbox', { name: 'Search resources' })).toHaveValue('');
    await page.getByRole('textbox', { name: 'Search resources' }).fill('Taylor');
    await expect(page.getByRole('button', { name: /^Inspect / })).toHaveCount(1);
    await page.getByRole('button', { name: routine.label, exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Search resources' })).toHaveValue(
      'Temperature',
    );
    await selectReferral(page);
    await expect(page.getByRole('textbox', { name: 'Search resources' })).toHaveValue('Taylor');
    await page
      .getByRole('button', { name: `Inspect Practitioner: ${receivingPractitioner.title}` })
      .click();
    await page
      .getByRole('region', { name: 'Practitioner details' })
      .getByRole('link', { name: 'Check record structure' })
      .click();
    await expect(page.getByLabel('Sample record')).toHaveValue('Practitioner/referral-taylor');
    await page.reload();
    await expect(page.getByLabel('Sample record')).toHaveValue('Practitioner/referral-taylor');
    await page.getByRole('link', { name: 'Back to resource explorer' }).click();
    await expect(page.getByRole('button', { name: referral.label, exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(
      page
        .getByRole('region', { name: 'Practitioner details' })
        .getByRole('heading', { name: receivingPractitioner.title }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Inspect Patient: Alex Morgan' })).toHaveCount(0);
  });

  test('View all clears old explorer filters while ordinary navigation resumes them', async ({
    page,
  }) => {
    await page.goto(`${base}/resources/`);
    await selectReferral(page);
    const search = page.getByRole('textbox', { name: 'Search resources' });
    const navigation = page.getByRole('navigation', { name: 'Primary' });
    await search.fill('Taylor');
    await page
      .getByRole('button', { name: `Inspect Practitioner: ${receivingPractitioner.title}` })
      .click();
    await navigation.getByRole('link', { name: 'Care journey', exact: true }).click();
    await navigation.getByRole('link', { name: 'Resource explorer' }).click();
    await expect(search).toHaveValue('Taylor');
    await expect(page.getByRole('button', { name: /^Inspect / })).toHaveCount(1);
    await expect(page.getByRole('region', { name: 'Practitioner details' })).toBeVisible();
    await navigation.getByRole('link', { name: 'Care journey', exact: true }).click();
    await page.getByRole('link', { name: 'View all', exact: true }).click();
    await expect(search).toHaveValue('');
    await expect(page.getByRole('button', { name: /^Inspect / })).toHaveCount(9);
    await expect(page.getByRole('region', { name: / details$/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: referral.label, exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('follow the prominent handoff path and retrace request and planned-visit context', async ({
    page,
  }) => {
    await page.goto(`${base}/journeys/`);
    await selectReferral(page);
    await page.getByRole('tab', { name: /Handoff/ }).click();
    await page.getByRole('button', { name: 'Explore the handoff', exact: true }).click();
    const task = page.getByRole('region', { name: 'Task details' });
    await task.getByRole('button', { name: 'Open referral request', exact: true }).click();
    const request = page.getByRole('region', { name: 'ServiceRequest details' });
    await expect(request).toBeFocused();
    await expect(request).toContainText('Active');
    await request
      .getByRole('button', { name: 'Open planned receiving visit', exact: true })
      .click();
    const visit = page.getByRole('region', { name: 'Encounter details' });
    await expect(visit).toBeFocused();
    await expect(
      visit.getByRole('heading', { name: 'Planned receiving visit at Cedar', exact: true }),
    ).toBeVisible();
    await expect(visit).toContainText('Planned visit');
    await visit.getByRole('button', { name: 'Back to Referral to Cedar', exact: true }).click();
    await expect(request).toBeFocused();
    await request
      .getByRole('button', { name: 'Back to Coordination handoff to Cedar', exact: true })
      .click();
    await expect(task).toBeFocused();
    await task.getByRole('button', { name: 'Open planned receiving visit', exact: true }).click();
    await visit.getByRole('button', { name: 'Open handoff record', exact: true }).click();
    await expect(task).toBeFocused();
    await expect(task).toContainText('Coordination completed');
    await checkAccessibility(page);
  });

  test('mobile switching keeps the picker in focus and handoff shortcuts within reach', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/journeys/`);
    await page.getByRole('button', { name: 'Inspect Patient: Alex Morgan', exact: true }).click();
    await selectReferral(page);
    await page.getByRole('tab', { name: /Handoff/ }).click();
    await page.getByRole('button', { name: 'Explore the handoff', exact: true }).click();
    await page.getByRole('button', { name: routine.label, exact: true }).click();
    await expect(page.getByRole('button', { name: routine.label, exact: true })).toBeFocused();
    await expect(page.getByRole('button', { name: routine.label, exact: true })).toBeInViewport();
    await expect(page.getByRole('region', { name: 'Patient details' })).toBeVisible();
    await selectReferral(page);
    await expect(page.getByRole('button', { name: referral.label, exact: true })).toBeFocused();
    await expect(page.getByRole('button', { name: referral.label, exact: true })).toBeInViewport();
    await expect(page.getByRole('region', { name: 'Task details' })).toBeVisible();
    await checkAccessibility(page);
    await page.getByRole('button', { name: 'Explore the handoff', exact: true }).click();
    const task = page.getByRole('region', { name: 'Task details' });
    await expect(task).toBeFocused();
    await expect(
      task.getByRole('button', { name: 'Open referral request', exact: true }),
    ).toBeInViewport();
    await expect(
      task.getByRole('button', { name: 'Open planned receiving visit', exact: true }),
    ).toBeInViewport();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await checkAccessibility(page);
  });

  test('sidebar navigation keeps referral context after opening or reloading a lab deep link', async ({
    page,
  }) => {
    const navigation = page.getByRole('navigation', { name: 'Primary' });
    for (const reload of [false, true]) {
      await page.goto(`${base}/validate/?journey=referral&record=Task%2Freferral-handoff`);
      if (reload) await page.reload();
      await expect(page.getByLabel('Sample record')).toHaveValue('Task/referral-handoff');
      await navigation.getByRole('link', { name: 'Resource explorer' }).click();
      await expect(page.getByRole('button', { name: referral.label, exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await expect(page.getByRole('button', { name: 'Inspect Patient: Maya Chen' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Inspect Patient: Alex Morgan' })).toHaveCount(
        0,
      );
      await navigation.getByRole('link', { name: 'Validation lab' }).click();
      await expect(page.getByLabel('Sample record')).toHaveValue('Patient/referral-maya');
      await expect(
        page
          .getByRole('region', { name: 'Practice draft' })
          .getByRole('heading', { name: 'Maya Chen' }),
      ).toBeVisible();
    }
  });

  test('mobile referral and handoff stay readable, accessible, and within the viewport', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/journeys/`);
    await selectReferral(page);
    await checkAccessibility(page);
    await page.getByRole('tab', { name: /Handoff/ }).click();
    const handoff = referral.records.find((sample) => sample.type === 'Task')!;
    await page.getByRole('button', { name: `Inspect Task: ${handoff.title}` }).click();
    await expect(page.getByRole('region', { name: 'Task details' })).toBeFocused();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await checkAccessibility(page);
    await page
      .getByRole('region', { name: 'Task details' })
      .getByRole('link', { name: 'Check record structure' })
      .click();
    await page.getByRole('button', { name: 'Check record structure', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Passes this teaching subset' })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await checkAccessibility(page);
  });
});
