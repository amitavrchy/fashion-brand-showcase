ALTER TABLE "Campaign" ADD COLUMN "mobileImage" TEXT;
CREATE TABLE "SiteSettings" (
  "id" TEXT NOT NULL DEFAULT 'main',
  "announcement" TEXT NOT NULL DEFAULT 'Complimentary delivery on orders over €300',
  "homeTitle" TEXT NOT NULL DEFAULT 'A wardrobe, considered.',
  "homeDescription" TEXT NOT NULL DEFAULT 'Beautiful pieces. Natural materials. An ease that stays with you, season after season.',
  "newsletterTitle" TEXT NOT NULL DEFAULT 'A letter from Lune.',
  "newsletterDescription" TEXT NOT NULL DEFAULT 'New collections, stories and small things worth sharing. A little inspiration, occasionally.',
  "contactEmail" TEXT NOT NULL DEFAULT 'hello@atelierlune.example',
  CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
INSERT INTO "SiteSettings" ("id") VALUES ('main');
