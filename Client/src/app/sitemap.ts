import type { MetadataRoute } from 'next';
import type { Catalog, JournalPost } from '@/lib/types';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const paths = [
    '',
    '/collections',
    '/about',
    '/journal',
    '/stores',
    '/client-care',
    '/lookbook/a-study-in-stillness',
  ];
  try {
    const api = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
    const [catalogResponse, journalResponse] = await Promise.all([
      fetch(`${api}/catalog`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(3000) }),
      fetch(`${api}/journal`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(3000) }),
    ]);
    if (catalogResponse.ok) {
      const catalog: Catalog = await catalogResponse.json();
      paths.push(
        ...catalog.products.map((p) => `/product/${p.slug}`),
        ...catalog.collections.map((c) => `/collections/${c.slug}`),
      );
    }
    if (journalResponse.ok) {
      const posts: JournalPost[] = await journalResponse.json();
      paths.push(...posts.map((p) => `/journal/${p.slug}`));
    }
  } catch {
    /* The base sitemap remains available during an API outage. */
  }
  return paths.map((p) => ({
    url: `${base}${p}`,
    changeFrequency: p ? 'weekly' : 'daily',
    priority: p ? 0.7 : 1,
  }));
}
