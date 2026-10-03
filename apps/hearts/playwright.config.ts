import { e2eConfig } from '@card-games/e2e/config';

// WebKit tests against the production build (see packages/e2e). Poker and blackjack use 4173 and 4174.
export default e2eConfig(4175);
