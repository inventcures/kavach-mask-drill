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

  // Older Android Chrome only offers "Add to Home screen" when the manifest has PNG icons at 192 and 512 px.
  const manifest = await (await page.request.get('./manifest.json')).json();
  for (const size of ['192x192', '512x512']) {
    const icon = manifest.icons.find((i: { sizes: string; type: string }) => i.sizes === size && i.type === 'image/png');
    expect(icon, `manifest icon ${size}`).toBeTruthy();
    const res = await page.request.get(`./${icon.src}`);
    expect(res.ok()).toBe(true);
    expect(res.headers()['content-type']).toBe('image/png');
  }

  // Nothing overflows sideways on a 360 px phone.
  expect(await sidewaysOverflow(page)).toBeLessThanOrEqual(0);
  expect(problems).toEqual([]);
});
