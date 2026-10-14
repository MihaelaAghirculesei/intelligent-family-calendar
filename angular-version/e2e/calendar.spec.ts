import { expect, test, type Page } from '@playwright/test';

const block = (page: Page, title: string) => page.locator('.grid-activity', { hasText: title });

async function addActivity(page: Page, title: string, person: string, day: string, start: string, end: string) {
  await page.getByRole('button', { name: /Add activity/ }).click();
  const dialog = page.locator('app-add-activity .modal-content');
  await dialog.getByLabel('Title').fill(title);
  await dialog.getByLabel('Person').selectOption({ label: person });
  await dialog.getByLabel('Day').selectOption({ label: day });
  await dialog.getByLabel('Start time').fill(start);
  await dialog.getByLabel('End time').fill(end);
  await dialog.getByRole('button', { name: 'Add activity' }).click();
  await expect(dialog).toBeHidden();
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/en-US/');
});

test('shows the demo week on a first visit', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Family Weekly Schedule' })).toBeVisible();
  await expect(page.locator('.legend-item')).toHaveText(['Anna', 'Mia', 'Leo']);
  await expect(page.locator('.grid-activity')).toHaveCount(27);
});

test('adds an activity and undoes and redoes it', async ({ page }) => {
  const undo = page.locator('.bottom-controls').getByRole('button', { name: /Undo/ });
  await expect(undo).toBeDisabled();

  await addActivity(page, 'Chess club', 'Leo', 'Sunday', '15:00', '16:00');
  await expect(block(page, 'Chess club')).toContainText('15:00-16:00');

  await undo.click();
  await expect(block(page, 'Chess club')).toHaveCount(0);

  await page.keyboard.press('Control+y');
  await expect(block(page, 'Chess club')).toHaveCount(1);
});

test('edits and deletes an activity in place', async ({ page }) => {
  await addActivity(page, 'Chess club', 'Leo', 'Sunday', '15:00', '16:00');

  await block(page, 'Chess club').dblclick();
  await page.locator('.title-input').fill('Chess match');
  await page.locator('.save-btn').click();
  await expect(block(page, 'Chess match')).toBeVisible();

  await block(page, 'Chess match').dblclick();
  await page.locator('.delete-btn').click();
  await expect(block(page, 'Chess match')).toHaveCount(0);
});

test('shows the full details of a narrow block on hover', async ({ page }) => {
  const school = block(page, 'Sch').first();
  await school.hover();

  const card = page.locator('.activity-details');
  await expect(card).toContainText('School');
  await expect(card).toContainText('Anna');
  await expect(card).toContainText('07:45-14:00');

  await page.mouse.move(5, 5);
  await expect(card).toBeHidden();
});

test('closes the details when the page scrolls', async ({ page }) => {
  await page.locator('.grid-activity', { hasText: 'Yoga' }).hover();
  await expect(page.locator('.activity-details')).toBeVisible();

  await page.mouse.wheel(0, 300);
  await expect(page.locator('.activity-details')).toBeHidden();
});

test('adds a family member from the activity form', async ({ page }) => {
  await page.getByRole('button', { name: /Add activity/ }).click();
  await page.locator('app-add-activity').getByLabel('Person').selectOption('add_new_person');

  const personDialog = page.locator('app-add-activity app-add-person .modal-content');
  await personDialog.getByLabel('Name').fill('Nora');
  await personDialog.getByRole('button', { name: 'Add person' }).click();

  await expect(page.locator('app-add-activity').getByLabel('Person')).toHaveValue('nora');
  await expect(page.locator('.legend-item', { hasText: 'Nora' })).toBeVisible();
});

test('keeps the week after a reload', async ({ page }) => {
  await addActivity(page, 'Chess club', 'Leo', 'Sunday', '15:00', '16:00');
  await page.reload();
  await expect(block(page, 'Chess club')).toBeVisible();
});
