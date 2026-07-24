// Gemeinsame Inhaltsbasis der drei B2B-Seiten-Varianten (/fuer-unternehmen/*).
// EINE Quelle für Preise, Features, Pilot-Angebot — die Varianten unterscheiden
// sich nur in Aufbau/Ton, nicht in den Fakten. Aarons Entscheidungen: Pilot-CTA,
// offene Preise, Nutzen "fertiger Content", Gründungsphase statt Fake-Referenzen.

export interface Tier {
	name: string;
	price: string;
	tagline: string;
	features: string[];
	featured?: boolean;
}

export const TIERS: Tier[] = [
	{
		name: 'Screen',
		price: '499',
		tagline: 'Ein Standort, eure Bildschirme',
		features: [
			'Täglicher API-Feed für Office-Screens',
			'Wartebereich, Kantine, Empfang',
			'Whitelabel-Option',
			'Wirkungsindex + offene Quellen'
		]
	},
	{
		name: 'Whitelabel',
		price: '799',
		tagline: 'Eure interne Kommunikation',
		featured: true,
		features: [
			'Alles aus Screen',
			'Euer Branding, eure Farben',
			'Integration in euren Firmen-Newsletter',
			'Redaktionelle Auswahl nach euren Themen'
		]
	},
	{
		name: 'Enterprise',
		price: '999',
		tagline: 'Mehrere Standorte',
		features: [
			'Alles aus Whitelabel',
			'Multi-Standort-Ausspielung',
			'Priorisierter Support',
			'Individuelle Themen-Schwerpunkte'
		]
	}
];

export const STEPS = [
	{
		n: '01',
		t: 'Wir recherchieren & schreiben',
		d: 'Täglich aus hunderten Meldungen die eine mit echter Wirkung — mit Quelle, mit Wirkungsindex, ohne Kitsch.'
	},
	{
		n: '02',
		t: 'Ihr bekommt sie fertig',
		d: 'Per API auf eure Screens, als Baustein im Newsletter oder im Intranet. Whitelabel möglich.'
	},
	{
		n: '03',
		t: 'Eure Leute sehen etwas Gutes',
		d: 'Jeden Tag ein Lichtblick statt Krisenticker. Null Redaktionsaufwand für euch.'
	}
];

export const PILOT_LINE = '30 Tage kostenlos auf euren Bildschirmen. Wenn eure Leute es ignorieren — zahlt ihr nichts.';

export const INTERESSE_OPTIONS = ['Screen (499 €)', 'Whitelabel (799 €)', 'Enterprise (999 €)', 'Weiß noch nicht'];
