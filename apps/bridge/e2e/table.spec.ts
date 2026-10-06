import { cardsLanded, collectErrors, hurry, isFaceUp, mute, pace, problemsIn, sizes, type Box, type Measurements } from '@card-games/e2e/helpers';
import { expect, test, type Page } from '@playwright/test';

const yourCards = (page: Page) => page.locator('.hand .slot');
/** The cards you may play now: from your hand, or the dummy's when you declare. */
const playable = (page: Page) => page.locator('.hand .slot:not(:disabled), .dummy .slot:not(:disabled)');
const suggested = (page: Page) => page.locator('.box .hint:not(:disabled)');
const endOfHand = (page: Page) => page.getByRole('button', { name: /^(Next hand|Play again)$/ });

/** Plays the first card you may play, near its left edge (the cards overlap), if it is your turn. */
async function playOne(page: Page) {
  const card = playable(page).first();
  if (!(await card.isVisible().catch(() => false))) return;
  // A click that does not land (the table moved on) is simply tried again by the caller.
  await card.click({ position: { x: 6, y: 20 }, timeout: 20_000 }).catch(() => {});
}

/** Makes the suggested call on each of your turns until the auction is over. */
async function callThrough(page: Page) {
  const box = page.locator('.box');
  const playing = page.locator('.info', { hasText: / by / });
  for (let call = 0; call < 40; call++) {
    await expect(box.or(playing).or(endOfHand(page)).first()).toBeVisible({ timeout: 30_000 });
    if (!(await box.isVisible())) return;
    await suggested(page).first().click({ timeout: 20_000 });
    // The computer players call before your next turn, if the auction goes on.
    await expect(box).toHaveCount(0);
  }
}

/** Calls, then plays the first card you may play on each of your turns until the hand is over. */
async function playToTheEnd(page: Page) {
  await callThrough(page);
  try {
    await expect(async () => {
      if (await endOfHand(page).isVisible()) return;
      await playOne(page);
      expect(await endOfHand(page).isVisible()).toBe(true);
    }).toPass({ timeout: 360_000, intervals: [50] });
  } catch (error) {
    throw new Error(`The hand did not finish. The controls said: ${await page.locator('.controls').innerText()}
${error}`);
  }
}

test.describe('with motion', () => {
  test('deals thirteen cards each with no errors, and asks for your call', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    await mute(page);
    await expect(page).toHaveTitle('Bridge');
    await expect(yourCards(page)).toHaveCount(13);
    for (const seat of [1, 2, 3]) await expect(page.locator(`#fan-${seat} > div`)).toHaveCount(13);
    // You deal the first hand, so you call first.
    await expect(page.locator('.controls').getByText('You deal, so you call first')).toBeVisible();
    await expect(page.locator('#seat-0')).toContainText('Dealer');
    await expect(suggested(page)).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test('your cards are dealt face up, and the others’ face down', async ({ page }) => {
    await page.goto('/');
    await mute(page);
    await expect(yourCards(page)).toHaveCount(13);
    await cardsLanded(page, page.locator('.hand [role="img"]'));
    expect(await isFaceUp(page, yourCards(page).last())).toBe(true);
    expect(await isFaceUp(page, page.locator('#fan-2 > div').last())).toBe(false);
  });

  test('a call shows on your plate and in the auction', async ({ page }) => {
    const errors = collectErrors(page);
    await hurry(page);
    await page.goto('/');
    await mute(page);
    await page.getByRole('button', { name: '7', exact: true }).click();
    await page.getByRole('button', { name: 'Bid 7 no trumps' }).click();
    await expect(page.locator('#seat-0')).toContainText('7NT');
    await expect(page.getByRole('table', { name: 'The auction' })).toContainText('7NT');
    // Nobody can bid higher: it is played, by you, and Arjun leads.
    await expect(page.locator('.info')).toContainText(/7NT( doubled)? by you/, { timeout: 15_000 });
    await expect(page.locator('#seat-0')).toContainText('Declarer');
    await expect(page.locator('#seat-2')).toContainText('Dummy');
    // After the opening lead, Helen's cards are face up, and yours to play.
    await expect(page.locator('.dummy .slot')).toHaveCount(13, { timeout: 15_000 });
    expect(errors).toEqual([]);
  });

  test('plays a whole hand, shows the result and the score sheet', async ({ page }) => {
    // A bridge hand is long, and headless WebKit on Windows draws the pulsing name plate at a few frames a second.
    test.setTimeout(420_000);
    const errors = collectErrors(page);
    await hurry(page);
    await page.goto('/');
    await mute(page);
    await playToTheEnd(page);
    await expect(page.locator('.verdict')).toBeVisible();
    await expect(page.locator('.verdict')).toContainText(/made|down|Passed out/);
    await expect(page.getByRole('table', { name: 'Scores' })).toBeVisible();
    await expect(page.getByRole('list', { name: 'The hands' })).toContainText(/by|passed/);
    // Arjun deals the next hand.
    await endOfHand(page).click();
    await expect(page.locator('#seat-1')).toContainText('Dealer');
    expect(errors).toEqual([]);
  });
});

test.describe('layout', () => {
  // Nothing moves, so the positions can be measured.
  test.use({ reducedMotion: 'reduce' });

  test('the calls are in view on a phone without scrolling', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'iphone', 'about the height a phone leaves');
    await page.goto('/');
    await mute(page);
    await expect(page.getByRole('button', { name: 'Pass' })).toBeInViewport({ ratio: 1 });
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
    test(`nothing overlaps on a ${name} (${width} x ${height}), with the dummy and a full trick, and at the result`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'webkit', 'the sizes are set here, so one browser project is enough');
      await page.setViewportSize({ width, height });
      await hurry(page);
      await page.goto('/');
      await mute(page);
      await expect(yourCards(page)).toHaveCount(13);
      expect(await problems(page)).toEqual([]);

      await callThrough(page);
      // A full trick on the table, at the usual pace so it is seen before it is taken.
      await pace(page, 1);
      const four = page.locator('.trick .spot');
      await expect(async () => {
        await playOne(page);
        expect((await four.count()) === 4 || (await endOfHand(page).isVisible())).toBe(true);
      }).toPass({ timeout: 60_000, intervals: [100] });
      expect(await problems(page)).toEqual([]);

      await pace(page);
      await expect(async () => {
        await playOne(page);
        expect(await endOfHand(page).isVisible()).toBe(true);
      }).toPass({ timeout: 180_000, intervals: [50] });
      await expect(page.locator('.verdict')).toBeVisible();
      expect(await problems(page)).toEqual([]);
    });
  }
});
