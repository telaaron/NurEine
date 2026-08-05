/**
 * Titelseite als Bild — „Meine Ausgabe für <Ort>".
 *
 * Das gerenderte Gegenstück zu /bei-dir: derselbe Zeitungskopf, derselbe
 * Aufmacher, dieselbe Spaltenlogik. Wer die Ausgabe teilt, teilt ein Bild, das
 * aussieht wie die Seite, die er gerade gesehen hat.
 *
 * BEWUSST OHNE STORY-BILDER (Vorfall 2026-07-16): Satori müsste jedes Bild
 * einzeln aus dem Supabase-Bucket ziehen und rastern. Bei einer Ausgabe mit
 * Aufmacher + 6 Meldungen wären das 7 Downloads pro Abruf — und anders als bei
 * /api/share-card/<slug> gibt es hier keinen festen Cache-Key, weil jeder Ort
 * eine eigene Ausgabe hat. Eine Zeitungs-Titelseite trägt ihren Charakter
 * ohnehin über Typografie, nicht über Fotos.
 *
 * Format 1080×1350 (4:5) — das größte Seitenverhältnis, das Instagram im Feed
 * ungeschnitten zeigt, und in WhatsApp/iMessage gut lesbar.
 */

export interface EditionStory {
	title: string;
	dek: string;
	category: string;
	/** Ortsmarke, wie sie in der Zeitung über der Meldung steht. */
	place: string;
	/** Einordnung für Ortsfremde ("Berlin"). Leer, wenn sie nichts hinzufügt. */
	placeDetail: string;
	/** true, wenn es ein echter Ort ist (nicht nur das Land). */
	localPlace: boolean;
	distance: string;
	impactScore: number;
}

export interface EditionCardInput {
	/** Zeitungstitel, z. B. „TELTOWER LICHTBLICK". */
	masthead: string;
	/** „Mittwoch, 5. August 2026 · Ausgabe Nr. 217" */
	issueLine: string;
	lead: EditionStory | null;
	stories: EditionStory[];
	count: number;
	nearest: string;
	logoDataUri?: string | null;
}

// ── Palette (identisch zu src/app.css, hell) ──
const W = 1080;
const H = 1350;
const CANVAS = '#f4efe6';
const INK = '#16140f';
const INK_SOFT = '#403a30';
const MUTED = '#7d7466';
const RULE = '#ddd4c4';
const AMBER = '#bd6a35';

const esc = (s: string): string =>
	String(s ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');

/** Satori kennt kein text-overflow — also hart kürzen, an der Wortgrenze. */
function clamp(text: string, max: number): string {
	const t = String(text ?? '').trim();
	if (t.length <= max) return t;
	const cut = t.slice(0, max);
	const sp = cut.lastIndexOf(' ');
	return (sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[,;:.\s]+$/, '') + '…';
}

/** Ortszeile einer Meldung — echter Ort in Akzentfarbe, Land gedämpft. */
function dateline(s: EditionStory, size: number): string {
	const color = s.localPlace ? AMBER : MUTED;
	const weight = s.localPlace ? 700 : 500;
	const detail = s.placeDetail
		? `<div style="display:flex;font-family:Inter;font-size:${size}px;color:${MUTED};margin-left:10px;">${esc(s.placeDetail)}</div>`
		: '';
	return `
	<div style="display:flex;align-items:center;">
		<div style="display:flex;font-family:Inter;font-size:${size}px;font-weight:${weight};color:${color};letter-spacing:2px;">${esc(s.place.toUpperCase())}</div>
		${detail}
		<div style="display:flex;flex-grow:1;"></div>
		<div style="display:flex;font-family:Inter;font-size:${size}px;color:${MUTED};letter-spacing:1px;">${esc(s.distance.toUpperCase())}</div>
	</div>`;
}

export function buildEditionCard(input: EditionCardInput): string {
	const { masthead, issueLine, lead, stories, count, nearest, logoDataUri } = input;

	// Zeitungskopf skaliert mit der Titellänge — „LICHTBLICK FÜR BAD BELZIG"
	// muss genauso in eine Zeile passen wie „TELTOWER LICHTBLICK".
	const mh = masthead.length;
	const mastheadSize = mh <= 18 ? 76 : mh <= 24 ? 62 : mh <= 32 ? 50 : 40;

	const leadBlock = lead
		? `
	<div style="display:flex;flex-direction:column;margin-top:30px;">
		<div style="display:flex;align-items:center;margin-bottom:14px;">
			<div style="display:flex;font-family:Inter;font-size:19px;font-weight:700;color:${INK};letter-spacing:4px;">AUFMACHER</div>
			<div style="display:flex;flex-grow:1;height:1px;background:${RULE};margin-left:16px;"></div>
		</div>
		${dateline(lead, 21)}
		<div style="display:flex;font-family:Newsreader;font-weight:500;font-size:60px;line-height:1.08;color:${INK};margin-top:12px;">${esc(clamp(lead.title, 96))}</div>
		<div style="display:flex;font-family:Newsreader;font-size:29px;line-height:1.45;color:${INK_SOFT};margin-top:18px;">${esc(clamp(lead.dek, 190))}</div>
	</div>`
		: '';

	// Zweispaltiger Satz darunter. Satori kann kein CSS-Multicolumn — die
	// Spalten werden darum vorab aufgeteilt und als zwei Flex-Spalten gesetzt.
	const half = Math.ceil(stories.length / 2);
	const columns = [stories.slice(0, half), stories.slice(half)];

	const columnHtml = columns
		.map(
			(col, i) => `
		<div style="display:flex;flex-direction:column;width:472px;${i === 0 ? `border-right:1px solid ${RULE};padding-right:32px;` : 'padding-left:32px;'}">
			${col
				.map(
					(s, j) => `
			<div style="display:flex;flex-direction:column;${j > 0 ? `border-top:1px solid ${RULE};padding-top:20px;margin-top:20px;` : ''}">
				${dateline(s, 17)}
				<div style="display:flex;font-family:Newsreader;font-weight:500;font-size:29px;line-height:1.18;color:${INK};margin-top:8px;">${esc(clamp(s.title, 74))}</div>
				<div style="display:flex;font-family:Newsreader;font-size:21px;line-height:1.42;color:${INK_SOFT};margin-top:10px;">${esc(clamp(s.dek, 108))}</div>
			</div>`
				)
				.join('')}
		</div>`
		)
		.join('');

	// Satori verlangt bei <img> in einer Flex-Zeile explizite Maße AM ELEMENT
	// (style, nicht nur width/height-Attribute) — sonst fällt das Bild still weg.
	const logo = logoDataUri
		? `<img src="${logoDataUri}" style="display:flex;width:34px;height:34px;" />`
		: '';

	return `
<div style="display:flex;flex-direction:column;width:${W}px;height:${H}px;background:${CANVAS};padding:52px 56px;">

	<!-- Zeitungskopf: Doppellinie oben, dünne unten — klassisches Muster -->
	<div style="display:flex;width:100%;height:4px;background:${INK};"></div>
	<div style="display:flex;justify-content:center;font-family:Inter;font-size:17px;color:${MUTED};letter-spacing:7px;margin-top:20px;">DEINE PERSÖNLICHE AUSGABE</div>
	<div style="display:flex;justify-content:center;font-family:Newsreader;font-weight:500;font-size:${mastheadSize}px;color:${INK};letter-spacing:3px;margin-top:8px;">${esc(masthead)}</div>
	<div style="display:flex;width:100%;height:1px;background:${RULE};margin-top:20px;"></div>
	<div style="display:flex;justify-content:center;font-family:Inter;font-size:19px;color:${MUTED};margin-top:14px;">${esc(issueLine)}</div>
	<div style="display:flex;width:100%;height:1px;background:${INK};margin-top:14px;"></div>

	${leadBlock}

	<!-- Spaltensatz -->
	<div style="display:flex;width:100%;height:3px;background:${RULE};margin-top:32px;"></div>
	<div style="display:flex;margin-top:26px;">${columnHtml}</div>

	<!-- Fußleiste -->
	<div style="display:flex;flex-grow:1;"></div>
	<div style="display:flex;width:100%;height:1px;background:${RULE};"></div>
	<div style="display:flex;align-items:center;margin-top:18px;">
		${logo}
		<div style="display:flex;font-family:Inter;font-weight:700;font-size:22px;color:${INK};margin-left:${logoDataUri ? 12 : 0}px;letter-spacing:1px;">nureine.de</div>
		<div style="display:flex;flex-grow:1;"></div>
		<div style="display:flex;font-family:Inter;font-size:20px;color:${MUTED};">${count} Meldungen · nächste ${esc(nearest)}</div>
	</div>
</div>`;
}
