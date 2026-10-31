# Atelier Lune API

NestJS 12, Prisma 6 and PostgreSQL. See [the root README](../README.md) for complete setup and administrator provisioning.

```sh
npm run db:local
npm run db:migrate
npm run db:seed
npm run start:dev
```

Keep the database running in its own terminal. `db:local` is optional if you already have PostgreSQL. Production uses `npm run build` followed by `npm run start:prod`.

The public API exposes `/health`, `/catalog`, `/products/:slug`, `/lookbooks`, `/lookbooks/:slug`, `/journal`, `/journal/:slug` and `/stores`. Session and account endpoints live under `/auth`, `/wishlist` and `/orders`; administrator CRUD lives under `/admin`. Non-GET operations validate DTOs, browser origins and rate limits.

```sh
npm run test:e2e
npm run lint
```

Integration tests use a separate database whose name ends in `_test` and inject a fake Stripe gateway only in the test bootstrap. Orders calculate their own prices, merge duplicate variants, reserve stock conditionally in one transaction and use an idempotency key shared with Stripe session creation.

`POST /orders` starts Stripe-hosted test Checkout. `GET /payments/checkout/:sessionId` verifies the payment and authorizes the receipt using an HTTP-only checkout cookie or the owning account. `POST /payments/cancel/:orderId` safely expires an unpaid session and restores stock once. `POST /payments/webhook` verifies the Stripe signature against the raw request body, then retrieves the session to verify its order, amount, currency and test mode. Private responses are not cacheable. A minute-based reconciliation also handles expired sessions and missed webhooks.

Set `STRIPE_SECRET_KEY` in ignored `.env`, then run `npm run stripe:listen` in a separate terminal. The wrapper saves the local webhook signing secret without printing it. Start/restart the API after the secret is configured. See the root README for test cards, deployment webhook configuration and limitations. Card numbers never pass through this API.
