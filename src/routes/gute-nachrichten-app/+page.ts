// GEO landing page. SSR (not prerender) — the root +layout.server.ts has a
// server load (ticker), which makes a child prerender 404 on Vercel. SSR is
// fine here: the page is still fully crawlable + AI-readable, just rendered
// per request instead of at build time.
export const prerender = false;
