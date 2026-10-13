import type { MetadataRoute } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export const revalidate = 86400; // Cache 24 jam untuk sitemap

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://jasdor.cimagroup.my.id';
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  try {
    const supabase = getSupabaseServerClient();
    const { data: outlets, error } = await supabase
      .from('outlets')
      .select('code, updated_at')
      .eq('is_in_scope', true)
      .order('id', { ascending: true })
      .limit(2000);

    if (error || !outlets) {
      return staticEntries;
    }

    const outletEntries: MetadataRoute.Sitemap = outlets.map((o) => ({
      url: `${baseUrl}/outlet/${encodeURIComponent(o.code)}`,
      lastModified: o.updated_at ? new Date(o.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticEntries, ...outletEntries];
  } catch {
    return staticEntries;
  }
}
