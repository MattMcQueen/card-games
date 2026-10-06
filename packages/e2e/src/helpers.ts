import { expect, type Locator, type Page } from '@playwright/test';

/** Clicks the speaker button so the tests are silent, as the games start with sound on. */
export async function mute(page: Page) {
  await page.getByRole('button', { name: 'Mute sound' }).click();
}

/** How many times sooner the timers go off in a hurried test. */
const HURRIED = 20;

/**
 * Makes the page's timers (`setTimeout`) go off `times` sooner, so a test does not sit through the computer
 * players' pauses. Called before the page loads; `pace` changes it later. The cards' flight is plain CSS,
 * which keeps to the real clock. (Playwright's own clock was tried: it also holds back animation frames,
 * which Playwright waits on before each click, so a click took seconds.)
 */
export async function hurry(page: Page, times = HURRIED) {
  await page.addInitScript((times) => {
    const page = window as Window & { pace?: number };
    page.pace = times;
    const setTimeout = window.setTimeout;
    window.setTimeout = ((handler: TimerHandler, timeout = 0, ...args: unknown[]) =>
      setTimeout(handler, timeout / (page.pace ?? 1), ...args)) as typeof window.setTimeout;
  }, times);
}

/** Sets how many times sooner the page's timers go off (see `hurry`): 1 is as normal. */
export async function pace(page: Page, times = HURRIED) {
  await page.evaluate((times) => ((window as Window & { pace?: number }).pace = times), times);
}

/** Errors the page reports: exceptions, console errors, and anything the security headers block. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`exception: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
}

/**
 * Waits until every card on the table has landed and turned over: none is moving and each is solid.
 * How long that takes depends on the hand (a dealer drawing several cards takes longer), so a fixed wait won't do.
 */
export async function cardsLanded(page: Page, cards: Locator) {
  await expect(async () => {
    const moving = await page.evaluate(
      () =>
        document
          .getAnimations()
          // A finished animation that holds its final pose (fill: both) has landed.
          .filter((a) => a.playState !== 'finished' && ((a.effect as KeyframeEffect | null)?.target as Element | null)?.closest('.card')).length,
    );
    expect(moving).toBe(0);
    for (const card of await cards.all()) expect(await card.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  }).toPass({ timeout: 15_000, intervals: [250] });
}

/**
 * Whether a card is showing its face and not its back, judged from a picture of the middle of it:
 * the back is red lattice all over, while even a red card's face has a good deal of paper showing.
 * Only a real browser can say, as it depends on how well it draws the turning of a card.
 * Taking the picture adds a stylesheet that the site's security headers refuse, so a test that
 * uses this cannot also expect `collectErrors` to find nothing.
 */
export async function isFaceUp(page: Page, card: Locator): Promise<boolean> {
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

/** The screen sizes the layout is checked at, from a small phone to a desktop. */
export const sizes = [
  { name: 'small phone', width: 360, height: 640 },
  { name: 'phone', width: 390, height: 844 },
  // An iPhone once Safari's or Chrome's toolbars have taken their share of the height.
  { name: 'phone with toolbars', width: 390, height: 664 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1280, height: 720 },
  { name: 'desktop', width: 1920, height: 1080 },
];

/** Something on the table, where it is on screen. Things in the same group (a seat and its own cards) may touch. */
export interface Box {
  name: string;
  group: string;
  l: number;
  t: number;
  r: number;
  b: number;
}

/** Where everything on a game's table is (measured in the page), the table itself, and whether the page scrolls sideways. */
export interface Measurements {
  boxes: Box[];
  felt: Omit<Box, 'name' | 'group'>;
  scrollsSideways: boolean;
}

const cutOff = (a: Box, felt: Measurements['felt']) => a.l < felt.l - 1 || a.r > felt.r + 1 || a.t < felt.t - 1 || a.b > felt.b + 1;
/** How far, in pixels across and down, two boxes overlap; nothing (0) if they do not, or only touch. */
const overlap = (a: Box, b: Box) => [Math.min(a.r, b.r) - Math.max(a.l, b.l), Math.min(a.b, b.b) - Math.max(a.t, b.t)] as const;

/** Every pair of things on the table that overlap, and anything cut off by its edge. */
export function problemsIn({ boxes, felt, scrollsSideways }: Measurements): string[] {
  const found = scrollsSideways ? ['the page scrolls sideways'] : [];
  for (const [i, a] of boxes.entries()) {
    if (cutOff(a, felt)) found.push(`${a.name} is cut off by the edge of the table`);
    for (const b of boxes.slice(i + 1).filter((other) => other.group !== a.group)) {
      const [w, h] = overlap(a, b);
      if (w > 3 && h > 3) found.push(`${a.name} overlaps ${b.name} by ${Math.round(w)} x ${Math.round(h)}`);
    }
  }
  return found;
}
