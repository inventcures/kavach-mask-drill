import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { answerCheck, checkBuddiesWell, disposeWell, finishPostCheck, fixEveryLeak, sidewaysOverflow, startDrill, watchPage } from './support';

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

async function checkStockWell(page: Page) {
  for (const [item, name] of [['A', 'Use'], ['B', 'Reject'], ['C', 'Reject'], ['D', 'Reject'], ['E', 'Use'], ['F', 'Reject']] as const) {
    await stock(page, item, name).click();
  }
}

test('a perfect run ends at 96% team protection with no contamination, and the result can be downloaded and deleted', async ({ page, baseURL }) => {
  const problems = watchPage(page, baseURL!);
  await page.goto('./');
  await page.getByRole('button', { name: 'Start the drill' }).click();

  // Pre-check: one plain consent line, no step number, and no Next until everything is answered.
  await expect(page.getByRole('heading', { name: 'Before we start' })).toBeVisible();
  await expect(page.getByText('No names are collected.')).toContainText('saved only on this phone');
  await expect(page.getByText(/Step \d/)).toHaveCount(0);
  await answerCheck(page, 2, { seal_vs_fit: 'True', doff_hold: 'The straps, bottom one first', weakest_seal: 'The three good seals' });
  await expect(page.getByRole('button', { name: 'Next' })).toHaveCount(0);
  await page.getByTestId('quiz-valve').getByRole('button', { name: 'False' }).click();
  await page.getByTestId('role').selectOption('nurse');
  // Whatever is typed, only capitals, digits and hyphens are kept, 16 at most.
  await page.getByTestId('trainer-code').pressSequentially('kzd-ert-1125 (Meera)');
  await expect(page.getByTestId('trainer-code')).toHaveValue('KZD-ERT-1125MEER');
  await page.getByTestId('trainer-code').fill('kzd-ert-1125');
  await expect(page.getByTestId('trainer-code')).toHaveValue('KZD-ERT-1125');
  expect(await sidewaysOverflow(page)).toBeLessThanOrEqual(0);
  await next(page);

  await expect(page.getByRole('heading', { name: 'Alert: suspected Nipah case' })).toBeVisible();
  await expect(page.getByText('Step 1 / 8')).toBeVisible();
  // A new screen takes the focus, so a screen reader starts reading it from the top.
  await expect(page.locator('main')).toBeFocused();
  await expect(page.getByTestId('team-row').locator('.dot')).toHaveText(['?', '?', '?', '?']);
  await expect(page.getByTestId('meter')).toHaveCount(0);
  await next(page);

  // Every screen that gives a rule also says the local protocol comes first.
  await expect(page.getByTestId('protocol-note')).toHaveText('Follow your local protocol if it differs from this drill.');
  await expect(page.getByTestId('meter')).toHaveCount(0);
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

  await expect(page.getByRole('heading', { name: 'Get a good seal' })).toBeVisible();
  await fixEveryLeak(page);
  await expect(page.getByTestId('seal-passed')).toContainText('Seal check passed');
  await next(page);

  await expect(page.getByRole('heading', { name: 'Buddy check your team' })).toBeVisible();
  await checkBuddiesWell(page);
  await expect(page.getByTestId('meter-value')).toHaveText('96% · PF 25.0');
  await next(page);

  await expect(page.getByRole('heading', { name: 'Take off your PPE safely' })).toBeVisible();
  for (const label of DOFF) await card(page, label).click();
  await expect(page.getByTestId('feedback')).toContainText('The N95 comes off last and outside the room');
  await expect(page.getByTestId('feedback').getByRole('img', { name: 'Right' })).toBeVisible();
  expect(await sidewaysOverflow(page)).toBeLessThanOrEqual(0);
  await next(page);

  await expect(page.getByRole('heading', { name: 'Dispose, decontaminate, log' })).toBeVisible();
  await expect(page.getByText('Step 8 / 8')).toBeVisible();
  await disposeWell(page);
  await expect(page.getByTestId('stock-log').getByTestId('feedback')).toContainText('only the 4 used come off');
  expect(await sidewaysOverflow(page)).toBeLessThanOrEqual(0);
  await next(page);

  await expect(page.getByRole('heading', { name: 'Quick check after the drill' })).toBeVisible();
  await expect(page.getByText(/Step \d/)).toHaveCount(0);
  expect(await sidewaysOverflow(page)).toBeLessThanOrEqual(0);
  await finishPostCheck(page);

  const results = page.getByTestId('results');
  await expect(results.getByRole('heading', { name: 'Drill complete' })).toBeVisible();
  await expect(page.getByTestId('results-percent')).toHaveText('96%');
  await expect(page.getByTestId('results-pf')).toContainText('protection factor: 25.0');
  await expect(page.getByTestId('results-contamination')).toHaveText('Self-contamination events while doffing: 0');
  await expect(results.getByTestId('team-row').locator('.dot')).toHaveText(['97%', '95%', '96%', '96%']);
  await expect(results).toContainText('No mistakes. Excellent drill.');
  await expect(page.getByTestId('before-after').locator('tbody tr')).toHaveText(['Quiz score2/44/4', 'Confidence2/54/5']);
  await expect(results).toContainText('Seal check every time. Fit test every year.');
  // The score must not be read as a measurement of anyone's real mask.
  const disclaimer = page.getByTestId('results-disclaimer');
  await expect(disclaimer).toContainText('Training aid only.');
  await expect(disclaimer).toContainText('This drill is not a fit test');
  await expect(disclaimer).toContainText('teaching approximations, not measurements');
  await expect(disclaimer).toContainText('follow your hospital or state infection-control protocol');
  await expect(results).toContainText('including drills other people played on this phone');
  await expect(page.locator('main')).toBeFocused();
  expect(await sidewaysOverflow(page)).toBeLessThanOrEqual(0);

  // Saved once, even after the screen re-renders in another language.
  await page.getByRole('button', { name: 'हिन्दी' }).click();
  await expect(results.getByRole('heading', { name: 'ड्रिल पूरी' })).toBeVisible();
  await page.getByRole('button', { name: 'English' }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('md_runs') ?? '[]').length)).toBe(1);

  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download my results (JSON)' }).click()]);
  expect(download.suggestedFilename()).toBe('mask-drill-results.json');
  const runs = JSON.parse(await readFile(await download.path(), 'utf8'));
  expect(runs).toHaveLength(1);
  expect(runs[0]).toMatchObject({
    v: 1,
    game: 'mask-drill',
    scenario: 'nipah-kerala-01',
    track: 'ert',
    lang: 'en',
    teamLeakage: 0.04,
    teamPF: 25,
    contaminationEvents: 0,
    leakageByMember: { you: 0.03, ravi: 0.05, anjali: 0.04, faiz: 0.04 },
    pre: { confidence: 2, score: 2, max: 4 },
    post: { confidence: 4, score: 4, max: 4, comfort: 3, willingToWear: 5 },
    mistakes: [],
    context: { role: 'nurse', trainerCode: 'KZD-ERT-1125' },
  });

  await page.getByRole('button', { name: 'Delete my results' }).click();
  await expect(page.getByTestId('deleted')).toHaveText('Your results have been deleted from this phone.');
  expect(await page.evaluate(() => localStorage.getItem('md_runs'))).toBeNull();
  await expect(page.getByRole('button', { name: 'Download my results (JSON)' })).toBeDisabled();

  await page.getByRole('button', { name: 'Play again' }).click();
  await expect(page.getByRole('heading', { name: 'Before we start' })).toBeVisible();
  await expect(page.getByTestId('trainer-code')).toHaveValue('');
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
  await expect(page.getByText('चरण 2 / 8')).toBeVisible();
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByTestId('meter-value')).toHaveText('40% · PF 1.7');
  await option(page, 'triage', 'Surgical mask').click();
  await option(page, 'agp', 'N95 + goggles or face shield').click();
  await next(page);

  // Letting expired stock through costs the player another 15 points of leakage.
  await stock(page, 'B', 'Use').click();
  await expect(page.getByTestId('stock-B').getByTestId('feedback')).toContainText('the straps have perished');
  await expect(page.getByTestId('stock-B').getByTestId('feedback').getByRole('img', { name: 'Wrong' })).toBeVisible();
  await expect(page.getByTestId('stock-B').getByRole('button', { name: 'Wrong Use' })).toBeDisabled();
  await expect(page.getByTestId('stock-B').getByRole('button', { name: 'Right Reject' })).toBeDisabled();
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

  // Bad stock went through earlier, so even a clean seal check ends with a warning about it.
  await fixEveryLeak(page);
  await expect(page.getByTestId('seal-passed')).toContainText('a mask from the bad stock reached your team');
  await next(page);
  await checkBuddiesWell(page);
  await next(page);

  // Doffing trap: the card is disabled and the reason is shown.
  await card(page, 'Pull the N95 off by the front').click();
  await expect(page.getByTestId('feedback')).toContainText('The front of the mask is the most contaminated surface');
  await expect(page.getByRole('button', { name: 'Wrong Pull the N95 off by the front' })).toBeDisabled();
  // Out of order after the first step is a contamination event, as is the trap above.
  await card(page, DOFF[0]!).click();
  await card(page, DOFF[2]!).click();
  await card(page, DOFF[3]!).click();
  for (const label of DOFF.slice(1)) await card(page, label).click();
  await next(page);

  // Gloves in general waste: wrong, and the right bin is pointed out. The log sum wrong too.
  await page.getByTestId('bin-gloves').getByRole('button', { name: 'General waste' }).click();
  await expect(page.getByTestId('bin-gloves').getByRole('button', { name: 'Wrong General waste' })).toBeDisabled();
  await expect(page.getByTestId('bin-gloves').getByRole('button', { name: 'Right Red bag' })).toBeDisabled();
  for (const item of ['n95', 'gown']) await page.getByTestId(`bin-${item}`).getByRole('button', { name: 'Yellow bag' }).click();
  await page.getByTestId('bin-goggles').getByRole('button', { name: 'Disinfect and reuse' }).click();
  await page.getByTestId('stock-log').getByRole('button', { name: '21' }).click();
  await expect(page.getByTestId('stock-log').getByTestId('feedback').getByRole('img', { name: 'Wrong' })).toBeVisible();
  await next(page);
  await finishPostCheck(page);

  await expect(page.getByTestId('results-contamination')).toHaveText('Self-contamination events while doffing: 3');
  await expect(page.getByTestId('mistakes').locator('li')).toHaveText([
    'Chose Cloth mask for: Ambulance transfer: you sit next to the coughing patient for 25 minutes',
    'Used N95, box 2',
    'Rejected N95, box 1',
    'Rejected N95, box 3 (different model)',
    'Put on PPE out of order',
    'Pull the N95 off by the front',
    'Took off PPE out of order ×2',
    'Used gloves into General waste',
    'Stock log wrote 21',
  ]);
  await page.getByRole('button', { name: 'हिन्दी' }).click();
  await expect(page.getByTestId('mistakes').locator('li').nth(6)).toHaveText('PPE गलत क्रम में उतारा ×2');
  expect(await sidewaysOverflow(page)).toBeLessThanOrEqual(0);
  expect(problems).toEqual([]);
});

for (const seed of [1, 2, 3]) {
  test(`random tapping always reaches the results (seed ${seed})`, async ({ page, baseURL }) => {
    const problems = watchPage(page, baseURL!);
    await page.goto('./');
    await page.getByRole('button', { name: 'Start the drill' }).click();
    // Small seeded generator so a failure can be replayed.
    let x = seed * 2654435761;
    const random = () => {
      x = (x * 1664525 + 1013904223) % 4294967296;
      return x / 4294967296;
    };
    const end = page.getByTestId('results');
    for (let taps = 0; taps < 1200 && !(await end.isVisible()); taps++) {
      const buttons = page.locator('button:enabled');
      const count = await buttons.count();
      await buttons.nth(Math.floor(random() * count)).click();
    }
    await expect(end).toBeVisible();
    expect(await sidewaysOverflow(page)).toBeLessThanOrEqual(0);
    expect(problems).toEqual([]);
  });
}
