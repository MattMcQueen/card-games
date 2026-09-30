import { isPlainClick, pathFor, routeFor, titleFor, type Route } from './routes';

// The site is one page that swaps what it shows, so the game (and your chips) survive a look at
// How to play. The addresses are real ones (/about), which the host serves the same page for.
export const nav = $state<{ route: Route }>({ route: routeFor(location.pathname) });

function show(route: Route) {
  nav.route = route;
  document.title = titleFor(route);
}
show(nav.route);

addEventListener('popstate', () => show(routeFor(location.pathname)));

function go(route: Route) {
  if (route !== nav.route) history.pushState(null, '', pathFor(route));
  show(route);
  scrollTo(0, 0);
  // Move keyboard and screen reader users to the new page, as a normal page load would.
  queueMicrotask(() => document.getElementById('main')?.focus({ preventScroll: true }));
}

/** Click handler for links to our own pages: plain clicks stay in the page, the rest behave normally. */
export function follow(route: Route) {
  return (event: MouseEvent) => {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    go(route);
  };
}
