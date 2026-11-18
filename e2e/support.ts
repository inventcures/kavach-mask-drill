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

/** Plays the drill without a mistake from the home screen up to the seal check. */
export async function playToSealCheck(page: Page): Promise<void> {
  const next = () => page.getByRole('button', { name: 'Next' }).click();
  await page.goto('./');
  await page.getByRole('button', { name: 'Start the drill' }).click();
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
