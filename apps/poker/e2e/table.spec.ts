import { cardsLanded, collectErrors, hurry, isFaceUp, mute, problemsIn, sizes, type Box, type Measurements } from '@card-games/e2e/helpers';
import { expect, test, type Page } from '@playwright/test';

/** The button that ends a hand: "Next hand", or "Play again" if the hand cost you your last chips. */
const endOfHand = (page: Page) => page.getByRole('button', { name: /^(Next hand|Play again)/ });

/** Checks or calls on every turn of yours until the hand is over. */
async function playToTheEnd(page: Page) {
  const done = endOfHand(page);
  const move = page.getByRole('button', { name: /^(Check|Call)/ });
  try {
    await expect(async () => {
      if (await done.isVisible()) return;
      if (await move.isVisible()) await move.click();
      expect(await done.isVisible()).toBe(true);
    }).toPass({ timeout: 150_000, intervals: [50] });
  } catch (error) {
    throw new Error(`The hand did not finish. The controls said: ${await page.locator('.controls').innerText()}
${error}`);
  }
}

test.describe('with motion', () => {
  test('deals a hand with no errors, and the deck is in the corner', async ({ page }) => {
    const errors = collectErrors(page);
    await hurry(page);
    await page.goto('/');
    await mute(page);
    await expect(page).toHaveTitle("Texas Hold'em");
    await expect(page.locator('.felt > .slot')).toHaveCount(6);
    // Your turn, or (if the others all fold to you) the end of the hand.
    await expect(page.getByRole('button', { name: /^Fold/ }).or(endOfHand(page))).toBeVisible({ timeout: 60_000 });
    // Your two cards have been turned face up.
    await expect(page.locator('.s0 .hole [role="img"]')).toHaveCount(2);

    const deck = await page.locator('#deck').boundingBox();
    const felt = await page.locator('.felt').boundingBox();
    expect(deck && felt && deck.x > felt.x + felt.width * 0.7 && deck.y < felt.y + felt.height * 0.25).toBe(true);
    expect(errors).toEqual([]);
  });

  test('your cards are dealt face up, and the opponents’ face down', async ({ page }) => {
    await page.goto('/');
    await mute(page);
    const cards = page.locator('.s0 .hole > .card');
    await expect(cards).toHaveCount(2, { timeout: 30_000 });
    // Once the deal has finished the cards are in place and solid.
    await cardsLanded(page, cards.locator('[role="img"]'));
    for (const card of await cards.all()) expect(await isFaceUp(page, card)).toBe(true);
    // The deck and the cards of an opponent who has not folded (folded cards are darkened) show their backs.
    expect(await isFaceUp(page, page.locator('#deck .layer').first())).toBe(false);
    const inHand = page.locator('.felt > .slot:not(.s0)').filter({ hasNot: page.getByText('Fold', { exact: true }) });
    if ((await inHand.count()) > 0) expect(await isFaceUp(page, inHand.first().locator('.hole > .card').first())).toBe(false);
  });

  test('the flop is dealt face up', async ({ page }) => {
    await hurry(page);
    await page.goto('/');
    await mute(page);
    const next = endOfHand(page);
    const move = page.getByRole('button', { name: /^(Check|Call)/ });
    const board = page.locator('.board .slot .card');
    // Call along until there is a flop and it is your turn again (some hands end before one).
    await expect(async () => {
      if ((await board.count()) >= 3 && (await move.isVisible())) return;
      if (await next.isVisible()) await next.click();
      else if (await move.isVisible()) await move.click();
      expect((await board.count()) >= 3 && (await move.isVisible())).toBe(true);
    }).toPass({ timeout: 150_000, intervals: [50] });
    await cardsLanded(page, board);
    for (const card of await board.all()) expect(await isFaceUp(page, card)).toBe(true);
  });

  test('opponents still in the hand turn their cards over at a showdown', async ({ page }) => {
    await hurry(page);
    await page.goto('/');
    await mute(page);
    const next = endOfHand(page);
    const verdict = page.locator('.verdict');
    // Play hands, always calling, until one reaches a showdown.
    for (let hand = 0; ; hand++) {
      expect(hand, 'no hand reached a showdown').toBeLessThan(8);
      await playToTheEnd(page);
      await expect(verdict).toBeVisible();
      if (!(await verdict.textContent())?.includes('Everyone else folded')) break;
      await next.click();
    }
    const stillIn = page.locator('.felt > .slot:not(.s0)').filter({ hasNot: page.getByText('Fold', { exact: true }) });
    expect(await stillIn.count()).toBeGreaterThan(0);
    for (const slot of await stillIn.all()) {
      await expect(slot.locator('.hole [role="img"]')).toHaveCount(2); // their two cards are showing
    }
  });

  test('plays a whole hand and shows who won', async ({ page }) => {
    const errors = collectErrors(page);
    await hurry(page);
    await page.goto('/');
    await mute(page);
    await playToTheEnd(page);
    await expect(page.locator('.verdict')).toBeVisible();
    await expect(page.locator('.verdict')).toContainText(/win/);
    expect(errors).toEqual([]);
  });
});

test.describe('layout', () => {
  // Nothing moves, so the positions can be measured.
  test.use({ reducedMotion: 'reduce' });

  test('your turn’s buttons are in view on a phone without scrolling', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'iphone', 'about the height a phone leaves');
    await page.goto('/');
    await mute(page);
    const fold = page.getByRole('button', { name: /^Fold/ });
    // Your turn, or (if the others all fold to you) the end of the hand.
    await expect(fold.or(endOfHand(page))).toBeVisible({ timeout: 60_000 });
    test.skip(!(await fold.isVisible()), 'the others all folded to you');
    for (const name of [/^Fold/, /^(Check|Call)/, /^(Bet|Raise|All-in)/]) {
      await expect(page.locator('.actions').getByRole('button', { name })).toBeInViewport({ ratio: 1 });
    }
  });

  /** Where everything on the felt is. Things in the same group (a seat and its own cards) may touch. */
  async function measure(page: Page): Promise<Measurements> {
    return page.evaluate(() => {
      const boxes: Box[] = [];
      const add = (name: string, group: string, el: Element | null) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) boxes.push({ name, group, l: r.left, t: r.top, r: r.right, b: r.bottom });
      };
      const seatOf = (el: Element) => [...(el.closest('.slot') as Element).classList].find((c) => /^s\d$/.test(c)) as string;
      document.querySelectorAll('.felt > .slot').forEach((slot) => {
        const id = seatOf(slot.firstElementChild as Element);
        add(`plate ${id}`, id, slot.querySelector('.plate'));
        slot.querySelectorAll('.hole > .card').forEach((c, i) => add(`card ${id}.${i}`, id, c));
        add(`hand name ${id}`, id, slot.querySelector('.hand-name'));
        add(`bet ${id}`, `bet ${id}`, slot.querySelector('.bet'));
      });
      add('verdict', 'verdict', document.querySelector('.verdict'));
      add('deck', 'deck', document.querySelector('#deck'));
      add('pot', 'pot', document.querySelector('.pot > strong'));
      add('board', 'board', document.querySelector('.board'));
      add('hand and blinds', 'info', document.querySelector('.info'));
      const f = (document.querySelector('.felt') as Element).getBoundingClientRect();
      const page = document.documentElement;
      return {
        boxes,
        felt: { l: f.left, t: f.top, r: f.right, b: f.bottom },
        scrollsSideways: page.scrollWidth > page.clientWidth,
      };
    });
  }

  const problems = async (page: Page) => problemsIn(await measure(page));

  /**
   * The longest results the banner can show, whatever hand was dealt: the longest name and amount, with the
   * longest hand name, or with several other winners (the most that are named before they are only counted).
   */
  const LONGEST_BANNERS = [
    ['Margaret wins 4250', 'Full house, sevens full of threes'],
    ['Margaret wins 4250', 'Margaret and Nigel win too'],
    ['You win 4250', '3 others win too'],
  ];

  /** Any overlap with the result banner while it shows each of the longest results in turn. */
  async function longestBannerProblems(page: Page): Promise<string[]> {
    const found: string[] = [];
    for (const [main, sub] of LONGEST_BANNERS) {
      await page.evaluate(([m, s]) => {
        const verdict = document.querySelector('.verdict') as Element;
        (verdict.querySelector('strong') as Element).textContent = m as string;
        const span = verdict.querySelector('span') ?? verdict.appendChild(document.createElement('span'));
        span.textContent = s as string;
      }, [main, sub]);
      found.push(...(await problems(page)).filter((p) => p.includes('verdict')).map((p) => `"${main}" / "${sub}": ${p}`));
    }
    return found;
  }

  for (const { name, width, height } of sizes) {
    test(`nothing overlaps on a ${name} (${width} x ${height}), during a hand and at the result`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'webkit', 'the sizes are set here, so one browser project is enough');
      await page.setViewportSize({ width, height });
      await hurry(page);
      await page.goto('/');
      await mute(page);
      // Your turn, or (if the others all fold to you) the end of the hand.
      await expect(page.getByRole('button', { name: /^Fold/ }).or(endOfHand(page))).toBeVisible({ timeout: 60_000 });
      expect(await problems(page)).toEqual([]);

      await playToTheEnd(page);
      await expect(page.locator('.verdict')).toBeVisible();
      expect(await problems(page)).toEqual([]);
      expect(await longestBannerProblems(page)).toEqual([]);
    });
  }
});
