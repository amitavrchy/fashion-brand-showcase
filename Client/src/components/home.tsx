'use client';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Campaign, Catalog, JournalPost } from '@/lib/types';
import { ProductCard } from './product-card';
import { useSiteSettings } from '@/lib/site-settings';
import { ArrowLink, ErrorState, Photo, Reveal } from './ui';
import { CollectionStories, AtelierVisit, ConsideredQuestions } from './brand-content';

const fallback: Campaign[] = [
  {
    id: 'intro',
    title: 'The art of\nbeing you.',
    subtitle: 'AUTUMN / WINTER 2026',
    image: '/images/hero-coast.webp',
    mobileImage: '/images/hero-coast-mobile.webp',
    link: '/collections/autumn-winter',
    accent: '#242820',
    active: true,
  },
  {
    id: 'essentials',
    title: 'Less, but\nbetter.',
    subtitle: 'THE PERMANENT COLLECTION',
    image: '/images/campaign-editorial.webp',
    mobileImage: '/images/campaign-portrait-optimized.webp',
    link: '/collections/the-permanent-collection',
    accent: '#FFFDF6',
    active: true,
  },
];
export function HomePage() {
  const settings = useSiteSettings();
  const catalog = useQuery({ queryKey: ['catalog'], queryFn: () => api<Catalog>('catalog') });
  const journal = useQuery({ queryKey: ['journal'], queryFn: () => api<JournalPost[]>('journal') });
  const [carousel, embla] = useEmblaCarousel({ align: 'start', dragFree: true });
  const [heroRef, hero] = useEmblaCarousel({ loop: true });
  const [slide, setSlide] = useState(0);
  const onSelect = useCallback(() => {
    if (hero) setSlide(hero.selectedScrollSnap());
  }, [hero]);
  useEffect(() => {
    if (!hero) return;
    hero.on('select', onSelect);
    return () => {
      hero.off('select', onSelect);
    };
  }, [hero, onSelect]);
  const campaigns = catalog.data?.campaigns.length ? catalog.data.campaigns : fallback;
  return (
    <>
      <section
        className="campaign-section"
        aria-label="Seasonal campaigns"
        style={{ '--campaign-ink': campaigns[slide]?.accent || '#242820' } as React.CSSProperties}
      >
        <div className="hero-viewport" ref={heroRef}>
          <div className="hero-track">
            {campaigns.map((c, i) => (
              <div
                className="hero-slide"
                key={c.id}
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${campaigns.length}`}
                style={{ color: c.accent }}
              >
                <div className="hero-photo">
                  <Photo
                    src={c.image}
                    mobileSrc={c.mobileImage || undefined}
                    alt="An exploration of form, movement and contemporary style"
                    priority={i === 0}
                    sizes="100vw"
                  />
                </div>
                <div className="hero-shade" />
                <div className="hero-content">
                  <p className="eyebrow">{c.subtitle}</p>
                  {i === 0 ? (
                    <h1>
                      {c.title.split('\n').map((line, n) => (
                        <span key={line}>{n === 1 ? <em>{line}</em> : line}</span>
                      ))}
                    </h1>
                  ) : (
                    <h2 className="hero-title">
                      {c.title.split('\n').map((line, n) => (
                        <span key={line}>{n === 1 ? <em>{line}</em> : line}</span>
                      ))}
                    </h2>
                  )}
                  <p>Considered pieces. An extraordinary everyday.</p>
                  <Link className="hero-link" href={c.link}>
                    Discover the collection <ArrowUpRight size={20} strokeWidth={1.4} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-bottom">
          <span>The new collection · Paris / Copenhagen</span>
          <a href="#new-season" aria-label="Scroll to new season pieces">
            <ArrowDown size={20} strokeWidth={1.3} />
          </a>
          <div className="hero-pagination">
            {campaigns.map((c, i) => (
              <button
                key={c.id}
                className={slide === i ? 'selected' : ''}
                onClick={() => hero?.scrollTo(i)}
                aria-label={`View campaign ${String(i + 1).padStart(2, '0')}`}
                aria-pressed={slide === i}
              >
                {String(i + 1).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="wardrobe-intro section-pad">
        <Reveal>
          <p className="eyebrow">Atelier Lune / A considered point of view</p>
          <h2>{settings.homeTitle}</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p>{settings.homeDescription}</p>
          <ArrowLink href="/about">Our philosophy</ArrowLink>
        </Reveal>
      </section>
      <CollectionStories catalog={catalog.data} />
      <section id="new-season" className="featured-section section-pad">
        <Reveal className="section-heading">
          <div>
            <p className="eyebrow">Considered for the season</p>
            <h2>
              The new <em>essentials.</em>
            </h2>
          </div>
          <ArrowLink href="/collections">Explore all pieces</ArrowLink>
        </Reveal>
        {catalog.isError ? (
          <ErrorState retry={() => catalog.refetch()} />
        ) : (
          <>
            <div className="product-carousel" ref={carousel}>
              <div className="product-track">
                {catalog.data
                  ? catalog.data.products.slice(0, 6).map((p, i) => (
                      <div className="product-slide" key={p.id}>
                        <ProductCard product={p} index={i} />
                      </div>
                    ))
                  : [0, 1, 2, 3].map((i) => (
                      <div className="product-slide skeleton-card" key={i}>
                        <div />
                        <span />
                      </div>
                    ))}
              </div>
            </div>
            <div className="carousel-bottom">
              <p className="muted">Made to be worn. Made to be kept.</p>
              <div className="carousel-controls">
                <button
                  className="icon-button"
                  onClick={() => embla?.scrollPrev()}
                  aria-label="Previous pieces"
                >
                  <ArrowLeft size={21} strokeWidth={1.3} />
                </button>
                <button
                  className="icon-button"
                  onClick={() => embla?.scrollNext()}
                  aria-label="Next pieces"
                >
                  <ArrowRight size={21} strokeWidth={1.3} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      <section className="lookbook-teaser">
        <div className="lookbook-image">
          <Photo
            src="/images/hero-coast-mobile.webp"
            alt="An expressive silhouette from the new collection"
            sizes="(max-width: 700px) 100vw, 60vw"
          />
          <span className="image-caption">A / W — 26</span>
        </div>
        <div className="lookbook-copy">
          <Reveal>
            <p className="eyebrow">The autumn / winter story</p>
            <h2>
              A study
              <br />
              in <em>stillness.</em>
            </h2>
            <p>
              Between the city and the quiet.
              <br />
              Between structure and softness.
              <br />A collection that finds its own rhythm.
            </p>
            <ArrowLink href="/lookbook/a-study-in-stillness">Explore the lookbook</ArrowLink>
          </Reveal>
          <span className="lookbook-number" aria-hidden>
            01 — 03
          </span>
        </div>
      </section>
      <section className="materials-section section-pad">
        <Reveal className="materials-copy">
          <p className="eyebrow">Fewer things. Better things.</p>
          <h2>
            Good things
            <br />
            take <em>care.</em>
          </h2>
          <p>
            Care in the choosing. Care in the making. Care in how we wear them. From natural fibres
            to long-standing relationships with our makers, every decision begins with intention.
          </p>
          <ArrowLink href="/about#our-commitments">Our approach to responsibility</ArrowLink>
          <div className="material-tags">
            <span>Natural materials</span>
            <span>Thoughtful production</span>
            <span>Enduring design</span>
          </div>
        </Reveal>
        <Reveal className="materials-photo">
          <Photo src="/images/studio-knit.webp" alt="The texture and warmth of a natural knit" />
          <span>It starts with a feeling.</span>
        </Reveal>
      </section>
      <section className="journal-section section-pad">
        <Reveal className="section-heading">
          <div>
            <p className="eyebrow">Notes from our world</p>
            <h2>
              The <em>journal.</em>
            </h2>
          </div>
          <ArrowLink href="/journal">Read all stories</ArrowLink>
        </Reveal>
        <div className="journal-grid">
          {journal.data?.slice(0, 3).map((post, i) => (
            <Reveal key={post.id} delay={i * 0.08}>
              <Link className="journal-card" href={`/journal/${post.slug}`}>
                <div className="journal-image">
                  <Photo
                    src={post.coverImage}
                    alt={post.title}
                    sizes="(max-width: 700px) 100vw, 33vw"
                  />
                  <span className="round-arrow">
                    <ArrowUpRight size={21} />
                  </span>
                </div>
                <p className="eyebrow muted">{post.category}</p>
                <h3>{post.title}</h3>
                <p className="muted">{post.excerpt}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      <AtelierVisit />
      <ConsideredQuestions />
    </>
  );
}
