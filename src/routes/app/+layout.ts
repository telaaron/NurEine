// The app subtree is a client-rendered SPA shell (Capacitor). No SSR, no
// prerender — every screen boots in the browser/webview and fetches from the
// live API. This keeps the app build free of the website's server loads.
export const ssr = false;
export const prerender = false;
export const csr = true;
