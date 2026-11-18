import { expect, test } from '@playwright/test';
import { fixEveryLeak, playToSealCheck, sealAction, sidewaysOverflow, watchPage } from './support';

const meter = (page: import('@playwright/test').Page) => page.getByTestId('meter-value');
const nextButton = (page: import('@playwright/test').Page) => page.getByRole('button', { name: 'Next' });

test('the face shows where air escapes, and fixing every leak passes the seal check', async ({ page, baseURL }) => {
  const problems = watchPage(page, baseURL!);
  await playToSealCheck(page);

  await expect(page.getByRole('heading', { name: 'Get a good seal' })).toBeVisible();
  const face = page.getByRole('img', { name: /Face wearing an N95 mask/ });
  await expect(face).toHaveAccessibleName('Face wearing an N95 mask. Air is escaping at: the nose, the sides, the chin.');
  await expect(page.getByTestId('leaks-left')).toHaveText('Leaks remaining: 3');
  await expect(page.locator('.leak')).toHaveCount(5);
  await expect(nextButton(page)).toHaveCount(0);

  await sealAction(page, /Mould the nose clip/).click();
  await expect(page.getByTestId('feedback')).toContainText('The clip now follows the shape of your nose');
  await expect(face).toHaveAccessibleName('Face wearing an N95 mask. Air is escaping at: the sides, the chin.');
  await expect(page.locator('.leak')).toHaveCount(3);

  // The face and its label follow the language.
  await page.getByRole('button', { name: 'हिन्दी' }).click();
  await expect(page.getByTestId('face')).toHaveAccessibleName('N95 मास्क पहना चेहरा। यहाँ से हवा निकल रही है: किनारे, ठोड़ी।');
  await expect(page.getByTestId('leaks-left')).toHaveText('बचे हुए लीक: 2');
  await page.getByRole('button', { name: 'English' }).click();

  await sealAction(page, /Top strap high on the crown/).click();
  await sealAction(page, /under your chin/).click();
  await expect(face).toHaveAccessibleName('Face wearing an N95 mask. No air is escaping.');
  await expect(page.locator('.leak')).toHaveCount(0);
  const passed = page.getByTestId('seal-passed');
  await expect(passed).toContainText('Seal check passed');
  // The seal check is not a fit test.
  await expect(passed).toContainText('It does not replace a yearly fit test');
  await expect(passed).not.toContainText('bad stock');
  await expect(page.getByTestId('seal-actions').locator('button:enabled')).toHaveCount(0);
  await expect(meter(page)).toHaveText('97% · PF 33.3');
  expect(await sidewaysOverflow(page)).toBeLessThanOrEqual(0);
  expect(problems).toEqual([]);
});

test('a harmful action re-opens a leak, costs protection, and can always be undone', async ({ page, baseURL }) => {
  const problems = watchPage(page, baseURL!);
  await playToSealCheck(page);

  await sealAction(page, /Stuff tissue/).click();
  await expect(page.getByTestId('feedback')).toContainText('Never put anything between the mask and your face');
  await expect(page.getByTestId('feedback').getByRole('img', { name: 'Wrong' })).toBeVisible();
  await expect(sealAction(page, /Stuff tissue/)).toBeDisabled();
  await expect(meter(page)).toHaveText('94% · PF 16.7');

  await fixEveryLeak(page);
  await expect(page.getByTestId('seal-passed')).toBeVisible();
  await expect(nextButton(page)).toBeVisible();

  // Start over and re-open leaks after fixing them: the fixes still work.
  await playToSealCheck(page);
  await sealAction(page, /Mould the nose clip/).click();
  await sealAction(page, /Top strap high on the crown/).click();
  await expect(page.getByTestId('leaks-left')).toHaveText('Leaks remaining: 1');
  await sealAction(page, /Pinch the nose clip/).click();
  await expect(page.getByTestId('feedback')).toContainText('bends the clip into a V');
  await sealAction(page, /Cross the straps/).click();
  await expect(page.getByTestId('leaks-left')).toHaveText('Leaks remaining: 3');
  await expect(meter(page)).toHaveText('91% · PF 11.1');
  await expect(nextButton(page)).toHaveCount(0);
  // The fix buttons are enabled again and no longer ticked.
  await expect(sealAction(page, /Mould the nose clip/)).toBeEnabled();
  await expect(sealAction(page, /Mould the nose clip/).getByRole('img')).toHaveCount(0);
  await fixEveryLeak(page);
  await expect(page.getByTestId('seal-passed')).toContainText('Seal check passed');
  // The damage done by the harmful actions stays on the meter.
  await expect(meter(page)).toHaveText('91% · PF 11.1');
  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: 'Buddy check your team' })).toBeVisible();
  expect(problems).toEqual([]);
});

test('each buddy decision moves the team meter, and one leaky teammate is explained', async ({ page, baseURL }) => {
  const problems = watchPage(page, baseURL!);
  await playToSealCheck(page);
  await fixEveryLeak(page);
  await nextButton(page).click();

  await expect(page.getByRole('heading', { name: 'Buddy check your team' })).toBeVisible();
  await expect(page.getByTestId('mate-ravi')).toContainText('Has a three-day beard');
  await expect(meter(page)).toHaveText('97% · PF 33.3');

  // Letting Ravi go with stubble under the seal: 3% and 35% average to 19%.
  const ravi = page.getByTestId('mate-ravi');
  await ravi.getByRole('button', { name: 'Looks fine, carry on' }).click();
  await expect(ravi.getByTestId('feedback')).toContainText('Ravi now has the worst protection on the team');
  await expect(ravi.getByTestId('feedback').getByRole('img', { name: 'Wrong' })).toBeVisible();
  // The right call is pointed out as well.
  await expect(ravi.getByRole('button', { name: /^Right Move him to the triage desk/ })).toBeDisabled();
  await expect(ravi.getByRole('img', { name: 'Right' })).toHaveCount(1);
  await expect(ravi.locator('button:enabled')).toHaveCount(0);
  await expect(meter(page)).toHaveText('81% · PF 5.3');
  await expect(page.getByTestId('meter')).toContainText('At risk');
  await expect(nextButton(page)).toHaveCount(0);
  await expect(page.getByTestId('buddy-explain')).toHaveCount(0);

  const anjali = page.getByTestId('mate-anjali');
  await anjali.getByRole('button', { name: /move the strap below her ears/ }).click();
  await expect(anjali.getByTestId('feedback')).toContainText('Straps over the ears tilt the mask');
  await expect(meter(page)).toHaveText('86% · PF 7.1');

  await page.getByRole('button', { name: 'हिन्दी' }).click();
  await expect(anjali.getByTestId('feedback')).toContainText('कानों पर पट्टी');
  await expect(page.locator('[data-testid^="mate-"] legend')).toHaveText(['रवि', 'अंजलि', 'फ़ैज़']);
  await expect(meter(page)).toHaveText('86% · PF 7.1');
  await page.getByRole('button', { name: 'English' }).click();

  const faiz = page.getByTestId('mate-faiz');
  await faiz.getByRole('button', { name: /All good/ }).click();
  await expect(faiz.getByTestId('feedback')).toContainText('saying when someone has it right');
  await expect(meter(page)).toHaveText('89% · PF 8.7');
  await expect(page.getByTestId('buddy-explain')).toContainText('Three people at 4% and one at 35% average to about 12%');
  expect(await sidewaysOverflow(page)).toBeLessThanOrEqual(0);
  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: 'Take off your PPE safely' })).toBeVisible();
  expect(problems).toEqual([]);
});

test('with reduced motion the leak puffs are shown but do not move', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await playToSealCheck(page);
  const puff = page.locator('.leak').first();
  await expect(puff).toBeVisible();
  expect(await puff.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  expect(await puff.evaluate((el) => getComputedStyle(el).animationName)).toBe('puff');
});

for (const seed of [1, 2, 3, 4, 5, 6]) {
  test(`random tapping always gets past the seal check and the buddy check (seed ${seed})`, async ({ page, baseURL }) => {
    const problems = watchPage(page, baseURL!);
    await playToSealCheck(page);
    // Small seeded generator so a failure can be replayed.
    let x = seed * 2654435761;
    const random = () => {
      x = (x * 1664525 + 1013904223) % 4294967296;
      return x / 4294967296;
    };
    const doffing = page.getByTestId('screen-doff');
    const seen = new Set<string>();
    for (let taps = 0; taps < 200 && !(await doffing.isVisible()); taps++) {
      seen.add((await page.locator('[data-testid^="screen-"]').getAttribute('data-testid')) ?? '');
      // Everything a thumb could land on, the language toggle included.
      const buttons = page.locator('button:enabled');
      await buttons.nth(Math.floor(random() * (await buttons.count()))).click();
    }
    await expect(doffing).toBeVisible();
    expect([...seen]).toEqual(['screen-seal', 'screen-buddy']);
    expect(problems).toEqual([]);
  });
}
