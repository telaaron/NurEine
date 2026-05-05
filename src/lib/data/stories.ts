export type Story = {
	slug: string;
	title: string;
	dek: string;
	body: string;
	category: 'Klima' | 'Gesundheit' | 'Wissenschaft' | 'Gemeinschaft' | 'Tiere' | 'Kultur' | 'Innovation';
	region: string;
	country: string;
	coords: [number, number]; // [x %, y %] on flat world map
	source: string;
	sourceUrl: string;
	publishedAt: string;
	readingMinutes: number;
	impactScore: number;
	impactNote: string;
	tone: 'amber' | 'sage' | 'rose' | 'sky';
	hero: string;
	pinned?: boolean;
	local?: boolean;
};

export const stories: Story[] = [
	{
		slug: 'kenia-mangroven-rekord',
		title: 'Kenia pflanzt 8 Millionen Mangroven — und stoppt damit Küstenerosion',
		dek: 'Eine Frauenkooperative in Mombasa hat ein Projekt gestartet, das CO₂ bindet, Fischbestände erholt und 4.000 Familien Einkommen gibt.',
		body: `Vor zehn Jahren war die Bucht von Gazi grau. Salzwasser drückte ins Trinkwasser, Fische blieben aus, der Boden trocknete. Heute steht hier ein Mangrovenwald — gepflanzt von Frauen, die einst Brennholz aus den Resten holten.

Das Projekt **Mikoko Pamoja** verkauft seit 2014 Kohlenstoffzertifikate. Erlöse fließen direkt zurück: Schulgebühren, Wassertanks, Solarlampen. 8 Millionen Bäume später hat die Erosion sich umgekehrt. Fischbestände sind um 240% gestiegen.

Was hier funktioniert, ist nicht Symbolik, sondern Buchhaltung. Jede Mangrove bindet über 30 Jahre etwa 308 Kilo CO₂. Multipliziert mit 8 Millionen ergibt das 2,46 Millionen Tonnen — entspricht den Jahresemissionen einer mittleren deutschen Stadt.

Die Geschäftsführerin Salma Mbarak sagt es so: "Wir verkaufen keinen Wald. Wir verkaufen die Tatsache, dass wir ihn nicht verbrennen."`,
		category: 'Klima',
		region: 'Ostafrika',
		country: 'Kenia',
		coords: [60, 58],
		source: 'Mongabay',
		sourceUrl: 'https://news.mongabay.com',
		publishedAt: '2026-05-04T08:30:00Z',
		readingMinutes: 4,
		impactScore: 87,
		impactNote: '4.000 Familien · 2,46 Mio. t CO₂',
		tone: 'sage',
		hero: '🌱',
		pinned: true
	},
	{
		slug: 'crispr-sichelzellanaemie',
		title: 'Erste CRISPR-Therapie heilt Sichelzellanämie — Zulassung in 14 Ländern',
		dek: 'Casgevy verändert das Knochenmark einmalig. Patienten, die jahrzehntelang mit Schmerzkrisen lebten, sind seit zwei Jahren symptomfrei.',
		body: `Victoria Gray war 33, als sie die Infusion bekam. Davor: neun Krankenhausaufenthalte pro Jahr, Morphium, Schmerzkrisen, die ihren Körper wie Glas zersplitterten.

Heute, drei Jahre nach der Behandlung mit **Casgevy**, hat sie keinen einzigen Rückfall. Sie arbeitet wieder. Ihre roten Blutkörperchen produzieren erstmals seit der Geburt funktionierendes Hämoglobin.

Die Therapie wurde 2023 zugelassen — eine einmalige Genom-Editierung mit CRISPR. 2026 ist sie in Großbritannien, USA, EU, Saudi-Arabien und neun weiteren Ländern verfügbar. Ein Durchbruch, der zeigt: genetische Krankheiten sind nicht mehr Schicksal.

Kostenfrage bleibt. 2,2 Mio. Dollar pro Behandlung. Doch die Krankenkassen rechnen nach: lebenslange Klinikbesuche kosten mehr.`,
		category: 'Gesundheit',
		region: 'Global',
		country: 'Vereinigtes Königreich',
		coords: [48, 32],
		source: 'New England Journal of Medicine',
		sourceUrl: 'https://www.nejm.org',
		publishedAt: '2026-05-03T14:00:00Z',
		readingMinutes: 3,
		impactScore: 78,
		impactNote: '~100.000 Patienten weltweit',
		tone: 'rose',
		hero: '🧬'
	},
	{
		slug: 'portugal-100-erneuerbar',
		title: 'Portugal lief 149 Tage 2026 vollständig auf erneuerbarem Strom',
		dek: 'Wind, Wasser und Sonne deckten den gesamten Bedarf. Industrie, Bahn, Krankenhäuser — alles aus dem Atlantik.',
		body: `Es war Mittwoch, der 15. April, 11:42 Uhr. Der portugiesische Netzbetreiber **REN** stellte fest: ab dieser Minute trug kein einziges Gramm fossiler Brennstoff mehr zum Stromnetz bei.

Was als Demonstrationsphase begann, ist 2026 Realität. 149 Tage am Stück lief Portugal komplett erneuerbar. Wind 41%, Wasserkraft 32%, Solar 22%, der Rest Biomasse.

Der Schlüssel: Speicher. Sieben neue Pumpspeicherwerke in den Bergen, dazu ein 800-MWh-Batteriepark in Sines. Wenn Wind nachts bläst und niemand verbraucht, wird Wasser hochgepumpt.

Spanien zieht nach. Frankreich studiert. Deutschland diskutiert.`,
		category: 'Klima',
		region: 'Westeuropa',
		country: 'Portugal',
		coords: [44.5, 38],
		source: 'REN Boletim',
		sourceUrl: 'https://www.ren.pt',
		publishedAt: '2026-05-02T09:00:00Z',
		readingMinutes: 3,
		impactScore: 82,
		impactNote: '10,3 Mio. Menschen · 0 g CO₂/kWh',
		tone: 'sky',
		hero: '🌬️'
	},
	{
		slug: 'tigerpopulation-nepal',
		title: 'Nepal verdreifacht seine Tigerpopulation in 14 Jahren',
		dek: 'Aus 121 Tieren sind 355 geworden. Gemeinde-Wildhüter und satellitengestützte Anti-Wilderer-Patrouillen drehten den Trend um.',
		body: `2009 zählte Nepal 121 wilde Bengaltiger. Im Frühjahr 2026 zählt das nationale Tigerregister 355.

Die Geschichte ist nicht über Tiger allein. Sie ist über **Buffer Zone Communities** — Dörfer am Parkrand, die für jeden Tag ohne Wilderei einen Anteil am Tourismus bekommen. 9.500 Menschen leben heute direkt vom Schutz statt vom Abschuss.

Indien, Bhutan und Russland haben das Modell adaptiert. Die globale Wildtigerpopulation ist erstmals seit Beginn der Aufzeichnungen wieder steigend.`,
		category: 'Tiere',
		region: 'Südasien',
		country: 'Nepal',
		coords: [70, 42],
		source: 'WWF Tiger Census',
		sourceUrl: 'https://www.worldwildlife.org',
		publishedAt: '2026-05-02T06:00:00Z',
		readingMinutes: 2,
		impactScore: 71,
		impactNote: '+193% Wildtiger · 9.500 Hüter',
		tone: 'amber',
		hero: '🐅'
	},
	{
		slug: 'amsterdam-fahrradautobahn',
		title: 'Amsterdam eröffnet 87 km Fahrrad-Autobahn — Auto-Pendler steigen massiv um',
		dek: 'Drei Stadtteile sind seit März autofrei in der Hauptverkehrszeit. Krankenhäuser melden 23% weniger Lärmbeschwerden.',
		body: `Die **Snelfietsroute F7** verbindet seit dem 12. März die Vororte Almere, Diemen und Amstelveen mit dem Zentrum. Vier Meter breit, beheizt im Winter, mit Gegenverkehrsspuren wie eine echte Straße.

In den ersten zwei Monaten: 1,8 Millionen Fahrten. 38% der neuen Nutzer waren vorher Auto-Pendler. Stickoxide an den drei großen Einfallstraßen: −19%.

Die Route hat 412 Mio. Euro gekostet. Die Stadt rechnet mit Amortisation in 11 Jahren — durch eingesparte Gesundheitskosten allein.`,
		category: 'Innovation',
		region: 'Westeuropa',
		country: 'Niederlande',
		coords: [49, 30],
		source: 'Het Parool',
		sourceUrl: 'https://www.parool.nl',
		publishedAt: '2026-05-01T11:00:00Z',
		readingMinutes: 3,
		impactScore: 64,
		impactNote: '−19% NOₓ · 1,8 Mio. Fahrten',
		tone: 'sage',
		hero: '🚴'
	},
	{
		slug: 'teltow-gemeinschaftsgarten',
		title: 'Teltow eröffnet größten Gemeinschaftsgarten Brandenburgs',
		dek: '4.200 m² ehemaliges Bauerwartungsland werden zu Beeten, Bienenwiese und einem Lehrpfad — ohne einen Cent Fördermittel.',
		body: `Es begann mit einem Aushang im Penny. "Gärtnern statt zubauen" — 47 Anwohner kamen zum ersten Treffen. Heute, ein Jahr später, hat der **Verein Teltower Beete** das Grundstück an der Ruhlsdorfer Straße in Pacht.

Geerntet wurde 2026 schon: 380 kg Kartoffeln, 92 kg Tomaten, eine bemerkenswerte Menge Mangold. Was über den Eigenbedarf hinausgeht, geht an die Tafel Teltow.

Bürgermeister Thomas Schmidt: "Wir hätten das Geld für so ein Projekt gar nicht. Aber wir hatten Bürger, die es selbst machen."`,
		category: 'Gemeinschaft',
		region: 'Brandenburg',
		country: 'Deutschland',
		coords: [50.5, 30],
		source: 'Märkische Allgemeine',
		sourceUrl: 'https://www.maz-online.de',
		publishedAt: '2026-05-01T07:30:00Z',
		readingMinutes: 2,
		impactScore: 41,
		impactNote: 'Lokal · Teltow · 47 Anwohner',
		tone: 'sage',
		hero: '🥕',
		local: true
	},
	{
		slug: 'malaria-impfstoff-afrika',
		title: 'Malaria-Impfstoff R21 schützt 12 Millionen Kinder in 15 Ländern',
		dek: 'WHO-Daten zeigen 78% Wirksamkeit gegen schwere Verläufe. Die ersten Geburtsjahrgänge nach Einführung haben halb so viele Klinikaufenthalte.',
		body: `Der **R21/Matrix-M-Impfstoff** wurde 2023 zugelassen. 2026 ist er in Ghana, Burkina Faso, Kenia, Nigeria und elf weiteren Ländern Standard im Routineimpfplan.

WHO-Zwischenbericht (April 2026): Säuglingssterblichkeit in den Pilotregionen ist um 13% gefallen. Klinikaufenthalte wegen schwerer Malaria: −51%.

Der Hersteller Serum Institute of India produziert den Impfstoff für unter 4 Dollar pro Dosis. Gavi, der globale Impfallianz-Fonds, finanziert die Verteilung. 100 Millionen Dosen sind für 2027 bestellt.`,
		category: 'Gesundheit',
		region: 'Subsahara-Afrika',
		country: 'Ghana',
		coords: [49, 56],
		source: 'WHO Malaria Report',
		sourceUrl: 'https://www.who.int',
		publishedAt: '2026-04-30T10:00:00Z',
		readingMinutes: 3,
		impactScore: 91,
		impactNote: '12 Mio. Kinder · −51% schwere Fälle',
		tone: 'rose',
		hero: '💉'
	},
	{
		slug: 'fusion-iter-erste-zuendung',
		title: 'ITER erreicht erste kontrollierte Fusionszündung',
		dek: 'Im südfranzösischen Cadarache zündete am 19. April das erste Plasma mit positivem Energiebilanz. Die Welt hat einen reproduzierbaren Sonnenofen.',
		body: `Es war ein Puls von 1,2 Sekunden. Aber ein Puls, der mehr Energie freisetzte, als hineingesteckt wurde — Q-Faktor 1,3.

Das **ITER-Konsortium** (35 Länder, 22 Mrd. Euro) hatte den Termin zwei Jahre überschritten. Doch am 19. April 2026 lief das Experiment erfolgreich. Direktor Pietro Barabaschi: "Wir haben die Sonne nicht zur Erde geholt. Wir haben gelernt, sie selbst zu bauen."

Bis zum Stromnetz dauert es. Demo-Reaktoren ab 2040, kommerzielle Anlagen frühestens 2050. Aber die Frage ist beantwortet: Fusion ist physikalisch möglich, technisch beherrschbar, wirtschaftlich offen.`,
		category: 'Wissenschaft',
		region: 'Südeuropa',
		country: 'Frankreich',
		coords: [46.5, 33],
		source: 'Nature',
		sourceUrl: 'https://www.nature.com',
		publishedAt: '2026-04-29T16:00:00Z',
		readingMinutes: 4,
		impactScore: 88,
		impactNote: 'Q = 1,3 · 1,2 s Plasmadauer',
		tone: 'amber',
		hero: '☀️',
		pinned: true
	},
	{
		slug: 'kolumbien-friedensabkommen-eln',
		title: 'Kolumbien unterzeichnet Friedensabkommen mit ELN — 60 Jahre Konflikt enden',
		dek: 'Nach 32 Verhandlungsrunden in Havanna legt die letzte aktive Guerillatruppe Lateinamerikas die Waffen nieder.',
		body: `Es war ein Konflikt, der drei Generationen geprägt hat. 450.000 Tote. 8 Millionen Vertriebene. Ein Land, das nie wirklich Frieden kannte.

Am 25. April 2026 unterschrieben Präsident Gustavo Petro und ELN-Kommandeur "Antonio García" das Abkommen. Wirksam ab 1. Juli. 4.500 ELN-Kämpfer geben ihre Waffen ab und werden in Übergangsprogramme integriert: Landwirtschaft, Forstwirtschaft, Schulausbildung.

Norwegen und Kuba bürgten als Garanten. Die UN-Mission CLM kontrolliert Demobilisierung über 24 Monate.`,
		category: 'Gemeinschaft',
		region: 'Südamerika',
		country: 'Kolumbien',
		coords: [27, 60],
		source: 'El Tiempo',
		sourceUrl: 'https://www.eltiempo.com',
		publishedAt: '2026-04-29T08:00:00Z',
		readingMinutes: 4,
		impactScore: 95,
		impactNote: '4.500 Kämpfer demobilisiert',
		tone: 'rose',
		hero: '🕊️'
	},
	{
		slug: 'tiefseekoralle-grosses-barriereriff',
		title: 'Großes Barriereriff: Korallenpopulation erholt sich erstmals seit 30 Jahren',
		dek: 'Hitzeresistente Stämme aus dem Labor und gezielter Schutz vor Sternenseesternen führen zu 11% mehr Korallendeckung.',
		body: `Australische Meeresbiologen haben am **Lizard Island Research Station** Korallenstämme gezüchtet, die Wassertemperaturen bis 33°C tolerieren — vier Grad mehr als die Wildtypen.

Seit 2022 wurden 1,7 Millionen Setzlinge ausgesetzt. Im Mai 2026 zeigt der Langzeit-Monitoring-Index (LTMP) erstmals seit Beginn der Aufzeichnungen 1996 ein Plus: +11% Korallendeckung in 87 von 127 untersuchten Riffen.

Das Ergebnis ist fragil. Eine weitere El-Niño-Hitzewelle könnte alles zurückwerfen. Aber zum ersten Mal seit einer Generation gibt es einen Pfad nach oben.`,
		category: 'Tiere',
		region: 'Ozeanien',
		country: 'Australien',
		coords: [85, 70],
		source: 'AIMS',
		sourceUrl: 'https://www.aims.gov.au',
		publishedAt: '2026-04-28T09:00:00Z',
		readingMinutes: 3,
		impactScore: 73,
		impactNote: '+11% Korallendeckung · 1,7 Mio. Setzlinge',
		tone: 'sky',
		hero: '🪸'
	},
	{
		slug: 'jugend-museum-berlin',
		title: 'Jugendliche aus Neukölln gestalten Dauerausstellung im Berlinischen Museum',
		dek: '23 Schülerinnen und Schüler kuratieren die neue Migrationsausstellung — ihre Großeltern werden zu Hauptzeugen.',
		body: `**"Wer hat das gepackt?"** — so heißt die Ausstellung, die seit dem 22. April im Berlinischen Museum zu sehen ist. Kuratiert nicht von Historikern, sondern von 23 Jugendlichen einer Neuköllner Gemeinschaftsschule.

Die Schüler interviewten ihre eigenen Großeltern. Türkische Gastarbeiter, vietnamesische Vertragsarbeiter, syrische Geflüchtete. Aus 84 Stunden Audio entstand ein Hörraum, in dem Generationen direkt miteinander sprechen.

Direktorin Annika Wellmann: "Wir haben gelernt, dass die Distanz zwischen Archiv und Wohnzimmer eine künstliche ist."`,
		category: 'Kultur',
		region: 'Berlin',
		country: 'Deutschland',
		coords: [50.5, 30],
		source: 'Tagesspiegel',
		sourceUrl: 'https://www.tagesspiegel.de',
		publishedAt: '2026-04-27T15:00:00Z',
		readingMinutes: 2,
		impactScore: 47,
		impactNote: 'Lokal · Berlin · 23 Kuratoren',
		tone: 'amber',
		hero: '🎨',
		local: true
	},
	{
		slug: 'plastikabbau-enzym',
		title: 'Forscher entwickeln Enzym, das PET-Plastik in 24 Stunden zerlegt',
		dek: 'Die Mainzer Universität präsentiert FAST-PETase. Erste Industrieanlage in Antwerpen geht 2027 in Betrieb.',
		body: `**FAST-PETase** ist eine evolutionsoptimierte Variante eines Bakterien-Enzyms, das im Jahr 2016 in einer japanischen Recyclinganlage entdeckt wurde. Die ursprüngliche Form brauchte Wochen, das Mainzer Team hat sie auf 24 Stunden beschleunigt.

Ein einzelner Reaktor kann 50 Tonnen PET pro Tag in seine Monomere zerlegen — direkt wieder polymerisierbar zu neuem PET. Kreislauf geschlossen.

Indorama, einer der größten PET-Hersteller weltweit, baut die erste industrielle Anlage in Antwerpen. Inbetriebnahme Q1 2027. Kapazität: 50.000 Tonnen pro Jahr.`,
		category: 'Wissenschaft',
		region: 'Mitteleuropa',
		country: 'Deutschland',
		coords: [49.5, 30],
		source: 'Science',
		sourceUrl: 'https://www.science.org',
		publishedAt: '2026-04-26T12:00:00Z',
		readingMinutes: 3,
		impactScore: 76,
		impactNote: '50 t PET/Tag pro Reaktor',
		tone: 'sage',
		hero: '♻️'
	}
];

export const featuredOfDay = stories.find((s) => s.pinned) ?? stories[0];

export function byCategory(cat: Story['category']) {
	return stories.filter((s) => s.category === cat);
}

export function localStories() {
	return stories.filter((s) => s.local);
}
