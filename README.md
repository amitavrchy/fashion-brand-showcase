# Atelier Lune

Clothing as quiet architecture. A contemporary fashion storefront and the commerce API that serves it: editorial campaigns, shoppable lookbooks, and Stripe test checkout.

[![Next.js](https://img.shields.io/badge/Next.js-16-111111?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%20%7C%206-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-12-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%7C%2018-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Stripe](https://img.shields.io/badge/Stripe-test%20checkout-635BFF?logo=stripe&logoColor=white)](https://docs.stripe.com/testing)

## Live demo

> **TODO:** this repository has no public storefront or API URL yet.

Nothing in the GitHub homepage field, `netlify.toml`, `render.yaml`, the env examples, or the application code names a deployed origin. `CLIENT_ORIGIN` and the API base URL both default to localhost. Replace the placeholders below when the sites are published, and do not invent a host.

| Surface | URL |
| --- | --- |
| Storefront | **TODO** |
| API (`GET /health`) | **TODO** |

Until then, the local apps are:

- Storefront: http://localhost:3000
- Admin: http://localhost:3000/admin
- API health: http://127.0.0.1:4000/health

The storefront proxies `/api/*` to the API, so the browser stays on one origin and the session cookie stays HTTP-only.

## Overview

Atelier Lune is a two-part workspace for a concept fashion house.

**Client** is the public site and the atelier desk. It is a Next.js App Router application: campaigns, collections, product pages, journal, stores, account, bag, and a protected admin.

**Server** is the NestJS API. It owns the catalog, sessions, wishlist, orders, Stripe Checkout, and media uploads, with Prisma on PostgreSQL.

Catalog copy, photography, and boutique locations are concept content. Payments accept Stripe **test** keys only. The app does not fulfil physical orders or send email.

## Key features

- Editorial homepage with a campaign carousel, mega-menu, search, and a saved newsletter address.
- Eight collections, filters, sort, pagination, and product pages with variants, stock, size guide, and zoom.
- A bag that persists locally, plus Stripe-hosted test checkout. Prices and stock reservations are decided on the server.
- Three shoppable lookbooks, a journal, a brand story, and a city-filtered store locator.
- Accounts with HTTP-only JWT sessions, a wishlist, and order history.
- An admin for products, collections, campaigns, journal, lookbooks, stores, orders, subscribers, and storefront copy. Uploads are re-encoded to metadata-free WebP.
- Accessible UI: self-hosted type, a 14px minimum, reduced motion, focus states, and product structured data.

## Tech stack

| | Storefront (`Client`) | API (`Server`) |
| --- | --- | --- |
| Runtime | Node.js 22, Next.js 16, React 19 | Node.js 22, NestJS 12 |
| Language | TypeScript | TypeScript |
| UI | Tailwind CSS 4, Framer Motion, GSAP, Lenis, Embla | — |
| Data | Redux Toolkit, React Query, React Hook Form, Zod | Prisma 6, PostgreSQL 16 (Docker) or 18 (`db:local`) |
| Payments | Hosted Checkout return page | Stripe test mode, signed webhooks |
| Quality | ESLint, Playwright | oxlint, Vitest |

## Project structure

Application code already lives in two folders. The names are `Client` and `Server` (the storefront and the API). Root holds only files that belong to the repository or to a host that reads them from the repository root.

```text
.
├── Client/                 Next.js storefront, public images, browser tests
│   ├── src/                App Router pages, components, and data helpers
│   ├── public/images/      Campaign and product photography
│   ├── e2e/                Playwright
│   ├── docs/               Asset notes
│   ├── .env.example
│   └── package.json
├── Server/                 NestJS API, Prisma schema, local database scripts
│   ├── src/                HTTP API, auth, catalog, payments, admin
│   ├── prisma/             Schema, migrations, and seed
│   ├── scripts/            Local Postgres, Stripe listen, workspace helpers
│   ├── test/               API end-to-end checks
│   ├── docs/               Product spec and build notes
│   ├── Dockerfile          API image
│   ├── Dockerfile.render   API image with Postgres for Render
│   ├── .env.example
│   └── package.json
├── netlify.toml            Netlify build for the storefront (must stay here)
├── render.yaml             Render blueprint for the API (must stay here)
├── .gitignore
└── README.md
```

`netlify.toml` sets the Netlify base directory to `Client`. `render.yaml` points Render at `Server/Dockerfile.render` with `Server` as the Docker context. Moving either file off the repository root would hide it from that host.

There is no root `package.json`. Shared commands live in `Server/scripts/workspace` and are invoked with `npm --prefix Server`.

## Getting started

Requires Node.js 22 or newer, and npm. PostgreSQL can be the built-in local server, Docker, or an instance you already run. Only one server should bind `127.0.0.1:5432`.

### Storefront

```sh
cd Client
cp .env.example .env.local
npm ci
npm run dev
```

| Variable | Role |
| --- | --- |
| `API_URL` | Server-side origin of the API. Default `http://127.0.0.1:4000`. |
| `NEXT_PUBLIC_API_URL` | Same origin, available to the browser bundle. |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL used for metadata, sitemap, and robots. |
| `SITE_URL` | Companion site URL. Keep it aligned with `NEXT_PUBLIC_SITE_URL`. |

`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is listed in `.env.example` and can stay empty. Checkout uses a Stripe-hosted redirect, so the secret key lives only on the API.

```sh
npm run lint          # ESLint
npx tsc --noEmit      # types (Next.js also typechecks during build)
npm run build
npm start             # http://localhost:3000
npm run test:e2e      # installs Chromium on first run: npx playwright install chromium
```

Details: [Client/README.md](Client/README.md).

### API

```sh
cd Server
cp .env.example .env
npm install
```

`npm ci` in `Server` fails on npm 10: the lockfile does not record the optional peer `magicast@0.3.5`. `npm install` matches the Render image (`Dockerfile.render`) and is the install to use. `npm --prefix Server run setup` copies missing env files and then runs `npm ci` in both apps, so prefer the commands in this section.

Set `JWT_SECRET` in `Server/.env` to at least 32 random characters. The example placeholder is rejected on startup.

| Variable | Role |
| --- | --- |
| `DATABASE_URL` | Local default: `postgresql://postgres:postgres@localhost:5432/fashion_brand_showcase?schema=public` |
| `JWT_SECRET` | Session signing secret. 32+ random characters. |
| `PORT` | `4000` |
| `HOST` | `127.0.0.1` locally. Use `0.0.0.0` in a container. |
| `CLIENT_ORIGIN` | Exact browser origin allowed by CORS. Comma-separate several. |
| `STRIPE_SECRET_KEY` | Stripe **test** secret. Leave empty until you exercise checkout. |
| `STRIPE_WEBHOOK_SECRET` | Written by `npm run stripe:listen` for local forwarding. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Optional one-time seed of an administrator. Password at least 12 characters. No default account exists. |

Start a database, then the API:

```sh
npm run db:local      # embedded PostgreSQL on 127.0.0.1:5432, data in Server/.data/postgres
npm run db:prepare    # prisma migrate deploy, then seed
npm run start:dev     # http://127.0.0.1:4000/health
```

`db:local` is optional when PostgreSQL is already running. Docker alternative, from the repository root:

```sh
docker compose -f Server/docker-compose.yml up -d
```

That Compose file uses Postgres 16 and the database name `fashion_brand_showcase`. `npm run db:local` uses the embedded-postgres 18 package instead.

```sh
npm run lint          # oxlint, type-aware
npm run build         # nest build (tsc)
npm run start:prod    # node dist/main.js — needs a reachable DATABASE_URL
npm test              # vitest
npm run test:e2e      # builds, then API tests against a separate *_test database
```

Seed an administrator only when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set. Seeding is idempotent: it does not reset an existing password. Sign in at `/account`, then open `/admin`. For a local-only account with a generated password, `npm run admin:local` writes `Server/.data/admin-access.txt`. That file is gitignored.

Stripe test cards and webhook forwarding are documented in [Server/README.md](Server/README.md). Test card `4242 4242 4242 4242` never charges a real card. See [Stripe's testing guide](https://docs.stripe.com/testing).

### Both applications

With Postgres running and `Server/.env` in place:

```sh
npm --prefix Server run db:prepare
npm --prefix Server run dev:all
```

`dev:all` starts the API watcher and `next dev` together. `npm --prefix Server run build:all` builds the API and then the storefront.

## Production

Two hosts are configured. Neither file contains a live URL.

**Storefront — Netlify.** `netlify.toml` at the repository root builds `Client` with Node 22 (`npm ci && npm run build`) and the Next.js runtime plugin. In the Netlify UI, set:

- `API_URL` to the deployed API origin
- `NEXT_PUBLIC_SITE_URL` to the storefront origin (set it before the production build)

Leave the UI base directory empty. The toml already sets `base = "Client"`. Setting the UI base to `Client` as well stacks the path.

**API — Render.** `render.yaml` defines a Docker web service, `atelier-lune-api`, in Oregon, from `Server/Dockerfile.render`. `CLIENT_ORIGIN` is `sync: false`: set it in the Render dashboard to the exact storefront origin (for example the Netlify URL, once that exists). `JWT_SECRET` and `JWT_REFRESH_SECRET` are generated by Render. The bundled Postgres password in that blueprint is for the free single-container preview; put a managed database and a strong secret in front of any public launch.

Also set `NODE_ENV=production`. Session cookies require HTTPS. Uploaded images default to `.data/uploads` (Docker: `/app/.data/uploads`) and need durable storage. The in-memory rate limiter is for one instance.

## Author

[Amitav Roy Chowdhury](https://github.com/amitavrchy)

## License

No `LICENSE` file is included. `Server/package.json` is `"license": "UNLICENSED"`. All rights reserved.
