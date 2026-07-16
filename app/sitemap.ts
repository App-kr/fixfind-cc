import type { MetadataRoute } from 'next';
import { listSitemapEntries } from '@/lib/supabase';

export const revalidate = 3600;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://fixfind.cc').replace(/\/$/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await listSitemapEntries();

  const valid = entries.filter((e) => /^[a-z0-9-]+\/[a-z0-9-]+$/.test(e.slug));

  const articleUrls: MetadataRoute.Sitemap = valid.map((e) => ({
    url: `${SITE_URL}/${e.slug}`,
    lastModified: new Date(e.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 브랜드 허브 페이지 (/irobot, /roborock ...) — slug prefix 유니크
  const brandMap = new Map<string, string>();
  for (const e of valid) {
    const seg = e.slug.split('/')[0];
    if (!brandMap.has(seg) || e.updated_at > brandMap.get(seg)!) {
      brandMap.set(seg, e.updated_at);
    }
  }
  const brandUrls: MetadataRoute.Sitemap = [...brandMap.entries()].map(([seg, updated]) => ({
    url: `${SITE_URL}/${seg}`,
    lastModified: new Date(updated),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    ...brandUrls,
    ...articleUrls,
  ];
}
