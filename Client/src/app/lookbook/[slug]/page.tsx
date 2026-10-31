import { LookbookPage } from '@/components/editorial';
import { publicData } from '@/lib/server-api';
import type { Lookbook } from '@/lib/types';
import { notFound } from 'next/navigation';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const story = await publicData<Lookbook>(`lookbooks/${encodeURIComponent((await params).slug)}`);
  return {
    title: `${story?.title || 'The editorial wardrobe'} — Lookbook`,
    description: 'Discover a considered wardrobe through shoppable photographic chapters.',
    openGraph: story ? { images: [story.coverImage] } : undefined,
  };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await publicData<Lookbook>(`lookbooks/${encodeURIComponent(slug)}`);
  if (!story) notFound();
  return <LookbookPage slug={slug} />;
}
