// Beispiel-Daten für die App v2 (Notfall-Fallback bei gesperrter DB).
//
// WARUM: Solange die Supabase-REST-Sperre (402) aktiv ist, liefert supabaseAdmin
// nichts — die App wäre dann leer. Diese Datei hält ECHTE, kürzlich veröffentlichte
// Stories (per Direkt-SQL aus nureine_stories gezogen, Stand 2026-07-19), damit die
// App-Erfahrung (Ritual → Zahl → Belegt → Himmel) auch offline vollständig ansehbar
// ist — für Abnahme und iOS-Übersetzung.
//
// SELBSTHEILEND: Der Fallback in queries.ts greift NUR, wenn die echte DB nichts
// liefert. Sobald die Sperre weg ist, verschwindet das Fixture von allein — hier
// muss nichts entfernt werden. Bilder fehlen bewusst (image_url = null): die liegen
// im ebenfalls gesperrten Storage und kommen automatisch zurück.
//
// Shape = SupabaseStory (rohe DB-Zeile, snake_case). Läuft durch mapStory() wie
// jede echte Zeile → korrekte StoryResult-Shape ohne Sonderbehandlung.

import type { SupabaseStory } from '../queries';

// Basis-Defaults für Felder, die die App-Reader nicht brauchen — hält die
// Story-Objekte lesbar, ohne jede Nullspalte einzeln zu wiederholen.
const base = {
	subtitle: null,
	source_url: '',
	region: null,
	region_code: null,
	lat: null,
	lng: null,
	impact_reach: null,
	emoji: '✨',
	image_url: null,
	og_image_url: null,
	og_image_srcset: null,
	is_hero: false,
	gut_filter_reason: null,
	emotion: null,
	ig_ok: false,
	ig_hook_type: null,
	dach_relevanz: null,
	wa_ok: false,
	ig_hook: null,
	wa_opener: null,
	slides: null,
	ig_caption: null,
	audio_url: null,
	sensitive: false,
	impact_explainer: null,
	share_hook: null,
	beat: null,
	source_type: null,
	kid_min_age: null,
	kid_explainer: null,
	conversation_starter: null
} satisfies Partial<SupabaseStory>;

export const APP_FIXTURE_STORIES: SupabaseStory[] = [
	{
		...base,
		id: '88728a17-47e6-4dff-98ce-12eb41b70a56',
		title: 'Kindergeld soll künftig automatisch aufs Konto kommen',
		subtitle: 'Ohne Antrag, ohne Papierkram – die Umstellung spart 205.000 Stunden Bürokratie.',
		summary:
			'Bisher müssen Familien Kindergeld beantragen – ein Aufwand, der leicht untergeht oder scheitert. Der Bundestag hat beschlossen, dass Kindergeld künftig automatisch aufs Konto fließen soll, ohne Antrag und ohne Papierkram. Das entlastet Familien und spart geschätzte 205.000 Stunden Bürokratie. Die Umstellung kommt schrittweise ab 2027. Es ist ein Beispiel dafür, wie der Staat Leistungen einfacher zugänglich macht – damit Hilfe die Menschen erreicht, statt an Formularen zu scheitern.',
		body_markdown:
			'Kindergeld soll künftig automatisch auf dem Konto landen – ohne Antrag, ohne Papierkram. Das soll Familien entlasten, heißt es im Gesetzentwurf, den der Bundestag am 9. Juli verabschiedet hat. Der Bundesrat muss noch zustimmen.\n\nBisher müssen Eltern das Kindergeld beantragen. Was nach einer Formalität klingt, ist in der Praxis eine echte Hürde: Anträge gehen unter, werden falsch ausgefüllt oder aus Unwissen gar nicht erst gestellt – gerade dort, wo die Unterstützung besonders gebraucht wird.\n\nDie Neuerung erfolgt schrittweise. Ab Frühjahr 2027 gilt sie zunächst für Neugeborene in Familien, die bereits für ältere Geschwister Kindergeld beziehen – der Grund: Die Daten der Familienkasse liegen hier schon vor. Ende 2027 soll die Leistung dann auch für das erste Kind automatisch fließen.\n\nDie erwartete Entlastung ist beträchtlich: Rund 205.000 Stunden Bürokratie sollen dadurch wegfallen – Zeit, die weder Familien noch Behörden mehr mit Anträgen verbringen müssen.\n\nDer eigentliche Fortschritt steckt im Prinzip: Eine Leistung, die ohnehin allen Familien zusteht, wird nicht mehr an einen Antrag geknüpft. Hilfe erreicht die Menschen, statt an Formularen zu scheitern.\n\nEin konkreter Endtermin für die vollständige Umsetzung wird noch nicht genannt – zuerst müssen die technischen Voraussetzungen geschaffen werden. Doch die Richtung ist klar: weniger Papierkram, mehr Selbstverständlichkeit.',
		category: 'gemeinschaft',
		region: 'Deutschland',
		region_code: 'DE',
		lat: 52.52,
		lng: 13.4,
		source_name: 'Perspective Daily',
		source_url:
			'https://perspective-daily.de/article/5066-diese-aenderung-spart-205000-stunden-buerokratie/probiere',
		impact_score: 72,
		impact_reach_score: 80,
		impact_durability: 90,
		impact_evidence: 80,
		impact_explainer:
			'Eine Leistung, die allen Familien zusteht, wird nicht mehr an einen Antrag geknüpft – Hilfe erreicht die Menschen automatisch.',
		reading_time_min: 1,
		published_at: '2026-07-18T22:00:00+00:00',
		created_at: '2026-07-19T01:40:00+00:00',
		emotion: 'relief',
		wa_opener: 'endlich weniger Papierkram für Familien:',
		share_hook:
			'Kindergeld soll bald automatisch aufs Konto kommen – ohne Antrag. Das spart 205.000 Stunden Papierkram.',
		conversation_starter: 'Warum ist es gut, wenn man Hilfe bekommt, ohne extra danach fragen zu müssen?',
		kid_min_age: 10,
		kid_explainer: 'Kindergeld ist Geld, das der Staat Familien für ihre Kinder gibt.'
	},
	{
		...base,
		id: '88283c4a-bd7b-41cd-a0b4-885535415444',
		title: 'Berlin geht mit einem Miet-Kataster gegen Wucher vor',
		subtitle: 'Ein zentrales Verzeichnis soll überhöhte Mieten sichtbar machen – und Mieter schützen.',
		summary:
			'In Berlin sind Wohnungen knapp und die Mieten hoch – ein Grund sind Vermieter, die mehr verlangen, als eigentlich erlaubt ist. Das Berliner Abgeordnetenhaus hat nun beschlossen, ein zentrales digitales Wohnungs- und Mietkataster aufzubauen, das alle Mietwohnungen der Stadt mit Daten wie Adresse, Wohnfläche und Miete erfasst. Damit werden überhöhte Mieten überhaupt erst nachweisbar. Für Millionen Mieterinnen und Mieter kann das ein handfestes Werkzeug gegen Mietwucher werden.',
		body_markdown:
			'Wer in Berlin eine Wohnung sucht, ist nicht zu beneiden: Der Wohnraum ist knapp, die Konkurrenz groß und die Mieten sind hoch. 15,68 Euro kostet hier der Quadratmeter; in Städten wie Hagen, Halle oder Magdeburg zahlt man gerade einmal die Hälfte.\n\nEiner der Gründe für die hohen Mieten: Vermieterinnen und Vermieter, die für ihre Wohnungen mehr Geld verlangen, als sie eigentlich dürften. Das Problem dabei ist nicht nur der Preis, sondern die fehlende Übersicht – wer überhöhte Mieten nachweisen will, hat es schwer.\n\nGenau hier setzt der Beschluss an: Ein zentrales digitales Wohnungs- und Mietkataster soll künftig einen Überblick über alle Mietwohnungen in Berlin geben. Das hat das Berliner Abgeordnetenhaus in seiner letzten Sitzung vor der Sommerpause Anfang Juli beschlossen.\n\nIn dem Kataster sollen unter anderem Angaben zu Adresse, Wohnfläche und Zahl der Räume erfasst werden – die Grundlage, um erlaubte und tatsächlich verlangte Mieten zu vergleichen.\n\nDer Nutzen ist konkret: Was sichtbar ist, lässt sich überprüfen. Ein solches Verzeichnis macht Mietwucher überhaupt erst nachweisbar und gibt Mieterinnen und Mietern ein Werkzeug an die Hand, um sich zu wehren.\n\nOb das Kataster in der Praxis hält, was es verspricht, wird die Umsetzung zeigen. Doch für eine Stadt mit Millionen Mietwohnungen ist mehr Transparenz auf dem Wohnungsmarkt ein Schritt, der viele Menschen im Alltag betrifft.',
		category: 'gemeinschaft',
		region: 'Deutschland',
		region_code: 'DE',
		lat: 52.52,
		lng: 13.4,
		source_name: 'Perspective Daily',
		source_url:
			'https://perspective-daily.de/article/5068-zu-hohe-miete-berlin-macht-ernst-gegen-wucher/probiere',
		impact_score: 66,
		impact_reach_score: 60,
		impact_durability: 80,
		impact_evidence: 75,
		impact_explainer:
			'Was sichtbar ist, lässt sich überprüfen: Ein Kataster macht überhöhte Mieten überhaupt erst nachweisbar.',
		reading_time_min: 1,
		published_at: '2026-07-18T22:00:00+00:00',
		created_at: '2026-07-19T01:39:00+00:00',
		emotion: 'relief',
		wa_opener: 'endlich mal ein konkretes Werkzeug gegen Mietwucher:',
		share_hook:
			'Berlin baut ein Kataster aller Mietwohnungen auf – damit überhöhte Mieten endlich nachweisbar werden.',
		conversation_starter: 'Warum hilft es, wenn Preise für alle sichtbar sind?',
		kid_min_age: 12,
		kid_explainer: 'Miete ist das Geld, das man jeden Monat dafür zahlt, in einer Wohnung zu wohnen.'
	},
	{
		...base,
		id: '069ccbc6-314e-46c2-9bbe-890857307aea',
		title: 'Alzheimer-Wirkstoff repariert im Labor das Erbgut von Nervenzellen',
		subtitle:
			'Ein bereits sicher getesteter Wirkstoff bremste im Krankheitsmodell gleich mehrere Alzheimer-Merkmale zugleich.',
		summary:
			'Bei Alzheimer verklumpen im Gehirn giftige Eiweiße und schädigen nach und nach die Nervenzellen – bisher gibt es kaum ein Mittel, das an mehreren Ursachen gleichzeitig ansetzt. Forschende des King’s College London zeigten nun, dass der Wirkstoff KCL-286, der die erste Sicherheitsprüfung am Menschen bereits bestanden hat, in einem Labormodell viele dieser Krankheitsmerkmale abmildert. Weil der Stoff schon als sicher gilt, könnte der Weg zu einer Erprobung an Patienten deutlich kürzer sein als bei einem völlig neuen Medikament. Noch ist es kein fertiges Mittel, aber ein ungewöhnlich weit fortgeschrittener Ansatzpunkt gegen eine Krankheit, für die es bislang wenig Hoffnung gab.',
		body_markdown:
			'Bei der Alzheimer-Krankheit lagern sich im Gehirn giftige Eiweiße ab – vor allem sogenanntes Amyloid-beta und Tau, zwei Proteine, die verklumpen und die Verbindungen zwischen den Nervenzellen zerstören. Die meisten bisherigen Medikamente zielen nur auf eines dieser Probleme.\n\nEin Team des King’s College London verfolgt einen anderen Weg: Es hat einen Ansatz entwickelt, der über ein einziges Schlüssel-Protein mehrere Krankheitsmerkmale zugleich angeht. Der eingesetzte Wirkstoff heißt KCL-286.\n\nDas Bemerkenswerte daran: Dieser Stoff wurde ursprünglich für die Behandlung von Rückenmarksverletzungen entwickelt und hat bereits eine sogenannte Phase-1-Studie durchlaufen – den ersten Test am Menschen, bei dem geprüft wird, ob ein Mittel sicher und verträglich ist. Diese Hürde gilt als genommen.\n\nIn einem Labormodell der Krankheit reduzierte KCL-286 mehrere der typischen, mit Alzheimer verbundenen Veränderungen. Das ist noch kein Beweis, dass er auch bei Patientinnen und Patienten wirkt – Labormodelle sind ein früher Schritt.\n\nWarum die Nachricht dennoch zählt: Weil der Wirkstoff bereits als sicher eingestuft ist, könnte eine Erprobung an Erkrankten schneller beginnen als bei einer komplett neuen Substanz, die erst jahrelange Sicherheitstests durchlaufen müsste.\n\nAlzheimer ist die häufigste Form der Demenz und betrifft weltweit viele Millionen Menschen und ihre Angehörigen. Jeder ernstzunehmende neue Ansatzpunkt ist deshalb eine Nachricht wert – mit der nötigen Vorsicht, dass der Weg von der Laborbank bis zur Zulassung lang und ungewiss bleibt.',
		category: 'gesundheit',
		region: 'Vereinigtes Königreich',
		region_code: 'GB',
		lat: 51.5,
		lng: -0.12,
		source_name: 'Good News Network',
		source_url:
			'https://www.goodnewsnetwork.org/drug-may-repair-dna-at-earliest-stages-of-alzheimers-and-its-already-passed-safety-trials/',
		impact_score: 52,
		impact_reach_score: 70,
		impact_durability: 70,
		impact_evidence: 70,
		impact_explainer:
			'Weil der Wirkstoff schon als sicher gilt, könnte die Erprobung an Erkrankten viel schneller beginnen als sonst.',
		reading_time_min: 1,
		published_at: '2026-07-18T16:51:00+00:00',
		created_at: '2026-07-19T01:38:00+00:00',
		emotion: 'hope',
		wa_opener: 'Das hat mich heute leiser hoffen lassen:',
		share_hook:
			'Ein Mittel, das eigentlich für Rückenmarksverletzungen gedacht war, bremst im Labor gleich mehrere Alzheimer-Ursachen – und gilt schon als sicher.',
		conversation_starter:
			'Warum ist es hilfreich, wenn ein Medikament schon für etwas anderes sicher getestet wurde?',
		kid_min_age: 12,
		kid_explainer: 'Alzheimer ist eine Krankheit, bei der das Gehirn im Alter das Erinnern verlernt.'
	},
	{
		...base,
		id: '8134b387-2e01-4c09-9576-a575cc64d326',
		title: 'Pazifik-Inseln planen riesiges gemeinsames Meeresschutzgebiet',
		subtitle: 'Vier Länder wollen einen der artenreichsten Ozeane der Welt über Grenzen hinweg schützen.',
		summary:
			'Der westliche Pazifik gehört zu den artenreichsten Meeresgebieten der Erde – rund drei Viertel aller bekannten Korallenarten leben dort. Mehrere Inselstaaten – Papua-Neuguinea, Vanuatu, Fidschi und die Salomonen – haben vereinbart, ihre Gewässer zu einem gewaltigen grenzüberschreitenden Meeresschutzgebiet zu verbinden. Ein zusammenhängender Schutzkorridor lässt Fische und Meerestiere sicher wandern und schützt Korallenriffe wirksamer als einzelne kleine Gebiete. Es ist Naturschutz im ganz großen Maßstab – über Ländergrenzen hinweg.',
		body_markdown:
			'Eine Gruppe pazifischer Inselstaaten hat vereinbart, einen gewaltigen grenzüberschreitenden Meeresschutzkorridor offiziell einzurichten, der ihre Hoheitsgewässer umspannen soll.\n\nPapua-Neuguinea, Vanuatu und Fidschi gaben beim ersten Melanesischen Ozean-Gipfel im Mai eine gemeinsame Erklärung ab, in der sie die Pläne für den Korridor ankündigten. Ende Juni schlossen sich die Salomonen der Initiative an.\n\nMelanesien, eine Teilregion Ozeaniens im südwestlichen Pazifik, gehört zu den artenreichsten Gebieten der Welt. Die Region liegt im sogenannten Korallendreieck, dem globalen Zentrum der Korallenvielfalt. In ihren Gewässern kommen schätzungsweise 75 Prozent aller bekannten Korallenarten vor.\n\nWarum ein zusammenhängender Korridor mehr bringt als viele kleine Schutzgebiete: Fische, Wale und Schildkröten wandern über weite Strecken. Ein durchgehend geschütztes Gebiet begleitet sie auf diesen Wegen, statt sie nur stückweise zu schützen. Das macht den Schutz deutlich wirksamer.\n\nEbenso bedeutsam ist die politische Botschaft. Vier Länder legen ihre Gewässer zusammen, um eine gemeinsame Lebensgrundlage zu bewahren. Der Ozean kennt keine Grenzen – und der Schutz muss auch keine kennen.\n\nNoch ist es eine Absichtserklärung, und die Umsetzung wird die eigentliche Bewährungsprobe. Doch der Anspruch ist bemerkenswert: Naturschutz nicht als nationaler Flickenteppich, sondern als ein zusammenhängendes Ganzes.',
		category: 'klima',
		region: 'Papua-Neuguinea',
		region_code: 'PG',
		lat: -6.3,
		lng: 155,
		source_name: 'Mongabay',
		source_url:
			'https://news.mongabay.com/2026/07/melanesian-nations-announce-intention-to-create-massive-ocean-reserve-corridor/',
		impact_score: 60,
		impact_reach_score: 55,
		impact_durability: 85,
		impact_evidence: 70,
		impact_explainer:
			'Ein durchgehend geschützter Korridor begleitet wandernde Meerestiere – wirksamer als viele kleine Einzelgebiete.',
		reading_time_min: 1,
		published_at: '2026-07-17T17:16:21+00:00',
		created_at: '2026-07-19T01:36:00+00:00',
		emotion: 'hope',
		wa_opener: 'krass, was die vier da zusammen anpacken:',
		share_hook:
			'Vier Pazifik-Länder legen ihre Meere zusammen, um einen der artenreichsten Ozeane der Welt gemeinsam zu schützen.',
		conversation_starter: 'Warum ist es besser, ein großes Gebiet zu schützen als viele kleine Stücke?',
		kid_min_age: 8,
		kid_explainer: 'Ein Meeresschutzgebiet ist ein Teil des Meeres, in dem Tiere in Ruhe leben dürfen.'
	},
	{
		...base,
		id: '6ef113ce-520c-468a-a963-8615f6fab62c',
		title: 'Indien stellt seinen ersten selbstgebauten Wasserstoff-Zug vor',
		subtitle: 'Ein Zug, der nur Wasserdampf ausstößt, soll die riesige Bahn sauberer machen.',
		summary:
			'Indien hat ein riesiges Bahnnetz – und will es klimafreundlicher machen. Nun rollte der erste im Land selbst gebaute Zug mit Wasserstoff-Antrieb aus, der statt Abgasen nur Wasserdampf ausstößt. Er fährt im nordindischen Bundesstaat Haryana, erreicht bis zu 75 km/h und fasst rund 2.600 Fahrgäste. Wasserstoffzüge können dort Dieselzüge ersetzen, wo Oberleitungen fehlen – und so den Ausstoß schädlicher Abgase senken. Dass Indien den Zug selbst gebaut hat, macht die Technik unabhängiger und leichter verbreitbar.',
		body_markdown:
			'Indien hat am Freitag seinen ersten im eigenen Land gebauten, mit Wasserstoff angetriebenen Zug vorgestellt – ein Schritt, der den Einsatz sauberer Energie in seinem riesigen Schienennetz ausweiten soll.\n\nDer Zug besteht aus zwei wasserstoffbetriebenen Triebköpfen und acht Passagierwagen und wird im nordindischen Bundesstaat Haryana verkehren. Er kann bis zu 75 km/h schnell fahren und laut Bahnbehörden maximal rund 2.600 Fahrgäste befördern.\n\nDas Besondere an einem Wasserstoff-Zug: Er erzeugt Strom aus Wasserstoff und Sauerstoff in einer sogenannten Brennstoffzelle. Als „Abgas“ entsteht dabei praktisch nur Wasserdampf – keine klimaschädlichen oder gesundheitsschädlichen Abgase wie beim Diesel.\n\nGenau das ist der Nutzen: Auf Strecken, auf denen keine Oberleitung für elektrische Züge vorhanden ist, fahren bislang oft Dieselloks. Wasserstoffzüge können sie ersetzen und so den Ausstoß von Ruß und Treibhausgasen verringern.\n\nBemerkenswert ist auch, dass Indien den Zug selbst entwickelt und gebaut hat. Eigene Technik macht ein Land unabhängiger von Importen und erleichtert es, die Lösung im großen Maßstab und zu tragbaren Kosten auszurollen.\n\nEin einzelner Zug verändert noch kein Netz. Aber als erster Schritt in einem der größten Bahnsysteme der Welt kann er den Weg für viele weitere ebnen.',
		category: 'klima',
		region: 'Indien',
		region_code: 'IN',
		lat: 29.3,
		lng: 76.3,
		source_name: 'Mongabay',
		source_url:
			'https://news.mongabay.com/short-article/2026/07/india-launches-first-hydrogen-powered-train-built-in-the-country-to-expand-clean-energy-on-railways/',
		impact_score: 55,
		impact_reach_score: 60,
		impact_durability: 80,
		impact_evidence: 70,
		impact_explainer:
			'Wasserstoffzüge ersetzen Dieselloks dort, wo Oberleitungen fehlen – Eigenbau macht die Technik leichter verbreitbar.',
		reading_time_min: 1,
		published_at: '2026-07-17T17:34:04+00:00',
		created_at: '2026-07-19T01:35:00+00:00',
		emotion: 'hope',
		wa_opener: 'les go – aus dem Auspuff kommt nur Wasserdampf:',
		share_hook:
			'Indiens erster selbstgebauter Wasserstoff-Zug fährt – und stößt statt Abgasen nur Wasserdampf aus.',
		conversation_starter: 'Was ist besser daran, wenn ein Land eine Technik selbst bauen kann?',
		kid_min_age: 8,
		kid_explainer: 'Ein Wasserstoff-Zug fährt sauber: Aus seinem Auspuff kommt nur Wasserdampf.'
	},
	{
		...base,
		id: 'fe1fa511-7931-49c7-b8b6-ce2d6bdacf1e',
		title: 'Tampons werden zum medizinischen Diagnose-Werkzeug',
		subtitle: 'Was jede Frau kennt, könnte künftig Krankheiten früh erkennen – ganz ohne Arztbesuch.',
		summary:
			'Menstruationsblut enthält wertvolle medizinische Informationen, wurde aber lange als bloßer Abfall behandelt. Eine Forscherin mit Abschlüssen von Harvard und MIT entwickelt Verfahren, um über den Tampon genau dieses Blut für Diagnosen zu nutzen – etwa für Tests, die Frauen sonst mühsam beim Arzt erbitten müssen. So könnte ein alltägliches Produkt zu einem einfachen, würdevollen Frühwarnsystem für die Gesundheit werden. Es ist ein Beispiel dafür, wie das Ernstnehmen von Frauengesundheit neue Medizin hervorbringt.',
		body_markdown:
			'Manchmal entstehen die folgenreichsten Erfindungen aus Frust. Als Ridhi Tariyal Anfang dreißig war, bat sie ihre Frauenärztin um einen Fruchtbarkeitstest. Die Ärztin wies die Bitte ab – ein solcher Test sei nicht möglich.\n\nTariyal wusste es besser. Mit einem MBA von Harvard und einem Masterabschluss in biomedizinischem Unternehmertum vom MIT kannte sie das Anti-Müller-Hormon, einen etablierten Marker für die Eierstockreserve, also einen Anhaltspunkt dafür, wie viele Eizellen einer Frau noch zur Verfügung stehen. Der Test existierte. Dennoch wollte ihre Ärztin ihn nicht anordnen.\n\nDie Erfahrung frustrierte sie so sehr, dass sie ihre eigene Gesundheit zum Forschungsprojekt machte. „Es gibt Tausende Frauen wie mich“, sagt Tariyal, heute 45. Frauen bekämen immer später Kinder, hätten aber kaum einfache Möglichkeiten, sich über ihren Zustand zu informieren.\n\nIhr Ansatz: Menstruationsblut, das bislang als bloßer Abfall behandelt wird, enthält eine Fülle medizinischer Informationen. Über den Tampon lässt sich dieses Blut gewinnen und auswerten – für Tests, die Frauen sonst nur mit ärztlicher Erlaubnis und im Labor bekommen.\n\nDamit würde aus einem Alltagsprodukt ein niedrigschwelliges Diagnose-Werkzeug: unkompliziert, zu Hause, ohne das Gefühl, um jeden Test kämpfen zu müssen.\n\nDie eigentliche gute Nachricht steckt hinter der Technik: Wenn Frauengesundheit ernst genommen wird, entstehen daraus konkrete medizinische Fortschritte, von denen sehr viele Menschen profitieren können.',
		category: 'gesundheit',
		region: 'Vereinigte Staaten',
		region_code: 'US',
		lat: 42.36,
		lng: -71.06,
		source_name: 'Reasons to be Cheerful',
		source_url: 'https://reasonstobecheerful.world/menstrual-blood-medical-possibilities/',
		impact_score: 50,
		impact_reach_score: 70,
		impact_durability: 70,
		impact_evidence: 60,
		impact_explainer:
			'Aus einem Alltagsprodukt wird ein niedrigschwelliges Diagnose-Werkzeug – für Tests, die Frauen sonst verweigert werden.',
		reading_time_min: 1,
		published_at: '2026-07-17T08:00:26+00:00',
		created_at: '2026-07-19T01:34:00+00:00',
		emotion: 'hope',
		wa_opener: 'krass, warum bekommt man das sonst nirgends mit:',
		share_hook:
			'Menstruationsblut galt als Abfall. Eine Forscherin macht daraus ein Diagnose-Werkzeug, das Frauen Tests bringt, die man ihnen sonst verweigert.'
	},
	{
		...base,
		id: 'a7f97cfd-e287-45c3-b220-54266deb4dea',
		title: 'Uralte Steinbauten bringen Leben an die US-mexikanische Grenze zurück',
		subtitle: 'Kleine Steinwälle bremsen das Wasser – und ausgetrocknetes Land ergrünt wieder.',
		summary:
			'In trockenen Grenzregionen zwischen den USA und Mexiko rauscht der seltene Regen oft ungenutzt ab und reißt Erde mit sich – das Land trocknet immer weiter aus. Menschen bauen dort nun wieder uralte, einfache Steinstrukturen in die Bachläufe, die das Wasser bremsen, versickern lassen und den Boden halten. So kehren Pflanzen, Tiere und Feuchtigkeit in Gebiete zurück, die schon fast verloren waren. Eine jahrhundertealte Technik, fast ohne Kosten, hilft der Natur, sich selbst zu heilen.',
		body_markdown:
			'In der Grenzregion zwischen den USA und Mexiko ist das Land vielerorts staubtrocken. Der Rancher Eduardo Ríos Colores zeigt auf ein knochentrockenes Bachbett, das sich durch die Landschaft zieht. „Es gab eine Zeit, da existierte dieser Bach nicht“, sagt er. „Früher standen hier viele Bäume, und die Bäume verhinderten, dass das Wasser die Erde wegspülte. Aber die Bäume sind vertrocknet.“\n\nDas Problem ist typisch für Trockengebiete: Wasser kommt nicht gleichmäßig, sondern auf einmal, als Sturzflut. Statt zu versickern, rast es über den harten Boden, reißt Erde mit und ist schnell wieder weg. Das Land trocknet weiter aus.\n\nDie Lösung ist verblüffend einfach und uralt: kleine Steinstrukturen, die quer in die Bachläufe gesetzt werden. Sie bremsen das strömende Wasser, sodass es versickern kann, und halten den Boden fest, statt ihn davontragen zu lassen.\n\nWo das Wasser länger bleibt, kehrt das Leben zurück: Gräser, Bäume und mit ihnen die Tiere. Aus vertrocknetem Land wird Schritt für Schritt wieder ein funktionierendes Ökosystem.\n\nDas Besondere: Diese Technik kostet fast nichts, braucht keine Maschinen und knüpft an jahrhundertealtes Wissen an. Menschen schichten Steine – und geben der Natur damit die Bausteine zurück, die sie zum Heilen braucht.\n\nGegen die großen Trockenkrisen ist das kein Allheilmittel. Aber es zeigt, dass sich selbst ausgezehrtes Land erholen kann, wenn man dem Wasser hilft zu bleiben.',
		category: 'klima',
		region: 'Mexiko',
		region_code: 'MX',
		lat: 30.98,
		lng: -110.3,
		source_name: 'Mongabay',
		source_url:
			'https://news.mongabay.com/2026/07/ancient-rock-structures-help-restore-biodiversity-on-the-us-mexico-border/',
		impact_score: 52,
		impact_reach_score: 35,
		impact_durability: 80,
		impact_evidence: 65,
		impact_explainer:
			'Simple Steinwälle halten seltenen Regen im Boden – ausgetrocknetes Land wird wieder lebendig.',
		reading_time_min: 1,
		published_at: '2026-07-17T10:49:04+00:00',
		created_at: '2026-07-19T01:42:22+00:00',
		emotion: 'wonder',
		wa_opener: 'schau mal, fast ohne Geld und Maschinen:',
		share_hook:
			'Ein paar Steine quer in den Bach gelegt – und ausgetrocknetes Grenzland ergrünt wieder. Eine uralte Technik, fast umsonst.',
		conversation_starter: 'Wie kann etwas so Einfaches wie ein Haufen Steine der Natur helfen?',
		kid_min_age: 8,
		kid_explainer: 'Wenn Regenwasser zu schnell wegfließt, kann der Boden nichts davon behalten.'
	},
	{
		...base,
		id: '79021864-b52e-4974-8df8-8bf8d689223d',
		title: 'China und Russland setzen fast 500.000 junge Störe im Amur aus',
		subtitle:
			'Der einst leergefischte Grenzfluss bekommt Nachwuchs: gemeinsame Aussetzaktion für den fast verschwundenen Riesenstör.',
		summary:
			'Der Amur, ein großer Grenzfluss zwischen China und Russland, galt lange als chronisch überfischt – der berühmte Riesenstör war dort praktisch verschwunden. Umweltbehörden beider Länder haben nun gemeinsam hunderttausende junge Störe in den Fluss entlassen, um den Bestand wieder aufzubauen. Solche Besatzaktionen geben einer bedrohten, sehr langlebigen Fischart die Chance, sich über Jahre erneut zu vermehren. Dass zwei Nachbarländer dafür zusammenarbeiten, zeigt, dass Artenschutz auch über Grenzen hinweg funktionieren kann.',
		body_markdown:
			'Als die BBC 2008 in die frostige nordostchinesische Provinz Heilongjiang reiste, um einen Blick auf die berühmten Riesenstöre des Flusses zu erhaschen, mussten die Dokumentarfilmer feststellen: Es gab keine mehr. Der Fluss – auf Chinesisch Heilongjiang, „Schwarzer-Drachen-Fluss“, auf Russisch Amur – war chronisch überfischt.\n\nDoch mit Chinas wirtschaftlichem Aufstieg wuchs auch die Sorge um die Umwelt, und dem Schutz des Heilongjiang-Störs wurde besondere Aufmerksamkeit gewidmet. China teilt sich den Fluss mit Russland.\n\nUmweltbehörden beider Länder kamen kürzlich in der Stadt Tongjiang zusammen, um gemeinsam große Mengen junger Fische im Fluss auszusetzen – nach Angaben der beteiligten Stellen hunderttausende, in der Summe bis in den Millionenbereich reichende Jungtiere.\n\nStöre sind ein Sinnbild für die Verletzlichkeit alter Fischarten: Sie werden sehr alt und pflanzen sich erst spät fort, weshalb sich Überfischung besonders lange auswirkt. Genau deshalb sind Besatzaktionen wie diese so wichtig – sie geben dem Bestand über Jahre die Chance, sich wieder aufzubauen.\n\nBemerkenswert ist auch das Signal: Zwei Nachbarländer koordinieren sich, um eine gemeinsame Lebensgrundlage zu schützen. Artenschutz endet nicht an einer Grenze – ein Fluss und seine Fische kennen keine Landkarten.',
		category: 'tiere',
		region: 'China',
		region_code: 'CN',
		lat: 47.6,
		lng: 132.5,
		source_name: 'Good News Network',
		source_url:
			'https://www.goodnewsnetwork.org/chinese-russian-biologists-release-nearly-500000-young-sturgeon-into-the-amur-river/',
		impact_score: 50,
		impact_reach_score: 40,
		impact_durability: 75,
		impact_evidence: 65,
		impact_explainer:
			'Eine fast verschwundene, uralte Fischart bekommt über Ländergrenzen hinweg eine zweite Chance.',
		reading_time_min: 1,
		published_at: '2026-07-17T11:00:54+00:00',
		created_at: '2026-07-19T01:37:13+00:00',
		emotion: 'hope',
		wa_opener: 'zwei Länder, ein Fluss, eine gute Idee:',
		share_hook:
			'Ein Fluss zwischen China und Russland war leergefischt – jetzt setzen beide Länder gemeinsam hunderttausende junge Störe wieder aus.',
		conversation_starter: 'Warum ist es gut, wenn zwei Länder sich um denselben Fluss kümmern?',
		kid_min_age: 8,
		kid_explainer: 'Ein Stör ist ein sehr großer, sehr alter Fisch, den es kaum noch gibt.'
	}
];

/** Die „Hero"-Story fürs Aufdecken — die stärkste (Kindergeld, impact 72). */
export const APP_FIXTURE_HERO: SupabaseStory = APP_FIXTURE_STORIES[0];
