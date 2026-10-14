import { readFile, writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/en-US/');
});

test('saves the week as a template and applies it again', async ({ page }) => {
  const messages: string[] = [];
  page.on('dialog', dialog => messages.push(dialog.message()));

  await page.getByRole('button', { name: /Save template/ }).click();
  await page.locator('app-save-template').getByRole('button', { name: /Save template/ }).click();
  await expect(page.getByRole('button', { name: /Templates \(1\)/ })).toBeVisible();

  await page.locator('.grid-activity', { hasText: 'Yoga' }).dblclick();
  await page.locator('.delete-btn').click();
  await expect(page.locator('.grid-activity')).toHaveCount(26);

  await page.getByRole('button', { name: /Templates \(1\)/ }).click();
  await page.locator('app-template-list .apply-btn').click();
  await expect(page.locator('.grid-activity')).toHaveCount(27);
  // The confirmation shows up a moment later; wait so it is not left open.
  await expect.poll(() => messages.at(-1)).toContain('applied');
});

test('exports a PDF and resets the export button afterwards', async ({ page }) => {
  const exportButton = page.locator('.export-btn');
  await exportButton.click();

  const download = page.waitForEvent('download');
  await page.locator('app-export-pdf-options').getByRole('button', { name: /Export/ }).click();

  expect((await download).suggestedFilename()).toMatch(/^family-schedule-\d{4}-\d{2}-\d{2}\.pdf$/);
  await expect(exportButton).toHaveText(/Export PDF/);
  await expect(exportButton).toBeEnabled();
});

test('exports the data as JSON and imports it back', async ({ page }, testInfo) => {
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export data/ }).click();
  const file = testInfo.outputPath('backup.json');
  await (await download).saveAs(file);

  const backup = JSON.parse(await readFile(file, 'utf8'));
  expect(backup.format).toBe('intelligent-family-calendar');
  expect(backup.week).toHaveLength(27);

  await page.locator('.grid-activity', { hasText: 'Yoga' }).dblclick();
  await page.locator('.delete-btn').click();
  await expect(page.locator('.grid-activity')).toHaveCount(26);

  await page.locator('input[type=file]').setInputFiles(file);
  await expect(page.locator('.grid-activity')).toHaveCount(27);
  await expect(page.locator('.bottom-controls').getByRole('button', { name: /Undo/ })).toBeDisabled();
});

test('rejects a file that is not a backup and changes nothing', async ({ page }, testInfo) => {
  const messages: string[] = [];
  page.on('dialog', dialog => messages.push(dialog.message()));
  const file = testInfo.outputPath('not-a-backup.json');
  await writeFile(file, '{"hello": "world"}');

  await page.locator('input[type=file]').setInputFiles(file);

  await expect.poll(() => messages.at(-1)).toContain('is not a valid calendar backup');
  await expect(page.locator('.grid-activity')).toHaveCount(27);
});
