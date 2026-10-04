import { e2eConfig } from '@card-games/e2e/config';

// WebKit tests against the production build (see packages/e2e). Poker, blackjack, hearts, spades and bridge use 4173 to 4177.
export default e2eConfig(4178);
