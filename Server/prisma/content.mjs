const image = (name) => `/images/${name}`;
const colors = {
  oat: ['Oat', '#D2C8B7'],
  ink: ['Ink', '#262625'],
  sand: ['Sand', '#C7B79E'],
  espresso: ['Espresso', '#514339'],
  chalk: ['Chalk', '#E9E4D9'],
  blue: ['Blue', '#72889A'],
};
const additions = [
  {
    id: 'col-soft',
    slug: 'the-soft-edit',
    title: 'The soft edit',
    season: 'Layers, considered',
    heroImage: image('knit.jpg'),
    description:
      'A comforting vocabulary of merino, cashmere and generous proportions. Discover fine layers for cool mornings, warm rooms and the quiet moments between.',
  },
  {
    id: 'col-city',
    slug: 'city-rituals',
    title: 'City rituals',
    season: 'Everyday architecture',
    heroImage: image('campaign-portrait.webp'),
    description:
      'From the first coffee to the last train home. Precise outerwear, fluid shirts and easy tailoring that move with the rhythm of the city.',
  },
  {
    id: 'col-weekend',
    slug: 'weekend-notes',
    title: 'Weekend notes',
    season: 'An open itinerary',
    heroImage: image('linen.jpg'),
    description:
      'A slower morning, a lighter suitcase, a different kind of day. Discover breathable cotton, relaxed linen and soft silhouettes with room to move.',
  },
];
const pieces = [
  [
    'p-wrap',
    'the-wrap-coat',
    'The wrap coat',
    'Outerwear',
    395,
    'col-city',
    'campaign-portrait.webp',
    'Double-faced wool with a touch of cashmere',
    'A generous wrap silhouette that draws softly around the body. An unstructured shoulder, deep pockets and a removable belt let you change the shape with a single gesture. Wear it open over a fine knit on the way to work, or gathered close for a slower walk home. The quiet finish keeps the focus on the fall of the cloth.',
    ['sand', 'ink'],
  ],
  [
    'p-trench',
    'the-longline-trench',
    'The longline trench',
    'Outerwear',
    425,
    'col-city',
    'campaign-portrait.webp',
    'Dense cotton twill with a smooth cupro lining',
    'A familiar form, thoughtfully reconsidered. This longline coat has a relaxed shoulder, a generous sleeve and enough room for the layers underneath. A clean front and softly defined waist make it easy to wear from early autumn through the first mild days of spring. Leave the collar open and the belt loosely knotted for an effortless finish.',
    ['sand', 'espresso'],
  ],
  [
    'p-merino',
    'the-merino-turtleneck',
    'The merino turtleneck',
    'Knitwear',
    195,
    'col-soft',
    'knit.jpg',
    '100% fine merino wool',
    'A light, warming layer with a soft roll neck and a clean, close-to-the-body line. Fine merino brings warmth without weight, making this a natural companion to tailoring and generous outerwear. The cuffs and hem are quietly ribbed, and the shoulder sits neatly beneath a blazer. Choose your usual size for layering, or go up one size for a little more ease.',
    ['oat', 'ink'],
  ],
  [
    'p-rib',
    'the-ribbed-tank',
    'The ribbed tank',
    'Essentials',
    95,
    'col-essentials',
    'detail.jpg',
    'Organic cotton rib with a little stretch',
    'The first layer you will reach for again and again. A balanced neckline, substantial rib and a softly fitted shape make this tank equally considered on its own or beneath an open shirt. The longer body stays neatly tucked without feeling restrictive. Wear it with relaxed trousers, a leather belt and nothing more than the confidence of a beautifully simple piece.',
    ['chalk', 'ink'],
  ],
  [
    'p-linen',
    'the-linen-shirt',
    'The linen shirt',
    'Essentials',
    185,
    'col-weekend',
    'linen.jpg',
    '100% European linen',
    'An easy shirt with the lightness of a day without plans. The naturally textured linen falls away from the body, while a considered collar and softly curved hem keep the shape composed. Roll the cuffs, wear it open over a tank, or tuck the front into a favourite trouser. The cloth will soften and develop its own gentle character with every wear.',
    ['chalk', 'blue'],
  ],
  [
    'p-oxford',
    'the-oxford-shirt',
    'The Oxford shirt',
    'Essentials',
    175,
    'col-essentials',
    'shirts.jpg',
    '100% cotton Oxford weave',
    'Crisp enough to feel dressed, soft enough to live in. The Oxford shirt has an easy straight body, a generous cuff and a collar that looks just as good worn open. Its textured cotton lends a little substance beneath fine knitwear. It is a piece for a busy Monday, a late lunch and the days when you would rather let your wardrobe take care of itself.',
    ['chalk', 'blue'],
  ],
  [
    'p-silk',
    'the-fluid-shirt',
    'The fluid shirt',
    'Essentials',
    225,
    'col-city',
    'shirts.jpg',
    'Silk and cotton blend with a fluid hand',
    'Light moves quietly across the surface of this softly draped shirt. A clean collar, concealed placket and easy sleeve create an understated line with a little evening character. Wear it loose with a tailored trouser or let the cuff fall below a jacket sleeve. The silk and cotton blend balances a gentle sheen with a comfortable, familiar feel.',
    ['chalk', 'espresso'],
  ],
  [
    'p-daydress',
    'the-everyday-dress',
    'The everyday dress',
    'Dresses',
    275,
    'col-weekend',
    'dress.jpg',
    'Lightweight cotton with a soft, washed finish',
    'A dress for a full day and an open itinerary. The relaxed waist and fluid skirt move easily, while thoughtful proportions keep the silhouette clear and composed. Deep side pockets make it as useful as it is comfortable. Add a generous knit for a cool morning, then let the shape speak for itself when the afternoon light arrives.',
    ['blue', 'chalk'],
  ],
  [
    'p-wrapdress',
    'the-wrap-dress',
    'The wrap dress',
    'Dresses',
    325,
    'col-autumn',
    'dress.jpg',
    'A fluid viscose and linen blend',
    'An adjustable wrap and a long, fluid line give this dress a natural sense of movement. The waist ties gently rather than constricting, and the neckline falls into a soft V. It is a considered choice for an unhurried dinner, a small celebration or a day that deserves a little more ease. Finish with a simple leather object and a coat over the shoulders.',
    ['blue', 'ink'],
  ],
  [
    'p-scarf',
    'the-generous-scarf',
    'The generous scarf',
    'Accessories',
    125,
    'col-objects',
    'knit.jpg',
    '90% merino wool and 10% cashmere',
    'A generous layer of warmth in an uncomplicated rectangle. Woven with a soft, open handle, this scarf drapes easily around the neck or across the shoulders. The quiet colour palette works with every part of the collection, making it a useful addition to a travel bag or an everyday coat pocket. Fold, wrap and wear it your own way.',
    ['oat', 'espresso'],
  ],
  [
    'p-belt',
    'the-everyday-belt',
    'The everyday belt',
    'Accessories',
    95,
    'col-objects',
    'bag.jpg',
    'Smooth vegetable-tanned leather',
    'A small detail that brings a silhouette together. A clean leather strap and understated metal finish make this belt easy to wear with tailoring, denim or a softly gathered dress. The leather is chosen for its ability to acquire a gentle patina, becoming more personal rather than less beautiful with time. An everyday object, made to stay close.',
    ['espresso', 'sand'],
  ],
  [
    'p-pouch',
    'the-small-companion',
    'The small companion',
    'Accessories',
    145,
    'col-objects',
    'bag.jpg',
    'Supple leather with a cotton lining',
    'A place for the small things that make a day feel organised. This simple leather companion slips inside a tote or carries comfortably on its own. A clean zip, soft lining and considered proportions keep it useful without unnecessary detail. Take it from desk to dinner, or keep it in your travel bag as a little piece of home.',
    ['espresso', 'ink'],
  ],
  [
    'p-knitvest',
    'the-knit-vest',
    'The knit vest',
    'Knitwear',
    175,
    'col-soft',
    'knit.jpg',
    'Soft merino and organic cotton',
    'A layer that gives familiar pieces a new perspective. An open neckline and easy armhole let this knit sit neatly over a shirt or a fine jersey top. The balanced length works tucked at the front or worn loose, while a substantial rib adds a little structure. Reach for it when a jacket feels like too much and a shirt feels like too little.',
    ['oat', 'sand'],
  ],
  [
    'p-mockneck',
    'the-soft-mock-neck',
    'The soft mock neck',
    'Knitwear',
    225,
    'col-soft',
    'knit.jpg',
    'Fine wool with a cashmere touch',
    'A softly raised neckline, generous sleeve and unhurried fit create a knit with an especially comforting feel. The body is relaxed without being oversized, making it a simple partner to both a wide trouser and a fluid dress. A subtle rib at the cuff and hem keeps the shape gently defined. It is warmth, with just enough architecture.',
    ['oat', 'espresso'],
  ],
  [
    'p-tee',
    'the-essential-jersey',
    'The essential jersey',
    'Essentials',
    75,
    'col-weekend',
    'detail.jpg',
    '100% soft organic cotton jersey',
    'The most familiar piece in the wardrobe deserves a little attention. A substantial cotton jersey, a comfortable neckline and a clean shoulder make this a dependable first layer. The straight body falls naturally and holds its shape between wears. Choose it for a quiet morning, a long journey or any day that begins with the wish to feel entirely yourself.',
    ['chalk', 'ink'],
  ],
  [
    'p-overshirt',
    'the-soft-overshirt',
    'The soft overshirt',
    'Outerwear',
    245,
    'col-city',
    'tailoring.jpg',
    'Brushed cotton twill with a softly structured feel',
    'Between a shirt and a light jacket, this is a layer with its own quiet usefulness. The easy body leaves room for knitwear, and generous pockets keep the essentials close. Wear it buttoned over a simple top or open in place of a blazer. Its softly brushed surface adds warmth and texture without the weight of traditional outerwear.',
    ['sand', 'espresso'],
  ],
];

const stories = [
  [
    'the-five-piece-weekend',
    'The five-piece weekend',
    'Wardrobe notes',
    'A lighter suitcase and an open itinerary. Five pieces, many possibilities, and room for the unexpected.',
    'landscape.jpg',
    [
      'Packing well begins with an honest question: how do you want the weekend to feel? We tend to choose ease. A small bag, a few familiar pieces and enough space to bring something unexpected home.',
      'Start with one generous layer. A soft coat or overshirt is a companion for a cool station platform, an early walk and the journey back. Choose a colour that already feels at home in your wardrobe, rather than a piece that demands a new set of decisions.',
      'Add a fine knit, an easy shirt and a trouser you can sit, walk and linger in. Each should work with the others. The aim is not a perfectly coordinated outfit for every moment; it is a small collection of possibilities that all feel like you.',
      'The fifth piece is personal. A dress for dinner, a scarf that doubles as a shoulder wrap, or a leather tote with room for the things you collect along the way. Leave the rest of the itinerary open.',
      'When you return, take a moment to notice what you actually wore. The pieces that travelled most easily often tell you something useful about the wardrobe you want to build at home.',
    ],
  ],
  [
    'a-guide-to-cashmere',
    'Living with cashmere',
    'Care & longevity',
    'A little attention goes a long way. Gentle rituals for keeping a favourite knit close for longer.',
    'knit.jpg',
    [
      'The pleasure of cashmere is immediate: the warmth, the lightness, the way a familiar knit seems to meet you halfway. Keeping that feeling requires care, but the routine need not be complicated.',
      'Begin with air. A piece worn for a few hours often needs time on a clean, flat surface rather than another wash. Let the fibres rest between wears, and keep your knit away from direct heat.',
      'Always follow the care label attached to your own garment. Where washing is permitted, use a cool, gentle method and a detergent intended for delicate wool. Avoid twisting or wringing; press out moisture with a clean towel and reshape carefully.',
      'Dry flat and store folded. A hanger can pull at the shoulders of a fine knit, especially while it is damp. A little space in a drawer is often the simplest way to protect the shape you chose it for.',
      'Small pills are a natural response to friction in soft fibres. Remove them gently with an appropriate comb, taking care around seams and ribbed edges. Care is not about keeping a garment untouched. It is about making it comfortable to keep wearing.',
    ],
  ],
  [
    'the-language-of-colour',
    'The language of quiet colour',
    'In conversation',
    'Oat, stone, ink and the shades between. How a considered palette makes getting dressed feel easier.',
    'shirts.jpg',
    [
      'A quiet palette is not the absence of colour. It is a conversation between shades that leave room for the person wearing them. Oat against ink. A warm stone beside a soft chalk. Espresso, deep enough to feel almost black in evening light.',
      'We begin a collection by laying materials together in natural light. The same colour can feel entirely different in poplin, brushed wool or smooth leather. Texture gives a neutral palette its depth.',
      'There is a practical ease in working this way. A new piece has somewhere to belong. The knit you wore last winter can sit naturally beside this season’s trouser, and a familiar coat can change character with a lighter layer underneath.',
      'When building your own palette, start with the colours you already reach for. Notice whether you feel most at home in warm, cool, deep or pale shades. A considered wardrobe should make your life easier, not ask you to perform someone else’s idea of restraint.',
      'Then leave room for one unexpected note. A blue shirt, a warm leather object, a colour gathered from a place you love. Simplicity becomes most interesting when it remains personal.',
    ],
  ],
  [
    'inside-the-pattern-room',
    'Inside the pattern room',
    'Craft & process',
    'Where a line becomes a silhouette. On fitting, adjusting, and knowing when to stop.',
    'studio.jpg',
    [
      'A sketch is a suggestion. A pattern is where that suggestion begins to meet the body. In the studio, we return to the relationship between the two many times before a piece feels resolved.',
      'The first sample asks practical questions. Does the sleeve move comfortably? Is a pocket where the hand naturally looks for it? Can the collar sit open without losing its character? These are small decisions, but they are the decisions a wearer lives with.',
      'We pay particular attention to balance. An extra centimetre at the shoulder can change the way a coat falls. A hem placed a little higher can give a trouser a different kind of ease. Refinement often means making a change that is felt more clearly than it is seen.',
      'Fitting is a conversation rather than a single approval. We sit, walk, reach, layer and look again. The goal is a shape that feels composed while allowing a real day to happen inside it.',
      'Eventually, the work becomes quieter. The piece no longer asks for another detail. The line is clear, the movement is natural, and the most useful decision is to leave it alone.',
    ],
  ],
  [
    'a-morning-in-copenhagen',
    'A morning in Copenhagen',
    'Places & people',
    'Coffee, changing light and a walk without a destination. A city seen at a gentler pace.',
    'architecture.jpg',
    [
      'The city is still waking when we begin. A bicycle leans against a pale wall, a bakery window gathers its first queue, and the light seems to arrive from several directions at once.',
      'We like to walk before making a plan. It is a way of noticing proportion: the width of a doorway, the curve of a chair in a quiet café, the simple confidence of a well-used object. Inspiration is often more useful when it comes from life rather than from a mood board.',
      'Our Copenhagen perspective is grounded in that everyday clarity. Clothing should have purpose without becoming severe. A generous knit can be both practical and expressive. A carefully chosen coat can make a grey morning feel a little more considered.',
      'By late morning, the city has found its rhythm. We stop for coffee, open a notebook and compare the details we noticed. What stays with us is rarely the grandest building or the most carefully arranged room.',
      'It is the easy relationship between things. A material used honestly. A space that invites you to stay. A silhouette that feels entirely at home in the life around it.',
    ],
  ],
  [
    'the-wardrobe-between-seasons',
    'Between seasons',
    'Wardrobe notes',
    'When the forecast keeps changing, a thoughtful layer makes all the difference.',
    'campaign-portrait.webp',
    [
      'There is a particular kind of dressing that belongs to the weeks between seasons. The morning asks for a coat; the afternoon suggests a lighter plan. A good wardrobe makes room for both.',
      'Think in layers with different weights. A fine merino knit beneath a cotton overshirt gives warmth without the bulk of two substantial pieces. An open coat can frame a lighter silhouette while remaining useful when the wind returns.',
      'Pay attention to the spaces between garments. A sleeve should move easily inside the layer above it. A shirt collar should sit comfortably beneath a neckline. These small relationships are what make an outfit feel natural rather than assembled.',
      'Accessories can do a quiet amount of work. A soft scarf adds warmth without committing you to another coat, while a roomy tote gives a removed layer somewhere to go.',
      'Most of all, allow your wardrobe to respond to the day. Considered clothing is not a fixed uniform. It is a set of familiar pieces that makes changing your mind a little easier.',
    ],
  ],
  [
    'objects-that-age-well',
    'Objects that age with you',
    'Craft & process',
    'Patina, purpose and the beauty of use. The small things we choose to keep close.',
    'bag.jpg',
    [
      'Some objects become less interesting with use. Others begin to feel more like themselves. A leather handle softened by a familiar grip, a notebook shaped by the bag it travels in, a scarf that carries the memory of many winters.',
      'When we design an accessory, we think about those later moments. The first impression matters, but it should not be the most meaningful part of the relationship. A useful object needs to make sense after the novelty has passed.',
      'That begins with proportion. A tote should be comfortable to carry with a coat. A pouch should hold the small essentials without becoming another thing to organise. A belt should bring an outfit together without demanding attention from everything around it.',
      'Materials bring their own character. Natural leather can develop variations in tone and surface over time. These changes ask for gentle care and a little understanding, rather than a wish to keep every object looking untouched.',
      'We like the idea of a wardrobe that records a life. Not through accumulation, but through a few things used often, looked after thoughtfully, and chosen again.',
    ],
  ],
  [
    'dressing-for-yourself',
    'Dressing for yourself',
    'In conversation',
    'A personal wardrobe begins with a familiar feeling. On confidence, comfort and finding your own proportions.',
    'detail.jpg',
    [
      'The most useful style advice may be the least complicated: pay attention to how you feel. A piece can be beautifully made and still ask you to be someone you are not. A familiar silhouette can make an ordinary day feel entirely your own.',
      'We often begin with proportion rather than trend. Do you feel most comfortable in a long line or a shorter layer? Do you prefer a close neckline or an open collar? These are personal choices, and they remain useful long after a particular season has passed.',
      'Comfort is part of confidence. A sleeve that lets you reach, a waistband that allows you to sit, a material you enjoy against the skin: none of these details is secondary to the way an outfit looks.',
      'Try familiar pieces in a slightly different relationship. A generous knit with a cleaner trouser. A softly structured jacket over a simple tank. Sometimes the new perspective is already in your wardrobe.',
      'There is no single correct version of a considered life. The clothes should leave room for yours.',
    ],
  ],
  [
    'the-art-of-rewearing',
    'The art of wearing it again',
    'Care & longevity',
    'A favourite piece, a new combination. Finding possibility in the wardrobe you already know.',
    'linen.jpg',
    [
      'A well-loved piece rarely becomes familiar all at once. It earns that place through ordinary days: the shirt you wore on a good morning, the coat that travelled easily, the knit that always felt right.',
      'Rewearing is a way of noticing what a garment can do. An open shirt becomes a light jacket. A soft dress takes on a different character beneath a structured layer. A belt changes where a silhouette begins and ends.',
      'Begin by taking a few pieces out of their usual combinations. Lay them together in natural light, and pay attention to material as much as colour. Crisp cotton and a substantial knit can make each other feel newly interesting.',
      'A little maintenance helps those possibilities stay open. Rest a pair of trousers between wears. Brush a coat before storing it. Repair a loose button while the task is still small. The point is to keep your pieces useful, rather than to make caring for them another complicated project.',
      'The wardrobe we imagine is built through these decisions. Fewer things chosen well, worn often, and understood a little better each time.',
    ],
  ],
];

export async function seedExpandedContent(db) {
  for (const collection of additions)
    await db.collection.upsert({
      where: { id: collection.id },
      create: collection,
      update: {},
    });
  for (const [
    id,
    slug,
    name,
    category,
    price,
    collectionId,
    photo,
    fabric,
    description,
    palette,
  ] of pieces) {
    const sizes =
      category === 'Accessories' ? ['One size'] : ['XS', 'S', 'M', 'L', 'XL'];
    const care =
      category === 'Accessories'
        ? 'Store in a cool, dry place away from direct heat and sunlight. Wipe leather gently with a soft cloth and keep it in a breathable dust bag when not in use. For knitted accessories, air between wears and follow the care label before cleaning.'
        : 'Give your piece time to rest between wears. Follow the garment care label; professional cleaning is recommended for structured wool and delicate blends. Reshape knitwear gently and store folded. Cotton and linen may be washed on a cool, gentle cycle where the label permits.';
    await db.product.upsert({
      where: { id },
      update: {},
      create: {
        id,
        slug,
        name,
        category,
        price,
        collectionId,
        fabric,
        description,
        care,
        media: {
          create: [
            {
              url: image(photo),
              alt: `${name} — complete garment and silhouette`,
              sortOrder: 0,
            },
            {
              url: image(
                category === 'Accessories'
                  ? 'bag.jpg'
                  : category === 'Knitwear'
                    ? 'knit.jpg'
                    : 'shirts.jpg',
              ),
              alt: `${name} — styling and material reference`,
              sortOrder: 1,
            },
          ],
        },
        variants: {
          create: palette.flatMap((key, c) =>
            sizes.map((size, i) => ({
              id: `${id}-${c}-${i}`,
              sku: `${slug}-${c}-${size}`,
              colorName: colors[key][0],
              colorHex: colors[key][1],
              size,
              stock: i === 4 && c === 0 ? 0 : 12,
            })),
          ),
        },
      },
    });
  }
  for (const [
    i,
    [slug, title, category, excerpt, photo, paragraphs],
  ] of stories.entries())
    await db.journalPost.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        title,
        category,
        excerpt,
        coverImage: image(photo),
        body: paragraphs.join('\n\n'),
        publishedAt: new Date(
          `2026-10-${String(16 + i).padStart(2, '0')}T09:00:00Z`,
        ),
      },
    });
  for (const look of [
    {
      slug: 'the-soft-hours',
      title: 'The soft hours',
      coverImage: image('knit.jpg'),
      scenes: [
        ['knit.jpg', '01 — A gentler beginning', 'p-merino', 50, 48],
        ['detail.jpg', '02 — The first layer', 'p-rib', 45, 40],
        ['linen.jpg', '03 — An open collar', 'p-linen', 50, 55],
        ['campaign-portrait.webp', '04 — One more layer', 'p-wrap', 52, 48],
      ],
    },
    {
      slug: 'a-city-in-motion',
      title: 'A city in motion',
      coverImage: image('campaign-portrait.webp'),
      scenes: [
        [
          'campaign-portrait.webp',
          '01 — The morning departure',
          'p-trench',
          50,
          50,
        ],
        ['shirts.jpg', '02 — A moment between meetings', 'p-silk', 53, 55],
        ['tailoring.jpg', '03 — An unhurried afternoon', 'p-overshirt', 50, 45],
        ['bag.jpg', '04 — Everything, close at hand', 'p-pouch', 50, 55],
      ],
    },
  ])
    await db.lookbook.upsert({
      where: { slug: look.slug },
      update: {},
      create: {
        slug: look.slug,
        title: look.title,
        coverImage: look.coverImage,
        chapters: {
          create: look.scenes.map(
            ([photo, caption, productId, xPct, yPct], i) => ({
              imageUrl: image(photo),
              caption,
              sortOrder: i,
              hotspots: { create: [{ productId, xPct, yPct }] },
            }),
          ),
        },
      },
    });
  const stillness = await db.lookbook.findUnique({
    where: { slug: 'a-study-in-stillness' },
  });
  if (stillness)
    for (const [id, photo, caption, productId, sortOrder] of [
      [
        'chapter-stillness-04',
        'linen.jpg',
        '04 — A different kind of ease',
        'p-linen',
        3,
      ],
      [
        'chapter-stillness-05',
        'bag.jpg',
        '05 — The things we keep close',
        'p-bag',
        4,
      ],
    ])
      await db.lookChapter.upsert({
        where: { id },
        update: {},
        create: {
          id,
          lookbookId: stillness.id,
          imageUrl: image(photo),
          caption,
          sortOrder,
          hotspots: { create: [{ productId, xPct: 50, yPct: 50 }] },
        },
      });
  for (const store of [
    {
      id: 'store-amsterdam',
      name: 'The Nine Streets',
      city: 'Amsterdam',
      address: '22 Huidenstraat, 1016 ES Amsterdam, Netherlands',
      lat: 52.3684,
      lng: 4.8851,
      hours: 'Monday–Saturday 10:00–18:00 · Sunday 12:00–17:00',
    },
    {
      id: 'store-milan',
      name: 'Brera',
      city: 'Milan',
      address: '16 Via Brera, 20121 Milan, Italy',
      lat: 45.4722,
      lng: 9.1882,
      hours: 'Monday–Saturday 10:00–19:00 · Sunday 12:00–18:00',
    },
    {
      id: 'store-berlin',
      name: 'Mitte',
      city: 'Berlin',
      address: '42 Linienstraße, 10119 Berlin, Germany',
      lat: 52.5295,
      lng: 13.401,
      hours: 'Monday–Saturday 11:00–19:00 · Sunday closed',
    },
  ])
    await db.store.upsert({
      where: { id: store.id },
      update: {},
      create: store,
    });
  console.log(
    'Expanded content ready: 24 pieces, 6 collections, 12 journal stories, 3 lookbooks and 6 concept stores.',
  );
}
