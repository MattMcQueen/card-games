import { e2eConfig } from '@card-games/e2e/config';

// WebKit tests against the production build (see packages/e2e). Poker, blackjack, hearts and spades use 4173 to 4176.
export default e2eConfig(4177);
