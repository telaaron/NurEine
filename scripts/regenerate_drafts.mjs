#!/usr/bin/env node
/**
 * Regeneriert die Draft-Posts: scort die Stories der bestehenden IG-Drafts neu
 * durch DeepSeek (positiver Hook, ig_caption, slides) und schreibt Story-Felder
 * + Post-Caption frisch. Behebt: Caption-Wiederholung + Negativ-Hooks.
 *
 * Aufruf: node scripts/regenerate_drafts.mjs
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

const PROMPT = (title, dek, cat, impact) => `Du bereitest eine Good-News-Story für Instagram auf. Antworte NUR mit JSON.

Titel: ${title}
Untertitel: ${dek}
Kategorie: ${cat}
Wirkungsindex: ${impact}

WICHTIG: Die gute Nachricht ins POSITIVE framen. Beispiel: nicht "40.000 Geckos gefangen"
sondern "Handelsverbot rettet seltenen Gecko". Der Hook betont, was BESSER wird, nicht das Problem.

Felder:
emotion: "relief"|"wonder"|"hope"|"pride"|"warmth" (dominante).
ig_hook: erste 1,5 Zeilen für Instagram (Emotion/positiver Fakt, NICHT Problem), max 90 Zeichen.
slides: {"hook":"Folie1 max70","aufloesung":"Folie2 was+warum 2-3 Sätze max280, einfach nicht dumm","stille":"Folie3 ruhiger Schluss max90"}
ig_caption: Instagram-Caption-Text UNTER dem Post. Darf hook/slides NICHT wiederholen — neuer
  Blickwinkel: zusätzliche Zahl, überraschendes Detail, Einordnung, die Neugier weckt. 2-4 Sätze,
  warm + konkret, kein Marketing-Sprech, max ein "→ nureine.de" am Ende.
heroNumber: falls eine knackige Zahl (z.B. "603", "−60%", "11 Mio") existiert, sonst null.`;

async function score(s) {
	const r = await fetch('https://api.deepseek.com/chat/completions', {
		method: 'POST',
		headers: { Authorization: `Bearer ${DS}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			model: 'deepseek-chat',
			messages: [{ role: 'user', content: PROMPT(s.title, s.subtitle || '', s.category, s.impact_score) }],
			temperature: 0.7,
			response_format: { type: 'json_object' }
		})
	});
	if (!r.ok) throw new Error(`DeepSeek ${r.status}`);
	return JSON.parse((await r.json()).choices[0].message.content);
}

async function main() {
	const res = await sql(
		`SELECT DISTINCT s.id, s.title, s.subtitle, s.category, s.impact_score, s.source_name
		 FROM nureine_social_posts p JOIN nureine_stories s ON s.id=p.story_id
		 WHERE p.status='draft' AND p.platform='instagram';`
	);
	const rows = res[0]?.result ?? res;
	const stories = Array.isArray(rows) ? rows : [];
	console.log(`${stories.length} Draft-Stories regenerieren…`);

	for (const s of stories) {
		try {
			const r = await score(s);
			const igHook = r.ig_hook ? String(r.ig_hook).slice(0, 120) : null;
			const igCaption = r.ig_caption ? String(r.ig_caption).slice(0, 600) : null;
			const slides = r.slides && r.slides.hook ? r.slides : null;
			const emotion = ['relief', 'wonder', 'hope', 'pride', 'warmth'].includes(r.emotion) ? r.emotion : null;

			await sql(
				`UPDATE nureine_stories SET ig_hook=${igHook ? `'${esc(igHook)}'` : 'NULL'},
				 ig_caption=${igCaption ? `'${esc(igCaption)}'` : 'NULL'},
				 slides=${slides ? `'${esc(JSON.stringify(slides))}'::jsonb` : 'NULL'},
				 emotion=${emotion ? `'${esc(emotion)}'` : 'emotion'}
				 WHERE id='${s.id}';`
			);

			// Post-Caption = ig_caption (Fallback: aufloesung). NIE der Hook.
			const cap = igCaption || (slides?.aufloesung || s.subtitle || s.title);
			await sql(
				`UPDATE nureine_social_posts SET caption='${esc(cap)}', updated_at=now()
				 WHERE story_id='${s.id}' AND status='draft';`
			);
			console.log(`  ✓ ${s.title.slice(0, 45)} → hook: ${igHook?.slice(0, 50)}`);
		} catch (e) {
			console.error(`  ! ${s.title.slice(0, 40)}: ${e.message}`);
		}
	}
	console.log('Fertig.');
}
main();
