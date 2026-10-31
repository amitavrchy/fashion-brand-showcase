import { ArrowLink, Photo, Reveal } from '@/components/ui';
export const metadata = {
  title: 'Our world',
  description:
    'Our philosophy: fewer things, better things. Discover the story, materials and people behind Atelier Lune.',
};
export default function Page() {
  return (
    <>
      <section className="story-hero">
        <Photo
          src="/images/landscape.jpg"
          alt="A quiet landscape, an open perspective"
          priority
          sizes="100vw"
        />
        <div>
          <p className="eyebrow">The world of Atelier Lune</p>
          <h1>
            A quieter way
            <br />
            to <em>stand out.</em>
          </h1>
        </div>
      </section>
      <Reveal className="story-intro">
        <p className="eyebrow">Clothing as quiet architecture</p>
        <h2>
          Beautiful in its simplicity.
          <br />
          <em>Extraordinary in its details.</em>
        </h2>
        <p>
          Atelier Lune began with a simple question: what if getting dressed felt less like a
          decision, and more like coming home?
        </p>
        <p>
          We design for that feeling. For the coat you reach for without thinking. The knit that
          travels everywhere. The silhouette that lets you be entirely yourself. Contemporary
          clothing, made with intention, to become part of your life.
        </p>
      </Reveal>
      <section className="story-values section-pad" id="our-commitments">
        {[
          {
            n: '01',
            title: 'Material matters.',
            body: 'We begin with natural fibres: wool with warmth and structure, cotton with a crisp honesty, cashmere with an exceptional softness. Our ambition is to source every material with clarity and care.',
          },
          {
            n: '02',
            title: 'People, always.',
            body: 'We value long relationships over short lead times. Working closely with specialist makers allows us to understand each step, ask better questions, and keep improving the way our clothes are made.',
          },
          {
            n: '03',
            title: 'Beyond a season.',
            body: 'A considered wardrobe is built slowly. We return to familiar forms, refining the fit and the feeling. Our pieces are designed to work together, to be cared for, and to stay in your life.',
          },
        ].map((v) => (
          <Reveal key={v.n}>
            <p className="eyebrow">{v.n} / Our commitments</p>
            <h3>{v.title}</h3>
            <p>{v.body}</p>
          </Reveal>
        ))}
      </section>
      <section className="story-timeline section-pad">
        <div className="timeline-heading">
          <p className="eyebrow">A story, slowly unfolding</p>
          <h2>
            Made of <em>moments.</em>
          </h2>
        </div>
        {[
          {
            year: '2021',
            title: 'A beginning in Paris',
            body: 'A small studio, a handful of sketches, and the belief that a wardrobe could be both thoughtful and effortless.',
          },
          {
            year: '2023',
            title: 'The permanent collection',
            body: 'Our first seasonless wardrobe takes shape. Familiar pieces, considered proportions, and a commitment to making fewer things well.',
          },
          {
            year: '2025',
            title: 'A new perspective',
            body: 'Copenhagen joins the conversation. A meeting of Parisian sensibility and the clarity of Scandinavian design.',
          },
          {
            year: '2026',
            title: 'Still becoming',
            body: 'A study in stillness. Our latest collection explores the space between structure and softness, and the beauty of finding your own rhythm.',
          },
        ].map((item) => (
          <Reveal key={item.year} className="timeline-item">
            <span>{item.year}</span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          </Reveal>
        ))}
      </section>
      <div className="lookbook-outro">
        <p className="eyebrow">Begin with something meaningful</p>
        <h2>
          Find your <em>everyday.</em>
        </h2>
        <ArrowLink href="/collections">Explore the collection</ArrowLink>
      </div>
    </>
  );
}
