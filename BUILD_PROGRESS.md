# ATELIER LUNE implementation

Source of truth: [PROJECT_SPEC.md](PROJECT_SPEC.md).

## Delivery stages

1. Database schema, curated seed catalog and API foundations.
2. Authentication, persistent wishlist, transactional orders and protected administration.
3. Brand design system, responsive shell and editorial home.
4. Collection filtering, product details, bag and checkout.
5. Interactive lookbook, journal, stores and brand story.
6. Account, administration, accessibility, motion and SEO.
7. Integration checks, browser verification and setup documentation.

Each meaningful stage is committed and pushed separately. All interface text has a minimum size of 14px. The requested revision replaces the original mock checkout with Stripe-hosted test payments; card details are entered only on Stripe.

## Requested revisions

1. Complete-frame photography: all storefront photographs use containment, with cropping hover transforms removed. A separate mobile campaign portrait includes headroom and visible shoes, and mobile campaign copy sits below the image. Lookbook hotspots use measured image bounds so letterboxing does not shift the targets.
2. Stripe: server-priced hosted Checkout, idempotent stock reservations, authorized receipts, signed raw-body webhooks, paid-state verification, cancellation/expiry release and minute-based reconciliation. Ambiguous creation retries retain their key; rejected or expired attempts can start again. Secrets remain in ignored environment files.
3. Content: 24 products, six collections, twelve journal articles, three shoppable lookbooks with thirteen chapters and six concept store locations. Added material guides, collection stories, service answers and atelier content. Expanded lookbook routes have their own metadata and sitemap entries.

## Verification

- [x] PostgreSQL schema, payment migration and idempotent expanded seed preserve existing catalog edits and order history.
- [x] Transactional stock checks prevent overselling; a failed line rolls the whole order back.
- [x] Checkout prices and shipping are calculated by the API; retries are idempotent.
- [x] Actual Stripe test Checkout accepts the successful test card, returns a verified paid receipt and delivers a signed webhook with HTTP 200. The declined test card is rejected. Cancelling the real test session restores its reserved stock.
- [x] Payment fixtures verify unauthorized/unsigned access, unpaid events, duplicate events, wrong amounts, concurrent retries, failed session creation, cancellation/expiry and a payment winning the cancellation race. Test endpoints exist only in the test bootstrap.
- [x] Lookbook hotspots open a product mini-panel.
- [x] Signed-in wishlist survives sign-out and a new session.
- [x] Embla campaign responds to actual mouse dragging and native touch swiping.
- [x] Reduced motion disables curtain wipes and smooth scrolling.
- [x] Desktop and mobile checks found no horizontal overflow or visible text below 14px on the main routes, including the expanded lookbook index.
- [x] Campaign framing verified at widths 1920, 1440, 1280, 768, 390 and 360. Mobile copy does not cover the portrait. Final desktop/mobile screenshots were inspected locally.
- [x] Protected administrator product, variant, collection and campaign workflows.
- [x] All 19 API integration tests and 24 desktop/mobile Chromium browser cases pass, using isolated databases and an injected test payment gateway. New browser cases cover framing, all catalog pages, all lookbooks, unpaid receipts and cancellation preserving the bag.
- [x] Client and API builds pass; client ESLint and API type-aware lint pass.
- [x] Production dependency audits: zero reported vulnerabilities in both applications.
- [x] Lighthouse mobile homepage: Performance 92, Accessibility 100, Best Practices 100, SEO 100; cumulative layout shift 0.

The Lighthouse result was collected again against the expanded production build at `http://localhost:3001` on 31 October 2026: FCP 0.8s, LCP 3.3s, total blocking time 50ms and CLS 0. Scores vary with hosting, hardware and network conditions. Full local audit artifacts are written to `.data/quality/` by `npm --prefix Client run audit`.

## Deliberate limits

Checkout uses Stripe test mode, as requested in the revision. No real funds are charged, and email delivery or physical fulfilment is not connected. Newsletter signup persists addresses without an email provider. Brand narrative, locations and product photography are illustrative. Optional stretch features (visual search, appointments, multi-currency and 3D garments) are outside this MVP.

The full dependency audit still reports advisories in inherited development lint/deploy tooling. Runtime dependency audits are clean. No forced major downgrades of Next.js, ESLint or the Nest CLI were used.

Docker is not installed in the development environment, so the container image was not built here. The application builds and all integration checks were run directly on Windows with a real local PostgreSQL instance.

See [README.md](README.md) for setup, administrator provisioning, production environment configuration and test commands. See [ASSETS.md](ASSETS.md) for image provenance and the generated campaign prompt.
