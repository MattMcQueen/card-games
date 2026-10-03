import { e2eConfig } from '@card-games/e2e/config';

// WebKit tests against the production build (see packages/e2e). Poker, blackjack and hearts use 4173, 4174 and 4175.
export default e2eConfig(4176);
