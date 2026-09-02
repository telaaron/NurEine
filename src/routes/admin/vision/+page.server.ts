import { readFile, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fail } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase/client';
import type { Actions } from './$types';

export const prerender = false;

// ── Warum die Datenbank die führende Quelle ist ─────────────────────────────
//
// Frühere Fassung las VISION.md per readFile aus dem Repo-Wurzelverzeichnis.
// Das funktioniert lokal, auf Vercel aber NIE: Serverless-Bundles enthalten nur
// importierte Module. Nachgemessen im Build — im gesamten `.vercel/output`
// liegt keine einzige .md-Datei. Die Seite war live dauerhaft im Fehlerzweig.
//
// Eine frühere Diagnose vermutete die Groß-/Kleinschreibung als Ursache
// („Git verfolgt VISION.md, auf der Platte liegt vision.md"). Das war ein
// Fehlalarm: Beide Namen zeigen auf dieselbe Inode, das Mac-Volume ist nur
// case-insensitiv. Im Verzeichnis existiert genau ein Eintrag, `VISION.md` —
// exakt so, wie Git ihn verfolgt. Deshalb ist die Kandidatenliste unten kein
// Case-Workaround mehr, sondern nur noch Bequemlichkeit für lokale Kopien.
//
// Seit 2026-09-03: Tabelle `nureine_vision` ist führend (Migration 00051).
// Die Datei bleibt Pflichtlektüre für Claude-Sessions (siehe CLAUDE.md) und
// wird beim Speichern lokal mitgeschrieben, solange das Dateisystem das
// zulässt.
const VISION_KANDIDATEN = ['VISION.md', 'vision.md'].map((n) => join(process.cwd(), n));

async function ersteLesbareDatei(): Promise<string | null> {
	for (const pfad of VISION_KANDIDATEN) {
		try {
			await stat(pfad);
			return pfad;
		} catch {
			// nächster Kandidat
		}
	}
	return null;
}


export async function load() {
	// 1) Datenbank — die führende Quelle, funktioniert auch live.
	try {
		const { data, error } = await supabaseAdmin
			.from('nureine_vision')
			.select('content,updated_at')
			.order('updated_at', { ascending: false })
			.limit(1)
			.maybeSingle();

		if (!error && data?.content) {
			return {
				content: data.content as string,
				modifiedAt: (data.updated_at as string) ?? null,
				quelle: 'db' as const,
				readable: true as const,
				writable: true as const
			};
		}
	} catch {
		// Tabelle fehlt noch (Migration 00051 nicht eingespielt) oder DB streikt
		// → unten auf die Datei zurückfallen, statt eine leere Seite zu zeigen.
	}

	// 2) Datei — lokaler Fallback, bis die Migration läuft.
	try {
		const pfad = await ersteLesbareDatei();
		if (!pfad) throw new Error('VISION.md nicht gefunden');
		const [content, info] = await Promise.all([readFile(pfad, 'utf-8'), stat(pfad)]);
		return {
			content,
			modifiedAt: info.mtime.toISOString(),
			quelle: 'datei' as const,
			readable: true as const,
			writable: true as const
		};
	} catch {
		return {
			content: '',
			modifiedAt: null,
			quelle: 'keine' as const,
			readable: false as const,
			writable: false as const
		};
	}
}

export const actions: Actions = {
	save: async ({ request }) => {
		const form = await request.formData();
		const content = form.get('content');

		if (typeof content !== 'string') {
			return fail(400, { error: 'Kein Inhalt übermittelt.' });
		}
		// Schutz vor dem Totalverlust: ein versehentlich geleertes Textfeld darf
		// das Dokument nicht überschreiben.
		if (content.trim().length < 200) {
			return fail(400, {
				error: 'Inhalt verdächtig kurz (< 200 Zeichen) — nicht gespeichert.'
			});
		}

		// 1) In die Datenbank — jede Speicherung ist eine neue Version, damit ein
		//    versehentliches Überschreiben zurückholbar bleibt.
		const { error } = await supabaseAdmin
			.from('nureine_vision')
			.insert({ content, updated_by: 'admin' });

		if (error) {
			return fail(500, {
				error: `Speichern in die Datenbank fehlgeschlagen: ${error.message}. Läuft Migration 00051 schon?`
			});
		}

		// 2) Datei lokal mitschreiben, damit Claude-Sessions den aktuellen Stand
		//    lesen. Auf Vercel schlägt das fehl (read-only) — das ist erwartet und
		//    darf das Speichern nicht rot färben.
		let dateiHinweis: string | null = null;
		try {
			const ziel = (await ersteLesbareDatei()) ?? VISION_KANDIDATEN[0];
			await writeFile(ziel, content, 'utf-8');
		} catch {
			dateiHinweis =
				'In der Datenbank gespeichert. VISION.md im Repo wurde NICHT aktualisiert (Dateisystem schreibgeschützt) — lokal nachziehen und committen.';
		}

		return { saved: true, dateiHinweis };
	}
};
