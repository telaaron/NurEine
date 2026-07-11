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

// ── Tempo-Parameter (TikTok-Schnitt) ────────────────────────────────────────
// Standard = altes Verhalten (rückwärtskompatibel): PACE=1.0, MINF=60, PAD=10,
// VO-Nachlauf 0.35s. --tiktok ist ein Preset für einen aggressiveren Schnitt;
// --pace <faktor> skaliert NUR den No-VO-Zweig (readDur), nie die Stimme.
const TIKTOK = arg('tiktok') === true;
// PACE aus CLI (--pace) > env PACE > Preset (--tiktok → 0.7) > 1.0.
const PACE = (() => {
	const cli = arg('pace');
	if (cli && cli !== true) return parseFloat(cli) || 1.0;
	if (env.PACE) return parseFloat(env.PACE) || 1.0;
	return TIKTOK ? 0.7 : 1.0;
})();
// VO-Nachlauf/Mindestlängen: im TikTok-Modus enger, sonst wie gehabt.
const MINF = TIKTOK ? 40 : 60; // Mindest-Szenenlänge MIT VO (Frames)
const PAD = TIKTOK ? 4 : 10; // Nachlauf hinter dem letzten VO-Wort (Frames)
const VO_TAIL = TIKTOK ? 0.15 : 0.35; // Sekunden hinter dem letzten Wort im TTS-Segment
// Sprechtempo (edge-tts rate): TikTok flotter — gemessen spricht Seraphina bei +4%
// nur ~2,2 Wörter/s, damit wird ein 50-Wort-Skript >23s. REEL_RATE übersteuert.
// +16% seit 2026-07-11 (Publikums-Feedback: „muss schneller geredet werden").
const TTS_RATE = env.REEL_RATE || (TIKTOK ? '+16%' : '+4%');
// TTS-Backend: 'edge' (kostenlos) oder 'eleven' (ElevenLabs-Premium-Stimme via
// ELEVENLABS_API_KEY/_VOICE_ID — eine Marken-Stimme, Figur-Kopplung entfällt).
const TTS_ENGINE = env.REEL_TTS || 'edge';

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

Das Reel hat feste Szenen. Pro Szene gibt es "screen" (Text im Bild) und "vo" (der gesprochene Satz eines Moderators). REGELN:
- "screen" ist die ESSENZ (kurz, plakativ), "vo" ERZÄHLT denselben Fakt ausformuliert — NICHT wortgleich, aber niemals andere Fakten oder andere Reihenfolge. Die Untertitel zeigen das Gesprochene, der Screen-Text ergänzt.
- "vo" enthält NUR deutsche Wörter — keine englischen Namen/Begriffe (die Stimme kippt sonst in englische Aussprache). Englische Eigennamen nur in "screen", im VO umschreiben ("eine Jugend-Tanzkompanie" statt "National Youth Dance Company").

STORY:
Titel: ${story.title}
Hook (Vorlage): ${story.hook}
Kern: ${story.aufloesung}
Region: ${story.region || '—'}
Quelle: ${story.source || '—'}

Liefere NUR ein JSON-Objekt (kein Markdown):
{
  "hook":   { "screen": "MAX 9 Wörter, die überraschendste Konkretheit zuerst (Zahl wenn vorhanden), keine Frage, kein Clickbait", "vo": "derselbe Fakt erzählt, max 16 Wörter, nicht wortgleich" },
  "number": { "screen": "Halbsatz MAX 12 Wörter, der die Kernzahl einordnet", "vo": "derselbe Fakt als Satz mit der Zahl, max 16 Wörter" },
  "beats":  [ { "screen": "MAX 14 Wörter NEUE Info (nicht den Hook wiederholen)", "vo": "derselbe Fakt erzählt, max 18 Wörter, nur deutsche Wörter" } ],
  "proofVo": "EXAKT: 'Belegt — von uns nachgeprüft.'",
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

// ── Zahlen → deutsche Zahlwörter fürs TTS ───────────────────────────────────
// Die Multilingual-Stimmen (Florian/Seraphina) kippen bei Ziffern (v.a. am
// Satzanfang) in ENGLISCHE Aussprache („ninety-seven thousand", Aaron 2026-07-11).
// Deshalb: Ziffern werden fürs TTS ausgeschrieben; die Captions zeigen weiter die
// Ziffern-Form (mergeNumberWords mappt die Wort-Timings zurück aufs Display-Token).

const G_ONES = ['null', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
const G_TENS = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];

// Präfixform: 1 → 'ein' (für „einundzwanzig"); Aufrufer regelt standalone 'eins'.
function gBelow100(n) {
	if (n < 20) return G_ONES[n];
	const t = Math.floor(n / 10), o = n % 10;
	return o ? `${G_ONES[o]}und${G_TENS[t]}` : G_TENS[t];
}

function gBelow1000(n) {
	const h = Math.floor(n / 100), r = n % 100;
	let s = h ? `${h === 1 ? 'ein' : G_ONES[h]}hundert` : '';
	if (r) s += r === 1 ? 'eins' : gBelow100(r);
	return s;
}

/** Kardinalzahl 0…999.999.999 als deutsches Zahlwort. */
function intToGerman(n) {
	if (n === 0) return 'null';
	if (n === 1) return 'eins';
	const mio = Math.floor(n / 1e6), tsd = Math.floor((n % 1e6) / 1000), rest = n % 1000;
	const parts = [];
	if (mio) parts.push(mio === 1 ? 'eine Million' : `${gBelow1000(mio)} Millionen`);
	let tail = '';
	if (tsd) tail += tsd === 1 ? 'eintausend' : `${gBelow1000(tsd)}tausend`;
	if (rest) tail += rest === 1 ? 'eins' : gBelow1000(rest);
	if (tail) parts.push(tail);
	return parts.join(' ');
}

/** Jahreszahlen 1100–1999 klassisch („neunzehnhundertneunzig"). */
function yearToGerman(n) {
	const c = Math.floor(n / 100), r = n % 100;
	return `${gBelow100(c)}hundert${r ? gBelow100(r) : ''}`;
}

/**
 * Ersetzt Ziffern-Zahlen (inkl. %, Mio/Mrd/Tsd, „1 Million" → „eine Million",
 * Jahreszahlen) durch Zahlwörter und liefert die Substitutionen fürs
 * Caption-Rückmapping. Ordinalzahlen („das 113.") NICHT abgedeckt — im voText
 * ausschreiben (Baukasten-Regel).
 */
function germanizeForTts(text) {
	const subs = [];
	const ttsText = text.replace(
		/(\d[\d.]*)(,\d+)?(\s?%)?(\s?(?:Mio\.?|Mrd\.?|Tsd\.?|Million(?:en)?|Milliarden?))?/g,
		(match, intRaw, dec, pct, unit) => {
			const intVal = parseInt(intRaw.replace(/\./g, ''), 10);
			if (!Number.isFinite(intVal)) return match;
			const singular = intVal === 1 && !dec;
			let unitSpoken = '';
			if (unit) {
				const u = unit.trim().replace(/\.$/, '');
				unitSpoken =
					u === 'Mio' ? (singular ? 'Million' : 'Millionen')
					: u === 'Mrd' ? (singular ? 'Milliarde' : 'Milliarden')
					: u === 'Tsd' ? 'tausend'
					: u;
			}
			let num =
				!dec && !pct && !unit && /^\d{4}$/.test(intRaw) && intVal >= 1100 && intVal <= 1999
					? yearToGerman(intVal)
					: singular && unitSpoken
						? 'eine' // „eine Million", nicht „eins Million"
						: intToGerman(intVal);
			if (dec) num += ` Komma ${dec.slice(1).split('').map((d) => (d === '1' ? 'eins' : G_ONES[+d])).join(' ')}`;
			if (pct) num += ' Prozent';
			const spoken = unitSpoken ? `${num} ${unitSpoken}` : num;
			subs.push({ display: match.trim(), spoken: spoken.split(/\s+/) });
			return spoken;
		}
	);
	return { ttsText, subs };
}

// ── Aussprache-Lexikon + Normalisierung ─────────────────────────────────────
// Workflow gegen Vorlesefehler: Fehler HÖREN → Eintrag in remotion/tts-lexikon.json
// ({"Original": "aussprache-freundliche form"}) → nächster Render sauber. Die
// Captions zeigen weiter das Original (display-merge wie bei den Zahlen).
let TTS_LEXICON = {};
try {
	TTS_LEXICON = JSON.parse(readFileSync(fileURLToPath(new URL('./tts-lexikon.json', import.meta.url)), 'utf8'));
} catch {
	/* kein Lexikon = keine Ersetzungen */
}

const ABBREV = { 'z.B.': 'zum Beispiel', 'z. B.': 'zum Beispiel', 'ca.': 'circa', 'u.a.': 'unter anderem', 'bzw.': 'beziehungsweise', 'Nr.': 'Nummer', '§': 'Paragraf', '&': 'und' };

function escapeRegex(s) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Kompletter TTS-Vorbereitungs-Pass: Lexikon → Gedankenstriche/Abkürzungen →
 * Zahlen ausschreiben. Liefert subs fürs Caption-Rückmapping.
 */
function prepareTts(text) {
	const subs = [];
	let t = text;
	for (const [orig, repl] of Object.entries(TTS_LEXICON)) {
		if (!orig || orig.startsWith('_') || typeof repl !== 'string') continue;
		const re = new RegExp(escapeRegex(orig), 'g');
		const hits = t.match(re);
		if (!hits) continue;
		t = t.replace(re, repl);
		for (let i = 0; i < hits.length; i++) subs.push({ display: orig, spoken: repl.split(/\s+/) });
	}
	for (const [orig, repl] of Object.entries(ABBREV)) {
		const re = new RegExp(escapeRegex(orig), 'g');
		const hits = t.match(re);
		if (!hits) continue;
		t = t.replace(re, repl);
		for (let i = 0; i < hits.length; i++) subs.push({ display: orig, spoken: repl.split(/\s+/) });
	}
	// Bindestrich-Komposita zusammenziehen („Räum-Teams" → „Räumteams" — die
	// Stimme macht sonst eine Roboter-Mikropause). Akronym-Teile (US-…) bleiben.
	t = t.replace(/\b([A-ZÄÖÜ]?[a-zäöüß]{2,})-([A-ZÄÖÜ][a-zäöüß]{2,})\b/g, (m, a, b) => {
		const merged = a + b.toLowerCase();
		subs.push({ display: m, spoken: [merged] });
		return merged;
	});
	// Gedankenstriche → Komma (die Multilingual-Stimme macht um „—" unnatürliche
	// Pausen/Betonungen); Ellipse → Punkt. Betrifft keine Caption-Wörter.
	t = t.replace(/\s*[—–]\s*/g, ', ').replace(/…/g, '.');
	const g = germanizeForTts(t);
	subs.push(...g.subs);
	return { ttsText: g.ttsText, subs };
}

/** Gesprochene Zahlwort-Folgen in den Captions wieder durch die Ziffern-Form ersetzen. */
function mergeNumberWords(words, subs) {
	const norm = (s) => s.toLowerCase().replace(/[^0-9a-zäöüß]/g, '');
	for (const sub of subs) {
		const target = sub.spoken.map(norm);
		for (let i = 0; i <= words.length - target.length; i++) {
			if (target.every((t, j) => norm(words[i + j].t) === t)) {
				words.splice(i, target.length, { t: sub.display, start: words[i].start, end: words[i + target.length - 1].end });
				break;
			}
		}
	}
	return words;
}

// Stimme passt zur gezeigten Figur: Moderator → Florian, Moderatorin → Seraphina.
// REEL_VOICE-Env übersteuert beides (nach Aarons Abnahme ggf. fixieren).
const VOICES = { mann: 'de-DE-FlorianMultilingualNeural', frau: 'de-DE-SeraphinaMultilingualNeural' };
let VOICE = env.REEL_VOICE || VOICES.mann;

/** Gleiche Hash-Logik wie personForSeed in ReelDaily.tsx — Stimme folgt der Figur. */
function personForSeed(seed) {
	let h = 0;
	for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) >>> 0;
	return h % 2 === 0 ? 'mann' : 'frau';
}

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
	// Lexikon + Striche/Abkürzungen + Ziffern ausschreiben — sonst spricht die
	// Multilingual-Stimme Ziffern englisch bzw. stolpert über Sonderzeichen.
	const { ttsText, subs } = prepareTts(text);
	if (subs.length) console.log(`vo-fix (${name}): ${subs.map((s) => `"${s.display}"→"${s.spoken.join(' ')}"`).join(' · ')}`);
	try {
		execFileSync(py, [fileURLToPath(new URL('./scripts/tts.py', import.meta.url)), '--text', ttsText, '--voice', VOICE, '--rate', TTS_RATE, '--engine', TTS_ENGINE, '--out', `${dir}${slug}-${name}.mp3`, '--words', wordsPath], { stdio: 'inherit', timeout: 120000 });
		let words = JSON.parse(readFileSync(wordsPath, 'utf8'));
		if (!words.length) throw new Error('keine Wort-Timestamps');
		words = mergeNumberWords(words, subs); // Captions zeigen wieder „97.000", nicht das Zahlwort
		return {
			file,
			words: words.map((w) => ({ t: w.t, start: Math.round(w.start * FPS), end: Math.round(w.end * FPS) })),
			durFrames: Math.round((words[words.length - 1].end + VO_TAIL) * FPS)
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
		// TIMING: die Stimme führt. Szene = VO-Länge + kurzer Nachlauf (min MINF);
		// ohne VO gilt die Lesezeit, mit Tempo-Faktor PACE skaliert (nur No-VO,
		// damit die Stimme nie abgeschnitten wird).
		const dur = vo ? Math.max(MINF, vo.durFrames + PAD) : Math.round(readDur * PACE);
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
		const baseText = sc.text || sc.context || sc.share || sc.label || 'x'.repeat(30);
		// TikTok-Preset: engere Standzeiten (schnellere Cuts). Sonst wie gehabt.
		const minMax = TIKTOK
			? sc.kind === 'end'
				? [2.2, 2.2]
				: sc.kind === 'proof'
					? [1.8, 1.8]
					: [1.3, 2.4]
			: sc.kind === 'end'
				? [3.4, 3.4]
				: sc.kind === 'proof'
					? [2.3, 2.3]
					: [2.4, 4.4];
		const readDur = readFrames(baseText, minMax[0], minMax[1]);
		// Die Stimme führt das Timing (min MINF); Endcard hält mind. ihre Lesezeit.
		// PACE skaliert NUR den No-VO-Zweig (Stimme wird nie abgeschnitten).
		const dur = vo
			? Math.max(sc.kind === 'end' ? readDur : MINF, vo.durFrames + PAD)
			: Math.round(readDur * PACE);
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

/**
 * TikTok-Caption der Story hinterlegen (nureine_stories.tiktok_caption/_hashtags).
 * Wird vom Admin-Tool /admin/tiktok fürs manuelle Posten gelesen; solange TikTok
 * nicht auto-postet, ist das der einzige Ort, an dem die TikTok-Variante lebt.
 * Rein additiv, ändert nur diese zwei Story-Spalten (kein Reel-Insert berührt).
 */
async function persistTikTokCaption(storyId, caption, hashtags) {
	if (!storyId || !caption) return;
	const supa = env.SUPABASE_URL.replace(/\/$/, '');
	const key = env.SUPABASE_SERVICE_KEY;
	const r = await fetch(`${supa}/rest/v1/nureine_stories?id=eq.${storyId}`, {
		method: 'PATCH',
		headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
		body: JSON.stringify({ tiktok_caption: caption, tiktok_hashtags: hashtags || [] })
	});
	if (!r.ok) console.log(`TikTok-Caption-Update fehlgeschlagen (${r.status}) — nicht kritisch`);
	else console.log('OK TikTok-Caption hinterlegt');
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

	// Figur bestimmen (Plan > Seed) und Stimme daran koppeln.
	const person = plan?.person || personForSeed(slug);
	if (!env.REEL_VOICE) VOICE = VOICES[person] || VOICES.mann;

	let scenes, duration, anyVo;
	if (plan) {
		// Regie-Modus: Szenenplan kommt fertig von der Claude-Routine.
		({ scenes, duration, anyVo } = buildScenesFromPlan(plan, voWanted, slug));
	} else {
		const script = await generateScript(story);
		console.log('skript:', JSON.stringify(script).slice(0, 240));
		({ scenes, duration, anyVo } = buildScenes(story, script, voWanted, slug));
	}

	// ── TikTok-Rezept-Felder (docs/TIKTOK_FORMAT_REZEPT.md §C) ────────────────
	// loop: Video endet auf dem eingefrorenen Cold-Open-Layout (Match-Cut auf
	// Frame 0 beim Autoloop) — braucht eine number-Szene als Opener.
	// badge: Rewatch-Saat (Wirkungsindex unerklärt ab ~Sek 2, Auflösung im
	// Stempel); plan.badge:false schaltet ab (A/B-Zelle Woche 3).
	const LOOP_TAIL = 14; // muss zu TIKTOK_LOOP_TAIL in src/ReelTikTok.tsx passen
	let loop = false;
	let badge = null;
	if (plan) {
		loop = plan.loop === true && scenes[0]?.kind === 'number';
		if (plan.loop === true && !loop) console.log('WARN plan.loop braucht eine number-Szene als Opener — Loop aus');
		if (loop) {
			scenes[0].snap = true; // der Loop-Schwanz friert das Snap-Layout ein → Opener muss snappen
			duration += LOOP_TAIL;
		}
		if (plan.badge !== false) badge = scenes.find((s) => s.kind === 'proof')?.impact ?? null;
	}

	// TikTok-SEO: das Kern-Keyword muss GESPROCHEN + als OVERLAY + in der CAPTION
	// vorkommen (Dreifach-Platzierung, Rezept §C). Hard-Fail, damit die Routine
	// es nie stillschweigend vergisst; --no-seo-check übersteuert bewusst.
	if (TIKTOK && plan) {
		const kw = (plan.seo?.keyword || '').trim().toLowerCase();
		if (!kw) {
			console.log('WARN kein seo.keyword im Plan — TikTok-Suche verschenkt (Rezept §C)');
		} else if (!arg('no-seo-check')) {
			const first = plan.scenes?.[0] || {};
			const spoken = (first.voText || '').toLowerCase();
			const overlay = [first.text, first.value, first.unit, first.context, first.kicker].filter(Boolean).join(' ').toLowerCase();
			const cap60 = (plan.tiktok?.caption || '').slice(0, 60).toLowerCase();
			const miss = [];
			if (!spoken.includes(kw)) miss.push('voText Szene 1 (gesprochen)');
			if (!overlay.includes(kw)) miss.push('Overlay Szene 1');
			if (!cap60.includes(kw)) miss.push('tiktok.caption (erste 60 Zeichen)');
			if (miss.length) throw new Error(`seo.keyword "${plan.seo.keyword}" fehlt in: ${miss.join(' + ')} — Dreifach-Platzierung ist Pflicht (übersteuern: --no-seo-check)`);
			console.log(`OK seo.keyword "${plan.seo.keyword}" dreifach platziert`);
		}
	}

	// Musik deterministisch variieren (per Slug), damit der Feed nicht monoton klingt.
	let h = 0;
	for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
	// uplift-1/2: fal.ai Stable Audio (loudnorm -20 LUFS). Die alten hope/calm-WAVs
	// waren mit -47dB praktisch stumm (das "Brummen" im ersten geposteten Reel).
	const music = plan?.music || ['audio/uplift-1.mp3', 'audio/uplift-2.mp3'][h % 2];

	const props = {
		scenes,
		category: story.category || 'gemeinschaft',
		seed: slug,
		person, // Figur (Plan > Seed) — Stimme ist bereits daran gekoppelt
		musicFile: music,
		hasVo: anyVo,
		durationInFrames: duration, // enthält bei loop bereits den LOOP_TAIL-Schwanz
		loop,
		badge
	};
	const propsPath = `/tmp/reel-props-${slug}.json`;
	writeFileSync(propsPath, JSON.stringify(props));
	// Welche Komposition rendern? --tiktok rendert standardmäßig ReelTikTok
	// (Rezept-Regie: Snap/Badge/Loop/Stempel-Sound), --comp übersteuert; ohne
	// beides bleibt es beim IG-ReelDaily — beide teilen dieselben Props.
	const compArg = arg('comp');
	const comp = compArg && compArg !== true ? compArg : TIKTOK ? 'ReelTikTok' : 'ReelDaily';
	console.log(`szenen: ${scenes.map((s) => s.kind).join(' → ')} | ${Math.round(duration / FPS)}s | VO: ${anyVo ? `ja (${TTS_ENGINE === 'eleven' ? 'ElevenLabs' : VOICE})` : 'nein'} | comp: ${comp} | pace: ${PACE}${TIKTOK ? ' (tiktok)' : ''}`);

	execFileSync('npx', ['remotion', 'render', comp, out, `--props=${propsPath}`, '--log=error'], {
		stdio: 'inherit',
		cwd: fileURLToPath(new URL('.', import.meta.url))
	});
	console.log(`OK reel → ${out} (${Math.round(statSync(out).size / 1024)} KB)`);

	if (arg('upload') || arg('queue')) {
		const videoUrl = await uploadToSupabase(out, slug);
		console.log(`OK upload → ${videoUrl}`);
		// TikTok-Master (--tiktok --upload ohne --queue): Caption trotzdem an der
		// Story hinterlegen — /admin/tiktok liest sie, und tiktok_caption IS NOT NULL
		// markiert die Story als „für TikTok verbraucht" (Dedup der täglichen Routine).
		if (TIKTOK && !arg('queue') && plan?.tiktok?.caption && plan?.story?.id) {
			await persistTikTokCaption(plan.story.id, plan.tiktok.caption, plan.tiktok.hashtags || []);
		}
		if (arg('queue')) {
			const storyId = arg('story-id') || plan?.story?.id;
			if (!storyId) throw new Error('--queue braucht --story-id');
			const tags = plan?.hashtags?.length ? plan.hashtags : (arg('hashtags') || '').split(',').map((t) => t.trim()).filter(Boolean);
			await queueReel(storyId, videoUrl, plan?.caption || arg('caption') || '', tags, plan?.story?.category || arg('category') || 'gemeinschaft', story.igHookType);
			console.log('OK reel-draft angelegt (status=draft)');
			// TikTok-Variante (eigener Hook + Keyword-SEO + Save-CTA) mitschreiben,
			// falls die Regie sie in den Plan gelegt hat → landet im /admin/tiktok-Tool.
			if (plan?.tiktok?.caption) {
				await persistTikTokCaption(storyId, plan.tiktok.caption, plan.tiktok.hashtags || []);
			}
		}
	}
}

main().catch((e) => {
	console.error('FEHLER:', e.message);
	exit(1);
});
