import { ProductPage } from '@/components/product-detail';
import type { Product } from '@/lib/types';
import { publicData } from '@/lib/server-api';
import { notFound } from 'next/navigation';
const getProduct = (slug: string) => publicData<Product>(`products/${encodeURIComponent(slug)}`);
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const product = await getProduct(slug);
  if (!product) notFound();
  return { title: product?.name || 'A considered piece', description: product?.description, openGraph: product ? { title: product.name, description: product.description, images: [{ url: product.media[0]?.url || '/images/coat.jpg' }] } : undefined };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const product = await getProduct(slug);
  if (!product) notFound();
  const jsonLd = product ? { '@context': 'https://schema.org', '@type': 'Product', name: product.name, description: product.description, image: product.media.map(m => m.url), brand: { '@type': 'Brand', name: 'ATELIER LUNE' }, offers: { '@type': 'Offer', priceCurrency: 'EUR', price: product.price, availability: `https://schema.org/${product.variants.some(v => v.stock > 0) ? 'InStock' : 'OutOfStock'}` } } : null;
  return <>{jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />}<ProductPage slug={slug} initialProduct={product} /></>;
}
