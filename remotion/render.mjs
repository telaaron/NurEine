#!/usr/bin/env node
/**
 * render.mjs — tägliches NurEine-Reel rendern (Remotion) + hochladen + einreihen.
 *
 * Pipeline (v3, Juli 2026):
 *   1. Story holen (per --slug von der API oder --data <json> für lokale Tests)
 *   2. Reel-Skript via DeepSeek (Hook ≤9 Wörter, Beats, VO-Text) — Fallback: regelbasiert
 *   3. Optional Voiceover via edge-tts (kostenlos, de-DE) mit Wort-Timestamps
 *   4. Szenen-Plan berechnen (Timings aus Textlänge, skaliert auf VO-Länge)
 *   5. Remotion rendert Komposition "ReelDaily" → MP4
 *   6. Upload nach Supabase Storage + Reel-Draft in nureine_social_posts
 *
 *   node render.mjs --base-url https://nureine.de --slug <slug> --out /tmp/reel.mp4 \
 *       [--vo | --no-vo] [--data story.json] \
 *       [--queue --story-id <id> --caption "…" --hashtags "#a,#b" --category klima]
 *
 * ENV: DEEPSEEK_API_KEY (Skript), SUPABASE_URL + SUPABASE_SERVICE_KEY (--queue),
 *      VO=1 (Voiceover an, Default AUS bis Stimm-Qualität abgenommen ist).
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { argv, env, exit } from 'node:process';
import { fileURLToPath } from 'node:url';

const FPS = 30;

function arg(name, def = null) {
	const i = argv.indexOf(`--${name}`);
	if (i === -1) return def;
	const v = argv[i + 1];
	return v && !v.startsWith('--') ? v : true;
}

// ── Extraktion (Fallbacks ohne LLM) ─────────────────────────────────────────

const UNIT_STOPWORDS = new Set(['und', 'der', 'die', 'das', 'den', 'dem', 'von', 'bis', 'im', 'in', 'am', 'an', 'mit', 'auf', 'aus', 'für', 'pro', 'je', 'bei', 'nach', 'seit', 'oder', 'als', 'ihnen', 'davon']);

/** Held-Zahl + Einheit (Wort danach) aus Text. */
function extractNumber(text) {
	let m = text.match(/([−-]?\d[\d.,]*\s?(?:%|Mrd|Mio|Millionen|Milliarden|Tsd)?)\s+([A-Za-zÄÖÜäöüß]+)/);
	if (m) {
		const num = m[1].replace(/\s+/g, ' ').trim();
		// %-Zahlen brauchen keine Einheit; Stopwörter ("und", "der" …) sind keine.
		const unit = num.endsWith('%') || UNIT_STOPWORDS.has(m[2].toLowerCase()) ? null : m[2];
		return { num, unit };
	}
	m = text.match(/[−-]?\d[\d.,]*\s?%/);
	if (m) return { num: m[0].replace(/\s/g, ''), unit: null };
	m = text.match(/\d[\d.,]*\s?(Mrd|Mio|Millionen|Milliarden|Tsd)\b/i);
	if (m) return { num: m[0], unit: null };
	m = text.match(/\d[\d.,]{2,}/);
	if (m) return { num: m[0], unit: null };
	return { num: null, unit: null };
}

function pickPunchWord(hook, heroNumber) {
	if (heroNumber && hook.includes(heroNumber)) return heroNumber;
	const strong = ['zum ersten Mal', 'verdoppelt', 'halbiert', 'gerettet', 'geheilt', 'besiegt', 'wächst', 'verschwindet', 'kostenlos'];
	for (const w of strong) {
		const i = hook.toLowerCase().indexOf(w.toLowerCase());
		if (i >= 0) return hook.slice(i, i + w.length);
	}
	const words = hook.split(/\s+/).filter((w) => w.length >= 6);
	return words[0] || '';
}

// ── Skript-Generierung (DeepSeek, Fallback regelbasiert) ────────────────────

function fallbackScript(story) {
	const hook = story.hook || story.title;
	const aufloesung = story.aufloesung || hook;
	const ctx = aufloesung.length <= 90 ? aufloesung : aufloesung.slice(0, 87) + '…';
	return {
		hook: { screen: hook, vo: null },
		number: { screen: ctx, vo: null },
		beats: [{ screen: aufloesung, vo: null }],
		proofVo: null,
		endVo: null
	};
}

/**
 * EIN Skript für Screen UND Stimme: jede Szene hat 'screen' (kurzer Text im
 * Bild) und 'vo' (der gesprochene Satz, der EXAKT dasselbe sagt, nur
 * ausformuliert). Die Stimme liest also immer das, was gerade zu sehen ist —
 * gleiche Reihenfolge, gleicher Inhalt (Aarons Feedback 2026-07-06: vorher
 * liefen Screen-Beats und VO als zwei getrennte Erzählungen auseinander).
 */
async function generateScript(story) {
	const key = env.DEEPSEEK_API_KEY;
	if (!key) {
		console.log('kein DEEPSEEK_API_KEY — regelbasiertes Skript (ohne VO)');
		return fallbackScript(story);
	}
	const prompt = `Du schreibst das Skript für ein 20-Sekunden-Instagram-Reel von "NurEine" (deutschsprachige Good-News-Plattform, Positionierung: "ehrlicher Fortschritt", belegt statt behauptet, warm aber nie kitschig, duzt).

Das Reel hat feste Szenen. Pro Szene gibt es "screen" (Text im Bild, KURZ) und "vo" (der gesprochene Satz eines Moderators). REGEL: "vo" sagt inhaltlich EXAKT das, was "screen" zeigt — nur als natürlicher gesprochener Satz. Niemals andere Fakten, niemals andere Reihenfolge.

STORY:
Titel: ${story.title}
Hook (Vorlage): ${story.hook}
Kern: ${story.aufloesung}
Region: ${story.region || '—'}
Quelle: ${story.source || '—'}

Liefere NUR ein JSON-Objekt (kein Markdown):
{
  "hook":   { "screen": "MAX 9 Wörter, die überraschendste Konkretheit zuerst (Zahl wenn vorhanden), keine Frage, kein Clickbait", "vo": "derselbe Inhalt als 1 gesprochener Satz, max 16 Wörter" },
  "number": { "screen": "Halbsatz MAX 12 Wörter, der die Kernzahl einordnet", "vo": "derselbe Inhalt als 1 Satz mit der Zahl, max 16 Wörter" },
  "beats":  [ { "screen": "MAX 14 Wörter NEUE Info (nicht den Hook wiederholen)", "vo": "derselbe Inhalt als 1 Satz, max 18 Wörter" } ],
  "proofVo": "1 kurzer Satz wie: 'Belegt — nachgeprüft, Quelle: ${story.source || 'siehe nureine.de'}.'",
  "endVo":  "EXAKT: 'Schick das jemandem, der heute eine gute Nachricht braucht.'"
}
"beats": 1-2 Einträge. Kurze Hauptsätze, warm, klar, keine Superlativ-Floskeln.`;
	try {
		const r = await fetch('https://api.deepseek.com/chat/completions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
			body: JSON.stringify({
				model: 'deepseek-chat',
				messages: [{ role: 'user', content: prompt }],
				temperature: 0.6,
				response_format: { type: 'json_object' }
			}),
			signal: AbortSignal.timeout(60000)
		});
		if (!r.ok) throw new Error(`DeepSeek ${r.status}`);
		const data = await r.json();
		const raw = JSON.parse(data.choices[0].message.content);
		if (!raw.hook?.screen || !Array.isArray(raw.beats)) throw new Error('Skript unvollständig');
		raw.beats = raw.beats.filter((b) => b && b.screen).slice(0, 2);
		return raw;
	} catch (e) {
		console.log(`DeepSeek-Skript fehlgeschlagen (${e.message}) — regelbasiert`);
		return fallbackScript(story);
	}
}

// ── Voiceover (edge-tts) ────────────────────────────────────────────────────

const VOICE = env.REEL_VOICE || 'de-DE-FlorianMultilingualNeural'; // männlich, passt zum Moderator

/**
 * Synthetisiert EIN VO-Segment (einen Szenen-Satz). Rückgabe mit Wort-Timings
 * RELATIV zum Segment-Start — das Audio wird in Remotion in der jeweiligen
 * Szenen-Sequence abgespielt, Sync ist damit konstruktionsbedingt exakt.
 */
function synthSegment(text, slug, name) {
	const dir = fileURLToPath(new URL('./public/vo/', import.meta.url));
	mkdirSync(dir, { recursive: true });
	const file = `vo/${slug}-${name}.mp3`;
	const wordsPath = `/tmp/reel-words-${slug}-${name}.json`;
	const py = env.TTS_PYTHON || 'python3';
	try {
		execFileSync(py, [fileURLToPath(new URL('./scripts/tts.py', import.meta.url)), '--text', text, '--voice', VOICE, '--out', `${dir}${slug}-${name}.mp3`, '--words', wordsPath], { stdio: 'inherit', timeout: 120000 });
		const words = JSON.parse(readFileSync(wordsPath, 'utf8'));
		if (!words.length) throw new Error('keine Wort-Timestamps');
		return {
			file,
			words: words.map((w) => ({ t: w.t, start: Math.round(w.start * FPS), end: Math.round(w.end * FPS) })),
			durFrames: Math.round((words[words.length - 1].end + 0.35) * FPS)
		};
	} catch (e) {
		console.log(`VO-Segment "${name}" fehlgeschlagen (${e.message}) — Szene ohne Stimme`);
		return null;
	}
}

// ── Szenen-Plan ─────────────────────────────────────────────────────────────

/** Lesedauer: ~2× laut lesen, geklemmt. */
function readFrames(text, min, max) {
	const sec = Math.min(max, Math.max(min, (text.length / 13) * 1.15));
	return Math.round(sec * FPS);
}

function buildScenes(story, script, voWanted, slug) {
	const hookScreen = script.hook.screen;
	// Kern-Zahl bevorzugt aus dem Zahl-Kontext des Skripts (dort steht die
	// Zahl, um die es GEHT) — sonst greift der Extraktor z.B. ein Alter ('16')
	// aus der Auflösung, während der Kontext von '90%' spricht.
	const { num, unit } = extractNumber(`${script.number?.screen || ''} ${hookScreen} ${story.title} ${story.aufloesung || ''}`);
	const kicker = `GUTE NACHRICHT · ${(story.category || 'gemeinschaft').toUpperCase()}`;
	const scenes = [];
	let t = 0;
	let anyVo = false;

	// Szene anlegen: Dauer = max(Lesezeit, VO-Länge + Nachlauf). VO nur, wenn
	// gewünscht UND das Segment einen Text hat UND die Synthese klappt.
	const push = (sc, minSec, maxSec, voText, name) => {
		const readDur = readFrames(sc.kind === 'proof' || sc.kind === 'end' ? 'x'.repeat(30) : sc.text || sc.context || '', minSec, maxSec);
		let vo = null;
		if (voWanted && voText) {
			vo = synthSegment(voText, slug, name);
			if (vo) anyVo = true;
		}
		const dur = vo ? Math.max(readDur, vo.durFrames + 12) : readDur;
		scenes.push({ ...sc, vo, start: t, dur });
		t += dur;
	};

	push({ kind: 'hook', text: hookScreen, punch: pickPunchWord(hookScreen, num), kicker }, 2.4, 3.6, script.hook.vo, 'hook');
	if (num && script.number?.screen) {
		push({ kind: 'number', value: num, unit, context: script.number.screen }, 2.4, 3.4, script.number.vo, 'number');
	}
	const beats = script.beats.length ? script.beats : [{ screen: story.aufloesung, vo: null }];
	beats.forEach((b, i) => {
		push({ kind: 'beat', text: b.screen, image: i === 0 ? story.image || null : null, pose: i % 2 === 0 ? 'point-side' : 'thinking' }, 2.6, 4.4, b.vo, `beat${i}`);
	});
	if (story.source) {
		// Wirkungsindex nur zeigen, wenn er die Story TRÄGT (≥50). Der Stempel
		// belegt die Verifikation — ein "30/100" würde die Story schlechtreden.
		const impact = (story.impactScore ?? 0) >= 50 ? story.impactScore : null;
		push({ kind: 'proof', source: story.source, impact }, 2.3, 2.3, script.proofVo, 'proof');
	}
	push({ kind: 'end', share: story.shareHook || hookScreen, cta: 'Schick’s jemandem, der das heute braucht', hasVo: anyVo }, 3.4, 3.4, script.endVo, 'end');
	// hasVo erst nach allen Segmenten final setzen (endVo könnte das erste erfolgreiche sein)
	scenes[scenes.length - 1].hasVo = anyVo;

	return { scenes, duration: t, anyVo };
}

/**
 * REGIE-MODUS (--script plan.json): Claude ordnet die Szenen selbst an —
 * beliebige Reihenfolge/Anzahl aus dem Baukasten (hook, number, beat, proof,
 * end), eigene Texte, eigenes VO. render.mjs übernimmt nur noch TTS, Timing,
 * Render, Upload, Queue. So variiert die Dramaturgie täglich, ohne dass die
 * technische Qualität (Safe-Zones, Sync, Marke) verhandelbar wird.
 */
function buildScenesFromPlan(plan, voWanted, slug) {
	const scenes = [];
	let t = 0;
	let anyVo = false;
	plan.scenes.forEach((raw, i) => {
		const { voText, ...sc } = raw;
		let vo = null;
		if (voWanted && voText) {
			vo = synthSegment(voText, slug, `s${i}-${sc.kind}`);
			if (vo) anyVo = true;
		}
		const baseText = sc.text || sc.context || sc.share || 'x'.repeat(30);
		const minMax = sc.kind === 'end' ? [3.4, 3.4] : sc.kind === 'proof' ? [2.3, 2.3] : [2.4, 4.4];
		const readDur = readFrames(baseText, minMax[0], minMax[1]);
		const dur = vo ? Math.max(readDur, vo.durFrames + 12) : readDur;
		scenes.push({ ...sc, vo, start: t, dur });
		t += dur;
	});
	const end = scenes.find((sc) => sc.kind === 'end');
	if (end) end.hasVo = anyVo;
	return { scenes, duration: t, anyVo };
}

// ── Story holen ─────────────────────────────────────────────────────────────

async function fetchStory(baseUrl, slug) {
	const url = `${baseUrl.replace(/\/$/, '')}/api/reel-data/${slug}`;
	const r = await fetch(url);
	if (!r.ok) throw new Error(`reel-data ${r.status}`);
	return r.json();
}

// ── Upload + Queue ──────────────────────────────────────────────────────────

async function uploadToSupabase(mp4Path, slug) {
	const supa = env.SUPABASE_URL.replace(/\/$/, '');
	const key = env.SUPABASE_SERVICE_KEY;
	// Eigener Bucket: story_images erlaubt nur Bilder ≤5MB (mime-Whitelist) → 400.
	const bucket = env.REEL_BUCKET || 'story_reels';
	const fname = `reels/${slug}-${statSync(mp4Path).size % 100000}.mp4`;
	const data = readFileSync(mp4Path);
	const r = await fetch(`${supa}/storage/v1/object/${bucket}/${fname}`, {
		method: 'POST',
		headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'video/mp4', 'x-upsert': 'true' },
		body: data
	});
	if (!r.ok) throw new Error(`Storage-Upload ${r.status}`);
	return `${supa}/storage/v1/object/public/${bucket}/${fname}`;
}

async function queueReel(storyId, videoUrl, caption, hashtags, category, hookType) {
	const supa = env.SUPABASE_URL.replace(/\/$/, '');
	const key = env.SUPABASE_SERVICE_KEY;
	const r = await fetch(`${supa}/rest/v1/nureine_social_posts`, {
		method: 'POST',
		headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
		body: JSON.stringify({
			story_id: storyId,
			platform: 'instagram',
			post_kind: 'reel',
			caption,
			hashtags,
			card_url: videoUrl,
			og_url: videoUrl,
			slide_urls: [videoUrl],
			// Check-Constraint erlaubt nur zahl|frage|kontrast (Legacy-A/B-Feld) —
			// ig_hook_type-Werte wie 'charme'/'mensch' darauf abbilden.
			hook_type: ['zahl', 'frage', 'kontrast'].includes(hookType) ? hookType : 'zahl',
			hook_style: 'image',
			category,
			is_carousel: false,
			status: 'draft',
			// sofort fällig — sonst findet publishDue (lte scheduled_for) den Draft nie
			scheduled_for: new Date().toISOString()
		})
	});
	if (!r.ok) throw new Error(`Queue-Insert ${r.status}`);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
	const baseUrl = arg('base-url');
	const slug = arg('slug') || 'local-test';
	const out = arg('out') || `/tmp/reel-${slug}.mp4`;
	const dataFile = arg('data');

	const scriptFile = arg('script');
	const plan = scriptFile ? JSON.parse(readFileSync(scriptFile, 'utf8')) : null;
	const story = plan ? plan.story : dataFile ? JSON.parse(readFileSync(dataFile, 'utf8')) : await fetchStory(baseUrl, slug);

	// VO: Default AUS (Stimm-Qualität muss einmal abgenommen werden) — an per --vo oder VO=1.
	const voWanted = arg('no-vo') ? false : arg('vo') === true || env.VO === '1';

	let scenes, duration, anyVo;
	if (plan) {
		// Regie-Modus: Szenenplan kommt fertig von der Claude-Routine.
		({ scenes, duration, anyVo } = buildScenesFromPlan(plan, voWanted, slug));
	} else {
		const script = await generateScript(story);
		console.log('skript:', JSON.stringify(script).slice(0, 240));
		({ scenes, duration, anyVo } = buildScenes(story, script, voWanted, slug));
	}

	// Musik deterministisch variieren (per Slug), damit der Feed nicht monoton klingt.
	let h = 0;
	for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
	const music = plan?.music || ['audio/hope-1.wav', 'audio/calm-1.wav'][h % 2];

	const props = {
		scenes,
		category: story.category || 'gemeinschaft',
		seed: slug,
		musicFile: music,
		hasVo: anyVo,
		durationInFrames: duration
	};
	const propsPath = `/tmp/reel-props-${slug}.json`;
	writeFileSync(propsPath, JSON.stringify(props));
	console.log(`szenen: ${scenes.map((s) => s.kind).join(' → ')} | ${Math.round(duration / FPS)}s | VO: ${anyVo ? `ja (${VOICE})` : 'nein'}`);

	execFileSync('npx', ['remotion', 'render', 'ReelDaily', out, `--props=${propsPath}`, '--log=error'], {
		stdio: 'inherit',
		cwd: fileURLToPath(new URL('.', import.meta.url))
	});
	console.log(`OK reel → ${out} (${Math.round(statSync(out).size / 1024)} KB)`);

	if (arg('upload') || arg('queue')) {
		const videoUrl = await uploadToSupabase(out, slug);
		console.log(`OK upload → ${videoUrl}`);
		if (arg('queue')) {
			const storyId = arg('story-id') || plan?.story?.id;
			if (!storyId) throw new Error('--queue braucht --story-id');
			const tags = plan?.hashtags?.length ? plan.hashtags : (arg('hashtags') || '').split(',').map((t) => t.trim()).filter(Boolean);
			await queueReel(storyId, videoUrl, plan?.caption || arg('caption') || '', tags, plan?.story?.category || arg('category') || 'gemeinschaft', story.igHookType);
			console.log('OK reel-draft angelegt (status=draft)');
		}
	}
}

main().catch((e) => {
	console.error('FEHLER:', e.message);
	exit(1);
});
