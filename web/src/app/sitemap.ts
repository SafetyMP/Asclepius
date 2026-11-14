import type { MetadataRoute } from 'next';
import { publicRoutes, siteUrl } from '@/lib/site-metadata';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((path) => ({ url: new URL(path, siteUrl).href }));
}
