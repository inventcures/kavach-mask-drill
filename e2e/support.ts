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
