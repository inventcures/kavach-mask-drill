import { expect, test } from '@playwright/test';
import { sidewaysOverflow, watchPage } from './support';

test('home screen shows the drill and switches between English and Hindi', async ({ page, baseURL }) => {
  const problems = watchPage(page, baseURL!);
  await page.goto('./');

  await expect(page.getByRole('heading', { level: 2, name: 'Mask Drill' })).toBeVisible();
  await expect(page.getByText('Training aid only.')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await page.getByRole('button', { name: 'हिन्दी' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'मास्क ड्रिल' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi');

  // The choice survives a reload.
  await page.reload();
  await expect(page.getByRole('heading', { level: 2, name: 'मास्क ड्रिल' })).toBeVisible();

  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Mask Drill' })).toBeVisible();

  // Nothing overflows sideways on a 360 px phone.
  expect(await sidewaysOverflow(page)).toBeLessThanOrEqual(0);
  expect(problems).toEqual([]);
});
