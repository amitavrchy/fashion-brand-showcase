import { expect, test } from '@playwright/test';

const pageErrors = new Map<string, string[]>();
test.beforeEach(async ({ page }, info) => {
  const errors: string[] = [];
  pageErrors.set(info.testId, errors);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (e) => {
    if (e.type() === 'error' && /Hydration failed|hydrated but/i.test(e.text()))
      errors.push(e.text());
  });
});
test.afterEach(async ({}, info) => {
  expect(pageErrors.get(info.testId), 'Unexpected browser errors').toEqual([]);
  pageErrors.delete(info.testId);
});

test('campaign carousel, responsive navigation and search work without browser errors', async ({
  page,
  isMobile,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('.product-card').first()).toBeVisible();
  await page.getByRole('button', { name: 'View campaign 02' }).click();
  await expect(page.getByRole('button', { name: 'View campaign 02' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  if (isMobile) {
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    await page.locator('#main-menu').getByRole('link', { name: 'All pieces' }).click();
  } else {
    await page.getByRole('button', { name: 'Search the collection' }).click();
    await page.getByRole('textbox', { name: 'Search pieces' }).fill('cashmere crew');
    await expect(page.locator('.search-results>a')).toHaveCount(1);
    await page.locator('.search-results>a').click();
    await expect(
      page.getByRole('heading', { name: 'The cashmere crew', exact: true }),
    ).toBeVisible();
    await page.goto('/collections');
  }
  await expect(page.locator('.catalog-grid .product-card')).toHaveCount(8);
  expect(errors).toEqual([]);
});
test('category, color, size filters and price sorting update the collection URL', async ({
  page,
}) => {
  await page.goto('/collections');
  await page.getByRole('button', { name: /Filters/ }).click();
  await page.getByLabel('Category', { exact: true }).selectOption('Knitwear');
  await expect(page.locator('.catalog-grid .product-card')).toHaveCount(2);
  await page.getByLabel('Color', { exact: true }).selectOption('Oat');
  await page.getByLabel('Available size').selectOption('M');
  await expect(page).toHaveURL(/category=Knitwear.*color=Oat.*size=M/);
  await page.getByLabel('Sort pieces').selectOption('price-high');
  await expect(page.locator('.catalog-grid .price').first()).toHaveText('€265');
  await page.getByRole('button', { name: 'Clear all filters' }).click();
  await expect(page.locator('.catalog-grid .product-card')).toHaveCount(8);
});
test('product size guide, stock states, persistent bag and complete mock checkout', async ({
  page,
}, info) => {
  await page.goto('/product/the-sculpted-coat');
  await expect(
    page.getByRole('button', { name: 'Size XL, out of stock', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: /^Add to bag/ }).click();
  await expect(page.locator('.product-info [role="alert"]')).toContainText(
    'Please choose your size',
  );
  await page.getByRole('button', { name: 'Size guide', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Finding your fit' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Finding your fit' })).not.toBeVisible();
  await page.getByRole('button', { name: 'Size M', exact: true }).click();
  await page.getByRole('button', { name: /^Add to bag/ }).click();
  await expect(page.getByRole('dialog', { name: 'Your bag (1)', exact: true })).toBeVisible();
  await page.getByRole('dialog').getByRole('link', { name: 'View your bag' }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await page.reload();
  await expect(page.locator('.cart-layout .bag-item')).toHaveCount(1);
  await page.locator('.order-summary').getByRole('link', { name: 'Continue to checkout' }).click();
  await page.getByRole('button', { name: 'Place mock order' }).click();
  await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
  await page
    .getByLabel('Email address', { exact: true })
    .first()
    .fill(`browser-${info.project.name}-${Date.now()}@example.test`);
  await page.getByLabel('Full name').fill('Browser Customer');
  await page.getByLabel('Street address').fill('12 Sample Street');
  await page.getByLabel('City', { exact: true }).fill('Paris');
  await page.getByLabel('Postal code').fill('75003');
  await page.getByLabel('Country', { exact: true }).selectOption('France');
  await page.getByRole('button', { name: 'Place mock order' }).click();
  await expect(page.locator('h1')).toHaveText('Beautifully chosen.');
  await expect(page.getByText('Mock order · Pending', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open bag, 0 items' })).toBeVisible();
});
test('account registration, saved pieces and wishlist persistence after sign out', async ({
  page,
}, info) => {
  const email = `wishlist-${info.project.name}-${Date.now()}@example.test`;
  const password = 'Browser-wishlist-2026';
  await page.goto('/account');
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.getByLabel('Your name').fill('Lune Customer');
  await page.getByLabel('Email address', { exact: true }).first().fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Create your account', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('Hello, Lune.');
  await page.goto('/collections');
  await page
    .getByRole('button', { name: 'Save The cashmere crew to wishlist', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Remove The cashmere crew from wishlist', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/account?tab=wishlist');
  await expect(page.locator('.catalog-grid .product-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.getByLabel('Email address', { exact: true }).first().fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('button', { name: 'Saved pieces (1)' }).click();
  await expect(page.locator('.catalog-grid .product-card')).toHaveCount(1);
});
test('lookbook hotspots open a product panel, journal articles and store filters resolve', async ({
  page,
}) => {
  await page.goto('/lookbook/a-study-in-stillness');
  await page.getByRole('button', { name: 'Shop The sculpted coat' }).click();
  const panel = page.getByRole('dialog', { name: 'A closer look' });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('heading', { name: 'The sculpted coat' })).toBeVisible();
  await panel.getByRole('link', { name: 'Discover piece' }).click();
  await expect(page).toHaveURL(/product\/the-sculpted-coat/);
  await page.goto('/journal');
  await page.getByRole('button', { name: 'Craft & process', exact: true }).click();
  await expect(page.locator('.journal-grid .journal-card')).toHaveCount(1);
  await page.locator('.journal-grid .journal-card').click();
  await expect(page.locator('h1')).toHaveText('A material connection');
  await page.goto('/stores');
  await page.getByRole('button', { name: 'Paris', exact: true }).click();
  await expect(page.locator('.store-card')).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Find your way' })).toHaveAttribute(
    'href',
    /google.com\/maps/,
  );
});
test('administrator can create, edit and unpublish a product through the interface', async ({
  page,
}, info) => {
  await page.goto('/account');
  await page
    .getByLabel('Email address', { exact: true })
    .first()
    .fill('browser-admin@example.test');
  await page.getByLabel('Password', { exact: true }).fill('Browser-tests-only-2026');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('link', { name: 'Manage atelier' }).click();
  await page.getByRole('button', { name: 'Add piece' }).click();
  const dialog = page.getByRole('dialog');
  const name = `Browser piece ${info.project.name} ${Date.now()}`;
  await dialog.getByLabel('Piece name').fill(name);
  await dialog.getByLabel('URL slug').fill(name.toLowerCase().replaceAll(' ', '-'));
  await dialog
    .getByLabel('Description', { exact: true })
    .fill('A sample piece for browser verification.');
  await dialog.getByLabel('Fabric', { exact: true }).fill('Organic cotton');
  await dialog.getByLabel('Care', { exact: true }).fill('Wash gently.');
  await dialog.getByLabel('Image description', { exact: true }).fill('Sample garment photograph');
  await dialog.getByLabel('Publish this piece in the storefront').check();
  await dialog.getByRole('button', { name: 'Save piece' }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole('button', { name: `Edit ${name}`, exact: true }).click();
  await dialog.getByLabel('Price in EUR').fill('135');
  await dialog.getByRole('button', { name: 'Save piece' }).click();
  await expect(page.getByRole('row').filter({ hasText: name })).toContainText('€135');
  await page.getByRole('button', { name: `Unpublish ${name}`, exact: true }).click();
  await dialog.getByRole('button', { name: 'Unpublish piece', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: name })).toContainText('Unpublished');
});
test('all main pages fit the viewport and every visible text element is at least 14px', async ({
  page,
}) => {
  for (const path of [
    '/',
    '/collections',
    '/product/the-cashmere-crew',
    '/about',
    '/journal',
    '/stores',
    '/account',
    '/client-care',
    '/privacy',
    '/terms',
    '/cart',
  ]) {
    await page.goto(path);
    await page.locator('.loading-state').waitFor({ state: 'hidden' });
    const result = await page.evaluate(() => {
      const tooSmall = [...document.querySelectorAll('body *')]
        .filter(
          (e) =>
            e.getClientRects().length &&
            [...e.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim()) &&
            Number.parseFloat(getComputedStyle(e).fontSize) < 14,
        )
        .map((e) => ({ text: e.textContent?.slice(0, 60), size: getComputedStyle(e).fontSize }));
      return { overflow: document.documentElement.scrollWidth - innerWidth, tooSmall };
    });
    expect(result.overflow, `Horizontal overflow at ${path}`).toBeLessThanOrEqual(1);
    expect(result.tooSmall, `Text smaller than 14px at ${path}`).toEqual([]);
  }
});
test('reduced motion suppresses curtain transitions', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('.page-curtain')).toHaveCSS('display', 'none');
  await context.close();
});

test('campaign supports mouse dragging and touch swiping', async ({ page, isMobile }) => {
  await page.goto('/');
  await expect(page.locator('.product-card').first()).toBeVisible();
  const width = page.viewportSize()!.width;
  const start = isMobile ? width - 40 : width - 180;
  const end = isMobile ? 40 : 180;
  const y = isMobile ? 300 : 400;
  if (isMobile) {
    const client = await page.context().newCDPSession(page);
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: start, y }],
    });
    for (let i = 1; i <= 12; i++)
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: start + ((end - start) * i) / 12, y }],
      });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await client.detach();
  } else {
    await page.mouse.move(start, y);
    await page.mouse.down();
    await page.mouse.move(end, y, { steps: 18 });
    await page.mouse.up();
  }
  await expect(page.getByRole('button', { name: 'View campaign 02' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
