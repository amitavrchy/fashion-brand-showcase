import { expect, test } from '@playwright/test';

test('homepage keeps one heading scale and equally sized collection photographs', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  await expect(page.locator('.home-page .collection-story-card')).toHaveCount(3);
  await expect(page.locator('.home-page .journal-card')).toHaveCount(3);
  await page.locator('.home-page img').evaluateAll((images) =>
    Promise.all(
      images.map(async (element) => {
        const image = element as HTMLImageElement;
        image.loading = 'eager';
        await image.decode();
      }),
    ),
  );
  const metrics = await page.evaluate(() => ({
    sections: [...document.querySelectorAll('.home-page>section h2:not(.hero-title)')].map(
      (element) => parseFloat(getComputedStyle(element).fontSize),
    ),
    hero: parseFloat(getComputedStyle(document.querySelector('.hero-content h1')!).fontSize),
    secondHero: parseFloat(getComputedStyle(document.querySelector('.hero-title')!).fontSize),
    collectionImages: [...document.querySelectorAll('.collection-story-image')].map(
      (element) => element.getBoundingClientRect().height,
    ),
    journalImages: [...document.querySelectorAll('.home-page .journal-image')].map(
      (element) => element.getBoundingClientRect().height,
    ),
    overflow: document.documentElement.scrollWidth - innerWidth,
  }));
  expect(new Set(metrics.sections).size).toBe(1);
  expect(metrics.sections[0]).toBe(isMobile ? 34 : 44);
  expect(metrics.hero).toBeGreaterThan(metrics.sections[0]);
  expect(metrics.secondHero).toBe(metrics.hero);
  expect(
    Math.max(...metrics.collectionImages) - Math.min(...metrics.collectionImages),
  ).toBeLessThanOrEqual(1);
  expect(
    Math.max(...metrics.journalImages) - Math.min(...metrics.journalImages),
  ).toBeLessThanOrEqual(1);
  expect(metrics.overflow).toBeLessThanOrEqual(1);
});

test('campaign preserves the complete photograph across screen sizes', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  const photo = page.locator('.hero-slide').first().locator('img');
  await expect(photo).toBeVisible();
  for (const width of isMobile ? [390, 360] : [1920, 1440, 1280, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        photo.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0),
      )
      .toBe(true);
    await expect(photo).toHaveCSS('object-fit', 'cover');
    await expect(photo).toHaveCSS('transform', 'none');
    const frame = await page.locator('.hero-photo').first().boundingBox();
    expect(frame?.width).toBeCloseTo(width, 0);
    if (width <= 600) {
      await expect
        .poll(() => photo.evaluate((element: HTMLImageElement) => element.currentSrc))
        .toContain('hero-coast-mobile');
      const copy = await page.locator('.hero-content').first().boundingBox();
      expect(copy!.y).toBeGreaterThanOrEqual(frame!.y + frame!.height - 1);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
  }
  await page.goto('/product/the-sculpted-coat');
  await expect(page.locator('.product-info')).toBeVisible();
  const fits = await page
    .locator('img.photo')
    .evaluateAll((images) =>
      images.every((image) => getComputedStyle(image).objectFit === 'cover'),
    );
  expect(fits).toBe(true);
});

test('expanded catalog pagination and all editorial stories are accessible', async ({ page }) => {
  await page.goto('/collections');
  await expect(page.locator('.catalog-grid .product-card')).toHaveCount(12);
  const firstPage = await page.locator('.catalog-grid .product-name').allTextContents();
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator('.catalog-grid .product-name').first()).not.toHaveText(firstPage[0]);
  await expect(page.locator('.catalog-grid .product-card')).toHaveCount(12);
  const secondPage = await page.locator('.catalog-grid .product-name').allTextContents();
  expect(new Set([...firstPage, ...secondPage]).size).toBe(24);
  await page.goto('/lookbook');
  await expect(page.locator('.lookbook-index-card')).toHaveCount(3);
  for (const [slug, title] of [
    ['the-soft-hours', 'The soft hours'],
    ['a-city-in-motion', 'A city in motion'],
  ]) {
    await page.goto(`/lookbook/${slug}`);
    await expect(page.locator('h1')).toHaveText(title);
    await expect(page).toHaveTitle(new RegExp(title));
    await expect(page.locator('.look-chapter')).toHaveCount(4);
  }
});

test('unpaid Stripe returns never confirm payment and cancellation keeps the bag', async ({
  page,
}) => {
  await page.goto('/product/the-sculpted-coat');
  await page.getByRole('button', { name: 'Size S', exact: true }).click();
  await page.getByRole('button', { name: /^Add to bag/ }).click();
  await page.keyboard.press('Escape');
  const checkout = await page.request.post('/api/orders', {
    data: {
      email: `cancel-${Date.now()}@example.test`,
      shipping: {
        name: 'Test Customer',
        address: '12 Sample Street',
        city: 'Paris',
        postalCode: '75003',
        country: 'France',
      },
      items: [{ variantId: 'p-coat-0-1', quantity: 1 }],
      idempotencyKey: crypto.randomUUID(),
    },
  });
  expect(checkout.ok()).toBe(true);
  const order = await checkout.json();
  await page.goto(`/checkout/return?session_id=${order.sessionId}`);
  await expect(page.locator('h1')).toHaveText('Awaiting confirmation.');
  await expect(page.getByText('Payment confirmed', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open bag, 1 items' })).toBeVisible();
  await page.goto(`/checkout/cancel?order_id=${order.id}`);
  await expect(page.getByText('Your bag is still here', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open bag, 1 items' })).toBeVisible();
  await page.getByRole('link', { name: 'Return to checkout' }).click();
  await expect(page.getByRole('button', { name: 'Continue to secure payment' })).toBeEnabled();
});
