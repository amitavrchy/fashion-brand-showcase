import { Test } from '@nestjs/testing';
import { FakeStripeGateway, signedEvent } from './fake-stripe.mjs';
import { PrismaClient } from '@prisma/client';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

assert.ok(process.env.DATABASE_URL, 'Set DATABASE_URL in Server/.env.');
const url = new URL(process.env.DATABASE_URL);
url.pathname = '/fashion_brand_showcase_browser_test';
const operator = new PrismaClient();
const exists =
  await operator.$queryRaw`SELECT 1 FROM pg_database WHERE datname = 'fashion_brand_showcase_browser_test'`;
if (!exists.length)
  await operator.$executeRawUnsafe(
    'CREATE DATABASE "fashion_brand_showcase_browser_test"',
  );
await operator.$disconnect();
process.env.DATABASE_URL = url.href;
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'browser-tests-only-secret-at-least-32-characters';
process.env.ADMIN_EMAIL = 'browser-admin@example.test';
process.env.ADMIN_PASSWORD = 'Browser-tests-only-2026';
process.env.CLIENT_ORIGIN = 'http://localhost:3003';
for (const args of [
  ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
  ['prisma/seed.mjs'],
]) {
  const result = spawnSync(process.execPath, args, {
    env: process.env,
    stdio: 'inherit',
  });
  assert.equal(result.status, 0);
}
const db = new PrismaClient({ datasourceUrl: url.href });
// This reset is limited to the named, dedicated browser test database above.
await db.order.deleteMany();
await db.variant.updateMany({ data: { stock: 8 } });
await db.variant.updateMany({
  where: { id: { endsWith: '-0-4' } },
  data: { stock: 0 },
});
await db.campaign.update({
  where: { id: 'campaign-aw' },
  data: { image: '/images/campaign-editorial.webp' },
});
await db.productMedia.updateMany({
  where: { productId: 'p-coat', sortOrder: 0 },
  data: { url: '/images/campaign-editorial.webp' },
});
await db.$disconnect();
const { configureApplication } = await import('../dist/bootstrap.js');
const { AppModule } = await import('../dist/app.module.js');
const { StripeGateway } = await import('../dist/shop/stripe.gateway.js');
const fakeStripe = new FakeStripeGateway();
const module = await Test.createTestingModule({ imports: [AppModule] })
  .overrideProvider(StripeGateway)
  .useValue(fakeStripe)
  .compile();
const app = configureApplication(
  module.createNestApplication({ rawBody: true, logger: false }),
);
app
  .getHttpAdapter()
  .getInstance()
  .post('/__test/pay/:sessionId', async (req, res) => {
    try {
      const session = await fakeStripe.pay(req.params.sessionId);
      const { payload, signature } = signedEvent(session);
      const { PaymentsService } =
        await import('../dist/shop/payments.service.js');
      await app.get(PaymentsService).webhook(Buffer.from(payload), signature);
      res.json({ url: session.success_url });
    } catch {
      res.status(500).json({ message: 'Test fixture failed.' });
    }
  });
await app.listen(4002, '127.0.0.1');
console.log('Browser test API ready on port 4002 (isolated test database).');
