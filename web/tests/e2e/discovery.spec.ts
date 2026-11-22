import { expect, test } from '@playwright/test';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const published = 'https://safetymp.github.io/Asclepius/';
const routes = [
  ['', 'Referral review · Asclepius'],
  ['workspace/', 'Technical evidence · Asclepius'],
] as const;

// Inspect the response itself: crawlers must not need hydration to find these fields.
function meta(html: string, name: string): string | undefined {
  const tags = html.match(/<meta\b[^>]*>/g) ?? [];
  return tags
    .find((tag) => tag.includes(`name="${name}"`) || tag.includes(`property="${name}"`))
    ?.match(/content="([^"]*)"/)?.[1];
}

test.describe('Published discovery metadata @smoke', () => {
  test('main routes export distinct titles and correct canonical and social URLs', async ({
    request,
  }) => {
    for (const [path, title] of routes) {
      const response = await request.get(`${base}/${path}`);
      expect(response.ok()).toBe(true);
      const html = await response.text();
      expect(html).toContain(`<title>${title}</title>`);
      expect(html.match(/<link\b[^>]*rel="canonical"[^>]*>/g)).toEqual([
        `<link rel="canonical" href="${published}${path}"/>`,
      ]);
      expect(meta(html, 'description')?.length).toBeGreaterThan(60);
      expect(meta(html, 'robots')).toBe('index, follow');
      expect(meta(html, 'og:url')).toBe(`${published}${path}`);
      expect(meta(html, 'og:title')).toBe(title);
      expect(meta(html, 'og:image')).toBe(`${published}social-preview.png`);
      expect(meta(html, 'twitter:card')).toBe('summary_large_image');
    }
  });

  test('compatibility routes remain reachable but excluded from indexing', async ({ request }) => {
    for (const route of [
      'journeys',
      'architecture',
      'resources',
      'validate',
      'patients',
      'auth',
      'cds',
      'interactions',
      'referral-review',
    ]) {
      const response = await request.get(`${base}/${route}/`);
      expect(response.ok()).toBe(true);
      expect(meta(await response.text(), 'robots')).toBe('noindex, follow');
    }
  });

  test('home describes the educational source accurately without clinical claims', async ({
    request,
  }) => {
    const html = await (await request.get(`${base}/`)).text();
    const json = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)?.[1];
    expect(json).toBeDefined();
    const data = JSON.parse(json ?? '{}');
    expect(data['@type']).toBe('SoftwareSourceCode');
    expect(data.codeRepository).toBe('https://github.com/SafetyMP/Asclepius');
    expect(data.url).toBe(published);
    expect(data.description).toContain('onboarding pilot');
    expect(data.description).toContain('Not for clinical use');
    expect(data.license).toBe('https://www.apache.org/licenses/LICENSE-2.0');
    expect(data).not.toHaveProperty('aggregateRating');
  });

  test('sitemap, agent reading map and share assets ship under the Pages path', async ({
    request,
  }) => {
    const response = await request.get(`${base}/sitemap.xml`);
    expect(response.ok()).toBe(true);
    const sitemap = await response.text();
    const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
    expect(urls).toEqual(routes.map(([path]) => `${published}${path}`));
    const readingMap = await request.get(`${base}/llms.txt`);
    expect(readingMap.ok()).toBe(true);
    expect(await readingMap.text()).toContain('NOT_FOR_CLINICAL_USE');
    expect(await readingMap.text()).toContain(
      'https://raw.githubusercontent.com/SafetyMP/Asclepius/main/AGENTS.md',
    );
    const image = await request.get(`${base}/social-preview.png`);
    expect(image.headers()['content-type']).toContain('image/png');
    const png = await image.body();
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
    const icon = await request.get(`${base}/icon.svg`);
    expect(icon.ok()).toBe(true);
    expect(await icon.text()).toContain('<svg');
  });
});
