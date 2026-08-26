// Lokale Website-Präferenzen (Leser-seitig, kein Login nötig).
//
// Warum localStorage und nicht die DB: /einstellungen ist an einen Abonnenten
// gebunden, die Story-Seiten sind öffentlich. Eine DB-Präferenz würde einen
// anonymen Leser nie erreichen. Der Schalter muss dort wirken, wo der Player
// steht — also im Browser.

const LS_KEY = 'nureine.site.prefs.v1';

type SitePrefs = {
	/** Vorlesen-Player auf Story-Seiten anzeigen. Default: aus. */
	readAloud: boolean;
};

const DEFAULTS: SitePrefs = { readAloud: false };

function load(): SitePrefs {
	if (typeof localStorage === 'undefined') return { ...DEFAULTS };
	try {
		const raw = localStorage.getItem(LS_KEY);
		if (!raw) return { ...DEFAULTS };
		return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<SitePrefs>) };
	} catch {
		return { ...DEFAULTS };
	}
}

class SitePrefsStore {
	readAloud = $state(false);
	private hydrated = false;

	/** Aus localStorage laden (im onMount aufrufen — SSR kennt kein localStorage). */
	hydrate(): void {
		if (this.hydrated) return;
		this.readAloud = load().readAloud;
		this.hydrated = true;
	}

	private persist(): void {
		if (typeof localStorage === 'undefined') return;
		try {
			localStorage.setItem(LS_KEY, JSON.stringify({ readAloud: this.readAloud }));
		} catch {
			// Speicher voll / privater Modus — Präferenz gilt nur für die Session.
		}
	}

	setReadAloud(on: boolean): void {
		this.readAloud = on;
		this.persist();
	}

	toggleReadAloud(): void {
		this.setReadAloud(!this.readAloud);
	}
}

export const sitePrefs = new SitePrefsStore();
