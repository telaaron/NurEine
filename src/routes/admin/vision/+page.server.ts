import { readFile, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const prerender = false;

// VISION.md liegt im Repo-Wurzelverzeichnis. process.cwd() ist beim SvelteKit-
// Server das Projektverzeichnis — lokal und im Vercel-Build identisch.
//
// BEIDE Schreibweisen probieren (2026-09-02): Git verfolgt `VISION.md`, auf der
// Platte liegt `vision.md`. Auf einem case-insensitiven Mac-Volume (HFS+/APFS
// Standard) faellt das nicht auf — `git status` bleibt sauber. Auf Vercel
// (Linux, case-sensitiv) findet `VISION.md` die Datei dagegen NICHT, und diese
// Seite zeigt dort dauerhaft den Fehlerzweig, obwohl lokal alles funktioniert.
// Ein reiner Rename haette das nicht sicher geloest: auf einem
// case-insensitiven Volume laesst er sich nicht zuverlaessig durchsetzen.
const VISION_KANDIDATEN = ['VISION.md', 'vision.md'].map((n) => join(process.cwd(), n));

async function ersteLesbareDatei(): Promise<string | null> {
	for (const pfad of VISION_KANDIDATEN) {
		try {
			await stat(pfad);
			return pfad;
		} catch {
			// naechster Kandidat
		}
	}
	return null;
}

export async function load() {
	try {
		const VISION_PATH = await ersteLesbareDatei();
		if (!VISION_PATH) throw new Error('VISION.md unter keiner Schreibweise gefunden');
		const [content, info] = await Promise.all([
			readFile(VISION_PATH, 'utf-8'),
			stat(VISION_PATH)
		]);
		return {
			content,
			modifiedAt: info.mtime.toISOString(),
			readable: true as const,
			writable: true as const
		};
	} catch {
		// Auf Vercel ist das Dateisystem read-only und VISION.md liegt zwar im
		// Build, ist aber je nach Bundling nicht unter cwd auffindbar. Dann lieber
		// ehrlich melden als eine leere Seite zeigen.
		return {
			content: '',
			modifiedAt: null,
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

		try {
			// In die Datei zurueckschreiben, die auch gelesen wurde — sonst legt ein
			// Speichern auf case-sensitiven Systemen eine zweite Datei an.
			const ZIEL = (await ersteLesbareDatei()) ?? VISION_KANDIDATEN[0];
			await writeFile(ZIEL, content, 'utf-8');
			return { saved: true };
		} catch (err) {
			// Auf Vercel ist das Dateisystem read-only → Schreiben schlägt fehl.
			// Das ist kein Bug, sondern die Plattform. Klartext statt 500er.
			const msg = err instanceof Error ? err.message : String(err);
			return fail(500, {
				error: `Speichern fehlgeschlagen: ${msg}. Auf der Live-Umgebung ist das Dateisystem schreibgeschützt — dort ist die Seite nur zum Lesen.`
			});
		}
	}
};
