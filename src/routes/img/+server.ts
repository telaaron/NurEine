/**
 * Bild-Proxy + Optimierung. Holt ein (großes PNG-)Story-Bild, skaliert es auf die
 * angefragte Breite und liefert WebP — typ. 1 MB PNG → ~40-120 KB WebP.
 *
 *   /img?url=<supabase-png-url>&w=600
 *
 * CDN-cached 1 Jahr (Bilder ändern sich nie pro URL). Massiver Performance-Gewinn
 * auf Startseite + Archiv, wo dutzende Story-Bilder geladen werden.
 */
import type { RequestHandler } from './$types';

// Nur Bilder aus dem eigenen Supabase-Storage proxien (kein offener Proxy).
const ALLOWED_HOST = 'supabase.co';

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const src = url.searchParams.get('url');
	const w = Math.min(1600, Math.max(80, parseInt(url.searchParams.get('w') || '600', 10)));
	const q = Math.min(95, Math.max(40, parseInt(url.searchParams.get('q') || '78', 10)));

	if (!src) return new Response('url required', { status: 400 });
	let host: string;
	try {
		host = new URL(src).host;
	} catch {
		return new Response('bad url', { status: 400 });
	}
	if (!host.endsWith(ALLOWED_HOST)) return new Response('host not allowed', { status: 403 });

	try {
		const resp = await fetch(src, { signal: AbortSignal.timeout(10000) });
		if (!resp.ok) return new Response('source error', { status: 502 });
		const input = Buffer.from(await resp.arrayBuffer());

		const sharp = (await import('sharp')).default;
		const out = await sharp(input)
			.resize({ width: w, withoutEnlargement: true })
			.webp({ quality: q })
			.toBuffer();

		setHeaders({
			'Content-Type': 'image/webp',
			'Cache-Control': 'public, max-age=31536000, immutable',
			'CDN-Cache-Control': 'public, max-age=31536000'
		});
		return new Response(new Uint8Array(out), { headers: { 'Content-Type': 'image/webp' } });
	} catch {
		return new Response('proxy error', { status: 500 });
	}
};
