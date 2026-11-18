import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { sidewaysOverflow, watchPage } from './support';

// The perfect player below reads the right answers from the scenario itself, so it
// works in any language the scenario is written in.
const scenario = JSON.parse(readFileSync(new URL('../src/content/scenarios/nipah-kerala-01.json', import.meta.url), 'utf8'));
const LANG = 'hi';
const exactly = (label: string) => new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);

async function playScreen(page: Page, screen: any): Promise<void> {
  const within = page.getByTestId(`screen-${screen.id}`);
  switch (screen.kind) {
    case 'quiz':
      await page.getByTestId('quiz-confidence').getByRole('button', { name: '4' }).click();
      for (const item of scenario.quiz.items) {
        const right = item.options.find((o: any) => o.id === item.correct);
        await page.getByTestId(`quiz-${item.id}`).getByRole('button', { name: right.label[LANG], exact: true }).click();
      }
      if (screen.phase === 'post') for (const id of ['comfort', 'willing']) await page.getByTestId(`quiz-${id}`).getByRole('button', { name: '4' }).click();
      break;
    case 'choice':
      for (const task of screen.tasks) {
        const best = screen.options.find((o: any) => o.id === task.best);
        await page.getByTestId(`task-${task.id}`).getByRole('button', { name: best.label[LANG], exact: true }).click();
      }
      break;
    case 'stock':
      for (const item of screen.items) await page.getByTestId(`stock-${item.id}`).getByRole('button').nth(item.usable ? 0 : 1).click();
      break;
    case 'sequence':
      for (const step of screen.steps) await page.getByTestId('cards').locator('button:enabled').filter({ hasText: exactly(step[LANG]) }).first().click();
      break;
    case 'seal':
      for (const action of screen.actions.filter((a: any) => !a.harmful)) await within.getByRole('button', { name: action.label[LANG], exact: true }).click();
      break;
    case 'buddy':
      for (const mate of screen.mates) {
        const ok = mate.options.find((o: any) => o.ok);
        await page.getByTestId(`mate-${mate.member}`).getByRole('button', { name: ok.label[LANG], exact: true }).click();
      }
      break;
    case 'bins':
      for (const item of screen.items) {
        const bin = screen.bins.find((b: any) => b.id === item.bin);
        await page.getByTestId(`bin-${item.id}`).getByRole('button', { name: bin.name[LANG], exact: true }).click();
      }
      await page.getByTestId('stock-log').getByRole('button', { name: String(screen.logQuestion.answer), exact: true }).click();
      break;
  }
}

test('the whole drill can be played in Hindi, from the home screen to the results', async ({ page, baseURL }) => {
  const problems = watchPage(page, baseURL!);
  await page.goto('./');
  await page.getByRole('button', { name: 'हिन्दी' }).click();
  await page.getByRole('button', { name: 'ड्रिल शुरू करें' }).click();

  for (const screen of scenario.screens) {
    await expect(page.getByTestId(`screen-${screen.id}`)).toBeVisible();
    await expect(page.getByRole('heading', { level: 2 })).toContainText(screen.title[LANG]);
    await playScreen(page, screen);
    expect(await sidewaysOverflow(page), `sideways overflow on ${screen.id}`).toBeLessThanOrEqual(0);
    await page.getByRole('button', { name: /^(आगे|नतीजे देखें)$/ }).click();
  }

  const results = page.getByTestId('results');
  await expect(results.getByRole('heading', { name: 'ड्रिल पूरी' })).toBeVisible();
  await expect(page.getByTestId('results-percent')).toHaveText('96%');
  await expect(page.getByTestId('results-contamination')).toHaveText('उतारते समय खुद के संक्रमण की घटनाएँ: 0');
  await expect(results).toContainText('कोई गलती नहीं। शानदार ड्रिल।');
  await expect(page.getByTestId('before-after').locator('tbody tr')).toHaveText(['क्विज़ स्कोर4/44/4', 'भरोसा4/54/5']);
  await expect(results).toContainText('हर बार सील चेक। हर साल फिट टेस्ट।');
  await expect(results.getByTestId('team-row').locator('.mem-name')).toHaveText(['आप', 'रवि', 'अंजलि', 'फ़ैज़']);
  await expect(page.getByTestId('results-disclaimer')).toContainText('यह ड्रिल फिट टेस्ट नहीं है');
  await expect(page.getByTestId('results-disclaimer')).toContainText('सिखाने के लिए अनुमान हैं');
  expect(await sidewaysOverflow(page)).toBeLessThanOrEqual(0);

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('md_runs') ?? '[]'));
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({ lang: 'hi', teamLeakage: 0.04, contaminationEvents: 0, mistakes: [] });
  expect(saved[0].context).toBeUndefined();
  expect(problems).toEqual([]);
});
