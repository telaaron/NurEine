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
import { execFileSync, spawnSync } from 'node:child_process';
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
// Seit 2026-07-14 gibt es NUR NOCH die TikTok-Master-Pipeline → das TikTok-Preset
// (schneller Schnitt, Loop-Tail, ReelTikTok) ist der STANDARD. `--tiktok` bleibt als
// no-op gültig (Rückwärtskompatibilität bestehender Aufrufe/Routinen); `--no-tiktok`
// ist der Notausgang zum alten ruhigen Tempo (praktisch ungenutzt).
// --pace <faktor> skaliert NUR den No-VO-Zweig (readDur), nie die Stimme.
const TIKTOK = arg('no-tiktok') ? false : true;
// PACE aus CLI (--pace) > env PACE > Preset (--tiktok → 0.7) > 1.0.
const PACE = (() => {
	const cli = arg('pace');
	if (cli && cli !== true) return parseFloat(cli) || 1.0;
	if (env.PACE) return parseFloat(env.PACE) || 1.0;
	return TIKTOK ? 0.7 : 1.0;
})();
// VO-Nachlauf/Mindestlängen: im TikTok-Modus enger, sonst wie gehabt.
const MINF = TIKTOK ? 30 : 60; // Mindest-Szenenlänge MIT VO (Frames)
const PAD = TIKTOK ? 2 : 10; // Nachlauf hinter dem letzten VO-Wort (Frames)
const VO_TAIL = TIKTOK ? 0.08 : 0.35; // Sekunden hinter dem letzten Wort im TTS-Segment
// Sprechtempo (edge-tts rate): TikTok flotter — gemessen spricht Seraphina bei +4%
// nur ~2,2 Wörter/s, damit wird ein 50-Wort-Skript >23s. REEL_RATE übersteuert.
// +16% seit 2026-07-11 (Publikums-Feedback: „muss schneller geredet werden").
const TTS_RATE = env.REEL_RATE || (TIKTOK ? '+16%' : '+4%');
// TTS-Backend:
//   'edge'   — kostenlos, Microsoft-Neural-Stimmen, braucht Internet (Default)
//   'eleven' — ElevenLabs-Premium via ELEVENLABS_API_KEY/_VOICE_ID (eine
//              Marken-Stimme, Figur-Kopplung entfällt); wortgenaue Timings
//   'local'  — lokaler TTS-Service auf dem Mac Mini (Piper/Chatterbox), offline
//              und kostenlos. Adresse via TTS_LOCAL_URL, Engine via
//              TTS_LOCAL_ENGINE. Siehe ops/tts-service/README.md
// DEFAULT seit 2026-07-30 (Aarons Entscheidung): ElevenLabs. Grund ist nicht Komfort,
// sondern Fehlerfreiheit — die kostenlose edge-tts-Stimme trifft medizinische/griechische
// Fachwörter NICHT sicher ('Trachom' -> 'Trakum'/'Track Home'/polnisch klingend), und
// kein Silbenhack im Lexikon löst das (siehe _regel_fachwoerter). REEL_TTS=edge als
// Notausgang, falls das ElevenLabs-Kontingent leer ist.
// KONTINGENT-SCHUTZ (Aaron 2026-08-20): ElevenLabs Starter hat 30.000 Zeichen/Monat,
// ein Reel kostet ~450. Das reicht fuer ~66 Reels — im Juli/August war es nach 13 Tagen
// leer, weil JEDER Testrender die Premium-Stimme zog (Analyse: 9.815 Zeichen allein fuer
// die verworfene Stimme "George", dazu 8-11 Renders an einzelnen Entwicklungstagen).
// Ohne --upload/--queue ist ein Lauf ein TEST → dort automatisch die kostenlose Stimme.
// Klang und Timing pruefen sich damit genauso; nur der finale Master zahlt.
// REEL_TTS setzt das explizit ausser Kraft (beide Richtungen).
const IST_TEST = !arg('upload') && !arg('queue');
const TTS_ENGINE = env.REEL_TTS || (IST_TEST ? 'edge' : 'eleven');
if (!env.REEL_TTS && IST_TEST) console.log('Testlauf → edge-tts (spart ElevenLabs-Kontingent; REEL_TTS=eleven erzwingt die Marken-Stimme)');

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

// ── Englisch-Detektor (kein englisches Wort mehr in den VO) ──────────────────
// Beide Engines (ElevenLabs UND edge-tts Multilingual) sprechen englische Wörter
// im voText ENGLISCH aus. Der Detektor läuft NACH prepareTts (also nach Lexikon/
// Abkürzungen/Zahlen) auf dem finalen TTS-Text: bleibt ein verdächtig englisches
// Wort übrig, das NICHT über tts-lexikon.json aufgelöst wurde, bricht der Render
// hart ab (wie der SEO-Check). Fix: das Wort im voText eindeutschen ODER eine
// deutsche Aussprache ins Lexikon eintragen. So kann nichts mehr unbemerkt durch.
const EN_BLACKLIST = new Set(['the', 'and', 'of', 'for', 'with', 'health', 'sciences', 'science', 'university', 'journal', 'news', 'network', 'daily', 'report', 'study', 'good', 'world', 'first', 'new', 'clean', 'energy', 'power', 'care', 'brain', 'heart', 'monitor', 'trust', 'foundation', 'institute', 'research', 'optimist', 'restores', 'memory', 'clears', 'model', 'evidence', 'chemical', 'neuroscience', 'global', 'nature', 'medicine', 'medical', 'today', 'future', 'people', 'life', 'water', 'green', 'happy', 'hope', 'children', 'women', 'ocean', 'forest', 'wildlife', 'climate']);
const EN_PATTERNS = [/[a-z]+ing\b/i, /[a-z]{2}ght\b/i, /^th[a-z]+/i, /[a-z]+ously\b/i, /\bwh[a-z]{2,}/i, /[a-z]ea[a-z]/i, /[a-z]oo[a-z]/i];
const DE_MARKERS = /[äöüß]|sch|ung$|keit$|heit$|lich$|chen$|ische$|ischen$|tät$|ieren$|iert$/i;
const DE_OK = new Set([
	// Deutsche Woerter, die der th-/ea-/oo-Mustererkennung sonst zum Opfer fallen.
	// Belegt 2026-08-03: 'Themen' blockierte einen Render, obwohl sauber deutsch.
	'thema', 'themen', 'theater', 'theorie', 'theoretisch', 'therapie', 'these', 'thesen',
	'ideal', 'real', 'reale', 'realen', 'reaktion', 'kreativ', 'ozean', 'europaeer',
	'team', 'teams', 'training', 'internet', 'computer', 'link', 'online', 'live', 'app', 'apps', 'video', 'story', 'update', 'meeting', 'design', 'start', 'test', 'job', 'jobs', 'fair', 'international', 'labor', 'partner', 'sport', 'international']);

function detectEnglishWords(ttsText) {
	const suspects = [];
	for (const w of ttsText.match(/[A-Za-zÄÖÜäöüß]{3,}/g) || []) {
		const lo = w.toLowerCase();
		if (DE_OK.has(lo) || DE_MARKERS.test(w)) continue;
		if (EN_BLACKLIST.has(lo)) suspects.push(w);
		else if (lo.length <= 9 && EN_PATTERNS.some((p) => p.test(lo))) suspects.push(w);
	}
	return [...new Set(suspects)];
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
	// Englisch-Wächter: kein englisches Wort darf die Stimme erreichen (beide Engines
	// sprechen es englisch aus). Bricht hart ab; Fix = Wort eindeutschen ODER deutsche
	// Aussprache ins tts-lexikon.json. --no-en-check übersteuert bewusst.
	const enSuspects = detectEnglishWords(ttsText);
	if (enSuspects.length && !arg('no-en-check')) {
		throw new Error(`VO-Segment "${name}": vermutlich ENGLISCHE Wörter im voText → würden englisch ausgesprochen: ${enSuspects.join(', ')}. Fix: im voText eindeutschen (z.B. Quelle „Good News Network" → „einer Good-News-Redaktion") ODER deutsche Aussprache in remotion/tts-lexikon.json eintragen. (Übersteuern: --no-en-check)`);
	}
	try {
		execFileSync(py, [fileURLToPath(new URL('./scripts/tts.py', import.meta.url)), '--text', ttsText, '--voice', VOICE, '--rate', TTS_RATE, '--engine', TTS_ENGINE, '--out', `${dir}${slug}-${name}.mp3`, '--words', wordsPath], { stdio: 'inherit', timeout: 120000 });
		let words = JSON.parse(readFileSync(wordsPath, 'utf8'));
		if (!words.length) throw new Error('keine Wort-Timestamps');
		words = mergeNumberWords(words, subs); // Captions zeigen wieder „97.000", nicht das Zahlwort
		// Caption-Tokens glätten: Pausen-Marker im voText (Gedankenstrich, Komma für
		// Sprech-Pacing) dürfen nicht als „weniger,," / „—" in den Untertiteln landen.
		const cleanTok = (t) => t.replace(/[—–]/g, '').replace(/([,.!?;:])\1+/g, '$1').replace(/\s+([,.!?;:])/g, '$1').replace(/^[,;:—–\s]+/, '').replace(/\s{2,}/g, ' ').trim();
		// brk = dieses Wort schließt einen Satzteil ab (endet auf . , — ; : ! ?). Wird
		// VOR dem Säubern bestimmt, damit die Caption-Segmentierung (ReelTikTok) an
		// Satzgrenzen brechen kann statt starr alle N Wörter (Panel-Fix 2026-07-17).
		// brk kann schon aus tts.py kommen (Interpunktion aus dem Original-Text) — ODER
		// aus dem rohen Token, falls es die Zeichen doch trägt. Beide Quellen verodern,
		// DANN säubern (Panel-Fix 2026-07-17).
		// sbrk = echtes Satz-Ende (. ! ?), brk = jeder Satzteil. Beide aus tts.py ODER Token.
		words = words.map((w) => ({ ...w, brk: !!w.brk || /[.,;:!?–—]\s*$/.test(w.t), sbrk: !!w.sbrk || /[.!?]\s*$/.test(w.t), t: cleanTok(w.t) })).filter((w) => w.t.length);
		// AUSSPRACHE-GATE (Vorfall 2026-07-26): Der Englisch-Wächter prüft die SCHREIBWEISE,
		// er kann nicht sehen, was die Stimme daraus MACHT. Belegt durchgerutscht:
		// „Trachom."→„Trakum.", „Prüfer suchten jahrelang."→„Proofers sucht den Geraldine."
		// Beide sehen deutsch aus (ch/ü) und werden von DE_MARKERS sogar entlastet. Nur die
		// Gegenprobe am fertigen Audio findet das. Hard-Fail; --no-vo-verify übersteuert.
		if (!arg('no-vo-verify')) {
			const vres = spawnSync(py, [fileURLToPath(new URL('./scripts/verify_vo.py', import.meta.url)), '--audio', `${dir}${slug}-${name}.mp3`, '--text', ttsText, '--json'], { encoding: 'utf8', timeout: 300000 });
			if (vres.status === 3) {
				let d = {};
				try {
					d = JSON.parse(vres.stdout || '{}');
				} catch {}
				throw new Error(
					`VO-Segment "${name}": die Stimme spricht NICHT, was geplant ist —\n` +
						`  geplant: "${d.planned ?? ttsText}"\n  gehört:  "${d.heard ?? '?'}"\n` +
						(d.missing?.length ? `  nicht gesprochen: ${d.missing.join(', ')}\n` : '') +
						(d.extra?.length ? `  erfunden/verhört: ${d.extra.join(', ')}\n` : '') +
						`  Fix: Satz umformulieren (bloßes Substantiv am Satzanfang kippt die Stimme —\n` +
						`  „Die Prüfer suchten…" statt „Prüfer suchten…") ODER Aussprache in\n` +
						`  remotion/tts-lexikon.json eintragen. (Übersteuern: --no-vo-verify)`
				);
			}
			if (vres.status === 2) {
				// Aaron 2026-07-30: "kein einziger Sprachfehler". Ein technisch ausgefallenes
				// Gate darf deshalb NICHT stillschweigend durchwinken — sonst geht genau der
				// ungeprüfte Ton raus, gegen den es gebaut wurde (belegt: kaputter
				// ~/.cache/whisper-Symlink liess 7 Segmente ungeprüft passieren).
				// --allow-unverified-vo erlaubt es bewusst, z.B. wenn Whisper fehlt.
				const why = (vres.stderr || '').trim().split('\n').pop() || 'unbekannt';
				if (!arg('allow-unverified-vo')) {
					throw new Error(
						`Aussprache-Gate nicht lauffähig (${name}): ${why}\n` +
							`  Der Ton wäre UNGEPRÜFT ins Video gegangen. Fix: Whisper reparieren\n` +
							`  (TTS_PYTHON zeigt auf die venv mit openai-whisper, ~/.cache/whisper muss\n` +
							`  beschreibbar sein). Bewusst ohne Prüfung rendern: --allow-unverified-vo`
					);
				}
				console.log(`WARN Aussprache-Gate übersprungen (${name}): ${why} — bewusst erlaubt`);
			}
			else if (vres.status === 0) console.log(`OK aussprache (${name})`);
		}
		return {
			file,
			words: words.map((w) => ({ t: w.t, brk: !!w.brk, sbrk: !!w.sbrk, start: Math.round(w.start * FPS), end: Math.round(w.end * FPS) })),
			durFrames: Math.round((words[words.length - 1].end + VO_TAIL) * FPS)
		};
	} catch (e) {
		// Aussprache-/Englisch-Gate sind BEFUNDE, keine technischen Pannen: sie dürfen
		// nicht als "Szene ohne Stimme" verschluckt werden. Belegt 2026-08-03: bei der
		// Ganz-Aufnahme ("take") liess ein Gate-Treffer die Funktion still null liefern
		// -> Rückfall auf Einzel-Calls -> die Stimme variierte hörbar zwischen den Szenen,
		// obwohl der eigentliche Fehler ein einziges Wort war ("Merseyside").
		const istBefund = /spricht NICHT, was geplant ist|ENGLISCHE Wörter/.test(e.message);
		if (istBefund) throw e;
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
/**
 * EINE Aufnahme für das ganze Reel, danach an den Satzgrenzen geschnitten.
 *
 * Warum (Aaron 2026-07-31): Segmentweise Synthese setzt die Stimme bei JEDEM Segment
 * neu an — Tonhöhe, Tempo und Klangfarbe schwanken dadurch hörbar von Szene zu Szene.
 * Ein einziger Call hält die Prosodie über das ganze Stück konstant; wir schneiden das
 * fertige Audio anhand der Wort-Timings, statt sechsmal neu zu sprechen.
 *
 * Rückgabe: dieselbe Struktur wie synthSegment, pro Szene ein Eintrag — oder null,
 * wenn die Aufnahme nicht zu den geplanten Sätzen passt (dann greift der Segment-Weg).
 */
function synthWholeTake(plan, slug) {
	const texts = plan.scenes.map((s) => s.voText).filter(Boolean);
	if (texts.length < 2) return null;
	// Sätze mit klarer Zäsur aneinanderhängen: die Stimme bekommt EIN Skript.
	const joined = texts.join(' ');
	const take = synthSegment(joined, slug, 'take');
	if (!take || !take.words.length) return null;

	// Zuordnung Wort -> Szene NICHT über Wortanzahl (die driftet: mergeNumberWords zieht
	// „dreiundvierzig" wieder zu „43" zusammen, danach passen alle Grenzen nicht mehr —
	// belegt 2026-07-31: Szenen zogen Wörter der nächsten Szene mit). Stattdessen über
	// den tatsächlichen WORTLAUT: pro Szene deren Wörter der Reihe nach in der Aufnahme
	// wiederfinden. Vergleich normalisiert (klein, ohne Interpunktion), damit „43" und
	// „dreiundvierzig" denselben Schlüssel bekommen.
	const dir = fileURLToPath(new URL('./public/vo/', import.meta.url));
	const norm = (s) => String(s).toLowerCase().replace(/[^0-9a-zäöüß]/g, '');
	const spoken = take.words.map((w) => norm(w.t));
	const counts = [];
	let cursor = 0;
	for (const t of texts) {
		// Szenen-Wörter so, wie sie in der Aufnahme ankommen (Ziffern bleiben Ziffern,
		// weil mergeNumberWords sie zurückverwandelt hat).
		const want = t.trim().split(/\s+/).map(norm).filter(Boolean);
		let taken = 0;
		for (const w of want) {
			// Nächstes Vorkommen ab dem Cursor suchen (kleine Toleranz für verschliffene
			// Füllwörter, die die Stimme weglässt).
			let hit = -1;
			for (let k = cursor + taken; k < Math.min(spoken.length, cursor + taken + 4); k++) {
				if (spoken[k] === w || spoken[k].startsWith(w) || w.startsWith(spoken[k])) { hit = k; break; }
			}
			if (hit >= 0) taken = hit - cursor + 1;
		}
		if (taken <= 0) {
			console.log('WARN Ganz-Aufnahme: Szenen-Zuordnung fehlgeschlagen — nutze Segmente');
			return null;
		}
		counts.push(taken);
		cursor += taken;
	}
	// Rest-Wörter (Stimme hat am Ende ergänzt) der letzten Szene zuschlagen.
	if (cursor < spoken.length) counts[counts.length - 1] += spoken.length - cursor;

	// KEIN SCHNITT MEHR (Aaron 2026-08-22): Frueher wurde die Aufnahme in Einzeldateien
	// zerschnitten. Jeder Schnitt nahm 120 ms Vorlauf mit — und darin steckte der Atemzug
	// vor dem Satz. Beim naechsten Segment kam derselbe Atmer nochmal, weil er dort am
	// Ende lag. Gemessen an kinderlungen-neu: Stille am Anfang UND Ende fast jedes Segments.
	//
	// Jetzt spielt jede Szene DIESELBE Originaldatei ab, nur mit eigenem Startpunkt
	// (startFrom). Kein ffmpeg, kein Neu-Kodieren, kein Atmer-Dopplung — die Tonspur ist
	// exakt das, was ElevenLabs geliefert hat. Das Tempo (REEL_TEMPO) bleibt erhalten,
	// weil es VOR diesem Schritt auf die ganze Aufnahme angewandt wird.
	const out = [];
	let idx = 0;
	let ci = 0;
	let vorherEnde = 0; // Frame, an dem die vorige Szene endete — die naechste beginnt exakt hier
	for (let i = 0; i < plan.scenes.length; i++) {
		if (!plan.scenes[i].voText) { out.push(null); continue; }
		const n = counts[ci++];
		const slice = take.words.slice(idx, idx + n);
		idx += n;
		if (!slice.length) { out.push(null); continue; }
		// LUECKENLOS ANEINANDER (Aaron 2026-08-22, zweiter Anlauf): Jede Szene beginnt
		// GENAU dort, wo die vorige endet — kein Vorlauf, kein Nachlauf, keine Ueberlappung.
		//
		// Warum das noetig war: Ein LEAD-Vorlauf zieht den Startpunkt zurueck und
		// ueberlappt damit das vorige Fenster. Gemessen am Vorgaenger-Render: -100 ms,
		// -133 ms, -67 ms Ueberlappung an den Szenengrenzen. Das ueberlappende Stueck ist
		// die Atempause — sie wird am Ende der einen Szene UND am Anfang der naechsten
		// gespielt. Genau das hoert man als doppelten Atemzug.
		//
		// Die Grenze liegt in der Mitte zwischen letztem Wort der Szene und erstem Wort
		// der naechsten: die Atempause wird damit sauber geteilt statt gedoppelt.
		const letzterFrame = slice[slice.length - 1].end;
		const naechstes = take.words[idx];
		const from = vorherEnde;
		const bis = naechstes
			? Math.round((letzterFrame + naechstes.start) / 2)
			: letzterFrame + Math.round(VO_TAIL * FPS);
		vorherEnde = bis; // naechste Szene setzt exakt hier an
		out.push({
			file: take.file,          // IMMER dieselbe Datei — die ungeschnittene Aufnahme
			startFrom: from,          // Remotion spielt sie ab diesem Frame
			words: slice.map((w) => ({ ...w, start: w.start - from, end: w.end - from })),
			durFrames: Math.max(1, bis - from)
		});
	}
	console.log(`OK ganz-aufnahme: 1 Call, ${out.filter(Boolean).length} Szenen — Originalton ungeschnitten`);
	return out;
}

function buildScenesFromPlan(plan, voWanted, slug) {
	const scenes = [];
	let t = 0;
	let anyVo = false;
	// EINE Aufnahme bevorzugen (gleichmäßige Stimme); nur wenn das scheitert, Segmente.
	const whole = voWanted && !arg('no-whole-take') ? synthWholeTake(plan, slug) : null;
	plan.scenes.forEach((raw, i) => {
		const { voText, ...sc } = raw;
		let vo = null;
		if (whole) {
			vo = whole[i] || null;
			if (vo) anyVo = true;
		} else if (voWanted && voText) {
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
		// GANZ-AUFNAHME (vo.startFrom gesetzt): Die Szene MUSS exakt ihr Audiofenster
		// sein. Jeder zusaetzliche Frame — durch PAD oder MINF — laesst die Aufnahme
		// weiterlaufen und schiebt den Atemzug des naechsten Satzes ans Szenenende;
		// beim naechsten Schnitt kommt derselbe Atmer nochmal (Aaron 2026-08-22:
		// "zwischen jeder Szene ein Atmen doppelt"). Nur die Endcard darf laenger
		// stehen, weil dort nach dem letzten Wort nichts mehr folgt.
		const dur = vo
			? vo.startFrom != null
				? sc.kind === 'end'
					? Math.max(readDur, vo.durFrames)
					: vo.durFrames
				: Math.max(sc.kind === 'end' ? readDur : MINF, vo.durFrames + PAD)
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
async function persistTikTokMeta(storyId, { caption, hashtags, videoUrl, soundKeywords }) {
	if (!storyId) return;
	const supa = env.SUPABASE_URL.replace(/\/$/, '');
	const key = env.SUPABASE_SERVICE_KEY;
	const patch = {};
	if (caption) patch.tiktok_caption = caption;
	// Sound-Suchbegriffe fuer die TikTok-CML reisen als "sound:"-Eintraege in derselben
	// Spalte mit — bewusst KEIN neues DB-Feld (Schema-Aenderungen nur nach Ruecksprache,
	// CLAUDE.md). /admin/tiktok trennt sie wieder heraus und zeigt sie separat an.
	if (caption)
		patch.tiktok_hashtags = [
			...(hashtags || []),
			...(soundKeywords || []).map((k) => `sound:${k}`)
		];
	if (videoUrl) patch.tiktok_video_url = videoUrl; // Master-MP4 → /admin/tiktok zeigt genau dieses Video
	if (!Object.keys(patch).length) return;
	const r = await fetch(`${supa}/rest/v1/nureine_stories?id=eq.${storyId}`, {
		method: 'PATCH',
		headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
		body: JSON.stringify(patch)
	});
	if (!r.ok) console.log(`TikTok-Meta-Update fehlgeschlagen (${r.status}) — nicht kritisch`);
	else console.log(`OK TikTok-Meta hinterlegt (${Object.keys(patch).join(', ')})`);
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
			// seo.spokenOptional:true = das Keyword ist ein Fachwort, das die Stimme nicht
			// sicher trifft (Vorfall 2026-07-30: „Trachom" wurde je nach Schreibweise
			// „Trakum"/„Track Home"/polnisch). Dann steht es NUR im Screen + Caption, und
			// der voText umschreibt es („eine Augenkrankheit"). Zwei Kanäle der Dreifach-
			// Platzierung bleiben erhalten — besser als ein falsch gesprochenes Keyword.
			const spokenOptional = plan.seo?.spokenOptional === true;
			const miss = [];
			if (!spoken.includes(kw) && !spokenOptional) miss.push('voText Szene 1 (gesprochen)');
			if (!overlay.includes(kw)) miss.push('Overlay Szene 1');
			if (!cap60.includes(kw)) miss.push('tiktok.caption (erste 60 Zeichen)');
			if (miss.length) throw new Error(`seo.keyword "${plan.seo.keyword}" fehlt in: ${miss.join(' + ')} — Dreifach-Platzierung ist Pflicht (übersteuern: --no-seo-check)`);
			console.log(`OK seo.keyword "${plan.seo.keyword}" ${spokenOptional ? 'im Screen+Caption (gesprochen bewusst umschrieben)' : 'dreifach platziert'}`);
		}
	}

	// KOHÄRENZ-CHECK (Panel-Befund 2026-07-17): Auge und Ohr dürfen sich NIE
	// widersprechen — sonst stolpert das Gehirn und der Daumen wischt („kognitive
	// Dissonanz"). Zwei belegte Fälle, die live gingen und beide fatal waren:
	//   (a) Screen „Erwartet: 6.452" ↔ VO „sechstausend"  → gerundet = Trust-Killer
	//       bei der Daten-Persona, obwohl unser USP „belegt" heißt.
	//   (b) Screen „auch Räder"      ↔ VO „auch Menschen"  → anderes Wort, andere
	//       Bedeutung, zeitgleich = Dissonanz.
	// Hard-Fail statt WARN: genau solche Fehler sind im Plan unsichtbar und fallen
	// erst im fertigen Video auf. --no-coherence-check übersteuert bewusst.
	if (plan && !arg('no-coherence-check')) {
		const problems = [];
		// Zahlen mit Tausenderpunkt/Komma aus dem Screen-Text ziehen (4.400, 6.452, 2.065, 47 %)
		const numsIn = (s) => (String(s || '').match(/\d[\d.,]*/g) || []).map((x) => x.replace(/[.,]$/, ''));
		for (const [i, sc] of (plan.scenes || []).entries()) {
			const screen = [sc.text, sc.value, sc.unit, sc.context, sc.share].filter(Boolean).join(' ');
			const vo = sc.voText || '';
			if (!vo) continue;
			for (const n of numsIn(screen)) {
				const plain = n.replace(/\./g, '');
				if (plain.length < 3) continue; // 0, 18, 47 … werden ohnehin ausgeschrieben
				// Die Ziffer darf im voText stehen (wird automatisch ausgeschrieben) …
				if (vo.includes(n) || vo.includes(plain)) continue;
				// … sonst muss das deutsche Zahlwort exakt drinstehen.
				// Zahlwort im voText suchen — Sprech-Trennzeichen (Leerzeichen/Bindestrich,
				// die die Stimme sauberer trennen lassen) vor dem Vergleich entfernen, damit
				// „zweitausend fünfundsechzig" weiterhin als 2065 zählt.
				const word = intToGerman(parseInt(plain, 10));
				const voSquished = vo.toLowerCase().replace(/[\s-]/g, '');
				if (word && voSquished.includes(word.toLowerCase())) continue;
				problems.push(`Szene ${i} (${sc.kind}): Bild zeigt "${n}", voText spricht sie nicht exakt → "${vo.slice(0, 70)}"`);
			}
		}
		if (problems.length) {
			throw new Error(
				`Kohärenz-Check: Auge und Ohr widersprechen sich —\n  ${problems.join('\n  ')}\n` +
					`  Zahlen im Bild MÜSSEN im voText exakt gesprochen werden (nie runden — der USP ist "belegt").\n` +
					`  (übersteuern: --no-coherence-check)`
			);
		}
		console.log('OK Kohärenz-Check: Bild-Zahlen = gesprochene Zahlen');
	}

	// MUSIKBETT: seit 2026-08-01 standardmäßig AUS (Aaron). Der Sound kommt beim Posten
	// aus TikToks Commercial Music Library — ein zweites Bett im Master würde sich damit
	// überlagern. Nur noch an, wenn der Plan es ausdrücklich verlangt (plan.music) oder
	// --music <datei> gesetzt ist. Die deterministische Auswahl bleibt für diesen Fall.
	let h = 0;
	for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
	const musicArg = arg('music');
	// uplift-1/2: fal.ai Stable Audio (loudnorm -20 LUFS). Die alten hope/calm-WAVs
	// waren mit -47dB praktisch stumm (das "Brummen" im ersten geposteten Reel).
	// plan.music wird BEWUSST IGNORIERT (Aaron 2026-08-03): die Regie-Routine kopiert
	// das Feld aus alten Vorlagen und rendert dann doch mit Musikbett. Musik gibt es nur
	// noch, wenn sie AUSDRÜCKLICH per --music angefordert wird.
	if (plan?.music) console.log('WARN plan.music ignoriert — Musik kommt beim Posten aus der TikTok-CML (--music erzwingt sie)');
	const music = musicArg === true ? ['audio/uplift-1.mp3', 'audio/uplift-2.mp3'][h % 2] : musicArg || null;
	if (!music) console.log('OK ohne Musikbett (Sound kommt beim Posten aus der TikTok-CML)');

	const props = {
		scenes,
		category: story.category || 'gemeinschaft',
		seed: slug,
		person, // Figur (Plan > Seed) — Stimme ist bereits daran gekoppelt
		musicFile: music,
		hasVo: anyVo,
		durationInFrames: duration, // enthält bei loop bereits den LOOP_TAIL-Schwanz
		loop,
		badge,
		softCta: plan?.softCta || null // stiller Text-CTA ~Sek 8-15 (Strategie §5)
	};
	const propsPath = `/tmp/reel-props-${slug}.json`;
	writeFileSync(propsPath, JSON.stringify(props));
	// Nur noch EINE Komposition: ReelTikTok (der Master ist TikTok UND IG-Reel).
	// --comp übersteuert (Debug); der ReelDaily-Build wurde 2026-07-14 verworfen.
	const compArg = arg('comp');
	const comp = compArg && compArg !== true ? compArg : 'ReelTikTok';
	console.log(`szenen: ${scenes.map((s) => s.kind).join(' → ')} | ${Math.round(duration / FPS)}s | VO: ${anyVo ? `ja (${TTS_ENGINE === 'eleven' ? 'ElevenLabs' : TTS_ENGINE === 'local' ? `lokal/${env.TTS_LOCAL_ENGINE || 'piper'}` : VOICE})` : 'nein'} | comp: ${comp} | pace: ${PACE}${TIKTOK ? ' (tiktok)' : ''}`);

	execFileSync('npx', ['remotion', 'render', comp, out, `--props=${propsPath}`, '--log=error'], {
		stdio: 'inherit',
		cwd: fileURLToPath(new URL('.', import.meta.url))
	});
	console.log(`OK reel → ${out} (${Math.round(statSync(out).size / 1024)} KB)`);

	if (arg('upload') || arg('queue')) {
		const videoUrl = await uploadToSupabase(out, slug);
		console.log(`OK upload → ${videoUrl}`);
		const storyId = arg('story-id') || plan?.story?.id;
		// TikTok-Master (--tiktok): Caption UND Master-MP4-URL an der Story hinterlegen
		// → /admin/tiktok zeigt genau dieses Video; tiktok_caption IS NOT NULL markiert
		// die Story zugleich als „für TikTok verbraucht" (Dedup der täglichen Routine).
		if (TIKTOK && storyId) {
			await persistTikTokMeta(storyId, {
				caption: plan?.tiktok?.caption,
				hashtags: plan?.tiktok?.hashtags || [],
				soundKeywords: plan?.tiktok?.soundKeywords || [],
				videoUrl
			});
		}
		if (arg('queue')) {
			if (!storyId) throw new Error('--queue braucht --story-id');
			const tags = plan?.hashtags?.length ? plan.hashtags : (arg('hashtags') || '').split(',').map((t) => t.trim()).filter(Boolean);
			// ZWEI FASSUNGEN (Aaron 2026-08-03): Auf TikTok legt Aaron beim Posten einen
			// Sound aus der Commercial Music Library darüber — der Master bleibt deshalb
			// musikfrei. Instagram wird dagegen AUTOMATISCH gepostet, dort kann niemand
			// nachträglich Musik wählen; ein stummer Hintergrund wirkt dort wie ein Fehler.
			// Also: dieselben Szenen ein zweites Mal rendern, diesmal mit unserem eigenen
			// Musikbett, und NUR diese Fassung an die IG-Queue geben.
			let igUrl = videoUrl;
			if (!music && !arg('no-ig-music')) {
				const igOut = out.replace(/\.mp4$/, '-ig.mp4');
				const igMusic = ['audio/uplift-1.mp3', 'audio/uplift-2.mp3'][h % 2];
				console.log(`IG-Fassung rendern (mit Musikbett ${igMusic}) …`);
				const igPropsPath = `/tmp/reel-props-${slug}-ig.json`;
				writeFileSync(igPropsPath, JSON.stringify({ ...props, musicFile: igMusic }));
				execFileSync('npx', ['remotion', 'render', comp, igOut, `--props=${igPropsPath}`, '--log=error'], {
					stdio: 'inherit',
					cwd: fileURLToPath(new URL('.', import.meta.url))
				});
				igUrl = await uploadToSupabase(igOut, `${slug}-ig`);
				console.log(`OK IG-Fassung → ${igUrl}`);
			}
			await queueReel(storyId, igUrl, plan?.caption || arg('caption') || '', tags, plan?.story?.category || arg('category') || 'gemeinschaft', story.igHookType);
			console.log(`OK reel-draft angelegt (status=draft)${igUrl !== videoUrl ? ' — MIT Musik (IG)' : ''}`);
			// Falls NICHT --tiktok (reiner IG-Lauf), die TikTok-Caption trotzdem mitschreiben.
			if (!TIKTOK && plan?.tiktok?.caption) {
				await persistTikTokMeta(storyId, { caption: plan.tiktok.caption, hashtags: plan.tiktok.hashtags || [] });
			}
		}
	}
}

main().catch((e) => {
	console.error('FEHLER:', e.stack || e.message);
	exit(1);
});
