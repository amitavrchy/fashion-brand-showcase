# ATELIER LUNE implementation

Source of truth: [PROJECT_SPEC.md](PROJECT_SPEC.md).

## Delivery stages

1. Database schema, curated seed catalog and API foundations.
2. Authentication, persistent wishlist, transactional orders and protected administration.
3. Brand design system, responsive shell and editorial home.
4. Collection filtering, product details, bag and mock checkout.
5. Interactive lookbook, journal, stores and brand story.
6. Account, administration, accessibility, motion and SEO.
7. Integration checks, browser verification and setup documentation.

Each meaningful stage is committed and pushed separately. All interface text has a minimum size of 14px. Checkout is explicitly a simulation; no payment details are collected.

## Verification

- [x] PostgreSQL schema, migration and idempotent seed: 3 collections, 8 products, 2 campaigns, 3 lookbook chapters, 3 journal stories and 3 store references.
- [x] Transactional stock checks prevent overselling; a failed line rolls the whole order back.
- [x] Checkout prices and shipping are calculated by the API; retries are idempotent.
- [x] Lookbook hotspots open a product mini-panel.
- [x] Signed-in wishlist survives sign-out and a new session.
- [x] Embla campaign responds to actual mouse dragging and native touch swiping.
- [x] Reduced motion disables curtain wipes and smooth scrolling.
- [x] Desktop and mobile checks found no horizontal overflow or visible text below 14px on the main routes.
- [x] Protected administrator product, variant, collection and campaign workflows.
- [x] 11 API integration tests and 18 Chromium browser tests pass, using isolated test databases.
- [x] Client and API builds pass; client ESLint and API type-aware lint pass.
- [x] Production dependency audits: zero reported vulnerabilities in both applications.
- [x] Lighthouse mobile homepage: Performance 92, Accessibility 100, Best Practices 100, SEO 100; cumulative layout shift 0.

The Lighthouse result was collected locally against the production build on 31 October 2026. Scores vary with hosting, hardware and network conditions. Full local audit artifacts are written to `.data/quality/` by `npm --prefix Client run audit`.

## Deliberate limits

Checkout remains a mock, as specified: no charge, payment information, email delivery or physical fulfilment. Newsletter signup persists addresses without an email provider. Brand narrative, locations and product photography are illustrative. Optional stretch features (visual search, appointments, multi-currency and 3D garments) are outside this MVP.

The full dependency audit still reports advisories in inherited development lint/deploy tooling. Runtime dependency audits are clean. No forced major downgrades of Next.js, ESLint or the Nest CLI were used.

Docker is not installed in the development environment, so the container image was not built here. The application builds and all integration checks were run directly on Windows with a real local PostgreSQL instance.

See [README.md](README.md) for setup, administrator provisioning, production environment configuration and test commands. See [ASSETS.md](ASSETS.md) for image provenance and the generated campaign prompt.
