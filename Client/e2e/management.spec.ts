import { expect, test } from '@playwright/test';

const errors = new Map<string, string[]>();
test.beforeEach(async ({ page }, info) => {
  const messages: string[] = [];
  errors.set(info.testId, messages);
  page.on('pageerror', (error) => messages.push(error.message));
});
test.afterEach(async ({}, info) => {
  expect(errors.get(info.testId), 'Unexpected browser errors').toEqual([]);
  errors.delete(info.testId);
});

async function signIn(page: import('@playwright/test').Page) {
  const login = await page.request.post('/api/auth/login', {
    data: { email: 'browser-admin@example.test', password: 'Browser-tests-only-2026' },
  });
  expect(login.ok()).toBe(true);
  await page.goto('/admin');
  await expect(page.getByRole('navigation', { name: 'Admin sections' })).toBeVisible();
}
test('administrator publishes an uploaded journal story and manages storefront settings', async ({
  page,
}, info) => {
  await signIn(page);
  const sections = page.getByRole('navigation', { name: 'Admin sections' });
  await expect(sections.getByRole('button')).toHaveCount(9);
  await sections.getByRole('button', { name: 'Journal', exact: true }).click();
  await page.getByRole('button', { name: 'Add story', exact: true }).click();
  const editor = page.getByRole('dialog');
  const title = `A considered browser story ${info.project.name}`;
  const slug = `browser-story-${info.project.name}-${Date.now()}`;
  await editor.getByLabel('Story title', { exact: true }).fill(title);
  await editor.getByLabel('URL slug', { exact: true }).fill(slug);
  await editor.getByLabel('Category', { exact: true }).fill('Wardrobe notes');
  await editor
    .getByLabel('Excerpt', { exact: true })
    .fill('Thoughtful layers for a quieter kind of everyday.');
  await editor
    .getByLabel('Article body (separate paragraphs with a blank line)')
    .fill(
      'A complete editorial story about the way natural materials feel in a considered wardrobe.\n\nA second paragraph about choosing fewer pieces and caring for them over time.',
    );
  await editor
    .getByLabel('Upload Cover image', { exact: true })
    .setInputFiles('public/images/studio-detail.webp');
  await expect(editor.getByRole('status')).toContainText('Uploaded');
  await editor.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(editor).not.toBeVisible();
  await page.goto(`/journal/${slug}`);
  await expect(page.locator('h1')).toHaveText(title);
  await expect(page.locator('.article-hero img')).toHaveAttribute('src', /api%2Fmedia/);
  await page.goto('/admin');
  await page
    .getByRole('navigation', { name: 'Admin sections' })
    .getByRole('button', { name: 'Journal', exact: true })
    .click();
  await page.getByRole('button', { name: `Delete ${title}`, exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete story', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();

  const original = await (await page.request.get('/api/settings')).json();
  const { id, ...settings } = original;
  void id;
  try {
    await page
      .getByRole('navigation', { name: 'Admin sections' })
      .getByRole('button', { name: 'Settings', exact: true })
      .click();
    await page
      .getByLabel('Announcement bar', { exact: true })
      .fill(`Considered for ${info.project.name}`);
    await page
      .getByLabel('Homepage introduction title', { exact: true })
      .fill('Beautiful, by nature.');
    await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('Your changes are saved.');
    await page.goto('/');
    await expect(page.locator('.announcement')).toContainText(
      `Considered for ${info.project.name}`,
    );
    await expect(page.locator('.wardrobe-intro h2')).toHaveText('Beautiful, by nature.');
  } finally {
    expect((await page.request.put('/api/admin/settings', { data: settings })).ok()).toBe(true);
  }
});

test('administrator creates shoppable chapters and manages store locations', async ({
  page,
}, info) => {
  await signIn(page);
  await page
    .getByRole('navigation', { name: 'Admin sections' })
    .getByRole('button', { name: 'Lookbooks', exact: true })
    .click();
  await page.getByRole('button', { name: 'Add lookbook', exact: true }).click();
  let editor = page.getByRole('dialog');
  const title = `A browser lookbook ${info.project.name}`;
  const slug = `browser-look-${info.project.name}-${Date.now()}`;
  await editor.getByLabel('Lookbook title', { exact: true }).fill(title);
  await editor.getByLabel('URL slug', { exact: true }).fill(slug);
  await editor
    .getByLabel('Chapter 1 caption', { exact: true })
    .fill('The art of a considered coat');
  await editor.getByRole('button', { name: 'Add product point', exact: true }).click();
  await editor.getByLabel('Product point 1', { exact: true }).selectOption('p-coat');
  await editor
    .getByRole('button', { name: 'Position selected product point on photograph' })
    .click({ position: { x: 130, y: 170 } });
  await editor.getByRole('button', { name: 'Add chapter', exact: true }).click();
  await editor.getByLabel('Chapter 2 caption', { exact: true }).fill('A second quiet moment');
  await editor.getByRole('button', { name: 'Save lookbook', exact: true }).click();
  await expect(editor).not.toBeVisible();
  await page.goto(`/lookbook/${slug}`);
  await expect(page.locator('h1')).toHaveText(title);
  await expect(page.locator('.look-chapter')).toHaveCount(2);
  await page.getByRole('button', { name: 'Shop The sculpted coat', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'A closer look' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.goto('/admin');
  await page
    .getByRole('navigation', { name: 'Admin sections' })
    .getByRole('button', { name: 'Lookbooks', exact: true })
    .click();
  await page.getByRole('button', { name: `Delete ${title}`, exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Delete lookbook', exact: true })
    .click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page
    .getByRole('navigation', { name: 'Admin sections' })
    .getByRole('button', { name: 'Stores', exact: true })
    .click();
  await page.getByRole('button', { name: 'Add store', exact: true }).click();
  editor = page.getByRole('dialog');
  const store = `Browser atelier ${info.project.name}`;
  await editor.getByLabel('Store name', { exact: true }).fill(store);
  await editor.getByLabel('City', { exact: true }).fill('Test City');
  await editor.getByLabel('Street address', { exact: true }).fill('12 Example Street');
  await editor.getByLabel('Opening hours', { exact: true }).fill('By appointment');
  await editor.getByLabel('Latitude', { exact: true }).fill('48.85');
  await editor.getByLabel('Longitude', { exact: true }).fill('2.35');
  await editor.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(editor).not.toBeVisible();
  await page.goto('/stores');
  await page.getByRole('button', { name: 'Test City', exact: true }).click();
  await expect(page.locator('.store-card')).toHaveCount(1);
  await expect(page.locator('.store-card')).toContainText(store);
  await page.goto('/admin');
  await page
    .getByRole('navigation', { name: 'Admin sections' })
    .getByRole('button', { name: 'Stores', exact: true })
    .click();
  await page.getByRole('button', { name: `Delete ${store}`, exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete store', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('photographs fill their frames without letterboxing or source clipping', async ({ page }) => {
  for (const path of [
    '/',
    '/collections',
    '/product/the-sculpted-coat',
    '/lookbook',
    '/lookbook/a-study-in-stillness',
    '/journal',
    '/journal/a-material-connection',
    '/about',
    '/stores',
    '/account',
  ]) {
    await page.goto(path);
    await expect(page.locator('.loading-state')).toHaveCount(0);
    const frames = page.locator(
      '.hero-photo,.collection-story-image,.materials-photo,.journal-image,.journal-feature-image,.article-hero,.stores-photo,.story-hero,.auth-photo,.lookbook-index-image,.look-chapter-image,.look-panel-photo,.gallery-main,.gallery-thumbnail,.lookbook-image,.atelier-visit-photo',
    );
    for (const frame of await frames.all()) {
      const image = frame.locator('img').first();
      if (!(await image.count())) continue;
      await image.evaluate(async (image: HTMLImageElement) => {
        image.loading = 'eager';
        await image.decode();
      });
      const metrics = await frame.evaluate((element) => {
        const image = element.querySelector('img')!;
        return {
          frameWidth: element.clientWidth,
          frameHeight: element.clientHeight,
          imageWidth: image.clientWidth,
          imageHeight: image.clientHeight,
          naturalRatio: image.naturalWidth / image.naturalHeight,
          displayRatio: image.clientWidth / image.clientHeight,
          source: image.currentSrc,
        };
      });
      expect(
        Math.abs(metrics.frameWidth - metrics.imageWidth),
        `Width mismatch at ${path}: ${metrics.source}`,
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(metrics.frameHeight - metrics.imageHeight),
        `Height mismatch at ${path}: ${metrics.source}`,
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(metrics.naturalRatio - metrics.displayRatio),
        `Source clipped at ${path}: ${metrics.source}`,
      ).toBeLessThan(0.015);
    }
  }
});
