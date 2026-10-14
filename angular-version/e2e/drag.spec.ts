import { expect, test, type Locator, type Page } from '@playwright/test';

// The grid shows one pixel per minute, so dy pixels move a block by dy minutes.
async function drag(page: Page, item: Locator, to: { x: number; y: number }) {
  const box = (await item.boundingBox())!;
  const start = { x: box.x + box.width / 2, y: box.y + 10 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(start.x + (to.x - start.x) * i / 10, start.y + (to.y - start.y) * i / 10);
  }
  await page.mouse.up();
  // CDK animates the drop with a temporary copy of the block; wait for it.
  await expect(page.locator('.cdk-drag-preview, .cdk-drag-placeholder')).toHaveCount(0);
}

const block = (page: Page, title: string) => page.locator('.grid-activity', { hasText: title });

test.beforeEach(async ({ page }) => {
  await page.goto('/en-US/');
});

test('dragging a block down within its day moves it later', async ({ page }) => {
  const yoga = block(page, 'Yoga');
  const box = (await yoga.boundingBox())!;

  await drag(page, yoga, { x: box.x + box.width / 2, y: box.y + 10 + 60 });

  await expect(block(page, 'Yoga')).toContainText('20:00-21:00');
});

test('dragging a block to another day keeps its duration and snaps the time', async ({ page }) => {
  const shopping = block(page, 'Grocery shopping');
  const shoppingBox = (await shopping.boundingBox())!;
  const saturday = (await page.locator('.day-column[data-day="saturday"]').boundingBox())!;

  // 3 hours and 4 minutes lower, onto Saturday: 10:00 becomes 13:00 after snapping
  await drag(page, shopping, { x: saturday.x + saturday.width / 2, y: shoppingBox.y + 10 + 184 });

  const moved = page.locator('.day-column[data-day="saturday"] .grid-activity', { hasText: 'Grocery shopping' });
  await expect(moved).toContainText('13:00-14:00');
  await expect(page.locator('.day-column[data-day="sunday"] .grid-activity')).toHaveCount(0);
});

test('one undo restores both the day and the time', async ({ page }) => {
  const shopping = block(page, 'Grocery shopping');
  const shoppingBox = (await shopping.boundingBox())!;
  const saturday = (await page.locator('.day-column[data-day="saturday"]').boundingBox())!;
  await drag(page, shopping, { x: saturday.x + saturday.width / 2, y: shoppingBox.y + 10 + 180 });

  await page.locator('.bottom-controls').getByRole('button', { name: /Undo/ }).click();

  const back = page.locator('.day-column[data-day="sunday"] .grid-activity', { hasText: 'Grocery shopping' });
  await expect(back).toContainText('10:00-11:00');
});

test('no details card opens while dragging over other blocks', async ({ page }) => {
  const yoga = block(page, 'Yoga');
  const box = (await yoga.boundingBox())!;
  const dance = (await block(page, 'Dance').boundingBox())!;

  await page.mouse.move(box.x + box.width / 2, box.y + 10);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(box.x + box.width / 2, box.y + 10 + (dance.y - box.y) * i / 10);
  }
  await expect(page.locator('.activity-details')).toBeHidden();
  await page.mouse.up();
});
