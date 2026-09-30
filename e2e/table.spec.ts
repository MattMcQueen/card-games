import { expect, test, type Locator, type Page } from '@playwright/test';

/** Clicks the speaker button so the tests are silent, as the app starts with sound on. */
async function mute(page: Page) {
  await page.getByRole('button', { name: 'Mute sound' }).click();
}

/** Errors the page reports: exceptions, console errors, and anything the security headers block. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`exception: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
}

/**
 * Whether a card is showing its face and not its back, judged from a picture of the middle of it:
 * the back is red lattice all over, while even a red card's face has a good deal of paper showing.
 * Only a real browser can say, as it depends on how well it draws the turning of a card.
 */
async function isFaceUp(page: Page, card: Locator): Promise<boolean> {
  const picture = (await card.screenshot()).toString('base64');
  const lattice = await page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    context.drawImage(image, 0, 0);
    const [x, y] = [Math.round(image.width * 0.25), Math.round(image.height * 0.25)];
    const pixels = context.getImageData(x, y, Math.round(image.width / 2), Math.round(image.height / 2)).data;
    let count = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const [red, green] = [pixels[i] as number, pixels[i + 1] as number];
      if (red > 100 && green < 80 && red - green > 50) count++;
    }
    return count / (pixels.length / 4);
  }, picture);
  return lattice < 0.8; // a card back measures 0.9 or more; even a very red face is well under
}

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
    }).toPass({ timeout: 150_000, intervals: [200] });
  } catch (error) {
    throw new Error(`The hand did not finish. The controls said: ${await page.locator('.controls').innerText()}
${error}`);
  }
}

test.describe('with motion', () => {
  test('deals a hand with no errors, and the deck is in the corner', async ({ page }) => {
    const errors = collectErrors(page);
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
    await page.waitForTimeout(3500);
    for (const card of await cards.all()) {
      expect(await card.locator('[role="img"]').evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
      expect(await isFaceUp(page, card)).toBe(true);
    }
    // The deck and the cards of an opponent who has not folded (folded cards are darkened) show their backs.
    expect(await isFaceUp(page, page.locator('#deck .layer').first())).toBe(false);
    const inHand = page.locator('.felt > .slot:not(.s0)').filter({ hasNot: page.getByText('Fold', { exact: true }) });
    if ((await inHand.count()) > 0) expect(await isFaceUp(page, inHand.first().locator('.hole > .card').first())).toBe(false);
  });

  test('the flop is dealt face up', async ({ page }) => {
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
    }).toPass({ timeout: 150_000, intervals: [250] });
    await page.waitForTimeout(3000);
    for (const card of await board.all()) expect(await isFaceUp(page, card)).toBe(true);
  });

  test('opponents still in the hand turn their cards over at a showdown', async ({ page }) => {
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
    await page.waitForTimeout(1500);
    const stillIn = page.locator('.felt > .slot:not(.s0)').filter({ hasNot: page.getByText('Fold', { exact: true }) });
    expect(await stillIn.count()).toBeGreaterThan(0);
    for (const slot of await stillIn.all()) {
      expect(await slot.locator('.hole [role="img"]').count()).toBe(2); // their two cards are showing
    }
  });

  test('plays a whole hand and shows who won', async ({ page }) => {
    const errors = collectErrors(page);
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

  const sizes = [
    { name: 'small phone', width: 360, height: 640 },
    { name: 'phone', width: 390, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'laptop', width: 1280, height: 720 },
    { name: 'desktop', width: 1920, height: 1080 },
  ];

  /** Every pair of things on the felt that overlap, and anything cut off by its edge. */
  async function problems(page: Page): Promise<string[]> {
    return page.evaluate(() => {
      interface Box { name: string; group: string; l: number; t: number; r: number; b: number }
      const boxes: Box[] = [];
      const add = (name: string, group: string, el: Element | null) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        boxes.push({ name, group, l: r.left, t: r.top, r: r.right, b: r.bottom });
      };
      document.querySelectorAll('.felt > .slot').forEach((slot) => {
        const id = [...slot.classList].find((c) => /^s\d$/.test(c)) as string;
        add(`plate ${id}`, id, slot.querySelector('.plate'));
        slot.querySelectorAll('.hole > .card').forEach((c, i) => add(`card ${id}.${i}`, id, c));
        add(`hand name ${id}`, id, slot.querySelector('.hand-name'));
      });
      document.querySelectorAll('.bet').forEach((bet) => {
        const id = [...(bet.closest('.slot') as Element).classList].find((c) => /^s\d$/.test(c)) as string;
        add(`bet ${id}`, `bet ${id}`, bet);
      });
      add('verdict', 'verdict', document.querySelector('.verdict'));
      add('deck', 'deck', document.querySelector('#deck'));
      add('pot', 'pot', document.querySelector('.pot > strong'));
      add('board', 'board', document.querySelector('.board'));

      const felt = (document.querySelector('.felt') as Element).getBoundingClientRect();
      const found: string[] = [];
      for (const [i, a] of boxes.entries()) {
        if (a.l < felt.left - 1 || a.r > felt.right + 1 || a.t < felt.top - 1 || a.b > felt.bottom + 1) {
          found.push(`${a.name} is cut off by the edge of the table`);
        }
        for (const b of boxes.slice(i + 1)) {
          if (a.group === b.group) continue;
          const w = Math.min(a.r, b.r) - Math.max(a.l, b.l);
          const h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
          if (w > 3 && h > 3) found.push(`${a.name} overlaps ${b.name} by ${Math.round(w)} x ${Math.round(h)}`);
        }
      }
      const page = document.documentElement;
      if (page.scrollWidth > page.clientWidth) found.push('the page scrolls sideways');
      return found;
    });
  }

  for (const { name, width, height } of sizes) {
    test(`nothing overlaps on a ${name} (${width} x ${height}), during a hand and at the result`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'webkit', 'the sizes are set here, so one browser project is enough');
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await mute(page);
      // Your turn, or (if the others all fold to you) the end of the hand.
      await expect(page.getByRole('button', { name: /^Fold/ }).or(endOfHand(page))).toBeVisible({ timeout: 60_000 });
      expect(await problems(page)).toEqual([]);

      await playToTheEnd(page);
      await expect(page.locator('.verdict')).toBeVisible();
      expect(await problems(page)).toEqual([]);
    });
  }
});
