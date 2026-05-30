import type { MetadataRoute } from 'next';
import { listSitemapEntries } from '@/lib/supabase';

export const revalidate = 3600;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://fixfind.cc').replace(/\/$/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await listSitemapEntries();

  const articleUrls: MetadataRoute.Sitemap = entries
    .filter((e) => /^[a-z0-9-]+\/[a-z0-9-]+$/.test(e.slug))
    .map((e) => ({
      url: `${SITE_URL}/${e.slug}`,
      lastModified: new Date(e.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    ...articleUrls,
  ];
}
