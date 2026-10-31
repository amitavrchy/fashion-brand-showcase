import { ArticlePage } from '@/components/editorial';
import { publicData } from '@/lib/server-api';
import type { JournalPost } from '@/lib/types';
import { notFound } from 'next/navigation';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const post = await publicData<JournalPost>(`journal/${encodeURIComponent((await params).slug)}`);
  return {
    title: post?.title || 'The journal',
    description: post?.excerpt,
    openGraph: post
      ? { type: 'article', images: [post.coverImage], publishedTime: post.publishedAt }
      : undefined,
  };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await publicData<JournalPost>(`journal/${encodeURIComponent(slug)}`);
  if (!post) notFound();
  return <ArticlePage slug={slug} initialPost={post} />;
}
