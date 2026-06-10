#!/usr/bin/env node
/**
 * Bewertet den Wirkungsindex (impact_score) bestehender Stories neu — gezielt für
 * die hoch bewerteten (≥85), wo die alte reach×beleg×dauer-Formel Kuriositäten
 * fälschlich auf 90-100 hob (z.B. "Hauskatzen-Domestizierung", "Sex beschleunigte
 * Evolution"). Die neue Logik misst ECHTE Wirkung aufs Leben, nicht Themengröße.
 *
 * Aufruf: node scripts/rescore_impact.mjs [--min 85] [--dry]
 */
import { readFileSync } from 'node:fs';

try {
	const env = readFileSync(new URL('../.env', import.meta.url), 'utf-8');
	for (const line of env.split('\n')) {
		const m = line.match(/^([A-Z_]+)=(.*)$/);
		if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
	}
} catch {}

const REF = process.env.SUPABASE_PROJECT_REF;
const SB = process.env.SUPABASE_ACCESS_TOKEN;
const DS = process.env.DEEPSEEK_API_KEY;
if (!REF || !SB || !DS) { console.error('Missing env (SUPABASE_PROJECT_REF / SUPABASE_ACCESS_TOKEN / DEEPSEEK_API_KEY)'); process.exit(1); }

const args = process.argv.slice(2);
const MIN = Number(args[args.indexOf('--min') + 1]) || 85;
const DRY = args.includes('--dry');

async function sql(query) {
	const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${SB}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ query })
	});
	if (!r.ok) throw new Error(`SQL ${r.status}: ${(await r.text()).slice(0, 200)}`);
	return r.json();
}
const esc = (s) => String(s).replace(/'/g, "''");

const PROMPT = (title, dek, summary, cat) => `Du bist Chef vom Dienst bei NurEine (Good-News-Plattform). Bewerte den WIRKUNGSINDEX dieser Story neu.

Titel: ${title}
Untertitel: ${dek}
Zusammenfassung: ${summary}
Kategorie: ${cat}

Der Wirkungsindex (0-100) misst GENAU EINE Sache:
„Wie sehr verbessert diese Nachricht konkret das Leben von Menschen (oder den Zustand der Welt) ZUM BESSEREN?"
Es ist KEINE Formel aus Reichweite × Beleg × Dauer. Eine Studie kann perfekt belegt und uralt-stabil sein
und TROTZDEM wenig Wirkung haben (sie verbessert nichts, sie erklärt nur etwas).

Skala (sei STRENG, 100 ist absolute Ausnahme):
• 85-100: Verändert STRUKTURELL das Leben vieler — Gesetz/Reform mit echtem Nutzen, Durchbruch der Krankheit
  heilt/Armut senkt/Umwelt rettet, Technologie die nachweisbar >100.000 Menschen direkt hilft.
• 65-84: Klarer, konkreter Fortschritt mit greifbarem Nutzen — gelöstes Problem, gute neue Regel, Art gerettet.
• 45-64: Solide gute Entwicklung, regionaler/mittlerer Fortschritt, vielversprechender erster Schritt.
• 25-44: Nett, aber geringe reale Wirkung — wissenschaftliche ERKENNTNIS/Kuriosität OHNE direkten Nutzen
  (interessant, aber verbessert nichts), Symbolisches, sehr Lokales, vager Forschungsstand.
  ⚠️ HIERHIN gehören reine "Aha"-Studien: "Hauskatzen früher domestiziert als gedacht", "Sex beschleunigte
  Evolution", "Ältester Baum entdeckt" — faszinierend, aber KEINE Wirkung auf das Leben von heute.
  NIEMALS 85+ nur weil peer-reviewed und das Thema groß ist.
• 1-24: Minimaler Impact, Grenzfall.

Merksatz: "Wird das Leben von irgendwem morgen messbar besser?" Wenn nein → max 44, egal wie gut belegt.

Antworte NUR mit JSON: {"impact_score": <int 1-100>, "begruendung": "<ein kurzer Satz>"}`;

async function rescore(s) {
	const r = await fetch('https://api.deepseek.com/chat/completions', {
		method: 'POST',
		headers: { Authorization: `Bearer ${DS}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			model: 'deepseek-chat',
			messages: [{ role: 'user', content: PROMPT(s.title, s.subtitle || '', s.summary || '', s.category || '') }],
			temperature: 0.2,
			response_format: { type: 'json_object' }
		})
	});
	if (!r.ok) throw new Error(`DeepSeek ${r.status}`);
	const data = await r.json();
	return JSON.parse(data.choices[0].message.content);
}

async function main() {
	const res = await sql(`SELECT id, title, subtitle, summary, category, impact_score FROM nureine_stories WHERE impact_score >= ${MIN} ORDER BY impact_score DESC`);
	const rows = res?.[0]?.rows ?? res?.rows ?? res;
	const stories = Array.isArray(rows) ? rows : [];
	console.log(`Re-scoring ${stories.length} stories (impact_score >= ${MIN})${DRY ? ' [DRY RUN]' : ''}\n`);

	let changed = 0, dropped = 0;
	for (const s of stories) {
		try {
			const { impact_score: ns, begruendung } = await rescore(s);
			const clamped = Math.max(1, Math.min(100, parseInt(ns, 10)));
			const delta = clamped - s.impact_score;
			const flag = clamped < 65 ? ' ⬇⬇' : delta <= -10 ? ' ⬇' : '';
			console.log(`${String(s.impact_score).padStart(3)} → ${String(clamped).padStart(3)}${flag}  ${s.title.slice(0, 55)}\n          (${begruendung.slice(0, 90)})`);
			if (clamped !== s.impact_score) {
				changed++;
				if (delta <= -20) dropped++;
				if (!DRY) await sql(`UPDATE nureine_stories SET impact_score = ${clamped} WHERE id = '${esc(s.id)}'`);
			}
		} catch (e) {
			console.error(`  ! ${s.title.slice(0, 40)}: ${e.message}`);
		}
	}
	console.log(`\nFertig. ${changed} geändert, davon ${dropped} um ≥20 Punkte gesenkt.${DRY ? ' (DRY — nichts geschrieben)' : ''}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
