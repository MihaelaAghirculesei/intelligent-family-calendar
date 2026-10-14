import { devices, expect, test } from '@playwright/test';

test.use({ ...devices['Pixel 7'] });

test.beforeEach(async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/en-US/');
});

test('a tap shows the details and a second tap hides them', async ({ page }) => {
  const yoga = page.locator('.grid-activity', { hasText: 'Yoga' });
  const card = page.locator('.activity-details');

  await yoga.tap();
  await expect(card).toContainText('Yoga');
  await expect(card).toContainText('Anna');

  await yoga.tap();
  await expect(card).toBeHidden();
});

test('a tap outside the blocks closes the details', async ({ page }) => {
  await page.locator('.grid-activity', { hasText: 'Yoga' }).tap();
  await expect(page.locator('.activity-details')).toBeVisible();

  await page.getByRole('heading').tap();
  await expect(page.locator('.activity-details')).toBeHidden();
});

test('the details card stays inside a phone screen', async ({ page }) => {
  await page.locator('.grid-activity', { hasText: 'Yoga' }).tap();

  const box = (await page.locator('.activity-details').boundingBox())!;
  const width = page.viewportSize()!.width;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(width);
});

test('a double tap opens the edit form', async ({ page }) => {
  await page.locator('.grid-activity', { hasText: 'Yoga' }).dblclick();
  await expect(page.locator('.edit-form')).toBeVisible();
});
