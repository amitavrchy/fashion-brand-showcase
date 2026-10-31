// Migrate only known original concept images; preserve administrator replacements.
const images = {
  '/images/coat.jpg': '/images/studio-coat.webp',
  '/images/knit.jpg': '/images/studio-knit.webp',
  '/images/dress.jpg': '/images/studio-dress.webp',
  '/images/tailoring.jpg': '/images/studio-tailoring.webp',
  '/images/bag.jpg': '/images/studio-bag.webp',
  '/images/linen.jpg': '/images/studio-linen.webp',
  '/images/shirts.jpg': '/images/studio-linen.webp',
  '/images/leather.jpg': '/images/studio-leather.webp',
  '/images/detail.jpg': '/images/studio-detail.webp',
};
export async function refreshPhotography(db) {
  const originalPhotos = Object.keys(images);
  for (const [before, after] of Object.entries(images)) {
    await db.productMedia.updateMany({
      where: { url: before },
      data: { url: after },
    });
    await db.collection.updateMany({
      where: { heroImage: before },
      data: { heroImage: after },
    });
    await db.lookbook.updateMany({
      where: { coverImage: before },
      data: { coverImage: after },
    });
    await db.lookChapter.updateMany({
      where: { imageUrl: before },
      data: { imageUrl: after },
    });
    // Landscape stories use location photography, rather than squeezing a portrait into a wide slot.
    await db.journalPost.updateMany({
      where: { coverImage: before },
      data: {
        coverImage: before.includes('bag')
          ? '/images/architecture.jpg'
          : before.includes('knit')
            ? '/images/landscape.jpg'
            : '/images/atelier.jpg',
      },
    });
  }
  await db.campaign.updateMany({
    where: {
      image: '/images/campaign-editorial.webp',
      title: 'The quiet\nexpression.',
    },
    data: {
      title: 'The art of\nbeing you.',
      image: '/images/hero-coast.webp',
      mobileImage: '/images/hero-coast-mobile.webp',
    },
  });
  await db.productMedia.updateMany({
    where: { productId: 'p-coat', url: '/images/campaign-editorial.webp' },
    data: {
      url: '/images/studio-coat.webp',
      alt: 'The sculpted camel wool coat, complete front view',
    },
  });
  await db.campaign.updateMany({
    where: { image: { in: ['/images/knit.jpg', '/images/studio-knit.webp'] } },
    data: {
      image: '/images/campaign-editorial.webp',
      mobileImage: '/images/campaign-portrait-optimized.webp',
    },
  });
  await db.campaign.updateMany({
    where: { id: 'campaign-aw', accent: '#5C1F1F' },
    data: { accent: '#242820' },
  });
  await db.campaign.updateMany({
    where: { id: 'campaign-permanent', accent: { in: ['#5C1F1F', '#514339'] } },
    data: { accent: '#FFFDF6' },
  });
  await db.collection.updateMany({
    where: {
      slug: 'autumn-winter',
      heroImage: {
        in: [
          '/images/studio-coat.webp',
          '/images/coat.jpg',
          '/images/campaign-editorial.webp',
        ],
      },
    },
    data: { heroImage: '/images/hero-coast-mobile.webp' },
  });
  await db.collection.updateMany({
    where: { heroImage: '/images/campaign-portrait.webp' },
    data: { heroImage: '/images/hero-coast-mobile.webp' },
  });
  // The complete six-card collection edit needs a distinct cover for every story.
  for (const [slug, original, heroImage] of [
    [
      'city-rituals',
      '/images/hero-coast-mobile.webp',
      '/images/studio-tailoring.webp',
    ],
    [
      'the-soft-edit',
      '/images/studio-knit.webp',
      '/images/studio-cardigan.webp',
    ],
  ]) {
    await db.collection.updateMany({
      where: { slug, heroImage: original },
      data: { heroImage },
    });
  }
  await db.journalPost.updateMany({
    where: {
      coverImage: {
        in: [
          '/images/campaign-portrait.webp',
          '/images/campaign-editorial.webp',
        ],
      },
    },
    data: { coverImage: '/images/architecture.jpg' },
  });
  await db.lookbook.updateMany({
    where: { coverImage: '/images/studio-coat.webp' },
    data: { coverImage: '/images/hero-coast-mobile.webp' },
  });
  await db.lookChapter.updateMany({
    where: { imageUrl: '/images/campaign-portrait.webp' },
    data: { imageUrl: '/images/hero-coast-mobile.webp' },
  });
  await db.lookChapter.updateMany({
    where: { imageUrl: '/images/campaign-editorial.webp' },
    data: { imageUrl: '/images/hero-coast-mobile.webp' },
  });
  const products = {
    coat: 'coat',
    knit: 'knit',
    dress: 'dress',
    trouser: 'tailoring',
    bag: 'bag',
    shirt: 'poplin',
    blazer: 'blazer',
    cardigan: 'cardigan',
    wrap: 'wrap',
    trench: 'trench',
    merino: 'merino',
    rib: 'rib',
    linen: 'linen',
    oxford: 'oxford',
    silk: 'silk',
    daydress: 'daydress',
    wrapdress: 'wrapdress',
    scarf: 'scarf',
    belt: 'belt',
    pouch: 'pouch',
    knitvest: 'knitvest',
    mockneck: 'mockneck',
    tee: 'tee',
    overshirt: 'overshirt',
  };
  const legacy = [
    ...originalPhotos,
    ...Object.values(images),
    '/images/campaign-editorial.webp',
    '/images/campaign-portrait.webp',
  ];
  for (const [key, photograph] of Object.entries(products)) {
    await db.productMedia.updateMany({
      where: { productId: `p-${key}`, sortOrder: 0, url: { in: legacy } },
      data: {
        url: `/images/studio-${photograph}.webp`,
        alt: `Complete front view of the ${key === 'trouser' ? 'tailored trousers' : key}`,
      },
    });
    // Remove unrelated starter garments from product galleries. Admin-added photography is retained.
    await db.productMedia.deleteMany({
      where: {
        productId: `p-${key}`,
        sortOrder: { gt: 0 },
        url: { in: legacy },
      },
    });
  }
  await db.siteSettings.upsert({
    where: { id: 'main' },
    create: { id: 'main' },
    update: {},
  });
}
