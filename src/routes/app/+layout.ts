// NurEine App v2 — Web-first mit SSR (Aarons Entscheidung 2026-07-14).
// Anders als der Legacy-/app (ssr=false, Capacitor-Bundle): die neue Web-App
// rendert den ersten Paint server-seitig, damit das Aufdecken sofort da ist.
export const ssr = true;
export const prerender = false;
export const csr = true;
