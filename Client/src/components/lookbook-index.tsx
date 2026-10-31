'use client';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Photo, Loading, ErrorState, Reveal } from './ui';
type Story = {
  id: string;
  slug: string;
  title: string;
  coverImage: string;
  _count: { chapters: number };
};
const notes: Record<string, string> = {
  'a-study-in-stillness':
    'Between structure and softness. An autumn wardrobe in five quiet chapters.',
  'the-soft-hours':
    'Fine layers, open collars and a gentler kind of warmth. Ease, from the first hour to the last.',
  'a-city-in-motion':
    'A coat for the morning departure, a shirt for the long afternoon, and everything you keep close.',
};
export function LookbookIndex() {
  const query = useQuery({ queryKey: ['lookbooks'], queryFn: () => api<Story[]>('lookbooks') });
  if (query.isPending) return <Loading label="Gathering the stories…" />;
  if (query.isError) return <ErrorState retry={() => query.refetch()} />;
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">The editorial wardrobe</p>
        <h1>
          Everyday, <em>reimagined.</em>
        </h1>
        <p>
          Three perspectives. Thirteen chapters. A quieter way to discover the pieces that feel like
          you.
        </p>
      </div>
      <div className="page-content">
        <div className="lookbook-index-grid">
          {query.data.map((story, i) => (
            <Reveal key={story.id} delay={i * 0.06}>
              <Link className="lookbook-index-card" href={`/lookbook/${story.slug}`}>
                <div className="lookbook-index-image">
                  <Photo
                    src={story.coverImage}
                    alt={story.title}
                    sizes="(max-width: 600px) 100vw, 33vw"
                  />
                  <span className="round-arrow">
                    <ArrowUpRight size={21} />
                  </span>
                </div>
                <p className="eyebrow muted">
                  Story {String(i + 1).padStart(2, '0')} / {story._count.chapters} chapters
                </p>
                <h2>{story.title}</h2>
                <p>{notes[story.slug] || 'A new perspective on the considered wardrobe.'}</p>
                <span className="text-link">Explore and shop the story</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </>
  );
}
