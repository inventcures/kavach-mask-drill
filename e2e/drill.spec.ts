import { expect, test, type Locator, type Page } from '@playwright/test';
import { sidewaysOverflow, watchPage } from './support';

const DON = ['Hand hygiene', 'Gown', 'N95', 'Seal check', 'Goggles or face shield', 'Gloves (over gown cuffs)'];
const DOFF = [
  'Remove gloves (glove-in-glove)',
  'Hand hygiene',
  'Remove gown, rolling it inside out',
  'Remove goggles by the strap from behind',
  'Step out of the room',
  'Remove N95: bottom strap, then top strap, without touching the front',
  'Hand hygiene',
];

const next = (page: Page) => page.getByRole('button', { name: /^(Next|आगे)$/ }).click();
const option = (page: Page, task: string, name: string) => page.getByTestId(`task-${task}`).getByRole('button', { name });
const stock = (page: Page, item: string, name: 'Use' | 'Reject') => page.getByTestId(`stock-${item}`).getByRole('button', { name });
/** A card that can still be tapped, matched on its whole label ("Gown" must not match "Remove gown..."). */
function card(page: Page, label: string): Locator {
  const exact = new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
  return page.getByTestId('cards').locator('button:enabled').filter({ hasText: exact }).first();
}

async function startDrill(page: Page) {
  await page.goto('./');
  await page.getByRole('button', { name: 'Start the drill' }).click();
}

async function checkStockWell(page: Page) {
  for (const [item, name] of [['A', 'Use'], ['B', 'Reject'], ['C', 'Reject'], ['D', 'Reject'], ['E', 'Use'], ['F', 'Reject']] as const) {
    await stock(page, item, name).click();
  }
}

test('a perfect run goes from the alert to the end of doffing', async ({ page, baseURL }) => {
  const problems = watchPage(page, baseURL!);
  await startDrill(page);

  await expect(page.getByRole('heading', { name: 'Alert: suspected Nipah case' })).toBeVisible();
  await expect(page.getByText('Step 1 / 5')).toBeVisible();
  await expect(page.getByTestId('team-row').locator('.dot')).toHaveText(['?', '?', '?', '?']);
  await expect(page.getByTestId('meter')).toHaveCount(0);
  await next(page);

  await option(page, 'triage', 'Surgical mask').click();
  await expect(page.getByTestId('task-triage').getByTestId('feedback')).toContainText('saves N95s for close contact');
  await expect(page.getByTestId('task-triage').getByTestId('feedback').getByRole('img', { name: 'Right' })).toHaveText('✓');
  // No Next button until all three tasks are answered.
  await expect(page.getByRole('button', { name: 'Next' })).toHaveCount(0);
  await option(page, 'transfer', 'N95 + goggles or face shield').click();
  await expect(page.getByTestId('meter-value')).toHaveText('97% · PF 33.3');
  await expect(page.getByTestId('meter')).toContainText('Good');
  await option(page, 'agp', 'N95 + goggles or face shield').click();
  await next(page);

  await expect(page.getByRole('heading', { name: 'Check the stockpile' })).toBeVisible();
  await checkStockWell(page);
  await expect(page.getByTestId('stock-E').getByTestId('feedback')).toContainText('Having two models helps');
  await expect(page.getByTestId('meter-value')).toHaveText('97% · PF 33.3');
  await next(page);

  await expect(page.getByRole('heading', { name: 'Put on your PPE in the right order' })).toBeVisible();
  for (const label of DON) await card(page, label).click();
  await expect(page.getByTestId('placed').locator('li')).toHaveText(DON.map((label, i) => `${i + 1}. ${label}`));
  await expect(page.getByTestId('feedback')).toContainText('gloves last so they cover the gown cuffs');
  await expect(page.getByTestId('feedback').getByRole('img', { name: 'Right' })).toBeVisible();
  await next(page);

  await expect(page.getByRole('heading', { name: 'Take off your PPE safely' })).toBeVisible();
  for (const label of DOFF) await card(page, label).click();
  await expect(page.getByTestId('feedback')).toContainText('The N95 comes off last and outside the room');
  await expect(page.getByTestId('feedback').getByRole('img', { name: 'Right' })).toBeVisible();
  expect(await sidewaysOverflow(page)).toBeLessThanOrEqual(0);
  await next(page);

  await expect(page.getByTestId('drill-end')).toContainText('Continue (coming next)');
  await page.getByRole('button', { name: 'Play again' }).click();
  await expect(page.getByRole('heading', { name: 'Alert: suspected Nipah case' })).toBeVisible();
  await expect(page.getByTestId('meter')).toHaveCount(0);
  expect(problems).toEqual([]);
});

test('mistakes get immediate feedback, move the meter, and survive a language switch mid-screen', async ({ page, baseURL }) => {
  const problems = watchPage(page, baseURL!);
  await startDrill(page);
  await next(page);

  // A cloth mask for the ambulance transfer: wrong, and the best answer is pointed out.
  await option(page, 'transfer', 'Cloth mask').click();
  const transfer = page.getByTestId('task-transfer');
  await expect(transfer.getByTestId('feedback').getByRole('img', { name: 'Wrong' })).toHaveText('✗');
  await expect(transfer.getByTestId('feedback')).toContainText('N95 plus eye protection');
  await expect(transfer.getByRole('button', { name: 'Wrong Cloth mask' })).toBeDisabled();
  await expect(transfer.getByRole('button', { name: 'Best choice N95 + goggles or face shield' })).toBeDisabled();
  await expect(page.getByTestId('meter-value')).toHaveText('40% · PF 1.7');
  await expect(page.getByTestId('meter')).toContainText('Unsafe');

  // Switch to Hindi half-way through the screen: the answer and its feedback stay, nothing resets.
  await page.getByRole('button', { name: 'हिन्दी' }).click();
  await expect(transfer.getByTestId('feedback')).toContainText('N95 और आँखों की सुरक्षा');
  await expect(transfer.getByRole('button', { name: 'कपड़े का मास्क' })).toBeDisabled();
  await expect(page.getByTestId('task-triage').getByRole('button', { name: 'सर्जिकल मास्क' })).toBeEnabled();
  await expect(page.getByTestId('meter-value')).toHaveText('40% · PF 1.7');
  await expect(page.getByText('चरण 2 / 5')).toBeVisible();
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByTestId('meter-value')).toHaveText('40% · PF 1.7');
  await option(page, 'triage', 'Surgical mask').click();
  await option(page, 'agp', 'N95 + goggles or face shield').click();
  await next(page);

  // Letting expired stock through costs the player another 15 points of leakage.
  await stock(page, 'B', 'Use').click();
  await expect(page.getByTestId('stock-B').getByTestId('feedback')).toContainText('the straps have perished');
  await expect(page.getByTestId('stock-B').getByTestId('feedback').getByRole('img', { name: 'Wrong' })).toBeVisible();
  await expect(page.getByTestId('meter-value')).toHaveText('25% · PF 1.3');
  for (const item of ['A', 'C', 'D', 'E', 'F']) await stock(page, item, 'Reject').click();
  await expect(page.getByTestId('meter-value')).toHaveText('25% · PF 1.3');
  await next(page);

  // Donning out of order: told which step is expected, nothing is placed.
  await card(page, 'Gown').click();
  await expect(page.getByTestId('feedback')).toHaveText(/Not yet\. What should come at step 1\?/);
  await expect(page.getByTestId('placed').locator('li')).toHaveCount(0);
  await card(page, 'Hand hygiene').click();
  await card(page, 'Gown').click();
  await page.getByRole('button', { name: 'हिन्दी' }).click();
  await expect(page.getByTestId('placed').locator('li')).toHaveText(['1. हाथों की सफ़ाई', '2. गाउन']);
  await page.getByRole('button', { name: 'English' }).click();
  for (const label of DON.slice(2)) await card(page, label).click();
  // Finished with an error on the way: the explanation comes as a note, not as a tick.
  await expect(page.getByTestId('feedback').getByRole('img', { name: 'Note' })).toBeVisible();
  await next(page);

  // Doffing trap: the card is disabled and the reason is shown.
  await card(page, 'Pull the N95 off by the front').click();
  await expect(page.getByTestId('feedback')).toContainText('The front of the mask is the most contaminated surface');
  await expect(page.getByRole('button', { name: 'Wrong Pull the N95 off by the front' })).toBeDisabled();
  for (const label of DOFF) await card(page, label).click();
  await next(page);
  await expect(page.getByTestId('drill-end')).toBeVisible();
  expect(await sidewaysOverflow(page)).toBeLessThanOrEqual(0);
  expect(problems).toEqual([]);
});

for (const seed of [1, 2, 3]) {
  test(`random tapping always reaches the end of the drill (seed ${seed})`, async ({ page, baseURL }) => {
    const problems = watchPage(page, baseURL!);
    await startDrill(page);
    // Small seeded generator so a failure can be replayed.
    let x = seed * 2654435761;
    const random = () => {
      x = (x * 1664525 + 1013904223) % 4294967296;
      return x / 4294967296;
    };
    const end = page.getByTestId('drill-end');
    for (let taps = 0; taps < 400 && !(await end.isVisible()); taps++) {
      const buttons = page.locator('button:enabled');
      const count = await buttons.count();
      await buttons.nth(Math.floor(random() * count)).click();
    }
    await expect(end).toBeVisible();
    expect(await sidewaysOverflow(page)).toBeLessThanOrEqual(0);
    expect(problems).toEqual([]);
  });
}
