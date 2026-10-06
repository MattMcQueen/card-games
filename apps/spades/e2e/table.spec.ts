import { cardsLanded, collectErrors, hurry, isFaceUp, mute, pace, problemsIn, sizes, type Box, type Measurements } from '@card-games/e2e/helpers';
import { expect, test, type Page } from '@playwright/test';

const yourCards = (page: Page) => page.locator('.hand .slot');
const bidButton = (page: Page) => page.getByRole('button', { name: /^Bid (nil|\d+)$/ });
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

/** Waits for your turn to bid, and bids what is suggested. */
async function bid(page: Page) {
  await expect(bidButton(page)).toBeVisible({ timeout: 30_000 });
  await bidButton(page).click();
}

/** Bids, then plays the first card you may play on each of your turns until the hand is over. */
async function playToTheEnd(page: Page) {
  await bid(page);
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
  test('deals thirteen cards each with no errors, and asks for your bid', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    await mute(page);
    await expect(page).toHaveTitle('Spades');
    await expect(yourCards(page)).toHaveCount(13);
    for (const seat of [1, 2, 3]) await expect(page.locator(`#fan-${seat} > div`)).toHaveCount(13);
    // Lena deals the first hand, so you bid first.
    await expect(page.locator('.controls').getByText('How many tricks will you take?')).toBeVisible();
    await expect(page.locator('#seat-3')).toContainText('Dealer');
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

  test('the bid can be changed, from nil to thirteen, and shows on your plate', async ({ page }) => {
    const errors = collectErrors(page);
    await hurry(page);
    await page.goto('/');
    await mute(page);
    const fewer = page.getByRole('button', { name: 'One fewer' });
    while (await fewer.isEnabled()) await fewer.click();
    await expect(page.getByRole('button', { name: 'Bid nil' })).toBeVisible();
    await page.getByRole('button', { name: 'One more' }).click();
    await page.getByRole('button', { name: 'One more' }).click();
    await page.getByRole('button', { name: 'Bid 2' }).click();
    await expect(page.locator('#seat-0')).toContainText('0/2');
    // Everyone else bids, and you lead: no spades yet.
    await expect(page.locator('.controls').getByText(/^Your lead: any card but a spade/)).toBeVisible({ timeout: 15_000 });
    for (const seat of [1, 2, 3]) await expect(page.locator(`#seat-${seat}`)).toContainText(/0\/(nil|\d+)/);
    expect(errors).toEqual([]);
  });

  test('plays a whole hand, shows the result and the score sheet', async ({ page }) => {
    const errors = collectErrors(page);
    await hurry(page);
    await page.goto('/');
    await mute(page);
    await playToTheEnd(page);
    await expect(page.locator('.verdict')).toBeVisible();
    await expect(page.locator('.verdict')).toContainText(/made|Set|nil/);
    const sheet = page.getByRole('table', { name: 'Scores' });
    await expect(sheet).toBeVisible();
    // The two sides took thirteen tricks between them.
    const took = await sheet.locator('tbody td:nth-of-type(2), tbody td:nth-of-type(5)').allInnerTexts();
    expect(took.map(Number).reduce((a, b) => a + b, 0)).toBe(13);
    // You deal the next hand, so Omar bids first.
    await endOfHand(page).click();
    await expect(page.locator('#seat-0')).toContainText('Dealer');
    expect(errors).toEqual([]);
  });
});

test.describe('layout', () => {
  // Nothing moves, so the positions can be measured.
  test.use({ reducedMotion: 'reduce' });

  test('the Bid button is in view on a phone without scrolling', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'iphone', 'about the height a phone leaves');
    await page.goto('/');
    await mute(page);
    await expect(bidButton(page)).toBeInViewport({ ratio: 1 });
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
      add('hand and dealer', 'info', document.querySelector('.info'));
      add('scores', 'scores', document.querySelector('.scores'));
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
      await bid(page);
      const four = page.locator('.trick .spot');
      await expect(async () => {
        const index = await firstPlayable(page);
        if (index >= 0) await clickCard(page, index);
        expect(await four.count()).toBe(4);
      }).toPass({ timeout: 30_000, intervals: [100] });
      expect(await problems(page)).toEqual([]);

      await pace(page);
      const done = endOfHand(page);
      await expect(async () => {
        const index = await firstPlayable(page);
        if (index >= 0) await clickCard(page, index);
        expect(await done.isVisible()).toBe(true);
      }).toPass({ timeout: 180_000, intervals: [50] });
      await expect(page.locator('.verdict')).toBeVisible();
      expect(await problems(page)).toEqual([]);
    });
  }
});
