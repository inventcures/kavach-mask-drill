import type { Page } from '@playwright/test';

/** Collects console errors and any request that leaves the app's own origin. Assert it is empty at the end. */
export function watchPage(page: Page, baseURL: string): string[] {
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

/** How far the page is wider than the phone screen, in px. Should be 0. */
export function sidewaysOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

const DON_ORDER = ['Hand hygiene', 'Gown', 'N95', 'Seal check', 'Goggles or face shield', 'Gloves (over gown cuffs)'];

/** The right answer to each quiz item, by item id (English labels). */
export const QUIZ_RIGHT = { seal_vs_fit: 'False', doff_hold: 'The straps, bottom one first', weakest_seal: 'The one bad seal', valve: 'False' } as const;

/** Sets confidence and answers the four quiz items on the pre-check or post-check. Does not press Next. */
export async function answerCheck(page: Page, confidence: number, answers: Record<string, string> = QUIZ_RIGHT): Promise<void> {
  await page.getByTestId('quiz-confidence').getByRole('button', { name: String(confidence) }).click();
  for (const [item, name] of Object.entries(answers)) await page.getByTestId(`quiz-${item}`).getByRole('button', { name, exact: true }).click();
}

/** From the home screen through the pre-check, to the first drill step (the alert). */
export async function startDrill(page: Page): Promise<void> {
  await page.goto('./');
  await page.getByRole('button', { name: 'Start the drill' }).click();
  await answerCheck(page, 2, { ...QUIZ_RIGHT, seal_vs_fit: 'True', weakest_seal: 'The three good seals' });
  await page.getByRole('button', { name: 'Next' }).click();
}

/** Bins every item correctly and gets the stock log right. */
export async function disposeWell(page: Page): Promise<void> {
  for (const [item, name] of [['n95', 'Yellow bag'], ['gown', 'Yellow bag'], ['gloves', 'Red bag'], ['goggles', 'Disinfect and reuse']] as const) {
    await page.getByTestId(`bin-${item}`).getByRole('button', { name }).click();
  }
  await page.getByTestId('stock-log').getByRole('button', { name: '36' }).click();
}

/** The post-check with every answer right, then on to the results. */
export async function finishPostCheck(page: Page): Promise<void> {
  await answerCheck(page, 4);
  await page.getByTestId('quiz-comfort').getByRole('button', { name: '3' }).click();
  await page.getByTestId('quiz-willing').getByRole('button', { name: '5' }).click();
  await page.getByRole('button', { name: 'See results' }).click();
}

/** Plays the drill without a mistake from the home screen up to the seal check. */
export async function playToSealCheck(page: Page): Promise<void> {
  const next = () => page.getByRole('button', { name: 'Next' }).click();
  await startDrill(page);
  await next();
  await page.getByTestId('task-triage').getByRole('button', { name: 'Surgical mask' }).click();
  for (const task of ['transfer', 'agp']) await page.getByTestId(`task-${task}`).getByRole('button', { name: 'N95 + goggles or face shield' }).click();
  await next();
  for (const [item, name] of [['A', 'Use'], ['B', 'Reject'], ['C', 'Reject'], ['D', 'Reject'], ['E', 'Use'], ['F', 'Reject']] as const) {
    await page.getByTestId(`stock-${item}`).getByRole('button', { name }).click();
  }
  await next();
  for (const label of DON_ORDER) {
    await page.getByTestId('cards').locator('button:enabled').filter({ hasText: new RegExp(`^${label.replace(/[()]/g, '\\$&')}$`) }).first().click();
  }
  await next();
}

/** A seal-check action button, matched on part of its English label. */
export function sealAction(page: Page, label: RegExp) {
  return page.getByTestId('seal-actions').getByRole('button', { name: label });
}

/** Closes all three leaks without doing anything harmful. */
export async function fixEveryLeak(page: Page): Promise<void> {
  for (const label of [/Mould the nose clip/, /Top strap high on the crown/, /under your chin/]) await sealAction(page, label).click();
}

/** Makes the right call for each teammate. */
export async function checkBuddiesWell(page: Page): Promise<void> {
  await page.getByTestId('mate-ravi').getByRole('button', { name: /Move him to the triage desk/ }).click();
  await page.getByTestId('mate-anjali').getByRole('button', { name: /move the strap below her ears/ }).click();
  await page.getByTestId('mate-faiz').getByRole('button', { name: /All good/ }).click();
}
