import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

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
  const { createApplication } = await import('../dist/bootstrap.js');
  app = await createApplication();
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
test('seeded public catalog, lookbook, stores and journal resolve with their relations', async () => {
  assert.ok(catalog.products.length >= 8);
  assert.ok(catalog.collections.length >= 3);
  assert.ok(catalog.campaigns.length >= 2);
  assert.ok(catalog.products.every((p) => p.variants.length && p.media.length));
  assert.equal((await call('products/the-sculpted-coat')).status, 200);
  const look = await call('lookbooks/a-study-in-stillness');
  assert.equal(look.data.chapters.length, 3);
  assert.ok(look.data.chapters[0].hotspots[0].product.slug);
  assert.equal((await call('stores')).data.length, 3);
  assert.equal((await call('journal')).data.length, 3);
  assert.equal((await call('products/missing-piece')).status, 404);
});
test('validation rejects missing shipping, unknown fields and invalid newsletter emails', async () => {
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
test('accounts use HTTP-only sessions, prevent privilege escalation, and protect administrator routes', async () => {
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
test('authenticated wishlist survives a fresh sign-in and can remove saved pieces', async () => {
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
test('cross-origin mutations are rejected and security headers are present', async () => {
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
test('newsletter signup is idempotent', async () => {
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
test('checkout calculates authoritative prices, decrements stock once, and links signed-in orders', async () => {
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
test('out-of-stock line rolls back earlier stock decrements in the same order', async () => {
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
test('two simultaneous orders for the final item produce one order and never negative stock', async () => {
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
test('duplicate variants are merged and aggregate quantity limits cannot be bypassed', async () => {
  const response = await call('orders', {
    method: 'POST',
    data: orderData([
      { variantId: 'p-bag-0-0', quantity: 6 },
      { variantId: 'p-bag-0-0', quantity: 6 },
    ]),
  });
  assert.equal(response.status, 400);
});
test('administrator product, collection and campaign CRUD remains reflected in the catalog', async () => {
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
