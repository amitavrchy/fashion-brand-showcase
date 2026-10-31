# ATELIER LUNE

A complete contemporary fashion storefront built from [PROJECT_SPEC.md](Server/docs/PROJECT_SPEC.md). Next.js 16 / React 19 on the client; NestJS, Prisma and PostgreSQL on the API.

## Repository layout

```text
Client/     Storefront, assets, design documentation and browser checks
Server/     API, database, project documentation and workspace scripts
README.md   Shared setup and deployment guide
```

Each application has its own package manifest, lockfile, environment template and ignore/format configuration. Shared setup and development commands live in `Server/scripts/workspace`; there is no root npm package. Local screenshots and Lighthouse reports are ignored under `Client/.data`, while private payment review artifacts remain ignored under `Server/.data/review/stripe`.

## Run locally

Requires Node.js 22+ and npm. From the repository root:

```sh
npm --prefix Server run setup
```

This installs the locked dependencies, creates missing local environment files and generates a random JWT secret. It preserves existing environment files. If you already have `Server/.env`, ensure `JWT_SECRET` contains at least 32 random characters and is not the example placeholder.

Start PostgreSQL in one terminal:

```sh
npm --prefix Server run db:local
```

This runs a real, persistent PostgreSQL server on `127.0.0.1:5432`, stored under `Server/.data/postgres`. It is a local development convenience. Alternatively, use your own PostgreSQL instance or `docker compose -f Server/docker-compose.yml up -d`, and set `DATABASE_URL` in `Server/.env`. Only one database should use port 5432.

In another terminal:

```sh
npm --prefix Server run db:prepare
npm --prefix Server run dev:all
```

- Storefront: http://localhost:3000
- API health: http://127.0.0.1:4000/health
- Admin: http://localhost:3000/admin

The current review preview runs at **http://localhost:3001** because port 3000 is occupied. To use that port yourself, run `npm --prefix Client run dev -- --port 3001` and include `http://localhost:3001` in `CLIENT_ORIGIN`.

The Next.js server proxies `/api/*` to the API, so session cookies stay HTTP-only and same-origin. `API_URL` is a server-side environment variable. `CLIENT_ORIGIN` on the API is the exact allowed browser origin (comma-separated if several are required).

## Administrator access

The requested local administrator has been provisioned for this review. Open the ignored **`Server/.data/admin-access.txt`** file for its generated sign-in details, sign in at `/account`, then visit `/admin`. Credentials are never committed or printed in setup logs.

On a fresh local database, `npm --prefix Server run admin:local` creates an administrator with a random password and writes that private local file. It only accepts a local development database and leaves any existing administrator unchanged.

There are no default administrator credentials. Add `ADMIN_EMAIL` and `ADMIN_PASSWORD` (at least 12 characters) to your ignored `Server/.env`, then run:

```sh
npm --prefix Server run db:seed
```

Sign in through `/account`, then open `/admin`. Seeding is idempotent and preserves existing catalog edits. It creates an administrator only if that email does not already exist; it never promotes an existing customer or resets a password. Remove the provisioning variables after creating the account.

## What works

- Editorial campaign carousel, responsive mega-menu, material-aware search and newsletter persistence.
- Collections with URL-backed category, color, available-size filters, sorting and pagination.
- A new coastal campaign with dedicated desktop/mobile photography, intrinsic image proportions without letterbox backgrounds, 24 distinct garment photographs, zoom, keyboard-accessible variants, size guide, stock states and fabric/care accordions. Secondary-image hover is supported when administrators add another product view.
- Redux bag with local persistence, editable quantities and a focus-trapped drawer.
- Stripe-hosted test checkout, authoritative server prices, shipping calculation, stable retry keys and transactional stock reservations. Verified payment confirms the order; cancellation/expiry releases stock exactly once.
- Three shoppable lookbooks with thirteen chapters, GSAP horizontal desktop navigation, touch-friendly mobile chapters and product panels. Hotspots stay aligned with the complete photograph.
- Brand story, journal filtering/articles and city-filtered store locator with map directions.
- Registration/sign-in, HTTP-only JWT sessions, persistent authenticated wishlist and account order history.
- Nine protected management sections: products/variants, collections, desktop/mobile campaigns, journal publishing/scheduling, lookbooks with reorderable chapters and clickable product points, stores, order details and fulfilment, subscriber CSV export, and storefront settings. Product unpublishing preserves order history.
- Image uploads validate and re-encode JPEG/PNG/WebP photographs, strip metadata, preserve complete proportions and save to persistent local media storage. Storefront settings control the announcement, homepage introduction, newsletter and contact email.
- Self-hosted fonts, a 14px minimum UI text size, reduced-motion support, focus states, native accessible dialogs, product JSON-LD, metadata, sitemap and robots rules.
- 24 pieces across eight collections, twelve journal stories, six concept boutiques, material guides, wardrobe advice, brand stories and detailed care/service answers.

## Stripe test payments

Set `STRIPE_SECRET_KEY` to your Stripe **test** secret key in ignored `Server/.env`. Existing keys are preserved. Hosted Checkout handles card entry; the application never receives card numbers, and a publishable key is not needed for this redirect flow.

Keep the local webhook forwarder running in its own terminal **before starting the API**:

```sh
npm --prefix Server run stripe:listen
```

The wrapper uses the configured test key without printing it, forwards Checkout events to `http://127.0.0.1:4000/payments/webhook`, and saves the signing secret only to ignored `Server/.env`. Restart the API after the first connection or if that secret changes. No Stripe CLI login is required with the configured API key.

Complete checkout with Stripe test card `4242 4242 4242 4242`, any future expiry, and any three-digit CVC. Card `4000 0000 0000 0002` exercises a declined payment. Use fictitious customer details. No real money is charged. See [Stripe's testing guide](https://docs.stripe.com/testing).

The return page verifies the session with Stripe before showing success. Signed webhooks and periodic reconciliation also update orders when the browser closes. Receipt access requires the checkout browser's HTTP-only cookie or the owning account. Abandoned reservations expire after about 31 minutes and are reconciled every minute. Cancelling Checkout returns to a usable bag.

The storefront displays one compact test-payment notice on checkout. Confirmation pages use normal order language; test-card instructions are kept in developer documentation.

## Verification

Run PostgreSQL first. Integration and browser tests create separate databases ending in `_test`; they do not submit test orders to the development catalog. The configured database user must be able to create these test databases, or provision them beforehand.

```sh
npm --prefix Server run test:e2e
npm --prefix Client exec -- playwright install chromium
npm --prefix Client run test:e2e
```

The browser suite starts its own API on port 4002 and Next.js on port 3003, using a separate `.next-test` directory. Its dedicated browser test database is reset when the test server starts. The test-only administrator credentials in the browser fixture are never provisioned in the development database. Automated suites inject a fake Stripe gateway in the test bootstrap, verify signed fixture events and never spend real funds or require Stripe credentials. The production application has no fixture payment endpoints. Real Stripe test-card payment, signed local webhook, decline and cancellation are also checked separately.

```sh
npm --prefix Server run build:all
npm --prefix Client run lint
npm --prefix Server run lint
```

Verification results are recorded in [BUILD_PROGRESS.md](Server/docs/BUILD_PROGRESS.md). Run `npm --prefix Client run audit` against a running production preview to write a fresh HTML/JSON Lighthouse report to `Client/.data/quality/`; set `AUDIT_URL` when the preview uses port 3001. Scores depend on the deployment environment.

## Production configuration

Use managed PostgreSQL, apply `npm --prefix Server run db:migrate`, provision an administrator deliberately, and configure a strong `JWT_SECRET`. Set `NODE_ENV=production`, `HOST=0.0.0.0` when binding inside a container, `CLIENT_ORIGIN` to the HTTPS storefront origin, and `API_URL` on Next.js to the API origin. Set `NEXT_PUBLIC_SITE_URL` before the client build for canonical social and sitemap URLs. Production session cookies require HTTPS.

Build with `npm --prefix Server run build:all`; start each service with `npm --prefix Server run start:prod` and `npm --prefix Client start`. The API Dockerfile is built with `Server` as its context. Never expose the development database or its example credentials to the public internet.

Keep uploaded photography on durable storage. `MEDIA_DIRECTORY` defaults to `.data/uploads` under the server working directory; the Docker image uses `/app/.data/uploads` as a writable volume. Back up this directory with PostgreSQL, or supply your deployment's persistent media path. Deleting an editorial entry does not delete an uploaded file that another entry may still use.

Payments currently accept Stripe test keys only. For a deployed test environment, configure a Stripe endpoint at `https://<your-api>/payments/webhook` for `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded` and `checkout.session.async_payment_failed`, and set that endpoint's `STRIPE_WEBHOOK_SECRET`. The CLI secret belongs only to local forwarding. Live charging requires an intentional production payment rollout.

The application records test orders without arranging physical fulfilment or sending transactional emails. Newsletter signup persists the address; connecting an email provider is a future integration. Store locations, brand history and product imagery are concept content. Replace them with verified brand information before commercial launch. Asset provenance and generated campaign prompts are in [ASSETS.md](Client/docs/ASSETS.md).

The in-memory API rate limiter is suitable for a single instance. A multi-instance deployment should share rate-limit storage and configure proxy trust for its infrastructure.
