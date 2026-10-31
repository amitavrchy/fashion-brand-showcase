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

1. Photography and art direction: the redesigned coastal hero uses separate desktop/mobile compositions. Photographs follow their intrinsic proportions instead of containment inside mismatched frames. No letterbox backgrounds are added, and cropping hover transforms are removed. The 24 products have distinct garment photographs; unrelated starter gallery shots are removed. Lookbook points stay aligned with the complete image. The hero now leads into a compact two-column introduction and three curated collection stories.
2. Stripe: server-priced hosted Checkout, idempotent stock reservations, authorized receipts, signed raw-body webhooks, paid-state verification, cancellation/expiry release and minute-based reconciliation. Ambiguous creation retries retain their key; rejected or expired attempts can start again. Secrets remain in ignored environment files.
3. Content: 24 products, six collections, twelve journal articles, three shoppable lookbooks with thirteen chapters and six concept store locations. Added material guides, collection stories, service answers and atelier content. Expanded lookbook routes have their own metadata and sitemap entries.
4. Administration: nine sections cover catalog/inventory, collections, responsive campaigns, journal scheduling, lookbook chapters/product points, store locations, payment/fulfilment operations, subscriber export and site settings. Image uploads validate actual image contents and preserve proportions. A requested local administrator is provisioned with generated credentials in an ignored file.
5. Checkout copy: one compact test notice on checkout; repeated test-mode wording was removed from confirmation, homepage answers and client-care flows. Technical test-card instructions stay in documentation.

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
- [x] Protected administrator workflows cover all nine sections. Upload access, disguised image rejection, journal scheduling, settings persistence, atomic chapter updates and payment-safe order operations are tested.
- [x] All 25 API integration tests and 30 desktop/mobile browser cases pass. Browser coverage includes shopping, image/frame geometry across the main routes, publishing uploaded images, settings hydration, shoppable chapter editing, store management and cancellation preserving the bag. The final responsive image optimization also passed its four targeted desktop/mobile checks.
- [x] Client and API builds pass; client ESLint and API type-aware lint pass.
- [x] Production dependency audits: zero reported vulnerabilities in both applications.
- [x] Lighthouse mobile homepage: Performance 93, Accessibility 100, Best Practices 100, SEO 100; cumulative layout shift 0.

The Lighthouse result was collected against the final redesigned production build at `http://localhost:3001` on 31 October 2026: FCP 0.9s, LCP 3.2s, total blocking time 50ms and CLS 0. Responsive sources supply intrinsic dimensions before download: delaying the mobile hero request preserved its 520px reserved height, with less than one pixel of rounding after decode. Final production smoke checks also confirmed nine working admin sections, 24 distinct primary product images, no page errors, no horizontal overflow and no text below 14px on desktop/mobile admin views. Scores vary with hosting, hardware and network conditions. Full local audit artifacts are written to `.data/quality/` by `npm --prefix Client run audit`.

## Deliberate limits

Checkout uses Stripe test mode, as requested in the revision. No real funds are charged, and email delivery or physical fulfilment is not connected. Newsletter signup persists addresses without an email provider. Brand narrative, locations and product photography are illustrative. Optional stretch features (visual search, appointments, multi-currency and 3D garments) are outside this MVP.

The full dependency audit still reports advisories in inherited development lint/deploy tooling. Runtime dependency audits are clean. No forced major downgrades of Next.js, ESLint or the Nest CLI were used.

Docker is not installed in the development environment, so the container image was not built here. The application builds and all integration checks were run directly on Windows with a real local PostgreSQL instance.

See [README.md](README.md) for setup, administrator provisioning, production environment configuration and test commands. See [ASSETS.md](ASSETS.md) for image provenance and the generated campaign prompt.
