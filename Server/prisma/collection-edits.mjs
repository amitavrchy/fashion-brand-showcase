const edits = [
  {
    collection: {
      id: 'col-evening',
      slug: 'after-hours',
      title: 'After hours',
      season: 'Evening, effortlessly',
      heroImage: '/images/studio-dress.webp',
      description:
        'When the day gives way to evening. Fluid silhouettes, a quiet sheen and considered pieces for dinner, a celebration or simply a different pace.',
    },
    pieces: [
      ['p-dress', 'col-autumn'],
      ['p-silk', 'col-city'],
    ],
  },
  {
    collection: {
      id: 'col-tailored',
      slug: 'tailored-ease',
      title: 'Tailored ease',
      season: 'Structure, softened',
      heroImage: '/images/studio-blazer.webp',
      description:
        'A softer approach to dressing with intention. Relaxed wool tailoring and crisp cotton shirting bring a composed, uncomplicated ease to the everyday.',
    },
    pieces: [
      ['p-blazer', 'col-autumn'],
      ['p-oxford', 'col-essentials'],
    ],
  },
];

export async function seedCollectionEdits(db) {
  await db.$transaction(async (tx) => {
    for (const { collection, pieces } of edits) {
      const existing = await tx.collection.findFirst({
        where: { OR: [{ id: collection.id }, { slug: collection.slug }] },
      });
      // Curate each new edit once. Subsequent seeds preserve administrator changes.
      if (existing) continue;
      await tx.collection.create({ data: collection });
      for (const [id, originalCollectionId] of pieces) {
        await tx.product.updateMany({
          where: { id, collectionId: originalCollectionId },
          data: { collectionId: collection.id },
        });
      }
    }
  });
}
