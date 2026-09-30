export type Route = 'game' | 'how-to-play' | 'about';

export const routes: readonly { route: Route; path: string; label: string; title: string }[] = [
  { route: 'game', path: '/', label: 'Game', title: "Texas Hold'em" },
  { route: 'how-to-play', path: '/how-to-play', label: 'How to play', title: "How to play - Texas Hold'em" },
  { route: 'about', path: '/about', label: 'About', title: "About and privacy - Texas Hold'em" },
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

export function titleFor(route: Route): string {
  return routes.find((r) => r.route === route)!.title;
}
