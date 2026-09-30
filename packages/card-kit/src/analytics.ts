// Visits are counted with Cloudflare Web Analytics, as on Brand New: no cookies, nothing that
// follows a visitor from site to site, and no record of who they are. The beacon is only loaded
// on the live sites, so local previews, the browser tests and CI never count as visits.

const BEACON = 'https://static.cloudflareinsights.com/beacon.min.js';

/** Whether this is one of the live sites, where visits count. */
export function isLiveSite(hostname: string): boolean {
  return hostname === 'matt-rarely-writes.co.uk' || hostname.endsWith('.matt-rarely-writes.co.uk');
}

/** Loads Cloudflare's beacon with the game's own site token (public: it is in every page). */
export function countVisits(token: string): void {
  if (!isLiveSite(location.hostname)) return;
  const script = document.createElement('script');
  script.type = 'module'; // as in Cloudflare's own snippet
  script.src = BEACON;
  script.dataset.cfBeacon = JSON.stringify({ token });
  document.head.append(script);
}
