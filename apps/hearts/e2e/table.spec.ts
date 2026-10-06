import { cardsLanded, collectErrors, hurry, isFaceUp, mute, pace, problemsIn, sizes, type Box, type Measurements } from '@card-games/e2e/helpers';
import { expect, test, type Page } from '@playwright/test';

const yourCards = (page: Page) => page.locator('.hand .slot');
const passButton = (page: Page) => page.getByRole('button', { name: /^Pass 3 cards|of 3 chosen$/ });
const endOfHand = (page: Page) => page.getByRole('button', { name: /^(Next hand|Play again)$/ });

/**
 * Clicks a card in your hand. The cards overlap, so it is clicked near its left edge, which is the
 * part of it that shows.
 */
async function clickCard(page: Page, index: number) {
  await yourCards(page).nth(index).click({ position: { x: 6, y: 20 } });
}

/** The first card in your hand you may play now, or -1 if it is not your turn. */
const firstPlayable = (page: Page) =>
  yourCards(page).evaluateAll((all) => all.findIndex((b) => !(b as HTMLButtonElement).disabled));

/** Chooses your first three cards and passes them, if this hand has passing. */
async function pass(page: Page) {
  const button = passButton(page);
  if (!(await button.isVisible())) return;
  for (const i of [0, 1, 2]) await clickCard(page, i);
  await expect(page.getByRole('button', { name: 'Pass 3 cards' })).toBeEnabled();
  await page.getByRole('button', { name: 'Pass 3 cards' }).click();
}

/** Plays the first card you may play on each of your turns until the hand is over. */
async function playToTheEnd(page: Page) {
  await expect(yourCards(page).first()).toBeVisible({ timeout: 30_000 });
  await pass(page);
  const done = endOfHand(page);
  try {
    await expect(async () => {
      if (await done.isVisible()) return;
      const index = await firstPlayable(page);
      if (index >= 0) await clickCard(page, index);
      expect(await done.isVisible()).toBe(true);
    }).toPass({ timeout: 180_000, intervals: [50] });
  } catch (error) {
    throw new Error(`The hand did not finish. The controls said: ${await page.locator('.controls').innerText()}
${error}`);
  }
}

test.describe('with motion', () => {
  test('deals thirteen cards each with no errors, and asks for three to pass', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    await mute(page);
    await expect(page).toHaveTitle('Hearts');
    await expect(yourCards(page)).toHaveCount(13);
    for (const seat of [1, 2, 3]) await expect(page.locator(`#fan-${seat} > div`)).toHaveCount(13);
    await expect(page.getByText(/Choose 3 cards to pass to Terry/)).toBeVisible();
    await expect(passButton(page)).toBeDisabled();
    expect(errors).toEqual([]);
  });

  test('your cards are dealt face up, and the others’ face down', async ({ page }) => {
    await page.goto('/');
    await mute(page);
    await expect(yourCards(page)).toHaveCount(13);
    await cardsLanded(page, page.locator('.hand [role="img"]'));
    // The last card in your hand is the only one shown whole.
    expect(await isFaceUp(page, yourCards(page).last())).toBe(true);
    expect(await isFaceUp(page, page.locator('#fan-2 > div').last())).toBe(false);
  });

  test('passing swaps three cards, and the two of clubs leads', async ({ page }) => {
    const errors = collectErrors(page);
    await hurry(page);
    await page.goto('/');
    await mute(page);
    await expect(yourCards(page)).toHaveCount(13);
    const before = await yourCards(page).evaluateAll((all) => all.map((b) => b.getAttribute('aria-label')));
    await pass(page);
    await expect(page.locator('.hand .slot.received')).toHaveCount(3);
    const after = await yourCards(page).evaluateAll((all) => all.map((b) => b.getAttribute('aria-label')));
    expect(after).toHaveLength(13);
    expect(after.filter((name) => !before.includes(name))).toHaveLength(3);
    // The first card of the hand is the two of clubs, led by whoever has it.
    await expect(page.locator('.trick [role="img"]').first()).toHaveAttribute('aria-label', '2 of clubs', { timeout: 10_000 });
    expect(errors).toEqual([]);
  });

  test('plays a whole hand, shows the result and the score sheet', async ({ page }) => {
    const errors = collectErrors(page);
    await hurry(page);
    await page.goto('/');
    await mute(page);
    await playToTheEnd(page);
    await expect(page.locator('.verdict')).toBeVisible();
    await expect(page.locator('.verdict')).toContainText(/took|moon/);
    const sheet = page.getByRole('table', { name: 'Scores' });
    await expect(sheet).toBeVisible();
    // Every hand has 26 points, or 78 if someone shot the moon.
    const points = (await sheet.locator('tbody td').allInnerTexts()).map(Number);
    expect([26, 78]).toContain(points.reduce((a, b) => a + b, 0));
    // The next hand passes to the right.
    await endOfHand(page).click();
    await expect(page.locator('.controls').getByText(/to Priya, on your right/)).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('layout', () => {
  // Nothing moves, so the positions can be measured.
  test.use({ reducedMotion: 'reduce' });

  test('the Pass button is in view on a phone without scrolling', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'iphone', 'about the height a phone leaves');
    await page.goto('/');
    await mute(page);
    await expect(passButton(page)).toBeInViewport({ ratio: 1 });
    await expect(yourCards(page).last()).toBeInViewport({ ratio: 1 });
  });

  /** Where everything on the felt is. Things in the same group (a seat's cards and its plate) may touch. */
  async function measure(page: Page): Promise<Measurements> {
    return page.evaluate(() => {
      const boxes: Box[] = [];
      const add = (name: string, group: string, el: Element | null) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) boxes.push({ name, group, l: r.left, t: r.top, r: r.right, b: r.bottom });
      };
      for (const seat of [0, 1, 2, 3]) {
        add(`plate ${seat}`, `seat ${seat}`, document.getElementById(`seat-${seat}`));
        add(`cards ${seat}`, `seat ${seat}`, document.getElementById(`fan-${seat}`));
      }
      // Your hand: from its first card to its last.
      const cards = [...document.querySelectorAll('.hand .slot')];
      if (cards.length > 0) {
        const first = cards[0]!.getBoundingClientRect();
        const last = cards.at(-1)!.getBoundingClientRect();
        boxes.push({ name: 'your hand', group: 'hand', l: first.left, t: Math.min(first.top, last.top), r: last.right, b: last.bottom });
      }
      document.querySelectorAll('.trick .spot').forEach((c, i) => add(`trick card ${i}`, 'trick', c));
      add('verdict', 'verdict', document.querySelector('.verdict'));
      add('hand and passing', 'info', document.querySelector('.info'));
      const f = (document.querySelector('.felt') as Element).getBoundingClientRect();
      const root = document.documentElement;
      return {
        boxes,
        felt: { l: f.left, t: f.top, r: f.right, b: f.bottom },
        scrollsSideways: root.scrollWidth > root.clientWidth,
      };
    });
  }

  const problems = async (page: Page) => problemsIn(await measure(page));

  for (const { name, width, height } of sizes) {
    test(`nothing overlaps on a ${name} (${width} x ${height}), with a full trick and at the result`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'webkit', 'the sizes are set here, so one browser project is enough');
      await page.setViewportSize({ width, height });
      await hurry(page);
      await page.goto('/');
      await mute(page);
      await expect(yourCards(page)).toHaveCount(13);
      expect(await problems(page)).toEqual([]);

      // A full trick on the table: four cards, waiting to be taken, at the usual pace so it is seen.
      await pace(page, 1);
      await pass(page);
      const four = page.locator('.trick .spot');
      await expect(async () => {
        const index = await firstPlayable(page);
        if (index >= 0) await clickCard(page, index);
        expect(await four.count()).toBe(4);
      }).toPass({ timeout: 30_000, intervals: [100] });
      expect(await problems(page)).toEqual([]);

      await pace(page);
      await playToTheEnd(page);
      await expect(page.locator('.verdict')).toBeVisible();
      expect(await problems(page)).toEqual([]);
    });
  }
});
