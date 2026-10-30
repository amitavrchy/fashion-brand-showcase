# Fashion / Brand Showcase — Project Build Spec (Agent-Ready)

> Stack: Next.js + Redux + RQ + RHF/zod + framer-motion + **gsap, lenis, embla**. NestJS + Prisma + JWT. Optional: `@radix-ui/react-dialog`, `sharp` pipeline notes, `next/font` with exclusive display face.

---

## 1. Vision & Audience

**Vision:** Digital flagship for **“ATELIER LUNE”** — contemporary luxury ready-to-wear. Museum restraint + commerce conversion. Inspiration: Brunello Cucinelli AI e-com discovery, Cartier photography discipline, Gucci Art of Silk gallery craft, PrimeAsia PDP polish — without building full marketplace complexity.

**Audience:** Luxury fashion shoppers; brand admirers; editorial press.

**Promise:** “Clothing as quiet architecture.”

---

## 2. References

| Site | Steal | Link |
|------|-------|------|
| Brunello Cucinelli AI E-com | Intent-led, pageless discovery — SOTD | https://www.awwwards.com/sites/brunello-cucinelli-ai-e-com |
| The Art of Silk (Gucci) | 3D/gallery creation experience — SOTD | https://www.awwwards.com/sites/the-art-of-silk |
| 365 — A Year of Cartier | Minimal photography luxury — SOTD | https://www.awwwards.com/sites/365-a-year-of-cartier-5 |
| PrimeAsia Leather | Filters, PDP, infinite product slider — SOTD | https://www.awwwards.com/sites/primeasia-leather |
| DICH™ Fashion | Expressive microinteractions — SOTD | https://www.awwwards.com/sites/dichtm-fashion |

**Patterns:** Full-bleed campaign films; lookbook chapters; size guide; quiet cart; fabric stories; intentional whitespace.

---

## 3. Design System

### Color
| Token | Hex |
|-------|-----|
| `--ivory` | `#F8F5F0` |
| `--ink` | `#121212` |
| `--stone` | `#D9D2C5` |
| `--taupe` | `#8A7F72` |
| `--oxblood` | `#5C1F1F` | accent CTA sparingly |
| `--line` | `#E8E2D8` |
| Seasonal campaign accents via CMS hex field |

### Typography
- Display: `Bodoni Moda` or `Cormorant`
- UI: `Neue Montreal` substitute → `Manrope` / `Inter`
- Product titles: serif; prices: light sans tracking wide

### Motion
- Lenis + GSAP lookbook horizontal scroll section
- Embla look carousel; product hover second image crossfade 400ms
- Page transition curtain wipe 500ms (respect reduced motion → fade)
- Mega-menu reveal 300ms

---

## 4. Sitemap

### `/`
Campaign hero (video optional); featured drops Embla; lookbook teaser; sustainability pledge; journal; Instagram grid.

### `/collections` · `/collections/[slug]`
Filtered PLP: category, color, size availability; sort; infinite or paginated.

### `/product/[slug]`
Gallery + zoom; size selector; add to bag; fabric/care accordion; complete the look; shipping returns.

### `/lookbook/[slug]`
Editorial scroll story; shop-the-look hotspots.

### `/stores` locations
### `/about` brand story timeline
### `/journal`
### `/cart` · `/checkout` mock
### `/account` orders wishlist
### Admin: products, collections, campaign banners

**Signature:** Lookbook shop-the-look; image swap hover; curtain transitions; size guide modal.

---

## 5. Features

### MVP
- Catalog collections/products/variants (size/color)
- Cart + checkout stub + wishlist
- Lookbook with hotspot → product links
- Store locator list
- Journal
- Inventory decrement on order mock

### Stretch
- Visual search (upload) — not required
- Size recommendation quiz
- Appointment booking in-store
- Multi-currency
- 3D garment (optional later; not in installed 3D stack here — skip or light CSS)

---

## 6. Frontend Architecture

```
components/product/ (Gallery, SizePicker, AddToBag, CareAccordion)
components/lookbook/ (HotspotImage, Chapter)
features/cart/cartSlice.ts
features/wishlist/wishlistSlice.ts
features/auth/authSlice.ts
```

**React Query:** catalog queries; mutations for checkout.
**Embla:** campaign + product recommendations.

---

## 7. Backend Prisma

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql" url = env("DATABASE_URL") }

enum Role { CUSTOMER ADMIN }
enum OrderStatus { PENDING PAID SHIPPED CANCELLED }

model User {
  id String @id @default(cuid())
  email String @unique
  passwordHash String
  name String
  role Role @default(CUSTOMER)
  orders Order[]
  wishlist WishlistItem[]
}

model Collection {
  id String @id @default(cuid())
  slug String @unique
  title String
  description String?
  heroImage String?
  season String?
  products Product[]
}

model Product {
  id String @id @default(cuid())
  slug String @unique
  name String
  description String
  fabric String?
  care String?
  price Decimal @db.Decimal(10,2)
  collectionId String?
  collection Collection? @relation(fields: [collectionId], references: [id])
  media ProductMedia[]
  variants Variant[]
  lookHotspots LookHotspot[]
  published Boolean @default(true)
}

model ProductMedia {
  id String @id @default(cuid())
  productId String
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  url String
  alt String?
  sortOrder Int @default(0)
}

model Variant {
  id String @id @default(cuid())
  productId String
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  sku String @unique
  colorName String
  colorHex String
  size String
  stock Int @default(0)
}

model Lookbook {
  id String @id @default(cuid())
  slug String @unique
  title String
  coverImage String?
  chapters LookChapter[]
}

model LookChapter {
  id String @id @default(cuid())
  lookbookId String
  lookbook Lookbook @relation(fields: [lookbookId], references: [id], onDelete: Cascade)
  imageUrl String
  caption String?
  sortOrder Int
  hotspots LookHotspot[]
}

model LookHotspot {
  id String @id @default(cuid())
  chapterId String
  chapter LookChapter @relation(fields: [chapterId], references: [id], onDelete: Cascade)
  productId String
  product Product @relation(fields: [productId], references: [id])
  xPct Float
  yPct Float
}

model WishlistItem {
  id String @id @default(cuid())
  userId String
  productId String
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, productId])
}

model Order {
  id String @id @default(cuid())
  userId String?
  user User? @relation(fields: [userId], references: [id])
  email String
  status OrderStatus @default(PENDING)
  total Decimal @db.Decimal(10,2)
  itemsJson Json
  shippingJson Json?
  createdAt DateTime @default(now())
}

model Store {
  id String @id @default(cuid())
  name String
  city String
  address String
  lat Float?
  lng Float?
  hours String?
}

model JournalPost {
  id String @id @default(cuid())
  slug String @unique
  title String
  body String
  coverImage String?
  publishedAt DateTime?
}
```

### Endpoints
Public catalog/lookbooks/stores/journal; cart is client-side until `POST /orders`; wishlist JWT; admin CRUD; auth.

---

## 8. Perf / A11y / SEO

- Prioritize LCP campaign image; video deferred
- Focusable hotspots; size picker keyboard
- Product JSON-LD; OG lookbook covers
- Lighthouse marketing ≥ 90

---

## 9. Build Order

1. Seed collections/products/media
2. PLP + PDP + cart Redux
3. Checkout + orders
4. Lookbook hotspots
5. Home campaign + Lenis/GSAP
6. Account wishlist
7. Admin + SEO

## 10. Acceptance

- [ ] Variant stock prevents oversell on order
- [ ] Look hotspot opens product mini-panel
- [ ] Wishlist persists for auth users
- [ ] Embla campaign works touch + mouse
- [ ] Reduced motion disables curtain wipe
