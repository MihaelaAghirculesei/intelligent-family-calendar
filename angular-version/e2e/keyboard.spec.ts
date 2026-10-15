import { expect, test, type Page } from '@playwright/test';

const block = (page: Page, title: string) => page.locator('.grid-activity', { hasText: title });

// Tabs from the page start to the first activity block, like a keyboard user.
async function tabToFirstBlock(page: Page) {
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate(() => document.activeElement?.classList.contains('grid-activity'))) return;
  }
  throw new Error('no activity block reached with Tab');
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/en-US/');
});

test('Tab reaches a block and shows its details', async ({ page }) => {
  await tabToFirstBlock(page);

  const focused = page.locator('.grid-activity:focus');
  await expect(focused).toHaveAttribute('role', 'button');
  await expect(focused).toHaveAccessibleName(/School, Anna, 07:45-14:00/);
  await expect(page.locator('.activity-details')).toContainText('School');

  await page.keyboard.press('Escape');
  await expect(page.locator('.activity-details')).toBeHidden();
});

test('Enter opens the edit form, Enter in a field saves and the focus returns', async ({ page }) => {
  await block(page, 'Yoga').focus();
  await page.keyboard.press('Enter');

  const title = page.locator('.title-input');
  await expect(title).toBeFocused();
  await expect(title).toHaveValue('Yoga');

  await page.keyboard.type('Pilates');
  await page.keyboard.press('Enter');

  await expect(page.locator('.edit-form')).toBeHidden();
  await expect(block(page, 'Pilates')).toBeFocused();
});

test('Escape closes the edit form without saving', async ({ page }) => {
  await block(page, 'Yoga').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.title-input')).toBeFocused();
  await page.keyboard.type('Pilates');
  await page.keyboard.press('Escape');

  await expect(page.locator('.edit-form')).toBeHidden();
  await expect(block(page, 'Yoga')).toBeFocused();
  await expect(block(page, 'Pilates')).toHaveCount(0);
});
