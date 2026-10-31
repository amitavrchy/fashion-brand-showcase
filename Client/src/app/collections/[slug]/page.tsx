import { Suspense } from 'react';
import { CatalogPage } from '@/components/catalog';
import { Loading } from '@/components/ui';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return { title: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }; }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <Suspense fallback={<Loading />}><CatalogPage slug={slug} /></Suspense>; }
