#!/usr/bin/env node
/**
 * Backfill der Wirkungsindex-Aufschlüsselung für bestehende Stories:
 * impact_reach_score (0-100 Balken), impact_explainer (Relevanz-Satz),
 * share_hook (Weitersagen-Satz). durability/evidence existieren schon.
 *
 * Standard: nur Stories ab impact_score >= 45 (die im Frontend prominent
 * erscheinen) und wo Felder noch fehlen. Aufruf:
 *   node scripts/backfill_breakdown.mjs [--min 45] [--limit 200] [--dry]
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
if (!REF || !SB || !DS) { console.error('Missing env'); process.exit(1); }

const args = process.argv.slice(2);
const MIN = Number(args[args.indexOf('--min') + 1]) || 45;
const LIMIT = Number(args[args.indexOf('--limit') + 1]) || 200;
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

const PROMPT = (s) => `Du bereitest die Wirkungsindex-Aufschlüsselung einer Good-News-Story auf. Antworte NUR mit JSON.

Titel: ${s.title}
Untertitel: ${s.subtitle || ''}
Zusammenfassung: ${s.summary || ''}
Wirkungsindex (gesamt): ${s.impact_score}/100

Felder:
impact_reach_score: 0-100 — REICHWEITE als Balkenwert. Wie viele Menschen betrifft es direkt?
  100=global/Milliarden, 80=Millionen, 60=Hunderttausende, 40=Zehntausende, 20=lokal.
  MUSS zum Gesamtindex ${s.impact_score} passen (niedriger Gesamtscore → selten hoher Reichweite-Balken).
impact_explainer: EIN deutscher Satz, der die RELEVANZ übersetzt (nicht die Methodik). Warum geht das
  die Leserin an? Alltagssprache, max 140 Zeichen, keine Floskel.
share_hook: EIN fertiger Chat-Satz zum Weitergeben an einen Freund (WhatsApp-ready). Neugierig, menschlich,
  überraschend. Keine Schlagzeile, keine Werbung, kein Hashtag, kein Link. Max 160 Zeichen.

Antworte NUR mit JSON: {"impact_reach_score": <int>, "impact_explainer": "<satz>", "share_hook": "<satz>"}`;

async function gen(s) {
	const r = await fetch('https://api.deepseek.com/chat/completions', {
		method: 'POST',
		headers: { Authorization: `Bearer ${DS}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			model: 'deepseek-chat',
			messages: [{ role: 'user', content: PROMPT(s) }],
			temperature: 0.6,
			response_format: { type: 'json_object' }
		})
	});
	if (!r.ok) throw new Error(`DeepSeek ${r.status}`);
	const data = await r.json();
	return JSON.parse(data.choices[0].message.content);
}

async function main() {
	const res = await sql(`SELECT id, title, subtitle, summary, impact_score FROM nureine_stories
		WHERE impact_score >= ${MIN} AND share_hook IS NULL
		ORDER BY impact_score DESC LIMIT ${LIMIT}`);
	const rows = res?.[0]?.rows ?? res?.rows ?? res;
	const stories = Array.isArray(rows) ? rows : [];
	console.log(`Backfill ${stories.length} Stories (impact >= ${MIN}, share_hook fehlt)${DRY ? ' [DRY]' : ''}\n`);

	let done = 0;
	for (const s of stories) {
		try {
			const { impact_reach_score, impact_explainer, share_hook } = await gen(s);
			const rs = Math.max(0, Math.min(100, parseInt(impact_reach_score, 10) || 0));
			console.log(`✓ ${s.title.slice(0, 50)}\n    reach=${rs} | 💬 ${(share_hook || '').slice(0, 80)}`);
			if (!DRY) {
				await sql(`UPDATE nureine_stories SET
					impact_reach_score = ${rs},
					impact_explainer = '${esc((impact_explainer || '').slice(0, 200))}',
					share_hook = '${esc((share_hook || '').slice(0, 220))}'
					WHERE id = '${esc(s.id)}'`);
			}
			done++;
		} catch (e) {
			console.error(`  ! ${s.title.slice(0, 40)}: ${e.message}`);
		}
	}
	console.log(`\nFertig. ${done}/${stories.length} aktualisiert.${DRY ? ' (DRY)' : ''}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
