import { ArticlePage } from '@/components/editorial';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { return { title: (await params).slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') }; }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) { return <ArticlePage slug={(await params).slug} />; }
