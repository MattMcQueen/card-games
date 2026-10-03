/** The result of a hand, shown on the table (ResultBanner.svelte). */
export interface Banner {
  /** Whether it is good news for you. */
  readonly tone: 'win' | 'lose';
  readonly main: string;
  readonly sub: string;
}
