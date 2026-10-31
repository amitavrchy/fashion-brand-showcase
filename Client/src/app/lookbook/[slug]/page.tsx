import { LookbookPage } from '@/components/editorial';
export const metadata = {
  title: 'A study in stillness — Lookbook',
  description:
    'Explore the Autumn / Winter 2026 story. Shop the look through an interactive editorial journey.',
  openGraph: { images: ['/images/coat.jpg'] },
};
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <LookbookPage slug={(await params).slug} />;
}
