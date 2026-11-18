import { expect, test } from '@playwright/test';

test('home screen still opens with no network after the first visit', async ({ page, context }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 2, name: 'Mask Drill' })).toBeVisible();

  // Wait until the service worker has cached the app shell and controls the page.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((done) =>
        navigator.serviceWorker.addEventListener('controllerchange', () => done(), { once: true }),
      );
    }
  });

  await context.setOffline(true);
  await page.reload();

  await expect(page.getByRole('heading', { level: 2, name: 'Mask Drill' })).toBeVisible();
  // Styles and script came from the cache too: the toggle still works.
  await page.getByRole('button', { name: 'हिन्दी' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'मास्क ड्रिल' })).toBeVisible();
  await expect(page.locator('header')).toHaveCSS('position', 'sticky');
});
