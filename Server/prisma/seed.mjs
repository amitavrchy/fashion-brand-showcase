import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const db = new PrismaClient();
const photos = {
  coat: '/images/campaign-editorial.webp', dress: '/images/dress.jpg', knit: '/images/knit.jpg',
  tailoring: '/images/tailoring.jpg', bag: '/images/bag.jpg', detail: '/images/detail.jpg',
  landscape: '/images/landscape.jpg', atelier: '/images/atelier.jpg',
};
const collections = [
  { id: 'col-autumn', slug: 'autumn-winter', title: 'Autumn / Winter 2026', description: 'A study in stillness. Sculptural silhouettes, tactile layers, and the poetry of the everyday.', heroImage: photos.coat, season: 'AW 2026' },
  { id: 'col-essentials', slug: 'the-permanent-collection', title: 'The permanent collection', description: 'Considered essentials. Pieces to return to, season after season.', heroImage: photos.knit, season: 'Permanent' },
  { id: 'col-objects', slug: 'objects-of-affection', title: 'Objects of affection', description: 'Beautifully useful. Leather objects that acquire character with time.', heroImage: photos.bag, season: 'Permanent' },
];
for (const collection of collections) await db.collection.upsert({ where: { id: collection.id }, create: collection, update: {} });
const products = [
  ['p-coat', 'the-sculpted-coat', 'The sculpted coat', 'Outerwear', 485, 'col-autumn', photos.coat, photos.tailoring, 'Double-faced wool, 90% wool / 10% cashmere', 'A generous silhouette, softly structured shoulders, and a considered drape. Cut from double-faced Italian wool and finished by hand.', [['Sand', '#C7B79E'], ['Ink', '#262625']]],
  ['p-knit', 'the-cashmere-crew', 'The cashmere crew', 'Knitwear', 245, 'col-essentials', photos.knit, photos.detail, '100% responsibly sourced cashmere', 'Exceptional softness in its simplest form. A relaxed crewneck with ribbed edges, knitted slowly for a beautiful, lasting handle.', [['Oat', '#D2C8B7'], ['Espresso', '#514339']]],
  ['p-dress', 'the-column-dress', 'The column dress', 'Dresses', 295, 'col-autumn', photos.dress, photos.coat, '100% organic cotton poplin', 'Quiet drama in a single gesture. An elongated, fluid silhouette with subtle volume and an effortless, architectural line.', [['Ink', '#262625'], ['Chalk', '#E9E4D9']]],
  ['p-trouser', 'the-tailored-trouser', 'The tailored trouser', 'Tailoring', 225, 'col-autumn', photos.tailoring, photos.detail, '98% virgin wool / 2% elastane', 'A high waist and generous straight leg. Precision tailoring with the ease of a piece you have always known.', [['Stone', '#A89F90'], ['Ink', '#262625']]],
  ['p-bag', 'the-everyday-tote', 'The everyday tote', 'Accessories', 345, 'col-objects', photos.bag, photos.detail, '100% vegetable-tanned leather', 'An everyday companion in supple leather. Unlined, quietly capacious, and designed to soften beautifully with use.', [['Espresso', '#514339'], ['Sand', '#C7B79E']]],
  ['p-shirt', 'the-poplin-shirt', 'The poplin shirt', 'Essentials', 165, 'col-essentials', photos.detail, photos.knit, '100% organic cotton', 'A fresh perspective on a familiar form. Crisp organic poplin, an easy oversized fit, and mother-of-pearl buttons.', [['Chalk', '#E9E4D9'], ['Sand', '#C7B79E']]],
  ['p-blazer', 'the-relaxed-blazer', 'The relaxed blazer', 'Tailoring', 365, 'col-autumn', photos.tailoring, photos.coat, '100% Italian virgin wool', 'Soft construction, precise proportions. An unlined blazer that moves naturally between the everyday and the exceptional.', [['Stone', '#A89F90'], ['Espresso', '#514339']]],
  ['p-cardigan', 'the-soft-cardigan', 'The soft cardigan', 'Knitwear', 265, 'col-essentials', photos.knit, photos.detail, '70% merino wool / 30% cashmere', 'A soft layer for slower days. A gentle V-neck, slightly dropped shoulders, and a comforting, substantial knit.', [['Oat', '#D2C8B7'], ['Ink', '#262625']]],
];
for (const [id, slug, name, category, price, collectionId, image, secondImage, fabric, description, colors] of products) {
  const sizes = category === 'Accessories' ? ['One size'] : ['XS', 'S', 'M', 'L', 'XL'];
  await db.product.upsert({
    where: { id }, update: {},
    create: {
      id, slug, name, category, price, collectionId, fabric, description,
      care: category === 'Accessories' ? 'Wipe gently with a soft, dry cloth. Store in the dust bag provided. Keep away from prolonged sunlight and moisture.' : 'Professional dry clean recommended. Air between wears. Store folded in a cool, dry place. Treat gently; wear often.',
      media: { create: [image, secondImage].map((url, i) => ({ url, alt: `${name} — ${i ? 'fabric and silhouette detail' : 'full silhouette'}`, sortOrder: i })) },
      variants: { create: colors.flatMap(([colorName, colorHex], c) => sizes.map((size, i) => ({ id: `${id}-${c}-${i}`, sku: `${slug}-${c}-${size}`, colorName, colorHex, size, stock: i === 4 && c === 0 ? 0 : 8 }))) },
    },
  });
}
await db.lookbook.upsert({ where: { slug: 'a-study-in-stillness' }, update: {}, create: {
  slug: 'a-study-in-stillness', title: 'A study in stillness', coverImage: photos.coat,
  chapters: { create: [
    { imageUrl: photos.coat, caption: '01 — The art of arriving', sortOrder: 0, hotspots: { create: [{ productId: 'p-coat', xPct: 52, yPct: 48 }] } },
    { imageUrl: photos.tailoring, caption: '02 — Between structure and softness', sortOrder: 1, hotspots: { create: [{ productId: 'p-trouser', xPct: 50, yPct: 67 }, { productId: 'p-blazer', xPct: 45, yPct: 32 }] } },
    { imageUrl: photos.dress, caption: '03 — Room to move', sortOrder: 2, hotspots: { create: [{ productId: 'p-dress', xPct: 48, yPct: 54 }] } },
  ] },
} });
const posts = [
  ['the-art-of-less', 'The art of less', 'In conversation', 'On finding beauty in what remains. A conversation about simplicity, intention, and the objects we choose to keep.', photos.atelier, 'We believe the most meaningful things ask little of us. They fit into our lives with an almost imperceptible ease, becoming more familiar, more personal, with every use.\n\nFor this edition of the journal, we return to the beginning: a light-filled studio, a length of fabric, and a question. What does a garment truly need?\n\nThe answer is rarely more. It is a seam placed with intention. A proportion that feels right. A fabric that invites the hand. It is the patience to remove what is unnecessary until the essential becomes clear.\n\nOur permanent collection grows from this philosophy. Each piece is a conversation between function and feeling, made to accompany the life you already lead.'],
  ['a-material-connection', 'A material connection', 'Craft & process', 'From fibre to feeling. A closer look at the natural materials at the heart of the collection.', photos.knit, 'Every collection begins with touch. Before a sketch takes shape, before a silhouette is considered, we spend time with the cloth.\n\nWe work with small specialist mills in Italy and Portugal. These are relationships built over many seasons, grounded in a shared understanding of what makes a fabric exceptional.\n\nNatural fibres carry a particular honesty. Wool regulates, linen breathes, cashmere softens with each wear. Their qualities cannot be imitated; they are part of the material itself.\n\nWe choose to work with these qualities, rather than against them. The result is clothing that feels as considered on the inside as it looks on the outside.'],
  ['a-slower-rhythm', 'A slower rhythm', 'Places & people', 'A weekend away, a different perspective. Finding inspiration in the landscape of everyday life.', photos.landscape, 'There is a particular kind of clarity that arrives when we slow down. A morning walk without a destination. The quiet ritual of making coffee. Light shifting across a familiar room.\n\nThis season, we travelled to the countryside with no itinerary. We took the collection out of the studio and into a landscape of open skies and weathered stone.\n\nHere, the clothes found their natural context. A generous coat against the wind. Soft knitwear for cool evenings. Pieces made for living, rather than looking at.\n\nWe returned with fewer photographs than expected, and more ideas. Sometimes, the most productive thing we can do is simply pay attention.'],
];
for (const [slug, title, category, excerpt, coverImage, body] of posts) await db.journalPost.upsert({ where: { slug }, update: {}, create: { slug, title, category, excerpt, coverImage, body, publishedAt: new Date('2026-10-15') } });
for (const store of [
  { id: 'store-paris', name: 'Le Marais', city: 'Paris', address: '24 Rue de Poitou, 75003 Paris, France', lat: 48.8629, lng: 2.3618, hours: 'Monday–Saturday 10:00–19:00 · Sunday 12:00–18:00' },
  { id: 'store-london', name: 'Marylebone', city: 'London', address: '18 Marylebone High Street, London W1U 4QZ, United Kingdom', lat: 51.5206, lng: -0.1519, hours: 'Monday–Saturday 10:00–18:00 · Sunday 12:00–17:00' },
  { id: 'store-copenhagen', name: 'The Copenhagen atelier', city: 'Copenhagen', address: '12 Store Strandstræde, 1255 Copenhagen, Denmark', lat: 55.6814, lng: 12.5896, hours: 'Monday–Friday 10:00–18:00 · Saturday 10:00–16:00' },
]) await db.store.upsert({ where: { id: store.id }, update: {}, create: store });
await db.campaign.upsert({ where: { id: 'campaign-aw' }, update: {}, create: { id: 'campaign-aw', title: 'The quiet\nexpression.', subtitle: 'AUTUMN / WINTER 2026', image: '/images/campaign-editorial.webp', link: '/collections/autumn-winter', accent: '#5C1F1F' } });
await db.campaign.upsert({ where: { id: 'campaign-permanent' }, update: {}, create: { id: 'campaign-permanent', title: 'Less, but\nbetter.', subtitle: 'THE PERMANENT COLLECTION', image: photos.knit, link: '/collections/the-permanent-collection', accent: '#514339' } });
if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  if (process.env.ADMIN_PASSWORD.length < 12) throw new Error('ADMIN_PASSWORD must contain at least 12 characters.');
  await db.user.upsert({ where: { email: process.env.ADMIN_EMAIL.toLowerCase() }, update: {}, create: { email: process.env.ADMIN_EMAIL.toLowerCase(), name: 'Atelier administrator', role: 'ADMIN', passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12) } });
  console.log('Administrator provisioned from environment.');
}
console.log('Seed complete: 3 collections, 8 products, 3 chapters, 3 articles, 3 stores.');
await db.$disconnect();
