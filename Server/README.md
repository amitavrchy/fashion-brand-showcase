# Atelier Lune API

NestJS 12, Prisma 6 and PostgreSQL. See [the root README](../README.md) for complete setup and administrator provisioning.

```sh
npm run db:local
npm run db:migrate
npm run db:seed
npm run start:dev
```

Keep the database running in its own terminal. `db:local` is optional if you already have PostgreSQL. Production uses `npm run build` followed by `npm run start:prod`.

The public API exposes `/health`, `/catalog`, `/products/:slug`, `/lookbooks/:slug`, `/journal`, `/journal/:slug` and `/stores`. Session and account endpoints live under `/auth`, `/wishlist` and `/orders`; administrator CRUD lives under `/admin`. Non-GET operations validate DTOs, browser origins and rate limits.

```sh
npm run test:e2e
npm run lint
```

Integration tests use a separate database whose name ends in `_test`. Orders calculate their own prices, merge duplicate variants, decrement stock conditionally in one transaction and use an idempotency key. Checkout is a simulation and never collects payment information.
