#!/usr/bin/env node
/**
 * Backfill: scort die N stärksten Stories rückwirkend durch die Social-Pipeline
 * (emotion / ig_ok / wa_ok / ig_hook / wa_opener / slides via DeepSeek) und legt
 * für jede einen Instagram-Post-Entwurf (status 'draft') an.
 *
 * Zweck: Feed-Grid füllen, damit neue Besucher sofort was sehen.
 * Aufruf: node scripts/backfill_social.mjs [N]   (Default N=9)
 *
 * Env nötig: SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, DEEPSEEK_API_KEY, PUBLIC_BASE_URL
 */
import { readFileSync } from 'node:fs';

// .env laden (simpel)
try {
	const env = readFileSync(new URL('../.env', import.meta.url), 'utf-8');
	for (const line of env.split('\n')) {
		const m = line.match(/^([A-Z_]+)=(.*)$/);
		if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
	}
} catch {}

const REF = process.env.SUPABASE_PROJECT_REF;
const SB_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const DS_KEY = process.env.DEEPSEEK_API_KEY;
const BASE = process.env.PUBLIC_BASE_URL || 'https://nureine.de';
const N = parseInt(process.argv[2] || '9', 10);

if (!REF || !SB_TOKEN || !DS_KEY) {
	console.error('Missing env: SUPABASE_PROJECT_REF / SUPABASE_ACCESS_TOKEN / DEEPSEEK_API_KEY');
	process.exit(1);
}

async function sql(query) {
	const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${SB_TOKEN}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ query })
	});
	if (!r.ok) throw new Error(`SQL ${r.status}: ${(await r.text()).slice(0, 300)}`);
	return r.json();
}

function esc(s) {
	return String(s).replace(/'/g, "''");
}

const PIPELINE_PROMPT = (title, dek, category, impact) => `Du bewertest eine Good-News-Story für Social Media. Antworte NUR mit validem JSON.

Story-Titel: ${title}
Untertitel: ${dek}
Kategorie: ${category}
Wirkungsindex: ${impact}

Felder:
emotion: EINE von "relief"|"wonder"|"hope"|"pride"|"warmth" (dominante Emotion).
ig_ok: true NUR wenn alle vier: (1) visuelles Moment, (2) Kern in einem Satz, (3) emotion relief/wonder/pride, (4) impact>=70.
wa_ok: true wenn man's einer Freundin schicken würde (spontan, ohne Erklärung, sofort emotional).
ig_hook: nur wenn ig_ok=true. Die ersten 1,5 Zeilen für Instagram (Emotion, NICHT Titel), max 90 Zeichen. Konkret, staunend, manchmal leise Systemkritik. Sonst null.
wa_opener: nur wenn wa_ok=true. Persönlicher WhatsApp-Einstieg in lockerer Stimme ("krass, warum hört man das nie:" / "Das hat mich heute ruhiger gemacht:"), max 80 Zeichen. Sonst null.
slides: nur wenn ig_ok=true. {"hook":"Folie 1, max 70 Zeichen","aufloesung":"Folie 2, 2-3 Sätze was+warum, max 280 Zeichen, einfach aber nicht dumm","stille":"Folie 3, ruhiger Schlusssatz, max 90 Zeichen"}. Sonst null.`;

async function scoreStory(s) {
	const r = await fetch('https://api.deepseek.com/chat/completions', {
		method: 'POST',
		headers: { Authorization: `Bearer ${DS_KEY}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			model: 'deepseek-chat',
			messages: [{ role: 'user', content: PIPELINE_PROMPT(s.title, s.subtitle || '', s.category, s.impact_score) }],
			temperature: 0.7,
			response_format: { type: 'json_object' }
		})
	});
	if (!r.ok) throw new Error(`DeepSeek ${r.status}`);
	const data = await r.json();
	return JSON.parse(data.choices[0].message.content);
}

const EMO = new Set(['relief', 'wonder', 'hope', 'pride', 'warmth']);
const CAT_TAG = { klima: '#klimaschutz', gesundheit: '#globalhealth', wissenschaft: '#wissenschaft', gemeinschaft: '#gemeinsinn', tiere: '#artenschutz', kultur: '#kultur', innovation: '#innovation' };

function slugify(t) {
	return t.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

async function main() {
	console.log(`Backfill: top ${N} Stories scoren + Posts anlegen…`);
	const res = await sql(
		`SELECT id, title, subtitle, category, impact_score, source_name FROM nureine_stories WHERE emotion IS NULL ORDER BY impact_score DESC NULLS LAST LIMIT ${N};`
	);
	const stories = res[0]?.result ?? res;
	const rows = Array.isArray(stories) ? stories : [];
	console.log(`  ${rows.length} Stories geladen.`);

	let created = 0;
	for (const s of rows) {
		try {
			const r = await scoreStory(s);
			const emotion = EMO.has(r.emotion) ? r.emotion : null;
			const igOk = !!r.ig_ok && s.impact_score >= 70;
			const waOk = !!r.wa_ok;
			const igHook = igOk && r.ig_hook ? String(r.ig_hook).slice(0, 120) : null;
			const waOpener = waOk && r.wa_opener ? String(r.wa_opener).slice(0, 120) : null;
			const slides = igOk && r.slides && r.slides.hook ? r.slides : null;

			// Story-Felder updaten
			await sql(
				`UPDATE nureine_stories SET emotion=${emotion ? `'${esc(emotion)}'` : 'NULL'}, ig_ok=${igOk}, wa_ok=${waOk}, ig_hook=${igHook ? `'${esc(igHook)}'` : 'NULL'}, wa_opener=${waOpener ? `'${esc(waOpener)}'` : 'NULL'}, slides=${slides ? `'${esc(JSON.stringify(slides))}'::jsonb` : 'NULL'} WHERE id='${s.id}';`
			);

			if (!igOk) {
				console.log(`  - ${s.title.slice(0, 40)} → ig_ok=false (skip post)`);
				continue;
			}

			const slug = `${slugify(s.title)}-${s.id.slice(0, 8)}`;
			const hashtags = ['#gutenachrichten', '#positivenews', '#fortschritt'];
			if (CAT_TAG[s.category]) hashtags.push(CAT_TAG[s.category]);
			const caption =
				(igHook ? igHook + '\\n\\n' : '') +
				(slides?.aufloesung || s.subtitle || '') +
				(s.source_name ? `\\n\\nQuelle: ${s.source_name}` : '') +
				'\\n\\nTäglich eine belegte gute Nachricht → nureine.de';

			// Post-Draft anlegen (idempotent via unique index)
			await sql(
				`INSERT INTO nureine_social_posts (story_id, platform, caption, hashtags, card_url, og_url, hook_type, category, is_carousel, status, scheduled_for)
				 VALUES ('${s.id}','instagram','${esc(caption)}', ARRAY[${hashtags.map((h) => `'${h}'`).join(',')}], '${BASE}/api/share-card/${slug}', '${BASE}/api/og/${slug}', 'zahl', '${esc(s.category)}', ${!!slides}, 'draft', now())
				 ON CONFLICT (story_id, platform) DO NOTHING;`
			);
			created += 1;
			console.log(`  ✓ ${s.title.slice(0, 40)} → draft (carousel=${!!slides}, ${emotion})`);
		} catch (e) {
			console.error(`  ! ${s.title.slice(0, 40)}: ${e.message}`);
		}
	}
	console.log(`Fertig. ${created} Post-Drafts angelegt.`);
}

main();
