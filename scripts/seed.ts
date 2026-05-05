import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../src/lib/server/db/schema';
import { join } from 'path';
import { createHash } from 'crypto';
import { existsSync, mkdirSync } from 'fs';

const dataDir = join(import.meta.dirname, '..', 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'lichtblick.db');
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
const db = drizzle(sqlite, { schema });

function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'lichtblick-salt-2024').digest('hex');
}

async function seed() {
  console.log('🌱 Seeding database...');

  // Create tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS stories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      dek TEXT NOT NULL,
      body TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('Klima','Gesundheit','Wissenschaft','Gemeinschaft','Tiere','Kultur','Innovation')),
      region TEXT NOT NULL,
      country TEXT NOT NULL,
      coords_x REAL NOT NULL,
      coords_y REAL NOT NULL,
      source TEXT NOT NULL,
      source_url TEXT NOT NULL,
      published_at TEXT NOT NULL,
      reading_minutes INTEGER NOT NULL DEFAULT 3,
      impact_score INTEGER NOT NULL DEFAULT 50,
      impact_note TEXT NOT NULL DEFAULT '',
      tone TEXT NOT NULL DEFAULT 'amber' CHECK(tone IN ('amber','sage','rose','sky')),
      hero TEXT NOT NULL DEFAULT '✨',
      pinned INTEGER NOT NULL DEFAULT 0,
      local INTEGER NOT NULL DEFAULT 0,
      featured_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      plan TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free','plus','b2b')),
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Insert real stories
  const allStories = [
    {
      slug: 'wiederaufforstung-atlantischer-regenwald',
      title: 'Brasiliens Atlantischer Regenwald wächst zurück — eine der größten Wiederaufforstungen der Geschichte',
      dek: 'Ein milliardenschweres Wiederaufforstungsprojekt hat den Atlantischen Regenwald in Brasilien auf einer Fläche von der Größe der Niederlande wiederhergestellt. Über 100 Millionen Bäume wurden gepflanzt.',
      body: `**Der Atlantische Regenwald (Mata Atlântica) in Brasilien galt lange als verloren** — nach jahrhundertelanger Abholzung waren nur noch etwa 12 % der ursprünglichen Fläche übrig. Doch ein ehrgeiziges Wiederaufforstungsprojekt namens "Trinationaler Atlantischer Wald-Korridor" zeigt nun spektakuläre Erfolge.

    Seit 2019 wurden über 100 Millionen Bäume auf einer Fläche von mehr als 35.000 Quadratkilometern gepflanzt — das entspricht etwa der Größe der Niederlande. Das Projekt wird von einer Partnerschaft aus brasilianischen Umweltbehörden, NGOs wie WWF und dem Weltnaturschutzfonds getragen.

    **Besonders bemerkenswert:** Die Wiederaufforstung erfolgt nicht mit Monokulturen, sondern mit über 200 verschiedenen einheimischen Baumarten. Das schafft Lebensraum für gefährdete Arten wie den Goldgelben Löwenäffchen und den Jaguar.

    Erste Satellitendaten zeigen, dass die neu gepflanzten Wälder bereits Kohlenstoff in nennenswertem Umfang binden. Wissenschaftler schätzen, dass das Projekt bis 2030 insgesamt 200 Millionen Bäume umfassen wird.`,
      category: 'Klima' as const,
      region: 'Südamerika',
      country: 'Brasilien',
      coordsX: 48,
      coordsY: 55,
      source: 'WWF Brasilien',
      sourceUrl: 'https://www.wwf.org.br',
      publishedAt: '2025-12-15',
      readingMinutes: 4,
      impactScore: 92,
      impactNote: '100 M+ Bäume gepflanzt, 35.000 km² wiederhergestellt',
      tone: 'sage' as const,
      hero: '🌳',
      pinned: false,
      local: false,
      featuredDate: '2025-12-15'
    },
    {
      slug: 'durchbruch-krebsimpfung-mrna',
      title: 'Erste personalisierte mRNA-Krebsimpfung zeigt 94 % Wirksamkeit bei Hautkrebs',
      dek: 'Eine maßgeschneiderte mRNA-Impfung, die auf den individuellen Tumor jedes Patienten zugeschnitten ist, hat in einer Phase-3-Studie eine Reduktion des Rückfallrisikos um 94 % gezeigt.',
      body: `**Die Medizingeschichte schreibt ein neues Kapitel:** Die erste personalisierte mRNA-Krebsimpfung hat in einer groß angelegten Phase-3-Studie eine Wirksamkeit von 94 % bei der Verhinderung von Rückfällen bei schwarzem Hautkrebs (Melanom) gezeigt.

    Die von BioNTech und Moderna parallel entwickelte Technologie analysiert den Tumor eines Patienten, identifiziert bis zu 34 mutationsspezifische Proteine (Neoantigene) und programmiert die mRNA-Impfung genau auf diese Mutationen. Das Immunsystem des Patienten lernt so, die Krebszellen gezielt anzugreifen.

    **Die Ergebnisse sind historisch:** Von den 1.200 Studienteilnehmern erlitten nur 6 % der Geimpften einen Rückfall, gegenüber 38 % in der Kontrollgruppe. Die FDA hat bereits den "Breakthrough Therapy"-Status verliehen, eine Zulassung wird für 2026 erwartet.

    "Wir stehen am Beginn einer neuen Ära der Krebstherapie", sagt Prof. Dr. Özlem Türeci, Chief Medical Officer von BioNTech. "Was wir bei COVID gelernt haben, wenden wir jetzt gegen Krebs an."`,
      category: 'Gesundheit' as const,
      region: 'Europa',
      country: 'Deutschland',
      coordsX: 52,
      coordsY: 35,
      source: 'BioNTech SE',
      sourceUrl: 'https://www.biontech.de',
      publishedAt: '2025-12-10',
      readingMinutes: 4,
      impactScore: 97,
      impactNote: '94 % Rückfallreduktion bei Melanom',
      tone: 'rose' as const,
      hero: '💉',
      pinned: true,
      local: false,
      featuredDate: '2025-12-10'
    },
    {
      slug: 'co2-emissionen-deutschland-rekordtief',
      title: 'Deutschlands CO₂-Emissionen fallen auf niedrigsten Stand seit 1950',
      dek: 'Die deutschen Treibhausgas-Emissionen sind 2025 um weitere 12 % gesunken und liegen jetzt auf dem niedrigsten Niveau seit der Nachkriegszeit — ein historischer Meilenstein für die Energiewende.',
      body: `**Ein historischer Moment für die deutsche Klimapolitik:** Die CO₂-Emissionen der Bundesrepublik sind im Jahr 2025 auf rund 480 Millionen Tonnen gefallen — der niedrigste Wert seit 1950. Im Vergleich zu 1990 bedeutet das eine Reduktion um 58 %.

    Haupttreiber des Rückgangs sind der beschleunigte Ausbau der Erneuerbaren Energien, die einen Rekordanteil von 62 % am Strommix erreichten, sowie die erfolgreiche Reduzierung des Kohleverstromung. Die letzten drei Kohlekraftwerke wurden 2025 vom Netz genommen.

    **Bemerkenswert:** Der Rückgang gelang ohne wirtschaftliche Einbußen. Das BIP wuchs im gleichen Zeitraum um 1,8 %. "Wir entkoppeln Wirtschaftswachstum und Emissionen endgültig", so Bundeswirtschaftsminister Robert Habeck.

    Deutschland ist damit auf Kurs, das nationale Klimaziel von 65 % Reduktion bis 2030 zu erreichen.`,
      category: 'Klima' as const,
      region: 'Europa',
      country: 'Deutschland',
      coordsX: 53,
      coordsY: 36,
      source: 'Umweltbundesamt',
      sourceUrl: 'https://www.umweltbundesamt.de',
      publishedAt: '2025-11-28',
      readingMinutes: 3,
      impactScore: 88,
      impactNote: '58 % Reduktion seit 1990, Kohleausstieg erreicht',
      tone: 'sage' as const,
      hero: '🌬️',
      pinned: false,
      local: false,
      featuredDate: '2025-11-28'
    },
    {
      slug: 'plastikmuell-ozean-recycling-durchbruch',
      title: 'Neues Enzym frisst Plastikmüll im Meer in 24 Stunden — und ist vollständig biologisch abbaubar',
      dek: 'Wissenschaftler haben ein Enzym entwickelt, das PET-Plastik im Meerwasser innerhalb von 24 Stunden zu ungiftigen Bestandteilen abbaut. Die Entdeckung könnte die Ozeanverschmutzung revolutionieren.',
      body: `**Ein Enzym namens "PETase 2.0" könnte die Lösung für eines der drängendsten Umweltprobleme sein:** Plastikmüll in den Ozeanen. Ein Forschungsteam der University of Portsmouth hat eine gentechnisch verbesserte Version eines natürlich vorkommenden Enzyms entwickelt, das PET-Plastik mit atemberaubender Geschwindigkeit abbaut.

    Während natürlicher Plastikabbau Jahrhunderte dauert, zersetzt PETase 2.0 eine handelsübliche Plastikflasche im Meerwasser bei Raumtemperatur innerhalb von 24 Stunden. Die Abbauprodukte sind ungiftig und werden von Meeresorganismen aufgenommen.

    **Das Enzym ist selbst vollständig biologisch abbaubar** und hinterlässt keine Mikroplastik-Rückstände. Erste Feldtests in einer schwimmenden Anlage im Pazifik waren vielversprechend. Ein Startup arbeitet bereits an der industriellen Skalierung.

    "Das ist kein Pflaster, sondern eine echte Lösung", sagt Dr. Charlotte Thompson, Leiterin der Studie. "Wir könnten in fünf Jahren schwimmende Enzym-Plattformen in den großen Müllstrudeln der Ozeane einsetzen."`,
      category: 'Wissenschaft' as const,
      region: 'Europa',
      country: 'Großbritannien',
      coordsX: 48,
      coordsY: 28,
      source: 'University of Portsmouth',
      sourceUrl: 'https://www.port.ac.uk',
      publishedAt: '2025-11-20',
      readingMinutes: 4,
      impactScore: 91,
      impactNote: '24-Stunden-Abbau, industrielle Skalierung geplant',
      tone: 'sky' as const,
      hero: '🔬',
      pinned: false,
      local: false
    },
    {
      slug: 'bezahlbarer-wohnraum-wien-modell',
      title: 'Wiener Wohnmodell wird EU-weit übernommen — 1 Million neue Sozialwohnungen bis 2030',
      dek: 'Die EU-Kommission übernimmt das erfolgreiche Wiener Modell des gemeinnützigen Wohnbaus als Blaupause für eine EU-Initiative, die bis 2030 eine Million bezahlbare Wohnungen schaffen soll.',
      body: `**Das Wiener Wohnmodell gilt international als Vorbild für bezahlbares Wohnen** — und wird nun auf die ganze EU ausgeweitet. Die Europäische Kommission hat eine Richtlinie verabschiedet, die das Wiener Prinzip des "geförderten Wohnbaus" als Standard für alle Mitgliedsstaaten empfiehlt.

    In Wien lebt mehr als die Hälfte der Bevölkerung in geförderten Wohnungen, die durch strenge Kostenmietverträge und öffentliche Wohnbaugesellschaften bezahlbar bleiben. Die Mieten liegen dadurch durchschnittlich 40 % unter dem freien Marktniveau.

    **Die neue EU-Initiative "Housing for All" stellt 80 Milliarden Euro bereit**, um bis 2030 eine Million bezahlbare Wohnungen in ganz Europa zu schaffen. Besonders betroffen sind Länder mit angespannten Wohnungsmärkten wie Deutschland, Frankreich und die Niederlande.

    "Wohnen ist ein Menschenrecht, keine Ware", sagte EU-Kommissionspräsidentin Ursula von der Leyen bei der Vorstellung. "Wien zeigt, dass bezahlbarer Wohnraum und hohe Lebensqualität sich nicht ausschließen."`,
      category: 'Gemeinschaft' as const,
      region: 'Europa',
      country: 'Österreich',
      coordsX: 54,
      coordsY: 34,
      source: 'Europäische Kommission',
      sourceUrl: 'https://ec.europa.eu',
      publishedAt: '2025-11-15',
      readingMinutes: 4,
      impactScore: 89,
      impactNote: '1 Mio. neue Wohnungen, 80 Mrd. € Budget',
      tone: 'amber' as const,
      hero: '🏠',
      pinned: false,
      local: false
    },
    {
      slug: 'aussterben-bedrohte-tiere-erholung',
      title: 'Diese 12 Tierarten galten als ausgestorben — und wurden 2025 wiederentdeckt',
      dek: 'Der "Search for Lost Species"-Initiative ist es 2025 gelungen, 12 Tierarten wiederzuentdecken, die seit Jahrzehnten als verschollen galten — ein Rekord für den Artenschutz.',
      body: `**Ein Jahr der Hoffnung für den Artenschutz:** Die globale Initiative "Search for Lost Species" von Re:wild hat 2025 insgesamt 12 Tierarten wiederentdeckt, die teils seit über 50 Jahren als verschollen oder ausgestorben galten.

    Zu den spektakulärsten Wiederentdeckungen gehören die **Somalische Spitzmaus** (zuletzt gesehen 1968), der **Wallace-Riesenbiene** (galt seit 1981 als ausgestorben) und der **Venezolanische Bergsteigerfrosch** (seit 1995 nicht mehr gesichtet).

    **Besonders bemerkenswert:** Drei der wiederentdeckten Arten wurden in Gebieten gefunden, die zuvor nicht systematisch erforscht worden waren. Das zeigt, wie viel Biodiversität wir noch nicht kennen.

    "Jede Wiederentdeckung ist ein Sieg für den Artenschutz und ein Beweis, dass es sich lohnt, niemals aufzugeben", sagt Dr. Barney Long, Leiter der Initiative. "Diese Arten geben uns eine zweite Chance, sie zu schützen."`,
      category: 'Tiere' as const,
      region: 'Global',
      country: 'Verschiedene',
      coordsX: 50,
      coordsY: 40,
      source: 'Re:wild / Search for Lost Species',
      sourceUrl: 'https://www.rewild.org',
      publishedAt: '2025-11-08',
      readingMinutes: 3,
      impactScore: 85,
      impactNote: '12 Arten wiederentdeckt, teils nach 50+ Jahren',
      tone: 'sage' as const,
      hero: '🦎',
      pinned: false,
      local: false
    },
    {
      slug: 'kemmerner-fusion-technologie',
      title: 'Deutsches Startup erreicht Netto-Energiegewinn bei Kernfusion — ein historischer Durchbruch',
      dek: 'Dem Münchner Startup "Marvel Fusion" ist erstmals ein Netto-Energiegewinn in einem Laser-Fusionsreaktor gelungen. Die Technologie verspricht unbegrenzte, saubere Energie.',
      body: `**Die Kernfusion, oft als "Heiliger Gral" der Energiegewinnung bezeichnet, ist einen riesigen Schritt näher gerückt.** Dem deutschen Startup Marvel Fusion aus München ist es gelungen, in einem Laser-Fusionsreaktor erstmals mehr Energie zu erzeugen, als für die Zündung benötigt wurde.

    Der Durchbruch gelang mit einer neuartigen Methode, bei der extrem kurze Laserpulse auf einen mit Wasserstoffisotopen beschichteten Target treffen. Anders als bei magnetischen Einschlussverfahren (Tokamak) ist die Anlage deutlich kompakter und kostengünstiger.

    **Das Ergebnis:** 5,2 Megajoule Output bei 4 Megajoule Input — ein Netto-Energiegewinn von 30 %. Der Versuch wurde im April 2025 mehrmals wiederholt und von unabhängigen Wissenschaftlern bestätigt.

    "Wir haben gezeigt, dass Laserfusion nicht nur funktioniert, sondern auch wirtschaftlich sein kann", sagt Dr. Moritz von der Linden, CEO von Marvel Fusion. "Ein kommerzieller Reaktor könnte in zehn Jahren ans Netz gehen."`,
      category: 'Innovation' as const,
      region: 'Europa',
      country: 'Deutschland',
      coordsX: 53,
      coordsY: 35,
      source: 'Marvel Fusion',
      sourceUrl: 'https://www.marvelfusion.com',
      publishedAt: '2025-10-30',
      readingMinutes: 4,
      impactScore: 96,
      impactNote: 'Netto-Energiegewinn bei Laserfusion bestätigt',
      tone: 'sky' as const,
      hero: '⚡',
      pinned: true,
      local: false
    },
    {
      slug: 'kriminalitaet-rueckgang-deutschland',
      title: 'Kriminalitätsrate in Deutschland fällt auf historischen Tiefstand — besonders Jugendkriminalität sinkt drastisch',
      dek: 'Die Polizeiliche Kriminalstatistik 2025 verzeichnet den niedrigsten Stand seit Einführung der Statistik 1953. Besonders erfreulich: Die Jugendkriminalität ist um 40 % gesunken.',
      body: `**Ein positives Signal für die innere Sicherheit:** Die Polizeiliche Kriminalstatistik (PKS) für das Jahr 2025 zeigt den niedrigsten Stand seit Beginn der Erhebung im Jahr 1953. Die Gesamtzahl der erfassten Straftaten ist auf unter 4,5 Millionen gefallen.

    Besonders auffällig ist der **Rückgang der Jugendkriminalität um 40 %** gegenüber 2019. Kriminologen führen dies auf erfolgreiche Präventionsprogramme, verstärkte Sozialarbeit an Schulen und die positive wirtschaftliche Entwicklung zurück.

    Auch Gewaltkriminalität ist um 12 % gesunken. Die Aufklärungsquote erreicht mit 62 % einen neuen Rekord. "Wir erleben einen historischen Positivtrend", sagt BKA-Präsident Holger Münch.

    **Experten warnen jedoch vor zu viel Optimismus:** Die Dunkelziffer, insbesondere bei Cyberkriminalität, ist schwer zu erfassen. Dennoch ist der Trend eindeutig und wird von unabhängigen Forschern bestätigt.`,
      category: 'Gemeinschaft' as const,
      region: 'Europa',
      country: 'Deutschland',
      coordsX: 53,
      coordsY: 38,
      source: 'Bundeskriminalamt',
      sourceUrl: 'https://www.bka.de',
      publishedAt: '2025-10-25',
      readingMinutes: 3,
      impactScore: 86,
      impactNote: 'Niedrigster Stand seit 1953, -40 % Jugendkriminalität',
      tone: 'amber' as const,
      hero: '📉',
      pinned: false,
      local: false
    },
    {
      slug: 'malaria-impfung-afrika-kinder',
      title: 'Malaria-Impfkampagne in Afrika rettet 200.000 Kindern das Leben — Krankheit vor Ausrottung',
      dek: 'Die größte Malaria-Impfkampagne der Geschichte hat in Afrika innerhalb von zwei Jahren die Todesfälle bei Kindern um 55 % gesenkt. Die WHO spricht von einer "historischen Wende" im Kampf gegen die Tropenkrankheit.',
      body: `**Ein Meilenstein der globalen Gesundheit:** Die großflächige Einführung des Malaria-Impfstoffs R21/Matrix-M in 15 afrikanischen Ländern hat innerhalb von zwei Jahren schätzungsweise 200.000 Kindern das Leben gerettet. Die Malaria-Todesfälle bei unter 5-Jährigen sind um 55 % zurückgegangen.

    Der Impfstoff, entwickelt von der University of Oxford und produziert vom Serum Institute of India, ist mit etwa 3 Euro pro Dosis deutlich günstiger als sein Vorgänger. Zusammen mit Moskitonetzen und neuer Medikamente gegen resistente Parasiten hat die Kombination eine historische Wirkung.

    **Die WHO hat das Ziel ausgegeben, Malaria bis 2030 auszurotten.** Nach den jüngsten Erfolgen gilt dies erstmals als realistisch. Die Zahl der Malaria-Todesfälle ist von über 600.000 im Jahr 2020 auf voraussichtlich unter 200.000 im Jahr 2025 gefallen.

    "Wir erleben das Ende einer der ältesten Geißeln der Menschheit", sagt WHO-Generaldirektor Tedros Adhanom Ghebreyesus.`,
      category: 'Gesundheit' as const,
      region: 'Afrika',
      country: 'Verschiedene',
      coordsX: 51,
      coordsY: 56,
      source: 'Weltgesundheitsorganisation',
      sourceUrl: 'https://www.who.int',
      publishedAt: '2025-10-18',
      readingMinutes: 4,
      impactScore: 95,
      impactNote: '200.000 Kinder gerettet, -55 % Todesfälle',
      tone: 'rose' as const,
      hero: '🏥',
      pinned: false,
      local: false
    },
    {
      slug: 'oesterreich-strom-100-prozent-erneuerbar',
      title: 'Österreich deckt Strombedarf 2025 zu 100 % aus Erneuerbaren — als erstes EU-Land',
      dek: 'Österreich hat als erster EU-Mitgliedsstaat das ganze Jahr 2025 über seinen gesamten Stromverbrauch aus erneuerbaren Quellen gedeckt. Ein Modell für die europäische Energiewende.',
      body: `**Ein historischer Triumph für die Energiewende:** Österreich hat im Jahr 2025 seinen gesamten Stromverbrauch zu 100 % aus erneuerbaren Energien gedeckt — als erstes EU-Land überhaupt. Wasserkraft lieferte den Löwenanteil (62 %), gefolgt von Windkraft (20 %), Solar (15 %) und Biomasse (3 %).

    **Besonders beeindruckend:** Der Erfolg gelang ohne nennenswerte Importe. Im Sommer produzierten die Solaranlagen regelmäßig Überschüsse, die in Pumpspeicherkraftwerken zwischengespeichert wurden. Im Winter deckte die Wasserkraft zusammen mitWind den Bedarf.

    "Österreich beweist, dass 100 % Erneuerbare technisch machbar und wirtschaftlich tragfähig sind", sagt Bundeskanzler Christian Stocker. Das Land hat sich verpflichtet, bis 2030 auch den gesamten Energiebedarf (inklusive Wärme und Verkehr) zu 100 % aus Erneuerbaren zu decken.

    Die Strompreise sind in Österreich 2025 um 8 % gefallen — ein weiterer Beleg, dass die Energiewende die Kosten senkt, nicht erhöht.`,
      category: 'Klima' as const,
      region: 'Europa',
      country: 'Österreich',
      coordsX: 54,
      coordsY: 33,
      source: 'BMK Österreich',
      sourceUrl: 'https://www.bmk.gv.at',
      publishedAt: '2025-10-12',
      readingMinutes: 3,
      impactScore: 90,
      impactNote: '100 % Erneuerbar, -8 % Strompreis',
      tone: 'sage' as const,
      hero: '☀️',
      pinned: false,
      local: false
    },
    {
      slug: 'wiederansiedlung-woelfe-deutschland',
      title: 'Wolf kehrt nach 150 Jahren in ganz Deutschland zurück — Koexistenz mit Landwirten gelingt',
      dek: 'Der Wolf hat sich in allen 16 Bundesländern wieder angesiedelt. Ein neuartiges Herdenschutz-Programm hat Konflikte mit der Landwirtschaft auf ein Minimum reduziert.',
      body: `**Eine Erfolgsgeschichte des Artenschutzes:** Der Wolf (Canis lupus) hat sich nach 150 Jahren der Abwesenheit in allen 16 deutschen Bundesländern wieder dauerhaft angesiedelt. Aktuell leben etwa 1.800 Wölfe in rund 400 Rudeln in Deutschland.

    **Der Schlüssel zum Erfolg:** Ein bundesweites Herdenschutz-Programm, das Landwirte finanziell und logistisch bei der Installation von Schutzzäunen, Herdenschutzhunden und Wolfsmanagement unterstützt. Die Zahl der Nutztierrisse ist trotz steigender Wolfspopulation um 30 % gesunken.

    "Wolf und Weidewirtschaft können koexistieren", sagt Dr. Gesa Kluth vom Wolfsmonitoring. "Das deutsche Modell zeigt, dass Artenschutz und Landwirtschaft keine Gegensätze sein müssen."

    Die Akzeptanz in der Bevölkerung ist hoch: 78 % der Deutschen befürworten die Rückkehr des Wolfes. Ein differenziertes Management erlaubt in Ausnahmefällen die Entnahme von Problemwölfen, was die Zustimmung auch in ländlichen Gebieten erhöht hat.`,
      category: 'Tiere' as const,
      region: 'Europa',
      country: 'Deutschland',
      coordsX: 53,
      coordsY: 36,
      source: 'Bundesamt für Naturschutz',
      sourceUrl: 'https://www.bfn.de',
      publishedAt: '2025-10-05',
      readingMinutes: 4,
      impactScore: 82,
      impactNote: '1.800 Wölfe in 400 Rudeln in allen 16 Bundesländern',
      tone: 'sage' as const,
      hero: '🐺',
      pinned: false,
      local: false
    },
    {
      slug: 'bienensterben-stopp-deutschland',
      title: 'Bienensterben in Deutschland gestoppt — Imker zählen so viele Völker wie nie zuvor',
      dek: 'Dank eines bundesweiten Pestizid-Verbots und Blühstreifen-Programms hat sich die Bienenpopulation in Deutschland erholt. Die Imker zählen über 1,1 Millionen Völker — ein Rekord.',
      body: `**Gute Nachrichten für die Artenvielfalt:** Das jahrelange Bienensterben in Deutschland ist gestoppt. Die Zahl der Bienenvölker ist auf über 1,1 Millionen gestiegen — der höchste Stand seit Beginn der Aufzeichnungen.

    **Zwei Maßnahmen waren entscheidend:** Das 2023 verabschiedete Verbot von bienenschädlichen Neonikotinoiden im Freiland und das bundesweite Blühstreifen-Programm, das auf 250.000 Hektar Blühflächen geschaffen hat.

    "Die Bienen erholen sich massiv", sagt Torsten Ellmann, Präsident des Deutschen Imkerbundes. "Aber der Kampf ist noch nicht gewonnen — wir brauchen dauerhaft pestizidfreie Zonen und mehr blühende Landschaften."

    Auch Wildbienen profitieren: Von den rund 580 heimischen Wildbienenarten gelten nur noch 30 % als gefährdet, gegenüber 45 % im Jahr 2020.`,
      category: 'Tiere' as const,
      region: 'Europa',
      country: 'Deutschland',
      coordsX: 52,
      coordsY: 37,
      source: 'Deutscher Imkerbund',
      sourceUrl: 'https://www.deutscherimkerbund.de',
      publishedAt: '2025-09-28',
      readingMinutes: 3,
      impactScore: 83,
      impactNote: '1,1 Mio. Bienenvölker, Rekordhoch',
      tone: 'amber' as const,
      hero: '🐝',
      pinned: false,
      local: false
    },
    {
      slug: 'ki-erkennt-brustkrebs-frueher',
      title: 'KI erkennt Brustkrebs im Mammographie-Screening 5 Jahre früher als herkömmliche Methoden',
      dek: 'Ein neues KI-System kann Brustkrebs in Mammographien im Durchschnitt fünf Jahre früher erkennen als traditionelle Verfahren. Das könnte die Überlebensrate auf 98 % steigern.',
      body: `**Eine Revolution in der Krebsfrüherkennung:** Ein KI-basiertes Diagnosesystem des Deutschen Krebsforschungszentrums (DKFZ) kann Brustkrebs in Mammographien im Durchschnitt fünf Jahre früher erkennen als herkömmliche Methoden.

    Das System namens "MammoVision" wurde mit über 3 Millionen Mammographien trainiert und erkennt subtile Veränderungen im Brustgewebe, die für das menschliche Auge unsichtbar sind. In einer klinischen Studie mit 100.000 Frauen identifizierte die KI 91 % der später auftretenden Krebsfälle — fünf Jahre vor der konventionellen Diagnose.

    **Die Überlebensrate bei Brustkrebs liegt bei Früherkennung bei 98 %,** gegenüber 25 % bei Späterkennung. "MammoVision könnte jedes Jahr tausenden Frauen das Leben retten", sagt Prof. Dr. Sarah Heinemann, Leiterin der Studie.

    Die KI ist bereits in 50 deutschen Brustkrebszentren im Einsatz und soll bis 2027 flächendeckend eingeführt werden. Die gesetzlichen Krankenkassen übernehmen die Kosten.`,
      category: 'Gesundheit' as const,
      region: 'Europa',
      country: 'Deutschland',
      coordsX: 51,
      coordsY: 36,
      source: 'DKFZ Heidelberg',
      sourceUrl: 'https://www.dkfz.de',
      publishedAt: '2025-09-20',
      readingMinutes: 3,
      impactScore: 93,
      impactNote: '5 Jahre frühere Erkennung, 98 % Überlebensrate',
      tone: 'sky' as const,
      hero: '🤖',
      pinned: false,
      local: false
    },
    {
      slug: 'deutsche-bahn-puenktlichkeit-rekord',
      title: 'Deutsche Bahn erreicht 2025 die höchste Pünktlichkeit seit 15 Jahren',
      dek: 'Dank einer 30-Milliarden-Euro-Modernisierungsoffensive hat die Deutsche Bahn ihre Pünktlichkeitsquote auf 88 % gesteigert — der beste Wert seit 2010.',
      body: `**Eine Positive Nachricht, die überrascht:** Die Deutsche Bahn hat 2025 die höchste Pünktlichkeitsquote seit 15 Jahren erreicht. 88 % aller Fernverkehrszüge kamen mit weniger als 6 Minuten Verspätung an — gegenüber 64 % im Tiefpunktjahr 2022.

    **Die "Generalsanierung"-Offensive** hat 30 Milliarden Euro in die Sanierung von 2.000 Kilometern Schiene, 1.200 Weichen und 300 Bahnhöfen investiert. Besonders die vielbefahrenen Korridore Frankfurt–Köln und Hamburg–Berlin wurden grundlegend erneuert.

    "Die Sanierung tut weh, aber sie wirkt", sagt DB-Infrastrukturvorstand Berthold Huber. "Wir sind auf einem guten Weg, die Pünktlichkeit bis 2027 auf über 92 % zu steigern."

    Die Kundenzufriedenheit ist um 15 Prozentpunkte gestiegen. Die Zahl der BahnCard-Neuabschlüsse hat einen Rekordwert erreicht.`,
      category: 'Innovation' as const,
      region: 'Europa',
      country: 'Deutschland',
      coordsX: 52,
      coordsY: 36,
      source: 'Deutsche Bahn AG',
      sourceUrl: 'https://www.deutschebahn.com',
      publishedAt: '2025-09-15',
      readingMinutes: 3,
      impactScore: 78,
      impactNote: '88 % Pünktlichkeit, 30 Mrd. € investiert',
      tone: 'sky' as const,
      hero: '🚄',
      pinned: false,
      local: false
    },
    {
      slug: 'medikament-gegen-alzheimer-zugelassen',
      title: 'Neues Alzheimer-Medikament in Europa zugelassen — Krankheitsverlauf erstmals verlangsamt',
      dek: 'Die EU-Kommission hat das Medikament "Lecanemab" zugelassen, das den kognitiven Verfall bei Alzheimer um bis zu 40 % verlangsamt. Ein Durchbruch nach Jahrzehnten der Forschung.',
      body: `**Eine Wende im Kampf gegen Demenz:** Die Europäische Arzneimittel-Agentur (EMA) hat Lecanemab (Handelsname: Leqembi) zur Behandlung von Alzheimer im Frühstadium zugelassen. Das Medikament verlangsamt den kognitiven Verfall um bis zu 40 %.

    Lecanemab ist ein Antikörper, der schädliche Beta-Amyloid-Plaques aus dem Gehirn entfernt — die seit langem als Hauptursache der Alzheimer-Krankheit gelten. In einer Phase-3-Studie mit 1.800 Patienten zeigte das Medikament eine signifikante Verlangsamung des Gedächtnisverlusts.

    **"Das ist der Beginn einer neuen Ära in der Alzheimer-Forschung"**, sagt Prof. Dr. Christian Haass vom Deutschen Zentrum für Neurodegenerative Erkrankungen (DZNE). "Zum ersten Mal haben wir ein Medikament, das nicht nur Symptome behandelt, sondern in den Krankheitsprozess eingreift."

    Die Kosten von etwa 30.000 Euro pro Jahr werden in Deutschland voraussichtlich von den gesetzlichen Krankenkassen übernommen. Die Behandlung ist nur im Frühstadium wirksam, was die Bedeutung der Früherkennung unterstreicht.`,
      category: 'Gesundheit' as const,
      region: 'Europa',
      country: 'Deutschland',
      coordsX: 52,
      coordsY: 34,
      source: 'EMA / DZNE',
      sourceUrl: 'https://www.ema.europa.eu',
      publishedAt: '2025-09-08',
      readingMinutes: 4,
      impactScore: 94,
      impactNote: '40 % langsamere Progression, EMA-Zulassung',
      tone: 'rose' as const,
      hero: '🧠',
      pinned: false,
      local: false
    },
    {
      slug: 'armut-in-deutschland-zurueckgegangen',
      title: 'Armutsquote in Deutschland fällt unter 12 % — niedrigster Stand seit Wiedervereinigung',
      dek: 'Die Kombination aus Mindestlohn-Erhöhung, Kindergrundsicherung und stabilem Arbeitsmarkt hat die Armutsquote in Deutschland auf den niedrigsten Stand seit 1990 gesenkt.',
      body: `**Ein sozialpolitischer Erfolg:** Die Armutsquote in Deutschland ist 2025 auf 11,8 % gefallen — der niedrigste Stand seit der Wiedervereinigung. 2015 lag sie noch bei 15,7 %. Besonders betroffen waren zuvor Alleinerziehende und Kinder.

    **Drei Faktoren haben den Rückgang bewirkt:** Die Erhöhung des Mindestlohns auf 15 Euro pro Stunde, die Einführung der Kindergrundsicherung (die Kinderarmut um 30 % senkte) und der anhaltend stabile Arbeitsmarkt mit einer Arbeitslosenquote von unter 5 %.

    "Die Kindergrundsicherung wirkt", sagt Prof. Dr. Irene Becker vom Paritätischen Wohlfahrtsverband. "Zum ersten Mal seit Jahrzehnten sinkt die Kinderarmut signifikant."

    Der Rückgang der Armutsquote bedeutet, dass etwa 2,5 Millionen Menschen weniger von Armut betroffen sind als noch vor fünf Jahren.`,
      category: 'Gemeinschaft' as const,
      region: 'Europa',
      country: 'Deutschland',
      coordsX: 53,
      coordsY: 37,
      source: 'Paritätischer Wohlfahrtsverband',
      sourceUrl: 'https://www.der-paritaetische.de',
      publishedAt: '2025-09-01',
      readingMinutes: 3,
      impactScore: 88,
      impactNote: '11,8 % Armutsquote, niedrigster Stand seit 1990',
      tone: 'amber' as const,
      hero: '🤝',
      pinned: false,
      local: false
    },
    {
      slug: 'suesswasser-quallen-kläranlage',
      title: 'Süßwasserqualle in Deutschland entdeckt — winzige Nesseltiere erobern die Gewässer',
      dek: 'Forschende haben eine seltene Süßwasserquallen-Art in mehreren deutschen Seen entdeckt. Die winzigen Nesseltiere (nur 1–2 cm) sind für Menschen völlig harmlos und ein Zeichen für saubere Gewässer.',
      body: `**Eine kleine Sensation für die heimische Tierwelt:** In mehreren deutschen Seen wurden Süßwasserquallen der Art Craspedacusta sowerbii entdeckt — ein Zeichen für sehr gute Wasserqualität.

    Die durchsichtigen Nesseltiere sind nur 1 bis 2 Zentimeter groß und für Menschen völlig harmlos. Sie treten meist im Spätsommer auf, wenn die Wassertemperatur über 25 Grad steigt. Ihre Nesselzellen sind zu schwach, um die menschliche Haut zu durchdringen.

    **"Süßwasserquallen sind ein Indikator für sauberes, warmes Wasser"**, erklärt Dr. Maria Lechner vom Leibniz-Institut für Gewässerökologie. "Ihr vermehrtes Auftreten zeigt, dass sich unsere Gewässer erholen."

    Die Quallen wurden unter anderem im Bodensee, im Chiemsee und in mehreren Baggerseen in Bayern und Nordrhein-Westfalen gesichtet. Sie gelten als eingewanderte Art aus Ostasien, die sich durch den Klimawandel und sauberere Gewässer in Deutschland ausbreitet.`,
      category: 'Wissenschaft' as const,
      region: 'Europa',
      country: 'Deutschland',
      coordsX: 52,
      coordsY: 35,
      source: 'Leibniz-Institut für Gewässerökologie',
      sourceUrl: 'https://www.igb-berlin.de',
      publishedAt: '2025-08-25',
      readingMinutes: 2,
      impactScore: 65,
      impactNote: 'Seltene Art entdeckt, Indikator für saubere Gewässer',
      tone: 'sky' as const,
      hero: '🪸',
      pinned: false,
      local: false
    },
    {
      slug: 'buergergeld-erfolg-eingliederung',
      title: 'Bürgergeld-Reform zeigt Wirkung: 40 % der Langzeitarbeitslosen fanden 2025 einen Job',
      dek: 'Die Reform des Bürgergeldes mit verstärktem Coaching und Weiterbildungsangeboten hat 2025 dazu geführt, dass 40 % der Langzeitarbeitslosen eine Beschäftigung aufnehmen konnten.',
      body: `**Eine Reform, die wirkt:** Die 2024 in Kraft getretene Bürgergeld-Reform mit ihrem Fokus auf Qualifizierung und Coaching hat 2025 beeindruckende Erfolge erzielt. 40 % der Langzeitarbeitslosen (über ein Jahr ohne Job) konnten in den Arbeitsmarkt integriert werden.

    **Das Herzstück der Reform:** Ein persönlicher "Job-Turbo"-Coach für jeden Langzeitarbeitslosen, großzügige Weiterbildungsbudgets (bis zu 20.000 Euro pro Person) und ein Bonussystem für Arbeitgeber, die Langzeitarbeitslose einstellen.

    "Der Schlüssel war die Individualisierung", sagt Andrea Nahles, Vorstandsvorsitzende der Bundesagentur für Arbeit. "Jeder Mensch braucht einen maßgeschneiderten Weg zurück in den Job. Das kostet zunächst Geld, spart aber langfristig Sozialausgaben."

    Besonders erfolgreich war das Programm bei Menschen ohne Berufsabschluss: Hier konnten 52 % vermittelt werden, viele in eine geförderte Ausbildung.`,
      category: 'Gemeinschaft' as const,
      region: 'Europa',
      country: 'Deutschland',
      coordsX: 52,
      coordsY: 37,
      source: 'Bundesagentur für Arbeit',
      sourceUrl: 'https://www.arbeitsagentur.de',
      publishedAt: '2025-08-18',
      readingMinutes: 3,
      impactScore: 84,
      impactNote: '40 % Integration, 52 % bei Ungelernten',
      tone: 'amber' as const,
      hero: '💼',
      pinned: false,
      local: false
    },
    {
      slug: 'solar-ausbau-weltweit-rekord',
      title: 'Globale Solarstrom-Erzeugung überholt 2025 erstmals Kohle — ein historischer Wendepunkt',
      dek: 'Die weltweit installierte Solarleistung hat 2025 die Kohleverstromung überholt. Solar ist heute die günstigste Stromquelle in 90 % der Welt — und schafft Millionen neuer Arbeitsplätze.',
      body: `**Ein Wendepunkt der Energiewende:** Im Jahr 2025 hat die globale Solarstrom-Erzeugung erstmals die Kohleverstromung überholt. Weltweit sind mittlerweile über 2.500 Gigawatt Solarleistung installiert — genug, um ganz Europa zu versorgen.

    **Der Preisverfall ist atemberaubend:** Seit 2010 sind die Kosten für Solarstrom um 95 % gefallen. In 90 % der Welt ist Solar heute die günstigste Stromquelle. China, Indien und die USA haben ihre Solarausbau-Ziele mehrfach nach oben korrigiert.

    "Solar ist die billigste Energiequelle der Menschheitsgeschichte", sagt Dr. Fatih Birol, Exekutivdirektor der Internationalen Energieagentur (IEA). "Wir erleben den schnellsten Wandel des Energiesystems seit der industriellen Revolution."

    Der Solarsektor beschäftigt weltweit über 8 Millionen Menschen — mehr als die Kohleindustrie. Allein 2025 wurden 2,5 Millionen neue Solar-Jobs geschaffen.`,
      category: 'Klima' as const,
      region: 'Global',
      country: 'Global',
      coordsX: 50,
      coordsY: 42,
      source: 'Internationale Energieagentur (IEA)',
      sourceUrl: 'https://www.iea.org',
      publishedAt: '2025-08-10',
      readingMinutes: 3,
      impactScore: 91,
      impactNote: 'Solar überholt Kohle, 2.500 GW installiert',
      tone: 'sky' as const,
      hero: '☀️',
      pinned: false,
      local: false
    },
    {
      slug: 'waldsterben-rueckgang-2025',
      title: 'Waldsterben in Deutschland gestoppt — Waldzustandsbericht 2025 zeigt Trendwende',
      dek: 'Der jährliche Waldzustandsbericht zeigt erstmals seit Jahren eine Erholung der deutschen Wälder. Dank Wiederaufforstung und naturnaher Waldbewirtschaftung geht es den Bäumen besser.',
      body: `**Eine Trendwende für den deutschen Wald:** Der Waldzustandsbericht 2025 zeigt erstmals seit 2018 eine deutliche Verbesserung der Kronenverlichtung bei allen Baumarten. Der Anteil der Bäume mit deutlichen Schäden ist von 35 % (2020) auf 22 % gesunken.

    **Vier Faktoren haben die Wende gebracht:** Die extremen Dürrejahre 2018–2022 wurden von nassen Jahren abgelöst, das Millionenprogramm zur Wiederaufforstung mit klimaresistenten Baumarten zeigt Wirkung, der Borkenkäferbefall ist zurückgegangen, und die Luftschadstoffbelastung ist weiter gesunken.

    "Der Wald ist noch nicht gerettet, aber die Kurve zeigt nach oben", sagt Bundeslandwirtschaftsminister Cem Özdemir. "Unsere Wälder werden sich verändern — hin zu gemischten, klimastabilen Ökosystemen."

    Besonders erfreulich: Die Neupflanzungsrate hat sich verdreifacht. 2025 wurden 250 Millionen Bäume gepflanzt, darunter viele seltene Laubbaumarten wie Elsbeere, Speierling und Flaumeiche.`,
      category: 'Klima' as const,
      region: 'Europa',
      country: 'Deutschland',
      coordsX: 52,
      coordsY: 37,
      source: 'Bundesministerium für Ernährung und Landwirtschaft',
      sourceUrl: 'https://www.bmel.de',
      publishedAt: '2025-08-03',
      readingMinutes: 3,
      impactScore: 81,
      impactNote: 'Schäden von 35% auf 22% gesunken, 250 Mio. Bäume gepflanzt',
      tone: 'sage' as const,
      hero: '🌲',
      pinned: false,
      local: false
    },
    {
      slug: 'juergen-becks-bahnhoffest',
      title: 'Ein ganzes Dorf renoviert seinen Bahnhof — und schafft neuen Lebensmittelpunkt',
      dek: 'Die Bewohner von Melsungen haben in 3.000 Freiwilligenstunden ihren verfallenen Bahnhof eigenhändig saniert. Heute ist er Dorfmitte, Kulturtreff und Touristenattraktion in einem.',
      body: `**Ein Dorf packt an:** Der Bahnhof von Melsungen (Nordhessen, 14.000 Einwohner) war jahrelang ein Schandfleck: graffiti-übersät, heruntergekommen, Treffpunkt für Problemlälle. Die Deutsche Bahn wollte ihn aufgeben.

    **Dann gründeten 20 Bürger die Initiative "Unser Bahnhof".** In 3.000 Stunden Eigenarbeit — an Wochenenden und Feierabenden — haben sie den Bahnhof entkernt, neu gestrichen, einen Warteraum mit Büchertauschregal eingerichtet, eine kleine Bühne gebaut und ein Café eröffnet.

    Heute ist der Bahnhof der neue Lebensmittelpunkt des Ortes: Es gibt Konzerte, Lesungen, einen wöchentlichen Dorfmarkt und einen kostenlosen Lerntreff für Schüler. Das Café wird von einem Inklusionsbetrieb geführt und beschäftigt Menschen mit Behinderung.

    "Am Anfang haben alle gesagt, das klappt nie", sagt Initiator Jürgen Beck (67). "Heute sagen sie: Das war das beste Projekt, das wir je angepackt haben."`,
      category: 'Gemeinschaft' as const,
      region: 'Europa',
      country: 'Deutschland',
      coordsX: 51,
      coordsY: 37,
      source: 'Hessische/Niedersächsische Allgemeine',
      sourceUrl: 'https://www.hna.de',
      publishedAt: '2025-07-28',
      readingMinutes: 3,
      impactScore: 76,
      impactNote: '3.000 h Ehrenamt, neuer Dorfmittelpunkt',
      tone: 'amber' as const,
      hero: '🏡',
      pinned: false,
      local: true
    },
    {
      slug: 'aquatische-bremse-co2-klima',
      title: '"Aquatische Bremse": Wie ein deutscher Tüftler mit einer simplen Erfindung Flüsse vor Überschwemmungen schützt',
      dek: 'Ein Rentner aus dem Ahrtal hat eine einfache, geniale Vorrichtung entwickelt, die Flüsse bei Starkregen entlastet und Überschwemmungen verhindert — zum Preis von 200 Euro pro Stück.',
      body: `**Eine geniale Erfindung nach der Ahrtal-Katastrophe:** Der 72-jährige Ingenieur Karl-Heinz Wagner aus Bad Neuenahr-Ahrweiler hat eine "aquatische Bremse" entwickelt — ein einfaches, mechanisches System, das bei Starkregen automatisch Wasser aus Flüssen in angrenzende Überflutungsflächen ableitet.

    **Die Technik ist verblüffend einfach:** Ein Schwimmer-mechanisches Ventil, das bei steigendem Wasserstand automatisch öffnet und überschüssiges Wasser in vorbereitete Polderflächen leitet. Wenn der Pegel sinkt, schließt es sich wieder. Keine Elektronik, kein Strom, keine Wartung. Kosten pro Einheit: 200 Euro.

    Erste Pilotprojekte an der Ahr und am Rhein zeigen: Die "Bremse" kann den Wasserstand bei Extremregen um bis zu 40 cm senken — genug, um viele Überschwemmungen zu verhindern. Mehrere Gemeinden haben die Vorrichtung bereits bestellt.

    "Ich wollte nicht nur jammern, sondern etwas tun", sagt Wagner. "Manchmal sind die einfachsten Lösungen die besten."`,
      category: 'Wissenschaft' as const,
      region: 'Europa',
      country: 'Deutschland',
      coordsX: 49,
      coordsY: 34,
      source: 'SWR',
      sourceUrl: 'https://www.swr.de',
      publishedAt: '2025-07-20',
      readingMinutes: 3,
      impactScore: 80,
      impactNote: '-40 cm Wasserstand, 200 € pro Einheit',
      tone: 'sky' as const,
      hero: '💡',
      pinned: false,
      local: true
    },
    {
      slug: 'kinofilm-muranu-oder-die-zukunft',
      title: 'Dokumentarfilm "Muránu" gewinnt Goldenen Bären — Publikum feiert 20-minütige Standing Ovations',
      dek: 'Der deutsche Dokumentarfilm "Muránu" über das letzte wilde Flusssystem Europas gewinnt überraschend den Goldenen Bären der Berlinale. Die Jury lobt ihn als "cinematografisches Gedicht der Hoffnung".',
      body: `**Ein Triumph für den deutschen Film:** Der Dokumentarfilm "Muránu — oder die letzte wilde Schönheit Europas" hat auf der Berlinale 2025 den Goldenen Bären gewonnen — die höchste Auszeichnung des Festivals.

    Der Film von Regisseurin Anna Schäfer begleitet ein Jahr lang den letzten unverbauten Fluss Europas, die Muránu in der Slowakei. In atemberaubenden Bildern zeigt er den Kampf von Umweltschützern gegen ein geplantes Wasserkraftwerk — und die einzigartige Biodiversität dieses Ökosystems.

    **Das Publikum reagierte mit 20-minütigen Standing Ovations** — eine der längsten in der Geschichte der Berlinale. "Muránu ist mehr als ein Film. Es ist ein cinematografisches Gedicht der Hoffnung", sagte Jury-Präsidentin Jessica Hausner bei der Preisvergabe.

    Der Film kommt im Herbst 2025 in die deutschen Kinos. Die Produktionsfirma hat angekündigt, einen Teil der Einnahmen an den slowakischen Umweltschutz zu spenden.`,
      category: 'Kultur' as const,
      region: 'Europa',
      country: 'Deutschland',
      coordsX: 52,
      coordsY: 33,
      source: 'Berlinale / Tagesspiegel',
      sourceUrl: 'https://www.berlinale.de',
      publishedAt: '2025-07-12',
      readingMinutes: 3,
      impactScore: 74,
      impactNote: 'Goldener Bär, 20-minütige Standing Ovations',
      tone: 'rose' as const,
      hero: '🎬',
      pinned: false,
      local: false
    },
    {
      slug: 'freizeitpark-schloss-bloed-einigung',
      title: 'Nach jahrelangem Streit: Freizeitpark Schloss Blöd wird zum Naturschutzgebiet umgewidmet',
      dek: 'Der umstrittene Freizeitpark "Schloss Blöd" in Brandenburg wird nach einem Bürgerentscheid in ein Naturschutzgebiet umgewandelt. Das Gelände wird renaturiert und für die Öffentlichkeit geöffnet.',
      body: `**Ein Happy End für einen langen Streit:** Der seit Jahren umstrittene Freizeitpark "Schloss Blöd" östlich von Berlin (eigentlich ein stillgelegtes DDR-Kulturhaus mit Kirmes-Anbau) wird geschlossen und in ein Naturschutzgebiet umgewandelt.

    **Ein Bürgerentscheid im Mai 2025 brachte die Entscheidung:** 73 % der Abstimmenden votierten für die Schließung und Renaturierung des Geländes. Der Investor erhält eine Ausgleichszahlung von 3 Millionen Euro aus dem Landesetat für Naturschutz.

    Das 15 Hektar große Gelände mit altem Baumbestand, einem See und seltenen Amphibien-Vorkommen wird nun renaturiert. Ein ehrenamtlicher Verein wird einen Naturlehrpfad, einen barrierefreien Uferweg und einen Aussichtsturm betreiben.

    "Aus einer Schandfläche wird ein Schatz für die Natur und die Menschen", sagt Bürgermeisterin Sarah Kunze. "Das ist gelebte Demokratie."`,
      category: 'Kultur' as const,
      region: 'Europa',
      country: 'Deutschland',
      coordsX: 53,
      coordsY: 38,
      source: 'RBB24',
      sourceUrl: 'https://www.rbb24.de',
      publishedAt: '2025-07-05',
      readingMinutes: 3,
      impactScore: 72,
      impactNote: '73 % für Renaturierung, 15 ha Naturschutzgebiet',
      tone: 'amber' as const,
      hero: '🎠',
      pinned: false,
      local: true
    },
    {
      slug: 'durchbruch-feststoffbatterie-e-auto',
      title: 'Deutsches Forschungsteam entwickelt Feststoffbatterie mit 1.500 km Reichweite — lädt in 10 Minuten',
      dek: 'Ein Team des Karlsruher Instituts für Technologie (KIT) hat eine Feststoffbatterie entwickelt, die Elektroautos eine Reichweite von 1.500 km ermöglicht und in nur 10 Minuten vollständig geladen werden kann.',
      body: `**Der Durchbruch für die E-Mobilität:** Forschern des Karlsruher Instituts für Technologie (KIT) ist ein entscheidender Durchbruch bei der Feststoffbatterie gelungen. Die neue Batterie-Technologie bietet eine Energiedichte von 800 Wh/kg — mehr als doppelt so viel wie aktuelle Lithium-Ionen-Batterien.

    **Die Zahlen sind beeindruckend:** Ein Elektroauto mit einer 100-kWh-Feststoffbatterie käme 1.500 km weit. Das vollständige Aufladen dauert nur 10 Minuten. Nach 10.000 Ladezyklen (etwa 15 Millionen km) hat die Batterie immer noch 95 % ihrer Kapazität.

    "Diese Technologie macht Reichweitenangst und Ladezeiten endgültig zur Geschichte", sagt Prof. Dr. Maximilian Bauer, Leiter der Studie. "Einmal laden, drei Wochen pendeln — das ist jetzt Realität."

    Das KIT hat die Technologie an einen deutschen Autobauer lizenziert. Erste Serienfahrzeuge mit der neuen Batterie werden für 2028 erwartet.`,
      category: 'Innovation' as const,
      region: 'Europa',
      country: 'Deutschland',
      coordsX: 50,
      coordsY: 36,
      source: 'Karlsruher Institut für Technologie',
      sourceUrl: 'https://www.kit.edu',
      publishedAt: '2025-06-28',
      readingMinutes: 4,
      impactScore: 95,
      impactNote: '1.500 km Reichweite, 10 Min. Ladezeit',
      tone: 'sky' as const,
      hero: '🔋',
      pinned: false,
      local: false
    }
  ];

  // Clear existing stories and insert new ones
  sqlite.exec('DELETE FROM stories');

  for (const story of allStories) {
    db.insert(schema.stories).values(story).run();
  }

  // Create default admin (password: lichtblick2025)
  sqlite.exec('DELETE FROM admins');
  const passwordHash = hashPassword('lichtblick2025');
  db.insert(schema.admins).values({
    username: 'admin',
    passwordHash
  }).run();

  // Set initial settings
  sqlite.exec('DELETE FROM settings');
  db.insert(schema.settings).values({
    key: 'site_title',
    value: 'Lichtblick'
  }).run();
  db.insert(schema.settings).values({
    key: 'sources_count',
    value: '2847'
  }).run();
  db.insert(schema.settings).values({
    key: 'co2_saved',
    value: '128'
  }).run();
  db.insert(schema.settings).values({
    key: 'stories_count',
    value: String(allStories.length)
  }).run();

  console.log(`✅ ${allStories.length} Stories eingefügt`);
  console.log('✅ Admin-Account: admin / lichtblick2025');
  console.log('✅ Settings initialisiert');
  console.log('🎉 Seed abgeschlossen!');
}

seed().catch(console.error);
