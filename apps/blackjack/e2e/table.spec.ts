import { cardsLanded, collectErrors, isFaceUp, mute, problemsIn, sizes, type Box, type Measurements } from '@card-games/e2e/helpers';
import { expect, test, type Page } from '@playwright/test';

/** The button that ends a round: "Next hand", or "Play again" if the round cost you your last chips. */
const endOfRound = (page: Page) => page.getByRole('button', { name: /^(Next hand|Play again)/ });

/** Deals a round with the bet already on the table. */
async function deal(page: Page) {
  await page.getByRole('button', { name: 'Deal', exact: true }).click();
}

/** Stands on every hand (and turns down insurance) until the round is over. */
async function playToTheEnd(page: Page) {
  const done = endOfRound(page);
  const move = page.getByRole('button', { name: /^(Stand|No thanks)/ });
  await expect(async () => {
    if (await done.isVisible()) return;
    if (await move.first().isVisible()) await move.first().click();
    expect(await done.isVisible()).toBe(true);
  }).toPass({ timeout: 30_000, intervals: [200] });
}

test.describe('with motion', () => {
  test('deals a round with no errors', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    await mute(page);
    await expect(page).toHaveTitle('Blackjack');
    await deal(page);
    await expect(page.locator('.player-zone .card')).toHaveCount(2);
    await expect(page.locator('.dealer-zone .card').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('the cards are dealt face up, and the shoe shows its back', async ({ page }) => {
    await page.goto('/');
    await mute(page);
    await deal(page);
    const cards = page.locator('.felt .card');
    await expect(page.locator('.player-zone .card')).toHaveCount(2);
    // Once the deal has finished (and, if the round ended at once, the dealer has drawn) the cards are in place.
    await cardsLanded(page, cards);
    expect(await cards.count()).toBeGreaterThanOrEqual(3);
    for (const card of await cards.all()) expect(await isFaceUp(page, card)).toBe(true);
    expect(await isFaceUp(page, page.locator('.shoe-corner .layer').last())).toBe(false);
  });

  test('plays a whole round and shows the result', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    await mute(page);
    await deal(page);
    await playToTheEnd(page);
    await expect(page.locator('.verdict .banner')).toBeVisible();
    await endOfRound(page).click();
    await expect(page.getByRole('button', { name: 'Deal', exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('the dealer’s cards are all face up at the result', async ({ page }) => {
    await page.goto('/');
    await mute(page);
    await deal(page);
    await playToTheEnd(page);
    await expect(page.locator('.verdict .banner')).toBeVisible();
    await cardsLanded(page, page.locator('.dealer-zone .card'));
    for (const card of await page.locator('.dealer-zone .card').all()) expect(await isFaceUp(page, card)).toBe(true);
  });
});

test.describe('layout', () => {
  // Nothing moves, so the positions can be measured.
  test.use({ reducedMotion: 'reduce' });

  /** Where everything on the felt is. A hand's name and its own cards may touch. */
  async function measure(page: Page): Promise<Measurements> {
    return page.evaluate(() => {
      const boxes: Box[] = [];
      const add = (name: string, group: string, el: Element | null) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) boxes.push({ name, group, l: r.left, t: r.top, r: r.right, b: r.bottom });
      };
      add('chip count', 'chip count', document.querySelector('.balance'));
      add('shoe', 'shoe', document.querySelector('.shoe-corner'));
      add('result', 'result', document.querySelector('.verdict .banner'));
      document.querySelectorAll('.felt .hand').forEach((hand, i) => {
        const name = hand.getAttribute('aria-label') ?? `hand ${i}`;
        // What shows, not the hand's padding, which may run under the shoe while the cards stay clear of it.
        add(`${name} total`, name, hand.querySelector('h2'));
        hand.querySelectorAll('.card').forEach((card, j) => add(`${name} card ${j}`, name, card));
      });
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

  /** How far "Your bet" reaches outside its ring, in pixels (negative: inside), judged at the label's corners. */
  const labelOutsideRing = (page: Page) =>
    page.evaluate(() => {
      const ring = (document.querySelector('.bet-spot') as Element).getBoundingClientRect();
      const label = (document.querySelector('.bet-label') as Element).getBoundingClientRect();
      const radius = ring.width / 2;
      const [cx, cy] = [ring.left + radius, ring.top + radius];
      const corners = [[label.left, label.top], [label.right, label.top], [label.left, label.bottom], [label.right, label.bottom]];
      return Math.max(...corners.map(([x, y]) => Math.hypot((x as number) - cx, (y as number) - cy) - radius));
    });

  test('Deal is in view on a phone without scrolling, with nothing over it', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'iphone', 'about the height a phone leaves');
    await page.goto('/');
    await mute(page);
    const button = page.getByRole('button', { name: 'Deal', exact: true });
    await expect(button).toBeInViewport({ ratio: 1 });
    // The Support me button moves out of the way of a button it would cover.
    await expect
      .poll(() => button.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return el.contains(document.elementFromPoint(r.left + 8, r.top + r.height / 2));
      }))
      .toBe(true);
  });

  for (const { name, width, height } of sizes) {
    test(`nothing overlaps on a ${name} (${width} x ${height}), during a round and at the result`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'webkit', 'the sizes are set here, so one browser project is enough');
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await mute(page);
      expect(await problems(page)).toEqual([]);
      expect(await labelOutsideRing(page)).toBeLessThan(0);

      await deal(page);
      await expect(page.locator('.player-zone .card')).toHaveCount(2);
      expect(await problems(page)).toEqual([]);

      await playToTheEnd(page);
      await expect(page.locator('.verdict .banner')).toBeVisible();
      expect(await problems(page)).toEqual([]);
    });
  }
});
