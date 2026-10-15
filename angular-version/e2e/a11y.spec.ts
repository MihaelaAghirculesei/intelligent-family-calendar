import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// WCAG 2.2 level A and AA, the usual legal and practical target.
async function violations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  return violations.map(v => ({
    rule: v.id,
    impact: v.impact,
    targets: v.nodes.map(n => n.target.join(' ')).slice(0, 5),
    count: v.nodes.length
  }));
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
});

// Opened through class names, so the same steps work in both languages.
const states: [string, (page: Page) => Promise<void>][] = [
  ['the week', async () => {}],
  ['the add activity form', async page => {
    await page.locator('.add-btn').click();
  }],
  ['the add person form', async page => {
    await page.locator('.add-btn').click();
    await page.locator('app-add-activity #person').selectOption('add_new_person');
  }],
  ['the save template form', async page => {
    await page.locator('.template-btn').click();
  }],
  ['the empty template list', async page => {
    await page.locator('.template-list-btn').click();
  }],
  ['a template in the list', async page => {
    await page.locator('.template-btn').click();
    await page.locator('app-save-template .btn-primary').click();
    await page.locator('.template-list-btn').click();
    await expect(page.locator('app-template-list .apply-btn')).toBeVisible();
  }],
  ['the PDF export options', async page => {
    await page.locator('.export-btn').click();
  }],
  ['the edit form', async page => {
    await page.locator('.grid-activity', { hasText: 'Yoga' }).dblclick();
  }],
  ['the details card', async page => {
    await page.locator('.grid-activity', { hasText: 'Yoga' }).hover();
  }]
];

for (const locale of ['en-US', 'it']) {
  for (const [name, open] of states) {
    test(`${locale}: ${name} has no accessibility violations`, async ({ page }) => {
      await page.goto(`/${locale}/`);
      await open(page);
      expect(await violations(page)).toEqual([]);
    });
  }
}
