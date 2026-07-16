/**
 * Karten-Cache für OG- und share-card-Bilder — der größte Egress-Hebel.
 *
 * PROBLEM (2026-07-16: Supabase sperrte das Projekt wegen exceed_egress_quota):
 * Jeder Abruf von /api/og/<slug> bzw. /api/share-card/<slug> hat
 *   1. das VOLLE Story-Bild (~1 MB PNG) aus dem Bucket gezogen  → Egress rein
 *   2. Satori gerendert (CPU)
 *   3. die fertige Karte ausgeliefert                            → Egress raus
 * …und das bei JEDEM IG-Fetch, WhatsApp-Preview und CDN-Cache-Miss. Bei einem
 * Post zieht Meta die Karte mehrfach (Container-Create, Publish, Vorschau).
 *
 * LÖSUNG: die gerenderte Karte EINMAL in den Bucket schreiben und danach direkt
 * von dort ausliefern (Redirect auf die public URL). Damit entfällt ab dem 2.
 * Abruf sowohl der Quell-Download als auch der Render — nur noch EIN Egress vom
 * CDN, das Supabase ohnehin cached.
 *
 * Key = <slug>-<variant>.webp; Invalidierung durch Überschreiben (upsert), weil
 * sich Story-Titel/Bild ändern können (Veredler/Bild-Regie laufen nachts).
 */
import { supabaseAdmin } from '$lib/server/supabase/client';

const BUCKET = 'og_cache';

/** Public URL einer gecachten Karte (ohne Existenz-Prüfung). */
export function cachedCardUrl(key: string): string | null {
	const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(key);
	return data?.publicUrl ?? null;
}

/**
 * Liest eine gecachte Karte, wenn sie existiert UND frisch genug ist.
 * Gibt die public URL zurück (zum Redirect) oder null.
 */
export async function getCachedCard(key: string, maxAgeMs = 24 * 3600e3): Promise<string | null> {
	try {
		// Datei-Metadaten holen (list ist billiger als download).
		const slash = key.lastIndexOf('/');
		const dir = slash > 0 ? key.slice(0, slash) : '';
		const file = slash > 0 ? key.slice(slash + 1) : key;
		const { data } = await supabaseAdmin.storage.from(BUCKET).list(dir, { search: file, limit: 1 });
		const hit = data?.find((f) => f.name === file);
		if (!hit) return null;
		const updated = hit.updated_at ? Date.parse(hit.updated_at) : 0;
		if (!updated || Date.now() - updated > maxAgeMs) return null; // zu alt → neu rendern
		return cachedCardUrl(key);
	} catch {
		return null; // Cache-Fehler darf den Request nie killen
	}
}

/**
 * Schreibt eine gerenderte Karte in den Cache. Best-effort — schlägt der Upload
 * fehl (z.B. Quota), wird die Karte trotzdem direkt ausgeliefert.
 */
export async function putCachedCard(key: string, body: Uint8Array, contentType = 'image/webp'): Promise<void> {
	try {
		await supabaseAdmin.storage.from(BUCKET).upload(key, body, {
			contentType,
			upsert: true,
			cacheControl: '86400'
		});
	} catch {
		/* egal — Auslieferung läuft auch ohne Cache */
	}
}
