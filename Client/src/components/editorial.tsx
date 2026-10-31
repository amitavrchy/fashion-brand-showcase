'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, ArrowRight, ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { api, ApiError, money } from '@/lib/api';
import type { JournalPost, Lookbook, Product, StoreLocation } from '@/lib/types';
import { ArrowLink, EmptyState, ErrorState, Loading, Modal, Photo, Reveal } from './ui';

gsap.registerPlugin(ScrollTrigger, useGSAP);
export function LookbookPage({ slug }: { slug: string }) {
  const query = useQuery({ queryKey: ['lookbook', slug], queryFn: () => api<Lookbook>(`lookbooks/${slug}`) });
  const [selected, setSelected] = useState<Product | null>(null);
  const scope = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (!query.data || !scope.current) return;
    const media = gsap.matchMedia();
    media.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      const section = scope.current?.querySelector('.lookbook-scroll');
      const track = scope.current?.querySelector<HTMLElement>('.lookbook-chapters');
      if (!track || !section) return;
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      gsap.to(track, { x: () => -distance(), ease: 'none', scrollTrigger: { trigger: section, start: 'top 80px', end: () => `+=${distance()}`, pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1 } });
    });
    return () => media.revert();
  }, { scope, dependencies: [query.data], revertOnUpdate: true });
  if (query.isPending) return <Loading label="Opening a new chapter…" />;
  if (query.isError) return query.error instanceof ApiError && query.error.status === 404 ? <EmptyState title="An unwritten chapter." text="This lookbook could not be found. Explore our current story." href="/lookbook/a-study-in-stillness" link="The current lookbook" /> : <ErrorState retry={() => query.refetch()} />;
  return <div ref={scope}><div className="lookbook-heading"><div><p className="eyebrow">The autumn / winter 2026 lookbook</p><h1>A study<br />in <em>stillness.</em></h1></div><p>A collection between structure and softness. Scroll to explore the story; select a point to discover the piece.</p></div><section className="lookbook-scroll" aria-label="Shoppable lookbook chapters"><div className="lookbook-chapters">{query.data.chapters.map(chapter => <article className="look-chapter" key={chapter.id}><div className="look-chapter-image"><Photo src={chapter.imageUrl} alt={chapter.caption} sizes="(max-width: 700px) 100vw, 65vw" />{chapter.hotspots.map(h => <button className="hotspot" key={h.id} style={{ left: `${h.xPct}%`, top: `${h.yPct}%` }} onClick={() => setSelected(h.product)} aria-label={`Shop ${h.product.name}`}><Plus size={20} strokeWidth={1.3} /></button>)}</div><p><span>{chapter.caption}</span><span>Discover the details <ArrowUpRight size={15} style={{ display: 'inline', marginLeft: 8 }} /></span></p></article>)}</div></section><Reveal className="lookbook-outro"><p className="eyebrow">From the story to your everyday</p><h2>Make it <em>your own.</em></h2><ArrowLink href="/collections/autumn-winter">Shop the collection</ArrowLink></Reveal><Modal open={!!selected} onClose={() => setSelected(null)} title="A closer look">{selected && <div className="look-panel"><div className="look-panel-photo"><Photo src={selected.media[0].url} alt={selected.name} sizes="300px" /></div><div><p className="eyebrow">{selected.category}</p><h3>{selected.name}</h3><p>{selected.description}</p><p>{money(selected.price)}</p><Link className="button" href={`/product/${selected.slug}`}>Discover piece <ArrowRight size={17} /></Link></div></div>}</Modal></div>;
}
export function JournalPage() {
  const query = useQuery({ queryKey: ['journal'], queryFn: () => api<JournalPost[]>('journal') });
  const [category, setCategory] = useState('All stories');
  if (query.isPending) return <Loading label="Gathering a few stories…" />;
  if (query.isError) return <ErrorState retry={() => query.refetch()} />;
  const posts = query.data;
  const categories = ['All stories', ...new Set(posts.map(p => p.category))];
  const filtered = posts.filter(p => category === 'All stories' || p.category === category);
  return <><div className="journal-list-heading"><p className="eyebrow">People. Places. Perspectives.</p><h1>The <em>journal.</em></h1><p className="muted">Notes on a considered way of living.</p></div><div className="page-content">{posts[0] && <Link className="journal-feature" href={`/journal/${posts[0].slug}`}><div className="journal-feature-image"><Photo src={posts[0].coverImage} alt={posts[0].title} priority /></div><div className="journal-feature-copy"><p className="eyebrow">The latest conversation</p><h2>{posts[0].title}</h2><p>{posts[0].excerpt}</p><span className="arrow-link">Read the story <ArrowRight size={19} /></span></div></Link>}<div className="journal-filters" role="group" aria-label="Filter journal stories">{categories.map(c => <button key={c} onClick={() => setCategory(c)} className={category === c ? 'selected' : ''} aria-pressed={category === c}>{c}</button>)}</div><div className="journal-grid">{filtered.map((p, i) => <Reveal key={p.id} delay={i * .05}><Link className="journal-card" href={`/journal/${p.slug}`}><div className="journal-image"><Photo src={p.coverImage} alt={p.title} /><span className="round-arrow"><ArrowUpRight size={20} /></span></div><p className="eyebrow muted">{p.category}</p><h3>{p.title}</h3><p className="muted">{p.excerpt}</p></Link></Reveal>)}</div>{!posts.length && <EmptyState title="A story is taking shape." text="Return soon for notes from our world." />}</div></>;
}
export function ArticlePage({ slug }: { slug: string }) {
  const query = useQuery({ queryKey: ['journal', slug], queryFn: () => api<JournalPost>(`journal/${slug}`) });
  if (query.isPending) return <Loading />;
  if (query.isError) return query.error instanceof ApiError && query.error.status === 404 ? <EmptyState title="A story yet to be found." text="Explore the latest notes from our world." href="/journal" link="Return to the journal" /> : <ErrorState retry={() => query.refetch()} />;
  const post = query.data;
  return <article><header className="article-heading"><p className="eyebrow">{post.category}</p><h1>{post.title}</h1><p>{post.excerpt}</p><p className="muted">{new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(post.publishedAt))} · 3 minute read</p></header><div className="article-hero"><Photo src={post.coverImage} alt={post.title} priority sizes="100vw" /></div><div className="article-body">{post.body.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}<ArrowLink href="/journal">More notes from our world</ArrowLink></div></article>;
}
export function StoresPage() {
  const query = useQuery({ queryKey: ['stores'], queryFn: () => api<StoreLocation[]>('stores') });
  const [city, setCity] = useState('All spaces');
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState retry={() => query.refetch()} />;
  const cities = ['All spaces', ...new Set(query.data.map(s => s.city))];
  return <><div className="page-heading"><p className="eyebrow">A place to slow down</p><h1>Our <em>spaces.</em></h1><p>Step inside. Feel the fabrics, find your silhouette, and make a little time for yourself.</p></div><div className="stores-layout"><div className="stores-photo"><Photo src="/images/atelier.jpg" alt="A light-filled space for considered clothing" priority /></div><div><div className="store-filters" role="group" aria-label="Filter stores by city">{cities.map(c => <button key={c} className={city === c ? 'selected' : ''} aria-pressed={city === c} onClick={() => setCity(c)}>{c}</button>)}</div>{query.data.filter(s => city === 'All spaces' || s.city === city).map(s => <article className="store-card" key={s.id}><p className="eyebrow">{s.city}</p><h2>{s.name}</h2><p>{s.address}</p><p className="store-hours">{s.hours}</p><a className="arrow-link" href={`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`} target="_blank" rel="noreferrer">Find your way <ArrowUpRight size={19} /></a></article>)}</div></div></>;
}
