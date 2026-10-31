import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { FakeStripeGateway, signedEvent } from './fake-stripe.mjs';
import sharp from 'sharp';
import { unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
const fakeStripe = new FakeStripeGateway();

const originalUrl = process.env.DATABASE_URL;
assert.ok(
  originalUrl,
  'DATABASE_URL is required. Copy .env.example to .env first.',
);
const databaseUrl = new URL(process.env.TEST_DATABASE_URL || originalUrl);
if (!process.env.TEST_DATABASE_URL)
  databaseUrl.pathname = '/fashion_brand_showcase_test';
const databaseName = databaseUrl.pathname.slice(1);
assert.match(
  databaseName,
  /^[a-zA-Z0-9_]+_test$/,
  'Integration tests only run against a dedicated database ending in _test.',
);
const operator = new PrismaClient({ datasourceUrl: originalUrl });
const exists =
  await operator.$queryRaw`SELECT 1 FROM pg_database WHERE datname = ${databaseName}`;
if (!exists.length)
  await operator.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
await operator.$disconnect();
process.env.DATABASE_URL = databaseUrl.href;
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'integration-tests-only-secret-that-is-long-enough';
const runId = randomUUID().slice(0, 8);
process.env.MEDIA_DIRECTORY = resolve(`.data/api-test-uploads-${runId}`);
process.env.ADMIN_EMAIL = `admin-${runId}@example.test`;
process.env.ADMIN_PASSWORD = `Admin-${randomUUID()}`;
for (const args of [
  ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
  ['prisma/seed.mjs'],
]) {
  const result = spawnSync(process.execPath, args, {
    env: process.env,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, `Database setup failed: ${result.stderr}`);
}
const db = new PrismaClient({ datasourceUrl: databaseUrl.href });
let app, base, customerCookie, adminCookie, catalog;
const email = `customer-${runId}@example.test`;
const password = `Customer-${randomUUID()}`;
const stockBefore = new Map();
const fixtureProducts = [];
const fixtureCollections = [];
const fixtureCampaigns = [];
const shipping = {
  name: 'Test Customer',
  address: '12 Sample Street',
  city: 'Paris',
  postalCode: '75003',
  country: 'France',
};
async function call(path, { method = 'GET', data, cookie, origin } = {}) {
  const response = await fetch(`${base}/${path}`, {
    method,
    headers: {
      ...(data ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...(origin ? { Origin: origin } : {}),
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  return {
    status: response.status,
    data: await response.json(),
    cookie: response.headers.get('set-cookie')?.split(';')[0],
    headers: response.headers,
  };
}
const orderData = (items, extra = {}) => ({
  email,
  items,
  shipping,
  idempotencyKey: randomUUID(),
  ...extra,
});
before(async () => {
  const { configureApplication } = await import('../dist/bootstrap.js');
  const { AppModule } = await import('../dist/app.module.js');
  const { StripeGateway } = await import('../dist/shop/stripe.gateway.js');
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(StripeGateway)
    .useValue(fakeStripe)
    .compile();
  app = configureApplication(
    module.createNestApplication({ rawBody: true, logger: false }),
  );
  await app.listen(0, '127.0.0.1');
  base = await app.getUrl();
  catalog = (await call('catalog')).data;
  for (const variant of catalog.products.flatMap((p) => p.variants))
    stockBefore.set(variant.id, variant.stock);
});
after(async () => {
  await db.order.deleteMany({ where: { email } });
  await db.user.deleteMany({
    where: { email: { in: [email, process.env.ADMIN_EMAIL] } },
  });
  await db.newsletterSubscriber.deleteMany({ where: { email } });
  for (const [id, stock] of stockBefore)
    await db.variant.update({ where: { id }, data: { stock } });
  await db.product.deleteMany({ where: { id: { in: fixtureProducts } } });
  await db.collection.deleteMany({ where: { id: { in: fixtureCollections } } });
  await db.campaign.deleteMany({ where: { id: { in: fixtureCampaigns } } });
  await db.$disconnect();
  await app?.close();
});
void test('seeded public catalog, lookbook, stores and journal resolve with their relations', async () => {
  assert.ok(catalog.products.length >= 8);
  assert.ok(catalog.collections.length >= 3);
  assert.ok(catalog.campaigns.length >= 2);
  assert.ok(catalog.products.every((p) => p.variants.length && p.media.length));
  assert.equal((await call('products/the-sculpted-coat')).status, 200);
  const look = await call('lookbooks/a-study-in-stillness');
  assert.equal(look.data.chapters.length, 5);
  assert.ok(look.data.chapters[0].hotspots[0].product.slug);
  assert.equal((await call('stores')).data.length, 6);
  assert.equal((await call('journal')).data.length, 12);
  assert.equal((await call('products/missing-piece')).status, 404);
});
void test('validation rejects missing shipping, unknown fields and invalid newsletter emails', async () => {
  const { shipping: _, ...invalid } = orderData([
    { variantId: 'p-coat-0-0', quantity: 1 },
  ]);
  assert.equal(
    (await call('orders', { method: 'POST', data: invalid })).status,
    400,
  );
  assert.equal(
    (
      await call('orders', {
        method: 'POST',
        data: orderData([{ variantId: 'p-coat-0-0', quantity: 1 }], {
          total: 0.01,
        }),
      })
    ).status,
    400,
  );
  assert.equal(
    (await call('newsletter', { method: 'POST', data: { email: 'invalid' } }))
      .status,
    400,
  );
  assert.equal(
    (
      await call('auth/register', {
        method: 'POST',
        data: { name: '  ', email, password },
      })
    ).status,
    400,
  );
});
void test('accounts use HTTP-only sessions, prevent privilege escalation, and protect administrator routes', async () => {
  assert.equal((await call('admin')).status, 401);
  const registration = await call('auth/register', {
    method: 'POST',
    data: { name: 'Test Customer', email, password },
  });
  assert.equal(registration.status, 201);
  assert.equal(registration.data.role, 'CUSTOMER');
  assert.ok(!('passwordHash' in registration.data));
  assert.match(registration.headers.get('set-cookie'), /HttpOnly/);
  customerCookie = registration.cookie;
  assert.equal(
    (await call('auth/me', { cookie: customerCookie })).data.email,
    email,
  );
  assert.equal((await call('admin', { cookie: customerCookie })).status, 403);
  assert.equal(
    (
      await call('auth/register', {
        method: 'POST',
        data: {
          name: 'Escalation',
          email: 'escalation@example.test',
          password,
          role: 'ADMIN',
        },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call('auth/login', {
        method: 'POST',
        data: { email, password: 'wrong-password' },
      })
    ).status,
    401,
  );
  const admin = await call('auth/login', {
    method: 'POST',
    data: {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    },
  });
  assert.equal(admin.status, 200);
  adminCookie = admin.cookie;
  assert.equal((await call('admin', { cookie: adminCookie })).status, 200);
});
void test('authenticated wishlist survives a fresh sign-in and can remove saved pieces', async () => {
  assert.equal(
    (await call('wishlist/p-coat', { method: 'PUT', cookie: customerCookie }))
      .status,
    200,
  );
  await call('auth/logout', { method: 'POST', cookie: customerCookie });
  const login = await call('auth/login', {
    method: 'POST',
    data: { email, password },
  });
  customerCookie = login.cookie;
  assert.equal(
    (await call('wishlist', { cookie: customerCookie })).data[0].id,
    'p-coat',
  );
  assert.equal(
    (
      await call('wishlist/p-coat', {
        method: 'DELETE',
        cookie: customerCookie,
      })
    ).status,
    200,
  );
  assert.equal(
    (await call('wishlist', { cookie: customerCookie })).data.length,
    0,
  );
});
void test('cross-origin mutations are rejected and security headers are present', async () => {
  assert.equal(
    (
      await call('newsletter', {
        method: 'POST',
        origin: 'https://attacker.example',
        data: { email },
      })
    ).status,
    403,
  );
  assert.equal(
    (await call('health')).headers.get('x-content-type-options'),
    'nosniff',
  );
});
void test('newsletter signup is idempotent', async () => {
  assert.equal(
    (await call('newsletter', { method: 'POST', data: { email } })).status,
    201,
  );
  assert.equal(
    (await call('newsletter', { method: 'POST', data: { email } })).status,
    201,
  );
  assert.equal(await db.newsletterSubscriber.count({ where: { email } }), 1);
});
void test('checkout calculates authoritative prices, decrements stock once, and links signed-in orders', async () => {
  const variantId = 'p-coat-0-0';
  const beforeStock = (
    await db.variant.findUnique({ where: { id: variantId } })
  ).stock;
  const payload = orderData([{ variantId, quantity: 1 }]);
  const first = await call('orders', {
    method: 'POST',
    cookie: customerCookie,
    data: payload,
  });
  assert.equal(first.status, 201);
  assert.equal(Number(first.data.total), 485);
  assert.equal(first.data.status, 'PENDING');
  assert.equal(first.data.shippingJson.shippingCost, 0);
  const repeat = await call('orders', {
    method: 'POST',
    cookie: customerCookie,
    data: payload,
  });
  assert.equal(repeat.data.id, first.data.id);
  assert.equal(
    (await db.variant.findUnique({ where: { id: variantId } })).stock,
    beforeStock - 1,
  );
  assert.ok(
    (await call('orders', { cookie: customerCookie })).data.some(
      (o) => o.id === first.data.id,
    ),
  );
  assert.equal(
    (
      await call('orders', {
        method: 'POST',
        data: { ...payload, email: 'other@example.test' },
      })
    ).status,
    409,
  );
});
void test('out-of-stock line rolls back earlier stock decrements in the same order', async () => {
  const variantId = 'p-coat-0-1';
  const beforeStock = (
    await db.variant.findUnique({ where: { id: variantId } })
  ).stock;
  const response = await call('orders', {
    method: 'POST',
    data: orderData([
      { variantId, quantity: 1 },
      { variantId: 'p-coat-0-4', quantity: 1 },
    ]),
  });
  assert.equal(response.status, 409);
  assert.equal(
    (await db.variant.findUnique({ where: { id: variantId } })).stock,
    beforeStock,
  );
});
void test('two simultaneous orders for the final item produce one order and never negative stock', async () => {
  const variantId = 'p-knit-0-0';
  await db.variant.update({ where: { id: variantId }, data: { stock: 1 } });
  const attempts = await Promise.all([
    call('orders', {
      method: 'POST',
      data: orderData([{ variantId, quantity: 1 }]),
    }),
    call('orders', {
      method: 'POST',
      data: orderData([{ variantId, quantity: 1 }]),
    }),
  ]);
  assert.deepEqual(
    attempts.map((r) => r.status).sort((a, b) => a - b),
    [201, 409],
  );
  assert.equal(
    (await db.variant.findUnique({ where: { id: variantId } })).stock,
    0,
  );
  const success = attempts.find((r) => r.status === 201);
  assert.equal(
    Number(success.data.total),
    260,
    'Orders below €300 include €15 shipping.',
  );
});
void test('duplicate variants are merged and aggregate quantity limits cannot be bypassed', async () => {
  const response = await call('orders', {
    method: 'POST',
    data: orderData([
      { variantId: 'p-bag-0-0', quantity: 6 },
      { variantId: 'p-bag-0-0', quantity: 6 },
    ]),
  });
  assert.equal(response.status, 400);
});
void test('administrator product, collection and campaign CRUD remains reflected in the catalog', async () => {
  const collection = await call('admin/collections', {
    method: 'POST',
    cookie: adminCookie,
    data: {
      title: 'Integration collection',
      slug: `integration-${runId}`,
      description: 'A collection created for integration verification.',
      heroImage: '/images/coat.jpg',
      season: 'Test season',
    },
  });
  assert.equal(collection.status, 201);
  fixtureCollections.push(collection.data.id);
  const payload = {
    name: 'Integration piece',
    slug: `integration-piece-${runId}`,
    description: 'A considered piece created for integration verification.',
    category: 'Essentials',
    fabric: 'Organic cotton',
    care: 'Wash gently.',
    price: 125,
    collectionId: collection.data.id,
    published: true,
    media: [{ url: '/images/knit.jpg', alt: 'Integration product front view' }],
    variants: [{ colorName: 'Sand', colorHex: '#C7B79E', size: 'M', stock: 4 }],
  };
  const product = await call('admin/products', {
    method: 'POST',
    cookie: adminCookie,
    data: payload,
  });
  assert.equal(product.status, 201);
  fixtureProducts.push(product.data.id);
  const updated = await call(`admin/products/${product.data.id}`, {
    method: 'PUT',
    cookie: adminCookie,
    data: { ...payload, price: 135 },
  });
  assert.equal(updated.status, 200);
  assert.equal(
    updated.data.variants[0].id,
    product.data.variants[0].id,
    'Edits preserve existing bag variant identities.',
  );
  assert.equal(
    Number((await call(`products/${payload.slug}`)).data.price),
    135,
  );
  assert.equal(
    (
      await call(`admin/products/${product.data.id}`, {
        method: 'DELETE',
        cookie: adminCookie,
      })
    ).status,
    200,
  );
  assert.equal((await call(`products/${payload.slug}`)).status, 404);
  const campaign = await call('admin/campaigns', {
    method: 'POST',
    cookie: adminCookie,
    data: {
      title: 'Integration campaign',
      subtitle: 'TEST COLLECTION',
      image: '/images/coat.jpg',
      link: '/collections',
      accent: '#5C1F1F',
      active: true,
    },
  });
  assert.equal(campaign.status, 201);
  fixtureCampaigns.push(campaign.data.id);
  assert.ok(
    (await call('catalog')).data.campaigns.some(
      (c) => c.id === campaign.data.id,
    ),
  );
  assert.equal(
    (
      await call(`admin/campaigns/${campaign.data.id}`, {
        method: 'DELETE',
        cookie: adminCookie,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await call(`admin/collections/${collection.data.id}`, {
        method: 'DELETE',
        cookie: adminCookie,
      })
    ).status,
    200,
  );
});

async function deliverEvent(session, type) {
  const event = signedEvent(session, type);
  const response = await fetch(`${base}/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': event.signature,
    },
    body: event.payload,
  });
  return { status: response.status, data: await response.json() };
}
void test('unsigned payment webhooks are rejected', async () => {
  assert.equal(
    (
      await call('payments/webhook', {
        method: 'POST',
        data: { type: 'checkout.session.completed' },
      })
    ).status,
    400,
  );
});
void test('only verified paid sessions confirm an order; duplicate webhooks never decrement twice', async () => {
  const variantId = 'p-shirt-0-0';
  const beforeStock = (
    await db.variant.findUnique({ where: { id: variantId } })
  ).stock;
  const checkout = await call('orders', {
    method: 'POST',
    data: orderData([{ variantId, quantity: 1 }]),
  });
  assert.equal(checkout.status, 201);
  assert.equal(
    (await call(`payments/checkout/${checkout.data.sessionId}`)).status,
    403,
  );
  const unpaid = await fakeStripe.retrieve(checkout.data.sessionId);
  assert.equal((await deliverEvent(unpaid)).status, 200);
  assert.equal(
    (await db.order.findUnique({ where: { id: checkout.data.id } })).status,
    'PENDING',
  );
  const paid = await fakeStripe.pay(checkout.data.sessionId);
  assert.equal((await deliverEvent(paid)).status, 200);
  const confirmed = await db.order.findUnique({
    where: { id: checkout.data.id },
  });
  assert.equal(confirmed.status, 'PAID');
  assert.ok(confirmed.paidAt);
  assert.equal((await deliverEvent(paid)).status, 200);
  assert.equal(
    (
      await db.order.findUnique({ where: { id: checkout.data.id } })
    ).paidAt.getTime(),
    confirmed.paidAt.getTime(),
  );
  assert.equal(
    (await db.variant.findUnique({ where: { id: variantId } })).stock,
    beforeStock - 1,
  );
  assert.equal(
    (
      await call(`payments/checkout/${checkout.data.sessionId}`, {
        cookie: checkout.cookie,
      })
    ).data.order.status,
    'PAID',
  );
});
void test('cancelling checkout returns stock exactly once and protects another browser', async () => {
  const variantId = 'p-shirt-0-1';
  const beforeStock = (
    await db.variant.findUnique({ where: { id: variantId } })
  ).stock;
  const checkout = await call('orders', {
    method: 'POST',
    data: orderData([{ variantId, quantity: 1 }]),
  });
  assert.equal(
    (await call(`payments/cancel/${checkout.data.id}`, { method: 'POST' }))
      .status,
    403,
  );
  const cancelled = await call(`payments/cancel/${checkout.data.id}`, {
    method: 'POST',
    cookie: checkout.cookie,
  });
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.data.order.status, 'CANCELLED');
  await call(`payments/cancel/${checkout.data.id}`, {
    method: 'POST',
    cookie: checkout.cookie,
  });
  assert.equal(
    (await db.variant.findUnique({ where: { id: variantId } })).stock,
    beforeStock,
  );
});
void test('expired session webhooks release reservations without duplicate restocking', async () => {
  const variantId = 'p-bag-0-0';
  const beforeStock = (
    await db.variant.findUnique({ where: { id: variantId } })
  ).stock;
  const checkout = await call('orders', {
    method: 'POST',
    data: orderData([{ variantId, quantity: 1 }]),
  });
  const expired = await fakeStripe.expire(checkout.data.sessionId);
  assert.equal(
    (await deliverEvent(expired, 'checkout.session.expired')).status,
    200,
  );
  assert.equal(
    (await deliverEvent(expired, 'checkout.session.expired')).status,
    200,
  );
  assert.equal(
    (await db.variant.findUnique({ where: { id: variantId } })).stock,
    beforeStock,
  );
});
void test('a mismatched Stripe amount cannot mark an order paid', async () => {
  const checkout = await call('orders', {
    method: 'POST',
    data: orderData([{ variantId: 'p-shirt-0-2', quantity: 1 }]),
  });
  const session = await fakeStripe.pay(checkout.data.sessionId);
  const correct = session.amount_total;
  session.amount_total += 1;
  assert.equal((await deliverEvent(session)).status, 409);
  assert.equal(
    (await db.order.findUnique({ where: { id: checkout.data.id } })).status,
    'PENDING',
  );
  session.amount_total = correct;
  assert.equal((await deliverEvent(session)).status, 200);
});
void test('definitively rejected session creation releases reserved stock', async () => {
  const variantId = 'p-shirt-0-3';
  const beforeStock = (
    await db.variant.findUnique({ where: { id: variantId } })
  ).stock;
  fakeStripe.failNext = true;
  const result = await call('orders', {
    method: 'POST',
    data: orderData([{ variantId, quantity: 1 }]),
  });
  assert.equal(result.status, 503);
  assert.equal(
    (await db.variant.findUnique({ where: { id: variantId } })).stock,
    beforeStock,
  );
});
void test('simultaneous checkout retries share one reservation and one Stripe session', async () => {
  const variantId = 'p-shirt-1-0';
  const beforeStock = (
    await db.variant.findUnique({ where: { id: variantId } })
  ).stock;
  const payload = orderData([{ variantId, quantity: 1 }]);
  const results = await Promise.all([
    call('orders', { method: 'POST', data: payload }),
    call('orders', { method: 'POST', data: payload }),
  ]);
  assert.deepEqual(
    results.map((r) => r.status),
    [201, 201],
  );
  assert.equal(results[0].data.id, results[1].data.id);
  assert.equal(results[0].data.sessionId, results[1].data.sessionId);
  assert.equal(
    (await db.variant.findUnique({ where: { id: variantId } })).stock,
    beforeStock - 1,
  );
});
void test('a payment completing before cancellation remains paid and is never restocked', async () => {
  const variantId = 'p-shirt-1-1';
  const beforeStock = (
    await db.variant.findUnique({ where: { id: variantId } })
  ).stock;
  const checkout = await call('orders', {
    method: 'POST',
    data: orderData([{ variantId, quantity: 1 }]),
  });
  await fakeStripe.pay(checkout.data.sessionId);
  const result = await call(`payments/cancel/${checkout.data.id}`, {
    method: 'POST',
    cookie: checkout.cookie,
  });
  assert.equal(result.data.order.status, 'PAID');
  assert.equal(
    (await db.variant.findUnique({ where: { id: variantId } })).stock,
    beforeStock - 1,
  );
});

void test('content management is restricted to administrators and settings update the public storefront', async () => {
  assert.equal((await call('admin/content')).status, 401);
  assert.equal(
    (await call('admin/content', { cookie: customerCookie })).status,
    403,
  );
  const original = (await call('settings')).data;
  const { id: _id, ...settings } = original;
  try {
    assert.equal(
      (
        await call('admin/settings', {
          method: 'PUT',
          cookie: customerCookie,
          data: settings,
        })
      ).status,
      403,
    );
    const saved = await call('admin/settings', {
      method: 'PUT',
      cookie: adminCookie,
      data: { ...settings, announcement: `A considered test ${runId}` },
    });
    assert.equal(saved.status, 200);
    assert.match(saved.headers.get('cache-control'), /no-store/);
    assert.equal(
      (await call('settings')).data.announcement,
      `A considered test ${runId}`,
    );
    const overview = await call('admin/content', { cookie: adminCookie });
    assert.equal(overview.data.journal.length, 12);
    assert.equal(overview.data.lookbooks.length, 3);
    assert.equal(overview.data.stores.length, 6);
  } finally {
    await call('admin/settings', {
      method: 'PUT',
      cookie: adminCookie,
      data: settings,
    });
  }
});
void test('journal publishing, scheduling, edits and deletion reach the public API', async () => {
  const payload = {
    title: 'A new editorial perspective',
    slug: `editorial-${runId}`,
    category: 'Wardrobe notes',
    excerpt: 'A thoughtful test story about a considered wardrobe.',
    body: 'A complete first paragraph about natural fabrics and considered details.\n\nA second paragraph about the way we care for the things we wear.',
    coverImage: '/images/architecture.jpg',
    publishedAt: new Date(Date.now() + 86400000).toISOString(),
  };
  const created = await call('admin/journal', {
    method: 'POST',
    cookie: adminCookie,
    data: payload,
  });
  assert.equal(created.status, 201);
  try {
    assert.equal((await call(`journal/${payload.slug}`)).status, 404);
    assert.equal(
      (
        await call(`admin/journal/${created.data.id}`, {
          method: 'PUT',
          cookie: adminCookie,
          data: {
            ...payload,
            publishedAt: new Date().toISOString(),
            title: 'Published with care',
          },
        })
      ).status,
      200,
    );
    assert.equal(
      (await call(`journal/${payload.slug}`)).data.title,
      'Published with care',
    );
  } finally {
    await call(`admin/journal/${created.data.id}`, {
      method: 'DELETE',
      cookie: adminCookie,
    });
  }
  assert.equal((await call(`journal/${payload.slug}`)).status, 404);
});
void test('store management validates coordinates and publishes updates and deletions', async () => {
  const payload = {
    name: `Test atelier ${runId}`,
    city: 'Test City',
    address: '12 Example Street',
    hours: 'Monday to Friday 10:00?18:00',
    lat: 48.85,
    lng: 2.35,
  };
  assert.equal(
    (
      await call('admin/stores', {
        method: 'POST',
        cookie: adminCookie,
        data: { ...payload, lat: 91 },
      })
    ).status,
    400,
  );
  const created = await call('admin/stores', {
    method: 'POST',
    cookie: adminCookie,
    data: payload,
  });
  assert.equal(created.status, 201);
  try {
    assert.equal(
      (
        await call(`admin/stores/${created.data.id}`, {
          method: 'PUT',
          cookie: adminCookie,
          data: { ...payload, hours: 'By appointment' },
        })
      ).status,
      200,
    );
    assert.equal(
      (await call('stores')).data.find((s) => s.id === created.data.id).hours,
      'By appointment',
    );
  } finally {
    await call(`admin/stores/${created.data.id}`, {
      method: 'DELETE',
      cookie: adminCookie,
    });
  }
  assert.ok(!(await call('stores')).data.some((s) => s.id === created.data.id));
});
void test('lookbook chapters and product points save atomically and reject unknown products', async () => {
  const payload = {
    title: 'A tested editorial story',
    slug: `lookbook-${runId}`,
    coverImage: '/images/hero-coast-mobile.webp',
    chapters: [
      {
        caption: 'The first quiet chapter',
        imageUrl: '/images/hero-coast-mobile.webp',
        hotspots: [{ productId: 'p-coat', xPct: 52, yPct: 45 }],
      },
      {
        caption: 'A second perspective',
        imageUrl: '/images/studio-knit.webp',
        hotspots: [{ productId: 'p-knit', xPct: 48, yPct: 40 }],
      },
    ],
  };
  const created = await call('admin/lookbooks', {
    method: 'POST',
    cookie: adminCookie,
    data: payload,
  });
  assert.equal(created.status, 201);
  try {
    assert.equal(
      (await call(`lookbooks/${payload.slug}`)).data.chapters.length,
      2,
    );
    const invalid = {
      ...payload,
      chapters: [
        {
          ...payload.chapters[0],
          hotspots: [{ productId: 'missing-product', xPct: 40, yPct: 50 }],
        },
      ],
    };
    assert.equal(
      (
        await call(`admin/lookbooks/${created.data.id}`, {
          method: 'PUT',
          cookie: adminCookie,
          data: invalid,
        })
      ).status,
      400,
    );
    assert.equal(
      (await call(`lookbooks/${payload.slug}`)).data.chapters.length,
      2,
    );
    assert.equal(
      (
        await call(`admin/lookbooks/${created.data.id}`, {
          method: 'PUT',
          cookie: adminCookie,
          data: { ...payload, chapters: [...payload.chapters].reverse() },
        })
      ).status,
      200,
    );
    assert.equal(
      (await call(`lookbooks/${payload.slug}`)).data.chapters[0].hotspots[0]
        .product.id,
      'p-knit',
    );
  } finally {
    await call(`admin/lookbooks/${created.data.id}`, {
      method: 'DELETE',
      cookie: adminCookie,
    });
  }
  assert.equal((await call(`lookbooks/${payload.slug}`)).status, 404);
});
void test('image uploads enforce admin access, decode photographs and reject disguised content', async () => {
  const upload = async (buffer, mime, cookie) => {
    const body = new FormData();
    body.append('file', new Blob([buffer], { type: mime }), 'photograph.png');
    const response = await fetch(`${base}/admin/media`, {
      method: 'POST',
      headers: cookie ? { Cookie: cookie } : {},
      body,
    });
    return { status: response.status, data: await response.json() };
  };
  const png = await sharp({
    create: { width: 450, height: 600, channels: 3, background: '#ddd3c2' },
  })
    .png()
    .toBuffer();
  assert.equal((await upload(png, 'image/png')).status, 401);
  assert.equal((await upload(png, 'image/png', customerCookie)).status, 403);
  assert.equal(
    (
      await upload(
        Buffer.from('<svg onload="alert(1)"></svg>'),
        'image/png',
        adminCookie,
      )
    ).status,
    400,
  );
  const result = await upload(png, 'image/png', adminCookie);
  assert.equal(result.status, 201);
  assert.match(result.data.url, /^\/api\/media\/[a-f0-9-]+\.webp$/);
  try {
    const publicImage = await fetch(
      `${base}${result.data.url.replace('/api', '')}`,
    );
    assert.equal(publicImage.status, 200);
    assert.match(publicImage.headers.get('content-type'), /image\/webp/);
    const metadata = await sharp(
      Buffer.from(await publicImage.arrayBuffer()),
    ).metadata();
    assert.equal(metadata.width, 450);
    assert.equal(metadata.height, 600);
  } finally {
    await unlink(
      resolve(process.env.MEDIA_DIRECTORY, result.data.url.split('/').pop()),
    );
  }
});
void test('administrators can cancel unpaid reservations and dispatch only verified paid orders', async () => {
  const variantId = 'p-knit-0-1';
  const stock = (await db.variant.findUnique({ where: { id: variantId } }))
    .stock;
  const checkout = await call('orders', {
    method: 'POST',
    data: orderData([{ variantId, quantity: 1 }]),
  });
  assert.equal(checkout.status, 201);
  assert.equal(
    (
      await call(`admin/orders/${checkout.data.id}/ship`, {
        method: 'POST',
        cookie: adminCookie,
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call(`admin/orders/${checkout.data.id}/cancel`, {
        method: 'POST',
        cookie: customerCookie,
      })
    ).status,
    403,
  );
  const cancelled = await call(`admin/orders/${checkout.data.id}/cancel`, {
    method: 'POST',
    cookie: adminCookie,
  });
  assert.equal(cancelled.data.order.status, 'CANCELLED');
  assert.equal(
    (await db.variant.findUnique({ where: { id: variantId } })).stock,
    stock,
  );
  const paid = await call('orders', {
    method: 'POST',
    data: orderData([{ variantId, quantity: 1 }]),
  });
  assert.equal(paid.status, 201);
  await deliverEvent(await fakeStripe.pay(paid.data.sessionId));
  assert.equal(
    (
      await call(`admin/orders/${paid.data.id}/cancel`, {
        method: 'POST',
        cookie: adminCookie,
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call(`admin/orders/${paid.data.id}/ship`, {
        method: 'POST',
        cookie: adminCookie,
      })
    ).data.status,
    'SHIPPED',
  );
  assert.equal(
    (await db.variant.findUnique({ where: { id: variantId } })).stock,
    stock - 1,
  );
});
