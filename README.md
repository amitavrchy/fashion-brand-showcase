# ATELIER LUNE

A complete contemporary fashion storefront built from [PROJECT_SPEC.md](PROJECT_SPEC.md). Next.js 16 / React 19 on the client; NestJS, Prisma and PostgreSQL on the API.

## Run locally

Requires Node.js 22+ and npm. From the repository root:

```sh
npm run setup
```

This installs the locked dependencies, creates missing local environment files and generates a random JWT secret. It preserves existing environment files. If you already have `Server/.env`, ensure `JWT_SECRET` contains at least 32 random characters and is not the example placeholder.

Start PostgreSQL in one terminal:

```sh
npm run db
```

This runs a real, persistent PostgreSQL server on `127.0.0.1:5432`, stored under `Server/.data/postgres`. It is a local development convenience. Alternatively, use your own PostgreSQL instance or `docker compose -f Server/docker-compose.yml up -d`, and set `DATABASE_URL` in `Server/.env`. Only one database should use port 5432.

In another terminal:

```sh
npm run db:prepare
npm run dev
```

- Storefront: http://localhost:3000
- API health: http://127.0.0.1:4000/health
- Admin: http://localhost:3000/admin

The Next.js server proxies `/api/*` to the API, so session cookies stay HTTP-only and same-origin. `API_URL` is a server-side environment variable. `CLIENT_ORIGIN` on the API is the exact allowed browser origin (comma-separated if several are required).

## Administrator access

There are no default administrator credentials. Add `ADMIN_EMAIL` and `ADMIN_PASSWORD` (at least 12 characters) to your ignored `Server/.env`, then run:

```sh
npm --prefix Server run db:seed
```

Sign in through `/account`, then open `/admin`. Seeding is idempotent and preserves existing catalog edits. It creates an administrator only if that email does not already exist; it never promotes an existing customer or resets a password. Remove the provisioning variables after creating the account.

## What works

- Editorial campaign carousel, responsive mega-menu, material-aware search and newsletter persistence.
- Collections with URL-backed category, color, available-size filters, sorting and pagination.
- Product images with a second-image hover, zoom, keyboard-accessible variants, size guide, stock states and fabric/care accordions.
- Redux bag with local persistence, editable quantities and a focus-trapped drawer.
- Validated mock checkout, authoritative server prices, shipping calculation, idempotency and transactional stock decrement.
- Shoppable lookbook with GSAP horizontal desktop chapters, touch-friendly mobile chapters and product panels.
- Brand story, journal filtering/articles and city-filtered store locator with map directions.
- Registration/sign-in, HTTP-only JWT sessions, persistent authenticated wishlist and account order history.
- Protected product/variant, collection and campaign administration. Unpublishing preserves order history.
- Self-hosted fonts, a 14px minimum UI text size, reduced-motion support, focus states, native accessible dialogs, product JSON-LD, metadata, sitemap and robots rules.

## Verification

Run PostgreSQL first. Integration and browser tests create separate databases ending in `_test`; they do not submit test orders to the development catalog. The configured database user must be able to create these test databases, or provision them beforehand.

```sh
npm --prefix Server run test:e2e
npm --prefix Client exec -- playwright install chromium
npm --prefix Client run test:e2e
```

The browser suite starts its own API on port 4002 and Next.js on port 3003, using a separate `.next-test` directory. Its dedicated browser test database is reset when the test server starts. The test-only administrator credentials in the browser fixture are never provisioned in the development database.

```sh
npm run build
npm --prefix Client run lint
npm --prefix Server run lint
```

Verified: 11 API integration tests and 18 desktop/mobile browser tests pass. Production dependency audits are clean. The local production homepage scores **92 Performance / 100 Accessibility / 100 Best Practices / 100 SEO** in Lighthouse mobile, with zero layout shift. Run `npm --prefix Client run audit` against a running production preview to write a fresh HTML/JSON report to `.data/quality/`. Scores depend on the deployment environment. Detailed acceptance results are in [BUILD_PROGRESS.md](BUILD_PROGRESS.md).

## Production configuration

Use managed PostgreSQL, apply `npm --prefix Server run db:migrate`, provision an administrator deliberately, and configure a strong `JWT_SECRET`. Set `NODE_ENV=production`, `HOST=0.0.0.0` when binding inside a container, `CLIENT_ORIGIN` to the HTTPS storefront origin, and `API_URL` on Next.js to the API origin. Set `NEXT_PUBLIC_SITE_URL` before the client build for canonical social and sitemap URLs. Production session cookies require HTTPS.

Build with `npm run build`; start each service with `npm --prefix Server run start:prod` and `npm --prefix Client start`. The API Dockerfile is built with `Server` as its context. Never expose the development database or its example credentials to the public internet.

Checkout is intentionally a simulation: it takes no payment details, sends no email, and arranges no physical fulfilment. Newsletter signup persists the address; connecting an email provider is a future integration. Store locations, brand history and product imagery are concept content. Replace them with verified brand information before commercial launch. Asset provenance and the generated campaign prompt are in [ASSETS.md](ASSETS.md).

The in-memory API rate limiter is suitable for a single instance. A multi-instance deployment should share rate-limit storage and configure proxy trust for its infrastructure.
