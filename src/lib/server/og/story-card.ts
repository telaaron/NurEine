/**
 * 9:16 social story-card (1080×1920) for WhatsApp status / IG story.
 *
 * MEHRERE TEMPLATES, damit der Feed nie gleich aussieht. Alle teilen dieselbe
 * Design-DNA (Space Grotesk display, scharfe Labels, persönlicher CTA, Akzent
 * pro Kategorie) — aber ein anderes Skelett:
 *
 *   stat       — Bild oben → Fade → riesige Zahl + Headline + Untertitel + CTA
 *   poster     — randloses Vollbild, nur Headline + CTA unten (Bild ist der Star)
 *   statement  — gedämpftes Bild, RIESIGE Headline als Plakat-Aussage
 *   split      — obere Hälfte Bild, untere Hälfte einfarbig Akzent (Magazin-Look)
 *   ticker     — Bild oben, darunter strukturierte Daten-Karte (Score-Balken, Meta)
 *
 * Auswahl = Hybrid: erst Inhalt (Zahl da? kurze Headline? gutes Bild?), bei
 * mehreren Kandidaten deterministisch rotiert per id-hash → gleiche Story kriegt
 * immer dasselbe Template (stabil + cachebar), aber der Feed variiert. Satori.
 */

const CATEGORY_ACCENT: Record<string, string> = {
	klima: '#7fae6f',
	gesundheit: '#e08a8a',
	wissenschaft: '#7da6cf',
	gemeinschaft: '#e8a05a',
	tiere: '#7fae6f',
	kultur: '#e8a05a',
	innovation: '#7da6cf'
};
// Dunkle, gesättigte Kategorie-Töne für farbcodierte Flächen (statement-BG,
// split-Panel). Bewusste Design-Entscheidung statt uninspiriertem Braun.
const CATEGORY_DARK: Record<string, string> = {
	klima: '#14241a',
	gesundheit: '#2a1518',
	wissenschaft: '#101c2a',
	gemeinschaft: '#291708',
	tiere: '#14241a',
	kultur: '#291708',
	innovation: '#101c2a'
};
// Mittel-dunkle Variante für split-Panel (heller als BG, Text bleibt weiß).
const CATEGORY_PANEL: Record<string, string> = {
	klima: '#24402e',
	gesundheit: '#45252a',
	wissenschaft: '#1c3148',
	gemeinschaft: '#46280f',
	tiere: '#24402e',
	kultur: '#46280f',
	innovation: '#1c3148'
};
const CATEGORY_LABELS: Record<string, string> = {
	klima: 'Klima',
	gesundheit: 'Gesundheit',
	wissenschaft: 'Wissenschaft',
	gemeinschaft: 'Gemeinschaft',
	tiere: 'Tiere',
	kultur: 'Kultur',
	innovation: 'Innovation'
};

const W = 1080;
const H = 1920;
const BG = '#0c0a08'; // dunkle Fläche, in die das Bild ausläuft
const AMBER = '#bd6a35';
const HOOK = '#f5b969'; // helles Amber für die Hook-Zahl

// IG-Story-SAFE-ZONES (1080×1920) — RECHERCHIERTE Maße (2026, mehrere Quellen:
// overvisual / growthscribe / admakeai). Instagram legt eigene UI über die Story:
//   oben  250px (14%): Fortschrittsbalken + Profilzeile (Avatar + Name + "…" + X)
//   unten 340px (organisch): "Antwort an …"-Feld + Herz/Teilen + Sticker-Zone
//   Seiten 75px (6%)
//   → nutzbare Safe Area 1080 × 1330, vertikal zentriert.
// Aaron 2026-07-11: An echten iPhone-Screenshots NACHGEMESSEN (924×2001 → 1920).
// Die IG-Profilzeile endet real bei ~250px, die Antwortzeile beginnt ~277px von
// unten. Mein 50px-Puffer oben war ZU GROSS → Badge hing mit ~107px Lücke zu tief.
// Jetzt sitzt der Chip DIREKT an der UI-Kante (knapp darunter, keine Riesenlücke,
// nichts verdeckt), CTA näher an die Antwortzeile.
// Aaron 2026-07-11 Feinschliff: Badge 50px höher (näher an die Profilzeile),
// CTA ganz nach unten mit demselben Abstand wie seitlich (75px) → gleichmäßiger
// Rahmen ringsum, kein Leerraum unten.
const SAFE_TOP = 150; // Chip oben (Aaron 2026-07-11: von 100 → 150, 50px tiefer)
const SAFE_BOTTOM = 75; // CTA-Unterkante = seitlicher Rand (gleichmäßiger Rahmen)
const SAFE_SIDE = 75; // seitlicher Rand
const CONTENT_W = W - SAFE_SIDE * 2; // 930 — Inhaltsbreite (Satori braucht feste px)

// Bild-Band kleiner (war 940–1140): je kleiner die Cover-Box, desto weniger muss
// ein Querformat-Bild beschnitten/„gezoomt" werden. Der längere Fade darunter
// (FADE_H) läuft früh in reines Schwarz aus → unterer Bereich der Story ist
// ohnehin Schwarz, das Bild braucht dort keine Fläche mehr (Aaron 2026-07-10).
const IMG_MIN_H = 880;
const IMG_MAX_H = 1040;
const FADE_H = 380; // langer Schwarz-Verlauf → Bild weniger gezoomt, sauberer Übergang

export type TemplateName = 'stat' | 'poster' | 'statement' | 'split' | 'ticker';
const TEMPLATES: TemplateName[] = ['stat', 'poster', 'statement', 'split', 'ticker'];

export interface StoryCardInput {
	title: string;
	dek: string;
	category: string;
	country?: string;
	impactScore?: number | null;
	emotion?: string | null;
	imageBase64: string | null;
	imageAspect?: number | null; // height/width des (downscaled) Bildes
	logoDataUri?: string | null;
	id?: string; // für deterministische Template-Rotation
	template?: TemplateName; // expliziter Override (Test via ?tpl=)
}

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Kleiner stabiler Hash über einen String → für deterministische Rotation.
function hashStr(s: string): number {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return Math.abs(h);
}

// Zieht die erste markante Zahl aus dem Text (z.B. "69%", "1,4 Mio. km²", "3×").
function extractStat(text: string): string | null {
	const m = text.match(
		/(\d[\d.,]*\s?(?:%|×|x|Mio\.?|Mrd\.?|Tsd\.?)(?:\s?(?:km²|km2|Euro|€|Tonnen|Hektar|ha))?)/
	);
	return m ? m[1].trim() : null;
}

interface Hook {
	value: string; // große Zahl
	unit: string; // kleine Einheit dahinter (z.B. "/100"), inline
	label: string; // Label dahinter (z.B. "WIRKUNG")
	fromText: boolean; // true = echte Zahl aus dem Text (starker Hook)
}

function pickHook(dek: string, title: string, impactScore?: number | null): Hook | null {
	const stat = extractStat(dek) || extractStat(title);
	if (stat) return { value: stat, unit: '', label: '', fromText: true };
	if (impactScore != null)
		return { value: String(impactScore), unit: '/100', label: 'WIRKUNG', fromText: false };
	return null;
}

// ─── Hybrid-Auswahl ──────────────────────────────────────────────────────────
// Regel zuerst, dann Rotation unter den passenden Kandidaten. Deterministisch.
function pickTemplate(input: StoryCardInput): TemplateName {
	if (input.template) return input.template;

	const title = input.title || '';
	const hasStat = !!(extractStat(input.dek || '') || extractStat(title));
	const shortTitle = title.length <= 38;
	const hasImage = !!input.imageBase64;
	const wide = (input.imageAspect ?? 1) <= 0.95; // breiter als hoch → Poster-tauglich

	// Kandidaten je nach Inhalt sammeln (kein Kandidat doppelt).
	const cands: TemplateName[] = [];
	if (hasStat) cands.push('stat', 'ticker');
	if (shortTitle) cands.push('statement');
	if (hasImage) cands.push('poster', 'split');
	if (hasImage && wide) cands.push('poster'); // breites Bild → Poster wahrscheinlicher
	if (cands.length === 0) cands.push('stat'); // Sicherheitsnetz

	const uniq = [...new Set(cands)];
	const seed = hashStr(input.id || title);
	return uniq[seed % uniq.length];
}

// ─── Shared Bausteine ────────────────────────────────────────────────────────

// Nur noch der Kategorie-Chip (links). Kein NurEine-Badge mehr (Aaron 2026-07-10):
// das Logo steht ohnehin im CTA, das Badge oben rechts kollidierte mit IG's "…"/X
// und war redundant. `logoDataUri`/`onDark` bleiben in der Signatur, um die
// Aufrufer nicht anzufassen, werden aber nicht mehr gebraucht.
function topLabels(accent: string, catLabel: string, _logoDataUri?: string | null, _onDark = false): string {
	return `<div style="position:absolute;display:flex;align-items:center;top:${SAFE_TOP}px;left:${SAFE_SIDE}px;">
      <div style="display:flex;align-items:center;background:#fff;border-radius:100px;padding:14px 32px;">
        <div style="display:flex;width:14px;height:14px;border-radius:14px;background:${accent};margin-right:14px;"></div>
        <div style="display:flex;font-family:'Inter';font-size:28px;font-weight:700;letter-spacing:0.12em;color:#111;">${esc(catLabel)}</div>
      </div>
    </div>`;
}

// Persönlicher Newsletter-CTA. `bg` erlaubt Variante (amber auf dunkel, dunkel auf Farbe).
function ctaBlock(bg = AMBER, subColor = 'rgba(255,255,255,0.96)'): string {
	return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:${CONTENT_W}px;background:${bg};border-radius:34px;padding:50px 32px;margin-top:42px;">
        <div style="display:flex;font-family:'Space Grotesk';font-size:46px;font-weight:700;color:#fff;letter-spacing:-0.02em;text-align:center;white-space:nowrap;">Deine gute Nachricht für heute →</div>
        <div style="display:flex;font-family:'Inter';font-size:38px;font-weight:600;color:${subColor};margin-top:14px;">Kostenlos abonnieren · Link im Profil</div>
      </div>`;
}

function headlineSize(title: string): number {
	const n = title.length;
	if (n <= 28) return 104;
	if (n <= 45) return 90;
	if (n <= 70) return 76;
	if (n <= 95) return 62;
	return 52;
}

// Riesige Zahl als Hook. Label (z.B. "WIRKUNG") steht ÜBER der Zahl → klare
// Hierarchie (nicht daneben wie ein Disclaimer). Einheit ("/100") inline.
function hookInline(hook: Hook | null, accent: string): string {
	if (!hook) return '';
	const len = hook.value.length;
	const size = len <= 4 ? 230 : len <= 7 ? 184 : len <= 11 ? 134 : 108;
	return `<div style="display:flex;flex-direction:column;margin-bottom:20px;">
        ${hook.label ? `<div style="display:flex;font-family:'Inter';font-size:34px;font-weight:800;letter-spacing:0.16em;color:${accent};margin-bottom:10px;">${esc(hook.label)}</div>` : ''}
        <div style="display:flex;align-items:flex-end;">
          <div style="display:flex;font-family:'Space Grotesk';font-size:${size}px;font-weight:700;color:${HOOK};line-height:0.78;letter-spacing:-0.05em;">${esc(hook.value)}</div>
          ${hook.unit ? `<div style="display:flex;font-family:'Space Grotesk';font-size:${Math.round(size * 0.42)}px;font-weight:700;color:rgba(245,185,105,0.7);margin-left:8px;margin-bottom:${Math.round(size * 0.07)}px;">${esc(hook.unit)}</div>` : ''}
        </div>
      </div>`;
}

// Untertitel — WEISS, regular, GROSS (systemweit, nie kursiv/grau).
// Im Story-Format zählt schneller Konsum: max. 12 Wörter, am Satzende geschnitten
// (nicht mitten im Wort). Alles Weitere gehört in die volle Geschichte.
const DEK_MAX_WORDS = 16;
// CLEAN clampen: KEIN „…". Wir bevorzugen einen VOLLSTÄNDIGEN Satz, der ins
// Wortbudget passt. Passt der erste Satz → ganzer Satz. Sonst schneiden wir am
// letzten sauberen Satzende innerhalb des Budgets; gibt es keins, enden wir an
// einer Wortgrenze ohne Satzzeichen-Rest und ohne Ellipse (Aaron 2026-07-10:
// „nichts gequetscht, nichts …, alles clean").
function clampDek(dek: string, maxWords = DEK_MAX_WORDS): string {
	const s = (dek || '').trim();
	if (!s) return '';
	const words = s.split(/\s+/);
	if (words.length <= maxWords) return s; // passt komplett → nichts schneiden

	// Sätze innerhalb des Budgets sammeln (an .!? trennen, Satzzeichen behalten).
	const sentences = s.match(/[^.!?]+[.!?]+/g) ?? [];
	let acc = '';
	for (const sent of sentences) {
		const cand = (acc ? acc + ' ' : '') + sent.trim();
		if (cand.split(/\s+/).length > maxWords) break;
		acc = cand;
	}
	if (acc) return acc.trim(); // ≥1 vollständiger Satz passt → sauberer Abschluss

	// Kein ganzer Satz passt: an Wortgrenze schneiden, hängende Satzzeichen weg,
	// KEIN „…". Ein Doppelpunkt/Komma am Ende wird entfernt, damit es ruhig endet.
	return words.slice(0, maxWords).join(' ').replace(/[,;:–-]+$/, '').trim();
}
// KEIN line-clamp mehr — das war die Quelle der „…". Stattdessen begrenzt
// clampDek() die Wortzahl vorab auf einen vollständigen Satz/Wortgrenze, sodass
// der Text ohnehin in ~2-3 Zeilen passt und SAUBER umbricht (nichts wird vom
// Renderer abgeschnitten). maxLines steuert nur noch die Wort-Obergrenze:
// weniger Zeilen → knapperes Wortbudget (enge Templates wie split).
function dekText(dek: string, color = '#ffffff', size = 48, maxWords = DEK_MAX_WORDS, _maxLines = 3): string {
	const short = clampDek(dek, maxWords);
	if (!short) return '';
	return `<div style="display:flex;font-family:'Inter';font-size:${size}px;font-weight:400;color:${color};line-height:1.3;margin-top:26px;width:${CONTENT_W}px;">${esc(short)}</div>`;
}

// EIN Wirkungs-System überall: dezente Pill "● 78/100". Nur wenn ein echter
// Text-Hook (z.B. "1,4 Mio.") schon die große Zahl trägt — sonst ist der Score
// selbst der Hook und die Pill entfällt (kein doppelter Score).
function impactPill(score: number | null | undefined, accent: string, dark = false): string {
	if (score == null) return '';
	const txtBg = dark ? 'rgba(0,0,0,0.32)' : 'rgba(255,255,255,0.14)';
	const txtCol = dark ? '#16140f' : '#fff';
	return `<div style="display:flex;align-items:center;background:${txtBg};border-radius:100px;padding:12px 26px;">
        <div style="display:flex;width:16px;height:16px;border-radius:16px;background:${accent};margin-right:12px;"></div>
        <div style="display:flex;font-family:'Space Grotesk';font-size:30px;font-weight:700;color:${txtCol};letter-spacing:0.02em;">${score}/100 Wirkung</div>
      </div>`;
}

function imageCover(imageBase64: string | null, imgH: number, pos = 'center 35%'): string {
	return imageBase64
		? `<img src="${imageBase64}" width="${W}" height="${imgH}" style="position:absolute;top:0;left:0;width:${W}px;height:${imgH}px;object-fit:cover;object-position:${pos};" />`
		: `<div style="position:absolute;top:0;left:0;display:flex;width:${W}px;height:${imgH}px;align-items:center;justify-content:center;background:linear-gradient(150deg,#f0c9a0,#d98b52 60%,#b5673a);"><div style="font-family:'Space Grotesk';font-size:340px;font-weight:700;color:rgba(255,255,255,0.9);">N</div></div>`;
}

function page(inner: string, bg = BG): string {
	return `<!DOCTYPE html><html><body style="margin:0;width:${W}px;height:${H}px;background:${bg};font-family:'Inter';display:flex;">
  <div style="display:flex;position:relative;width:${W}px;height:${H}px;">${inner}</div>
</body></html>`;
}

// ─── Template 1: STAT (Bild oben → Fade → Zahl/Headline/Untertitel/CTA) ──────
function tplStat(input: StoryCardInput, accent: string, catLabel: string, hook: Hook | null): string {
	const aspect = input.imageAspect && input.imageAspect > 0 ? input.imageAspect : 1;
	const imgH = Math.round(Math.min(IMG_MAX_H, Math.max(IMG_MIN_H, W * aspect)));
	// Fade läuft schon bei ~78% in volles Schwarz → sauberer, dunkler Sockel unter
	// dem Bild, auf dem Zahl/Headline/CTA sicher lesbar sind (kein Grau-Matsch).
	const fade = `<div style="position:absolute;display:flex;left:0;top:${imgH - FADE_H}px;width:${W}px;height:${FADE_H}px;background:linear-gradient(180deg,rgba(12,10,8,0) 0%,rgba(12,10,8,0.55) 42%,rgba(12,10,8,0.92) 72%,${BG} 88%);"></div>`;

	return page(`
    ${imageCover(input.imageBase64, imgH)}
    ${fade}
    ${topLabels(accent, catLabel, input.logoDataUri)}
    <div style="position:absolute;display:flex;flex-direction:column;left:${SAFE_SIDE}px;right:${SAFE_SIDE}px;bottom:${SAFE_BOTTOM}px;width:${CONTENT_W}px;">
      ${hookInline(hook, accent)}
      <div style="display:flex;font-family:'Space Grotesk';font-size:${headlineSize(input.title)}px;font-weight:700;color:#fff;line-height:1.0;letter-spacing:-0.03em;">${esc(input.title)}</div>
      ${dekText(input.dek)}
      ${hook?.fromText ? `<div style="display:flex;margin-top:24px;">${impactPill(input.impactScore, accent)}</div>` : ''}
      ${ctaBlock()}
    </div>`);
}

// ─── Template 2: POSTER (randloses Vollbild, nur Headline + CTA) ─────────────
function tplPoster(input: StoryCardInput, accent: string, catLabel: string): string {
	const image = input.imageBase64
		? `<img src="${input.imageBase64}" width="${W}" height="${H}" style="position:absolute;top:0;left:0;width:${W}px;height:${H}px;object-fit:cover;object-position:center;" />`
		: imageCover(null, H);
	// STÄRKERER Verlauf unten (bis fast deckend) → Headline IMMER lesbar, egal wie
	// hell das Bild ist. Headline + Pill + CTA sitzen alle auf dem Scrim.
	const scrim = `<div style="position:absolute;bottom:0;left:0;display:flex;width:${W}px;height:1220px;background:linear-gradient(180deg,rgba(8,6,4,0) 0%,rgba(8,6,4,0.42) 34%,rgba(8,6,4,0.86) 62%,rgba(8,6,4,0.98) 100%);"></div>`;
	const scrimTop = `<div style="position:absolute;top:0;left:0;display:flex;width:${W}px;height:320px;background:linear-gradient(180deg,rgba(8,6,4,0.55) 0%,rgba(8,6,4,0) 100%);"></div>`;
	const n = input.title.length;
	const hs = n <= 28 ? 118 : n <= 45 ? 100 : n <= 70 ? 82 : 66;
	return page(`
    ${image}
    ${scrimTop}
    ${scrim}
    ${topLabels(accent, catLabel, input.logoDataUri)}
    <div style="position:absolute;display:flex;flex-direction:column;left:${SAFE_SIDE}px;right:${SAFE_SIDE}px;bottom:${SAFE_BOTTOM}px;width:${CONTENT_W}px;">
      <div style="display:flex;width:120px;height:12px;border-radius:12px;background:${accent};margin-bottom:30px;"></div>
      <div style="display:flex;font-family:'Space Grotesk';font-size:${hs}px;font-weight:700;color:#fff;line-height:0.98;letter-spacing:-0.03em;">${esc(input.title)}</div>
      ${dekText(input.dek)}
      ${input.impactScore != null ? `<div style="display:flex;margin-top:24px;">${impactPill(input.impactScore, accent)}</div>` : ''}
      ${ctaBlock()}
    </div>`);
}

// ─── Template 3: STATEMENT (farbcodierter BG, RIESIGE Headline als Plakat) ───
function tplStatement(input: StoryCardInput, accent: string, catLabel: string): string {
	const darkBg = CATEGORY_DARK[input.category] || '#14110c';
	// Bild nur als schwache Textur ganz dezent oben (Tiefe), Farbe dominiert.
	const texture = input.imageBase64
		? `<img src="${input.imageBase64}" width="${W}" height="${H}" style="position:absolute;top:0;left:0;width:${W}px;height:${H}px;object-fit:cover;object-position:center;opacity:0.16;" />`
		: '';
	const n = input.title.length;
	const hs = n <= 24 ? 166 : n <= 40 ? 138 : n <= 60 ? 110 : 88;
	return page(
		`
    ${texture}
    ${topLabels(accent, catLabel, input.logoDataUri, true)}
    <div style="position:absolute;display:flex;flex-direction:column;left:${SAFE_SIDE}px;right:${SAFE_SIDE}px;top:${SAFE_TOP + 60}px;bottom:${SAFE_BOTTOM}px;width:${CONTENT_W}px;justify-content:space-between;">
      <div style="display:flex;">
        <!-- dicker vertikaler Akzentbalken links (Editorial-Pattern) -->
        <div style="display:flex;width:18px;border-radius:18px;background:${accent};margin-right:40px;"></div>
        <div style="display:flex;flex-direction:column;width:${CONTENT_W - 58}px;">
          <div style="display:flex;font-family:'Space Grotesk';font-size:${hs}px;font-weight:700;color:#fff;line-height:0.96;letter-spacing:-0.035em;">${esc(input.title)}</div>
          ${dekText(input.dek, 'rgba(255,255,255,0.9)', 44)}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;">
        ${input.impactScore != null ? `<div style="display:flex;margin-bottom:24px;">${impactPill(input.impactScore, accent)}</div>` : ''}
        ${ctaBlock()}
      </div>
    </div>`,
		darkBg
	);
}

// ─── Template 4: SPLIT (obere Hälfte Bild, untere Hälfte Kategorie-Farbe) ────
function tplSplit(input: StoryCardInput, accent: string, catLabel: string, hook: Hook | null): string {
	// Bild oben, farbiges Panel unten. Mit den ECHTEN Safe-Zones (SAFE_BOTTOM=360)
	// rückt der bottom-verankerte CTA nach oben — der Textblock braucht mehr Panel.
	// splitY=940 gibt genug Höhe für 2-zeiligen Titel + Ortszeile + 1-zeiligen
	// Untertitel, ohne dass irgendetwas hinter dem CTA verschwindet (Aaron 2026-07-10:
	// der Untertitel lief hinter den CTA). Untertitel bewusst 1 Zeile (Titel trägt).
	const splitY = 940;
	const panelBg = CATEGORY_PANEL[input.category] || '#2a2118';
	const image = input.imageBase64
		? `<img src="${input.imageBase64}" width="${W}" height="${splitY}" style="position:absolute;top:0;left:0;width:${W}px;height:${splitY}px;object-fit:cover;object-position:center;" />`
		: imageCover(null, splitY);
	const panel = `<div style="position:absolute;left:0;top:${splitY}px;display:flex;width:${W}px;height:${H - splitY}px;background:${panelBg};"></div>`;
	const blend = `<div style="position:absolute;left:0;top:${splitY - 90}px;display:flex;width:${W}px;height:90px;background:linear-gradient(180deg,rgba(0,0,0,0) 0%,${panelBg} 100%);"></div>`;
	// Titel GRÖSSER (Aaron 2026-07-11: im Panel ist Platz). Stufen hochgezogen.
	const n = input.title.length;
	const hs = n <= 32 ? 88 : n <= 55 ? 74 : n <= 80 ? 62 : 52;
	const locParts = [input.country?.toUpperCase(), hook?.fromText ? hook.value : null].filter(Boolean);
	const locLine = locParts.length
		? `<div style="display:flex;align-items:center;margin-bottom:22px;">
        <div style="display:flex;width:16px;height:16px;border-radius:16px;background:${accent};margin-right:14px;"></div>
        <div style="display:flex;font-family:'Inter';font-size:32px;font-weight:700;letter-spacing:0.06em;color:#fff;">${esc(locParts.join('  ·  '))}</div>
      </div>`
		: '';
	// Textblock füllt das Panel MITTIG (justify-content:center) zwischen Panel-
	// Oberkante und CTA → kein hohles grünes Feld mehr (Aaron 2026-07-11).
	const ctaTop = H - SAFE_BOTTOM - 190; // grobe CTA-Oberkante (Höhe ~190)
	return page(`
    ${image}
    ${blend}
    ${panel}
    ${topLabels(accent, catLabel, input.logoDataUri)}
    <div style="position:absolute;display:flex;flex-direction:column;justify-content:center;left:${SAFE_SIDE}px;right:${SAFE_SIDE}px;top:${splitY + 30}px;height:${ctaTop - (splitY + 30) - 30}px;width:${CONTENT_W}px;">
      ${locLine}
      <div style="display:flex;font-family:'Space Grotesk';font-size:${hs}px;font-weight:700;color:#fff;line-height:1.03;letter-spacing:-0.03em;">${esc(input.title)}</div>
      ${dekText(input.dek, 'rgba(255,255,255,0.92)', 40, 10, 2)}
      ${input.impactScore != null && input.impactScore >= 50 ? `<div style="display:flex;margin-top:24px;">${impactPill(input.impactScore, accent)}</div>` : ''}
    </div>
    <!-- CTA HART unten verankert → nie in der IG-Antwortzeile -->
    <div style="position:absolute;display:flex;left:${SAFE_SIDE}px;right:${SAFE_SIDE}px;bottom:${SAFE_BOTTOM}px;width:${CONTENT_W}px;">
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:${CONTENT_W}px;background:${AMBER};border-radius:34px;padding:38px 32px;">
        <div style="display:flex;font-family:'Space Grotesk';font-size:44px;font-weight:700;color:#fff;letter-spacing:-0.02em;text-align:center;white-space:nowrap;">Deine gute Nachricht für heute →</div>
        <div style="display:flex;font-family:'Inter';font-size:34px;font-weight:600;color:rgba(255,255,255,0.96);margin-top:12px;">Kostenlos abonnieren · Link im Profil</div>
      </div>
    </div>`);
}

// ─── Template 5: TICKER (Bild oben, strukturierte Daten-Karte darunter) ──────
function tplTicker(
	input: StoryCardInput,
	accent: string,
	catLabel: string,
	hook: Hook | null
): string {
	const aspect = input.imageAspect && input.imageAspect > 0 ? input.imageAspect : 1;
	const imgH = Math.round(Math.min(1000, Math.max(860, W * aspect)));
	const fade = `<div style="position:absolute;display:flex;left:0;top:${imgH - 200}px;width:${W}px;height:200px;background:linear-gradient(180deg,rgba(12,10,8,0) 0%,${BG} 100%);"></div>`;

	// Orts-Label als farbige Pill (lesbar + branded), eigene Zeile.
	const locPill = input.country
		? `<div style="display:flex;align-items:center;align-self:flex-start;background:${accent};border-radius:100px;padding:10px 24px;margin-bottom:24px;">
        <div style="display:flex;font-family:'Inter';font-size:28px;font-weight:700;letter-spacing:0.04em;color:#16140f;">${esc(input.country.toUpperCase())}</div>
      </div>`
		: '';

	return page(`
    ${imageCover(input.imageBase64, imgH)}
    ${fade}
    ${topLabels(accent, catLabel, input.logoDataUri)}
    <div style="position:absolute;display:flex;flex-direction:column;left:${SAFE_SIDE}px;right:${SAFE_SIDE}px;bottom:${SAFE_BOTTOM}px;width:${CONTENT_W}px;">
      <!-- Wirkungs-Pill ÜBER der Headline = erster Kontext-Geber -->
      ${input.impactScore != null ? `<div style="display:flex;margin-bottom:24px;">${impactPill(input.impactScore, accent)}</div>` : ''}
      ${locPill}
      <!-- Headline: fett + groß (klare Hierarchie-Spitze) -->
      <div style="display:flex;font-family:'Space Grotesk';font-size:${headlineSize(input.title)}px;font-weight:700;color:#fff;line-height:1.0;letter-spacing:-0.03em;">${esc(input.title)}</div>
      <!-- Editorial-Trennlinie zwischen Headline und Subline -->
      <div style="display:flex;width:${CONTENT_W}px;height:2px;background:rgba(255,255,255,0.18);margin-top:28px;margin-bottom:4px;"></div>
      ${dekText(input.dek, '#ffffff', 42)}
      ${ctaBlock()}
    </div>`);
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────
export function buildStoryCard(input: StoryCardInput): string {
	const accent = CATEGORY_ACCENT[input.category] || HOOK;
	const catLabel = (CATEGORY_LABELS[input.category] || input.category).toUpperCase();
	const hook = pickHook(input.dek || '', input.title, input.impactScore);
	const tpl = pickTemplate(input);

	switch (tpl) {
		case 'poster':
			return tplPoster(input, accent, catLabel);
		case 'statement':
			return tplStatement(input, accent, catLabel);
		case 'split':
			return tplSplit(input, accent, catLabel, hook);
		case 'ticker':
			return tplTicker(input, accent, catLabel, hook);
		case 'stat':
		default:
			return tplStat(input, accent, catLabel, hook);
	}
}

// Für Endpoint: erlaubt ?tpl=poster Validierung.
export function asTemplateName(s: string | null | undefined): TemplateName | undefined {
	return s && (TEMPLATES as string[]).includes(s) ? (s as TemplateName) : undefined;
}
