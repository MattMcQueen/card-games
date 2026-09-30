import { e2eConfig } from '@card-games/e2e/config';

// WebKit tests against the production build (see packages/e2e). Poker uses 4173, so both can run at once.
export default e2eConfig(4174);
