import { expect, test, type Page } from '@playwright/test';

/** Fails the test on any console error or any request that leaves the app's own origin. */
function watchPage(page: Page, baseURL: string) {
  const problems: string[] = [];
  const origin = new URL(baseURL).origin;
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`console error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => problems.push(`page error: ${err.message}`));
  page.on('request', (req) => {
    const url = req.url();
    if (url.startsWith('data:') || url.startsWith('blob:')) return;
    if (new URL(url).origin !== origin) problems.push(`off-origin request: ${url}`);
  });
  return problems;
}

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
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  expect(problems).toEqual([]);
});
