import type { Metadata } from 'next';

// Canonicals describe the public deployment, including its GitHub Pages project path.
export const siteUrl = 'https://safetymp.github.io/Asclepius/';
export const repositoryUrl = 'https://github.com/SafetyMP/Asclepius';
export const siteDescription = 'Match a consultant report to a fictional referral, choose an onboarding pilot and trace the selected evidence through a teaching subset of FHIR. Not for clinical use.';
export const publicRoutes = ['', 'workspace/'] as const;

export function pageMetadata(
  path: string,
  title: string,
  description: string,
  index = true,
): Metadata {
  const url = new URL(path, siteUrl).href;
  const image = new URL('social-preview.png', siteUrl).href;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index, follow: true },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: 'Asclepius',
      title,
      description,
      url,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: 'Asclepius: Connected care, explained. A fictional referral review and onboarding decision. Synthetic only; not for clinical use.',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export const sourceCodeSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareSourceCode',
  '@id': `${siteUrl}#source`,
  name: 'Asclepius',
  description: siteDescription,
  url: siteUrl,
  codeRepository: repositoryUrl,
  programmingLanguage: 'TypeScript',
  license: 'https://www.apache.org/licenses/LICENSE-2.0',
  isAccessibleForFree: true,
  inLanguage: 'en',
  keywords: ['synthetic care journeys', 'FHIR R4', 'healthcare interoperability', 'education'],
};
