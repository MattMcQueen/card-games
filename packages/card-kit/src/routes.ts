export type Route = 'game' | 'how-to-play' | 'about';

// Every game has the same three pages (the host serves the game for each address: see
// public/staticwebapp.config.json). `title` is the tab title, after which the game's name follows.
export const routes: readonly { route: Route; path: string; label: string; title: string }[] = [
  { route: 'game', path: '/', label: 'Game', title: '' },
  { route: 'how-to-play', path: '/how-to-play', label: 'How to play', title: 'How to play' },
  { route: 'about', path: '/about', label: 'About', title: 'About and privacy' },
];

/** A plain left click, the kind a link handles itself; with a modifier key it means "open elsewhere". */
export function isPlainClick(event: Pick<MouseEvent, 'button' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>): boolean {
  return event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
}

/** The page for an address. Anything unknown (the server only sends real pages here) is the game. */
export function routeFor(pathname: string): Route {
  const path = pathname.replace(/\/+$/, '') || '/';
  return routes.find((r) => r.path === path)?.route ?? 'game';
}

export function pathFor(route: Route): string {
  return routes.find((r) => r.route === route)!.path;
}

/** The tab title of a page of the game called `game`: "How to play - Blackjack", or just "Blackjack" for the game. */
export function titleFor(route: Route, game: string): string {
  const title = routes.find((r) => r.route === route)!.title;
  return title ? `${title} - ${game}` : game;
}
