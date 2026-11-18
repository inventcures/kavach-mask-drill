import { expect, test } from '@playwright/test';

test('meter and team row follow the team leakage, in English and Hindi', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./#/dev/meter');

  // Three members at 4% and one at 35%: the worked example from the spec.
  const meter = page.getByTestId('meter');
  await expect(page.getByTestId('meter-value')).toHaveText('88% · PF 8.5');
  await expect(meter).toContainText('Team protection');
  await expect(meter).toContainText('At risk');
  const dots = page.getByTestId('team-row').locator('.dot');
  await expect(dots).toHaveText(['96%', '65%', '96%', '96%']);
  await expect(page.getByTestId('team-row')).toContainText('You');

  await page.getByRole('button', { name: 'Four good seals' }).click();
  await expect(page.getByTestId('meter-value')).toHaveText('96% · PF 25.0');
  await expect(meter).toContainText('Good');

  await page.getByRole('button', { name: 'Surgical masks' }).click();
  await expect(page.getByTestId('meter-value')).toHaveText('50% · PF 2.0');
  await expect(meter).toContainText('Unsafe');
  await expect(dots).toHaveText(['65%', '35%', '?', '?']);

  await page.getByRole('button', { name: 'हिन्दी' }).click();
  await expect(meter).toContainText('टीम सुरक्षा');
  await expect(meter).toContainText('असुरक्षित');
  await expect(page.getByTestId('team-row')).toContainText('आप');

  await page.getByRole('button', { name: 'Nobody masked up' }).click();
  await expect(meter).toHaveCount(0);
  await expect(dots).toHaveText(['?', '?', '?', '?']);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});
