'use client';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Campaign, Catalog, JournalPost } from '@/lib/types';
import imageDimensions from '@/lib/image-dimensions.json';
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
    accent: '#242820',
    active: true,
  },
];
const campaignLandscapes: Record<string, string> = {
  '/images/hero-coast-wide.webp': '/images/hero-coast.webp',
  '/images/campaign-editorial-wide.webp': '/images/campaign-editorial.webp',
};

export function HomePage() {
  const settings = useSiteSettings();
  const catalog = useQuery({ queryKey: ['catalog'], queryFn: () => api<Catalog>('catalog') });
  const journal = useQuery({ queryKey: ['journal'], queryFn: () => api<JournalPost[]>('journal') });
  const [carousel, embla] = useEmblaCarousel({ align: 'start', dragFree: true });
  const [heroRef, hero] = useEmblaCarousel({ loop: true, watchFocus: false });
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
    <div className="home-page">
      <section className="campaign-section" aria-label="Seasonal campaigns">
        <div className="hero-viewport" ref={heroRef}>
          <div className="hero-track">
            {campaigns.map((campaign, index) => {
              const landscape = campaignLandscapes[campaign.image] || campaign.image;
              const panorama =
                landscape === '/images/hero-coast.webp'
                  ? '/images/hero-coast-wide.webp'
                  : landscape === '/images/campaign-editorial.webp'
                    ? '/images/campaign-editorial-wide.webp'
                    : landscape;
              const portrait = campaign.mobileImage || landscape;
              const dimensions = (imageDimensions as Record<string, number[]>)[portrait] || [
                900, 1200,
              ];
              return (
                <div
                  className="hero-slide"
                  key={campaign.id}
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${campaigns.length}`}
                  aria-hidden={slide !== index}
                  inert={slide !== index}
                  style={{ '--campaign-accent': campaign.accent } as React.CSSProperties}
                >
                  <div className="hero-content">
                    <p className="eyebrow">{campaign.subtitle}</p>
                    {index === 0 ? (
                      <h1>
                        {campaign.title.split('\n').map((line, n) => (
                          <span key={line}>{n === 1 ? <em>{line}</em> : line}</span>
                        ))}
                      </h1>
                    ) : (
                      <h2 className="hero-title">
                        {campaign.title.split('\n').map((line, n) => (
                          <span key={line}>{n === 1 ? <em>{line}</em> : line}</span>
                        ))}
                      </h2>
                    )}
                    <p className="hero-description">Considered pieces. A natural ease.</p>
                    <Link className="hero-link" href={campaign.link}>
                      Discover the collection <ArrowUpRight size={18} />
                    </Link>
                    <p className="hero-note">Designed in Paris. Considered everywhere.</p>
                  </div>
                  <div
                    className="hero-photo"
                    style={
                      { '--portrait-ratio': dimensions[0] / dimensions[1] } as React.CSSProperties
                    }
                  >
                    <Photo
                      src={panorama}
                      tabletSrc={landscape}
                      mobileSrc={campaign.mobileImage || undefined}
                      alt="A complete silhouette from the Atelier Lune seasonal campaign"
                      priority={index === 0}
                      sizes="100vw"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="hero-bottom">
          <a href="#new-season">
            Explore the season <ArrowDown size={16} />
          </a>
          <span className="hero-edition">The considered wardrobe / 2026</span>
          <div className="hero-pagination" aria-label="Campaign navigation">
            {campaigns.map((campaign, index) => (
              <button
                key={campaign.id}
                className={slide === index ? 'selected' : ''}
                onClick={() => hero?.scrollTo(index)}
                aria-label={`View campaign ${String(index + 1).padStart(2, '0')}`}
                aria-pressed={slide === index}
              >
                {String(index + 1).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="wardrobe-intro section-pad">
        <Reveal>
          <p className="eyebrow">The Atelier Lune point of view</p>
          <h2>{settings.homeTitle}</h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p>{settings.homeDescription}</p>
          <ArrowLink href="/about">Our philosophy</ArrowLink>
        </Reveal>
      </section>

      <section id="new-season" className="featured-section section-pad">
        <Reveal className="section-heading">
          <div>
            <p className="eyebrow">Selected for the season</p>
            <h2>
              The new <em>essentials.</em>
            </h2>
          </div>
          <ArrowLink href="/collections">Shop all pieces</ArrowLink>
        </Reveal>
        {catalog.isError ? (
          <ErrorState retry={() => catalog.refetch()} />
        ) : (
          <>
            <div className="product-carousel" ref={carousel}>
              <div className="product-track">
                {catalog.data
                  ? catalog.data.products.slice(0, 6).map((product, index) => (
                      <div className="product-slide" key={product.id}>
                        <ProductCard product={product} index={index} />
                      </div>
                    ))
                  : [0, 1, 2, 3].map((index) => (
                      <div className="product-slide skeleton-card" key={index}>
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
                  <ArrowLeft size={18} />
                </button>
                <button
                  className="icon-button"
                  onClick={() => embla?.scrollNext()}
                  aria-label="Next pieces"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <CollectionStories catalog={catalog.data} />

      <section className="lookbook-teaser section-pad">
        <Reveal className="editorial-section-heading">
          <div>
            <p className="eyebrow">The autumn / winter lookbook</p>
            <h2>
              A study in <em>stillness.</em>
            </h2>
          </div>
          <p>
            The seasonal wardrobe, seen differently. Between structure, softness and everyday life.
          </p>
        </Reveal>
        <Reveal className="lookbook-feature">
          <div className="lookbook-figure">
            <div className="lookbook-image">
              <Photo
                src="/images/campaign-editorial.webp"
                alt="A complete camel coat silhouette beside warm limestone architecture"
                sizes="(max-width: 800px) 90vw, 57vw"
              />
            </div>
            <p className="editorial-photo-caption">
              The autumn / winter story <span>2026</span>
            </p>
          </div>
          <div className="lookbook-copy">
            <p className="eyebrow">Five chapters. One point of view.</p>
            <h3>
              A quieter kind
              <br />
              of <em>statement.</em>
            </h3>
            <p>
              Sculptural coats, fluid tailoring and layers with a natural ease. A collection that
              leaves room for the person wearing it.
            </p>
            <p>
              Explore the photographs. Discover the details. Find the pieces that become your own.
            </p>
            <ArrowLink href="/lookbook/a-study-in-stillness">Explore the lookbook</ArrowLink>
          </div>
        </Reveal>
      </section>

      <section className="materials-section section-pad">
        <Reveal className="editorial-section-heading">
          <div>
            <p className="eyebrow">Materials with meaning</p>
            <h2>
              Good things take <em>care.</em>
            </h2>
          </div>
          <p>
            It begins with how a fabric feels. Natural textures, thoughtful construction and
            character that grows with time.
          </p>
        </Reveal>
        <div className="materials-layout">
          <Reveal className="materials-figure">
            <div className="materials-photo">
              <Photo
                src="/images/home-material-study.webp"
                alt="Complete folded stack of cashmere, wool and silk with an olive twig and wooden spool"
                sizes="(max-width: 800px) 90vw, 51vw"
              />
            </div>
            <p className="editorial-photo-caption">Natural fibres. Lasting character.</p>
          </Reveal>
          <Reveal className="materials-copy" delay={0.08}>
            <div className="material-detail-list">
              {[
                {
                  title: 'Wool & cashmere',
                  body: 'Gentle warmth, beautiful drape. Soft layers to return to, season after season.',
                  href: '/collections?category=Knitwear',
                },
                {
                  title: 'Cotton & linen',
                  body: 'Honest textures and a lighter touch. Everyday pieces with room to breathe.',
                  href: '/collections/weekend-notes',
                },
                {
                  title: 'Considered leather',
                  body: 'Useful shapes, quiet details. Objects that become more personal with time.',
                  href: '/collections/objects-of-affection',
                },
              ].map((material, index) => (
                <Link className="material-detail" key={material.title} href={material.href}>
                  <span className="material-index">0{index + 1}</span>
                  <div>
                    <h3>{material.title}</h3>
                    <p>{material.body}</p>
                  </div>
                  <ArrowUpRight size={20} />
                </Link>
              ))}
            </div>
            <ArrowLink href="/about#our-commitments">Our approach to care</ArrowLink>
          </Reveal>
        </div>
      </section>

      <section className="journal-section section-pad">
        <Reveal className="section-heading">
          <div>
            <p className="eyebrow">Stories, ideas and everyday rituals</p>
            <h2>
              From the <em>journal.</em>
            </h2>
          </div>
          <ArrowLink href="/journal">All stories</ArrowLink>
        </Reveal>
        <div
          className="journal-grid"
          role="region"
          aria-label="Featured journal stories"
          tabIndex={0}
        >
          {journal.data?.slice(0, 3).map((post, index) => (
            <Reveal key={post.id} delay={index * 0.06}>
              <Link className="journal-card" href={`/journal/${post.slug}`}>
                <div className="journal-image">
                  <Photo
                    src={
                      ['/images/atelier.jpg', '/images/architecture.jpg'].includes(post.coverImage)
                        ? [
                            '/images/home-material-study.webp',
                            '/images/atelier.jpg',
                            '/images/studio.jpg',
                          ][index]
                        : post.coverImage
                    }
                    alt={post.title}
                    sizes="(max-width: 600px) 75vw, 33vw"
                  />
                  <span className="round-arrow">
                    <ArrowUpRight size={18} />
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
    </div>
  );
}
