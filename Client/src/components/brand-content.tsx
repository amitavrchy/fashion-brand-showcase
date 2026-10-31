'use client';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Leaf, Ruler, ShieldCheck, PackageCheck } from 'lucide-react';
import type { Catalog } from '@/lib/types';
import { ArrowLink, Photo, Reveal } from './ui';

export function CollectionStories({ catalog }: { catalog?: Catalog }) {
  if (!catalog) return null;
  return (
    <section className="collection-stories section-pad">
      <Reveal className="section-heading">
        <div>
          <p className="eyebrow">A wardrobe with a point of view</p>
          <h2>
            Find your <em>own rhythm.</em>
          </h2>
        </div>
        <ArrowLink href="/collections">Every considered piece</ArrowLink>
      </Reveal>
      <div className="collection-story-grid">
        {catalog.collections.map((collection, index) => (
          <Reveal key={collection.id} delay={(index % 3) * 0.06}>
            <Link className="collection-story-card" href={`/collections/${collection.slug}`}>
              <div className="collection-story-image">
                <Photo
                  src={collection.heroImage}
                  alt={`${collection.title} — explore the complete collection`}
                  sizes="(max-width: 600px) 100vw, 33vw"
                />
                <span className="round-arrow">
                  <ArrowUpRight size={21} />
                </span>
              </div>
              <p className="eyebrow muted">{collection.season}</p>
              <h3>{collection.title}</h3>
              <p>{collection.description}</p>
              <span className="text-link">
                Explore {catalog.products.filter((p) => p.collectionId === collection.id).length}{' '}
                pieces
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
export function MaterialLibrary() {
  return (
    <section className="material-library section-pad">
      <Reveal className="section-heading">
        <div>
          <p className="eyebrow">The material library</p>
          <h2>
            Know what
            <br />
            you <em>wear.</em>
          </h2>
        </div>
        <ArrowLink href="/journal/a-material-connection">From fibre to feeling</ArrowLink>
      </Reveal>
      <div className="material-library-grid">
        {[
          {
            image: 'knit.jpg',
            title: 'The warmth of wool',
            tag: 'Softness / Structure / Warmth',
            body: 'Merino brings a light, breathable warmth. Cashmere adds an exceptional softness. Together, these natural fibres give familiar layers their comforting depth and a beautiful, unhurried drape.',
            link: '/collections?category=Knitwear',
            cta: 'Explore the soft layers',
          },
          {
            image: 'linen.jpg',
            title: 'A lighter kind of ease',
            tag: 'Cotton / Linen / Everyday',
            body: 'Crisp poplin, textured Oxford and the gentle irregularity of linen. We return to these fabrics for their honest feel, their useful versatility and the way they become more familiar with wear.',
            link: '/collections/weekend-notes',
            cta: 'Find your everyday shirt',
          },
          {
            image: 'bag.jpg',
            title: 'Character, with time',
            tag: 'Leather / Patina / Purpose',
            body: 'An object should become part of your life. Supple leather, thoughtful proportions and a quiet finish create accessories that feel useful from the first day and more personal with each one after.',
            link: '/collections/objects-of-affection',
            cta: 'Discover the small details',
          },
        ].map((item) => (
          <Reveal className="material-library-card" key={item.title}>
            <div className="material-library-image">
              <Photo
                src={`/images/${item.image}`}
                alt={item.title}
                sizes="(max-width: 600px) 100vw, 33vw"
              />
            </div>
            <p className="eyebrow muted">{item.tag}</p>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
            <ArrowLink href={item.link}>{item.cta}</ArrowLink>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
export function AtelierVisit() {
  return (
    <section className="atelier-visit">
      <div className="atelier-visit-photo">
        <Photo
          src="/images/architecture.jpg"
          alt="A warm, considered interior with room to slow down"
          sizes="(max-width: 600px) 100vw, 55vw"
        />
      </div>
      <Reveal className="atelier-visit-copy">
        <p className="eyebrow">A place to make time</p>
        <h2>
          Come a little
          <br />
          <em>closer.</em>
        </h2>
        <p>
          Some things are better understood in person. The feel of a fabric. The fall of a sleeve. A
          conversation about the piece you will wear most.
        </p>
        <p>
          Our world stretches from Paris to Copenhagen, with concept spaces in London, Amsterdam,
          Milan and Berlin. Each shares the same invitation: step inside, take your time, and find
          what feels like you.
        </p>
        <ArrowLink href="/stores">Explore our six spaces</ArrowLink>
      </Reveal>
    </section>
  );
}
export function ConsideredQuestions() {
  return (
    <section className="considered-questions section-pad">
      <div>
        <p className="eyebrow">A little guidance</p>
        <h2>
          Thoughtfully
          <br />
          <em>answered.</em>
        </h2>
        <p>The details that make choosing feel easier.</p>
        <div className="service-promises">
          <span>
            <PackageCheck size={19} />
            30-day concept returns
          </span>
          <span>
            <ShieldCheck size={19} />
            Secure Stripe checkout
          </span>
          <span>
            <Leaf size={19} />
            Care, beyond a season
          </span>
          <span>
            <Ruler size={19} />A size guide for every piece
          </span>
        </div>
      </div>
      <div className="accordion">
        {[
          [
            'How do I find the right size?',
            'Begin with your usual size and the measurements in our size guide. Our silhouettes are generally relaxed, with room to move and layer. Product pages include a fabric description and fit notes, and unavailable sizes are clearly marked before you add a piece to your bag.',
          ],
          [
            'Can I save a piece for later?',
            'Select the heart on a product to keep it close. A guest wishlist stays in your browser. Sign in to save your favourites to your account and return to them on another device; your guest selections can move with you when you sign in.',
          ],
          [
            'How does secure payment work?',
            'After you enter your delivery details, we reserve available stock and take you to Stripe’s secure payment page. This storefront uses Stripe test mode, so no real funds are charged. Your order is confirmed only after Stripe verifies that payment succeeded.',
          ],
          [
            'What happens if I change my mind at checkout?',
            'Return from Stripe using its back link to cancel your checkout. Your bag stays available, and reserved stock is released after cancellation is confirmed. An unfinished payment session also expires automatically, so a piece is not held indefinitely.',
          ],
          [
            'What are the delivery and return details?',
            'Our concept delivery is complimentary from €300, with a €15 flat rate below that amount. The illustrative return window is 30 days for unworn pieces with original tags. This is a concept store with test payments; physical fulfilment is not arranged.',
          ],
          [
            'How can I make my pieces last?',
            'Air garments between wears, follow the care label and store soft knits folded. Brush structured wool gently and protect leather from prolonged heat and moisture. Our journal has practical guides to cashmere, rewearing and building a wardrobe over time.',
          ],
        ].map(([question, answer]) => (
          <details key={question}>
            <summary>{question}</summary>
            <div>{answer}</div>
          </details>
        ))}
        <Link href="/client-care" className="text-link">
          Visit client care <ArrowRight size={16} style={{ display: 'inline', marginLeft: 10 }} />
        </Link>
      </div>
    </section>
  );
}
