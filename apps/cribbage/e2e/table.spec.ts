import { cardsLanded, collectErrors, isFaceUp, mute, problemsIn, sizes, type Box, type Measurements } from '@card-games/e2e/helpers';
import { expect, test, type Page } from '@playwright/test';

const yourCards = (page: Page) => page.locator('.hand .slot');
const toCrib = (page: Page) => page.getByRole('button', { name: 'Put them in the crib' });
const endOfHand = (page: Page) => page.getByRole('button', { name: /^(Next hand|Play again)$/ });
/** Whatever moves the hand on for you: saying go, or counting the next hand in the show. */
const moveOn = (page: Page) => page.locator('.controls').getByRole('button', { name: /^(Go|Count .*)$/ });

/** Clicks a card in your hand near its left edge, the part of it that shows when cards overlap. */
async function clickCard(page: Page, index: number) {
  await yourCards(page).nth(index).click({ position: { x: 6, y: 20 } });
}

/** The first card in your hand you may play now, or -1 if there is none. */
const firstPlayable = (page: Page) =>
  yourCards(page).evaluateAll((all) => all.findIndex((b) => !(b as HTMLButtonElement).disabled));

/** Chooses your first two cards and puts them in the crib. */
async function discard(page: Page) {
  await expect(yourCards(page)).toHaveCount(6);
  await clickCard(page, 0);
  await clickCard(page, 1);
  await toCrib(page).click();
  await expect(yourCards(page)).toHaveCount(4);
}

/** One step of your part of the play or the show: say go, count the next hand, or play the first card you may. */
async function yourMove(page: Page) {
  if (await moveOn(page).isVisible()) {
    await moveOn(page).click();
    return;
  }
  const index = await firstPlayable(page);
  if (index >= 0) await clickCard(page, index);
}

/** Plays the rest of the hand, saying go and counting the show as needed, until it is over. */
async function playToTheEnd(page: Page) {
  const done = endOfHand(page);
  try {
    await expect(async () => {
      if (await done.isVisible()) return;
      await yourMove(page);
      expect(await done.isVisible()).toBe(true);
    }).toPass({ timeout: 120_000, intervals: [250] });
  } catch (error) {
    throw new Error(`The hand did not finish. The controls said: ${await page.locator('.controls').innerText()}
${error}`);
  }
}

test.describe('with motion', () => {
  test('deals six cards each with no errors, and asks for your discards', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    await mute(page);
    await expect(page).toHaveTitle('Cribbage');
    await expect(yourCards(page)).toHaveCount(6);
    await expect(page.locator('#fan-1 > div')).toHaveCount(6);
    await expect(page.locator('.controls')).toContainText(/You cut the .* so (you deal|Ruth deals)\. Choose 2 cards for (your|Ruth's) crib\./);
    await expect(page.getByRole('img', { name: /^Pegging board: Ruth 0, you 0$/ })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('your cards are dealt face up, and Ruth’s face down', async ({ page }) => {
    await page.goto('/');
    await mute(page);
    await expect(yourCards(page)).toHaveCount(6);
    await cardsLanded(page, page.locator('.hand [role="img"]'));
    expect(await isFaceUp(page, yourCards(page).last())).toBe(true);
    expect(await isFaceUp(page, page.locator('#fan-1 > div').last())).toBe(false);
  });

  test('chooses two cards for the crib, turns up the starter and starts the play', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    await mute(page);
    await expect(toCrib(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: '0 of 2 chosen' })).toBeDisabled();
    await clickCard(page, 0);
    await clickCard(page, 1);
    // A third card is not taken, and a chosen card can be put back.
    await clickCard(page, 2);
    await expect(page.locator('.hand .slot[aria-pressed="true"]')).toHaveCount(2);
    await clickCard(page, 1);
    await expect(page.getByRole('button', { name: '1 of 2 chosen' })).toBeVisible();
    await clickCard(page, 1);
    await toCrib(page).click();
    await expect(page.locator('#crib > .back')).toHaveCount(4);
    await expect(page.locator('.stock .starter')).toHaveCount(1);
    await expect(page.locator('#fan-1 > div')).toHaveCount(4, { timeout: 15_000 });
    expect(errors).toEqual([]);
  });

  test('plays a whole hand, counts the show and fills in the score sheet', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    await mute(page);
    const dealer = (await page.locator('#seat-0').innerText()).includes('Dealer') ? 0 : 1;
    await discard(page);
    await playToTheEnd(page);
    // The last count is the dealer's crib.
    await expect(page.locator('.controls')).toContainText(/(Your|Ruth's) crib with the/);
    const sheet = page.getByRole('table', { name: 'Scores' });
    await expect(sheet).toBeVisible();
    // The score sheet adds up to the scores on the plates.
    const row = (await sheet.locator('tbody tr').first().locator('td').allInnerTexts()).map(Number);
    const yours = row.slice(0, 3).reduce((a, b) => a + b, 0);
    const theirs = row.slice(3).reduce((a, b) => a + b, 0);
    await expect(page.locator('#seat-0 .count')).toContainText(String(yours));
    await expect(page.locator('#seat-1 .count')).toContainText(String(theirs));
    // Only the dealer scores for a crib.
    expect(row[dealer === 0 ? 5 : 2]).toBe(0);
    // The deal passes to the other player.
    await endOfHand(page).click();
    await expect(page.locator(`#seat-${1 - dealer}`)).toContainText('Dealer');
    expect(errors).toEqual([]);
  });
});

test.describe('layout', () => {
  // Nothing moves, so the positions can be measured.
  test.use({ reducedMotion: 'reduce' });

  test('the discard button and your cards are in view on a phone without scrolling', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'iphone', 'about the height a phone leaves');
    await page.goto('/');
    await mute(page);
    await expect(page.getByRole('button', { name: '0 of 2 chosen' })).toBeInViewport({ ratio: 1 });
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
      add('your plate', 'you', document.getElementById('seat-0'));
      add('Ruth’s plate', 'Ruth', document.getElementById('seat-1'));
      add('Ruth’s cards', 'Ruth', document.getElementById('fan-1'));
      // Your hand: from its first card to its last.
      const cards = [...document.querySelectorAll('.hand .slot')];
      if (cards.length > 0) {
        const first = cards[0]!.getBoundingClientRect();
        const last = cards.at(-1)!.getBoundingClientRect();
        boxes.push({ name: 'your hand', group: 'hand', l: first.left, t: Math.min(first.top, last.top), r: last.right, b: last.bottom });
      }
      document.querySelectorAll('.stock figure').forEach((f, i) => add(i === 0 ? 'the starter' : 'the crib', 'stock', f));
      add('the count', 'middle', document.querySelector('.middle .badge'));
      document.querySelectorAll('.middle .spot').forEach((c, i) => add(`middle card ${i}`, 'middle', c));
      add('points pegged', 'callout', document.querySelector('.callout'));
      add('verdict', 'verdict', document.querySelector('.verdict'));
      add('hand and dealer', 'info', document.querySelector('.info'));
      add('to 121', 'corner', document.querySelector('.corner'));
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
    test(`nothing overlaps on a ${name} (${width} x ${height}), in the play and in the show`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'webkit', 'the sizes are set here, so one browser project is enough');
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await mute(page);
      await expect(yourCards(page)).toHaveCount(6);
      expect(await problems(page)).toEqual([]);
      await discard(page);
      expect(await problems(page)).toEqual([]);

      // Every step of the play and the show, measured as it comes.
      const done = endOfHand(page);
      const seen: string[] = [];
      await expect(async () => {
        for (const problem of await problems(page)) if (!seen.includes(problem)) seen.push(problem);
        await yourMove(page);
        expect(await done.isVisible()).toBe(true);
      }).toPass({ timeout: 120_000, intervals: [150] });
      expect(seen).toEqual([]);
      expect(await problems(page)).toEqual([]);
    });
  }
});
