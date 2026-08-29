import { readFile, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const prerender = false;

// VISION.md liegt im Repo-Wurzelverzeichnis. process.cwd() ist beim SvelteKit-
// Server das Projektverzeichnis — lokal und im Vercel-Build identisch.
const VISION_PATH = join(process.cwd(), 'VISION.md');

export async function load() {
	try {
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
			await writeFile(VISION_PATH, content, 'utf-8');
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
