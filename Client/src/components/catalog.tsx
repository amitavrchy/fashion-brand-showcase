'use client';
import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Catalog } from '@/lib/types';
import { ProductCard } from './product-card';
import { EmptyState, ErrorState, Loading } from './ui';

export function CatalogPage({ slug }: { slug?: string }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const query = useQuery({ queryKey: ['catalog'], queryFn: () => api<Catalog>('catalog') });
  const category = params.get('category') || '';
  const color = params.get('color') || '';
  const size = params.get('size') || '';
  const search = params.get('q') || '';
  const sort = params.get('sort') || 'featured';
  const collection = query.data?.collections.find(c => c.slug === slug);
  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    router.replace(`${path}${next.size ? `?${next}` : ''}`, { scroll: false });
  }
  if (query.isPending) return <Loading label="Opening the wardrobe…" />;
  if (query.isError) return <ErrorState retry={() => query.refetch()} />;
  if (slug && !collection) return <EmptyState title="A collection yet to be found." text="This collection may have moved. Discover our current pieces." />;
  const all = query.data.products.filter(p => !slug || p.collection?.slug === slug);
  const categories = [...new Set(all.map(p => p.category))];
  const colors = [...new Set(all.flatMap(p => p.variants.map(v => v.colorName)))];
  const sizes = [...new Set(all.flatMap(p => p.variants.map(v => v.size)))];
  const products = all.filter(p => (!category || p.category === category) && (!search || `${p.name} ${p.category} ${p.fabric}`.toLowerCase().includes(search.toLowerCase())) && ((!color && !size) || p.variants.some(v => (!color || v.colorName === color) && (!size || v.size === size) && v.stock > 0)));
  if (sort === 'price-low') products.sort((a, b) => Number(a.price) - Number(b.price));
  if (sort === 'price-high') products.sort((a, b) => Number(b.price) - Number(a.price));
  if (sort === 'name') products.sort((a, b) => a.name.localeCompare(b.name));
  const pageCount = Math.max(1, Math.ceil(products.length / 12));
  const page = Math.min(pageCount, Math.max(1, Number(params.get('page')) || 1));
  const active = [['category', category], ['color', color], ['size', size], ['q', search]].filter(([, v]) => v);
  return <><div className="page-heading"><p className="eyebrow">{collection?.season || 'The considered wardrobe'}</p><h1>{collection?.title || 'Pieces to live in.'}</h1><p>{collection?.description || 'A quiet confidence. A natural ease. Discover clothing and objects designed to feel like you.'}</p></div><nav className="collection-tabs" aria-label="Collections"><Link href="/collections" className={!slug ? 'selected' : ''}>All pieces</Link>{query.data.collections.map(c => <Link href={`/collections/${c.slug}`} key={c.id} className={slug === c.slug ? 'selected' : ''}>{c.title}</Link>)}</nav><div className="page-content"><div className="catalog-toolbar"><div><button className="filter-toggle" onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen} aria-controls="catalog-filters"><SlidersHorizontal size={17} strokeWidth={1.4} /> Filters {active.length > 0 && `(${active.length})`}<ChevronDown size={15} style={{ transform: filtersOpen ? 'rotate(180deg)' : undefined }} /></button><span className="muted" aria-live="polite">{products.length} pieces</span></div><label><span className="sr-only">Sort pieces</span><select value={sort} onChange={e => update('sort', e.target.value)}><option value="featured">Sort: Featured</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option><option value="name">Name: A–Z</option></select></label></div>{filtersOpen && <div id="catalog-filters" className="filter-panel"><label htmlFor="filter-category">Category<select id="filter-category" value={category} onChange={e => update('category', e.target.value)}><option value="">All categories</option>{categories.map(c => <option key={c}>{c}</option>)}</select></label><label htmlFor="filter-color">Color<select id="filter-color" value={color} onChange={e => update('color', e.target.value)}><option value="">All colors</option>{colors.map(c => <option key={c}>{c}</option>)}</select></label><label htmlFor="filter-size">Available size<select id="filter-size" value={size} onChange={e => update('size', e.target.value)}><option value="">All sizes</option>{sizes.map(s => <option key={s}>{s}</option>)}</select></label><button className="text-link" onClick={() => router.replace(path, { scroll: false })}>Clear all filters</button></div>}{active.length > 0 && <div className="active-filters">{active.map(([key, value]) => <button className="filter-chip" key={key} onClick={() => update(key, '')}>{key === 'q' ? `Search: ${value}` : value}<X size={14} aria-label={`Remove ${key} filter`} /></button>)}</div>}{products.length ? <><div className="catalog-grid">{products.slice((page - 1) * 12, page * 12).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div><div className="catalog-pagination"><button className="icon-button" disabled={page <= 1} onClick={() => update('page', String(page - 1))} aria-label="Previous page"><ArrowLeft size={19} /></button><span>Page {page} of {pageCount}</span><button className="icon-button" disabled={page >= pageCount} onClick={() => update('page', String(page + 1))} aria-label="Next page"><ArrowRight size={19} /></button></div></> : <EmptyState title="A different perspective?" text="No pieces match these filters. Try a different color, category, or size." href={path} link="View all pieces" />}</div></>;
}
