import { expect, test } from '@playwright/test';

test('serves the Italian build with Italian demo data', async ({ page }) => {
  await page.goto('/it/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'it');
  await expect(page.getByRole('heading', { name: 'Orario Settimanale Famiglia' })).toBeVisible();
  await expect(page.locator('.day-header').first()).toHaveText('Lunedì');
  await expect(page.locator('.grid-activity', { hasText: 'Nuoto' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Esporta dati/ })).toBeVisible();
});

test('serves the English build by default', async ({ page }) => {
  await page.goto('/en-US/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  await expect(page.locator('.day-header').first()).toHaveText('Monday');
});
