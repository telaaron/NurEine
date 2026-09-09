# Spezifikation des Neubaus — Synthese (Stand 2026-09-09)

> Fünf Fachseiten (technik, produkt, beweis, wachstum, firma) wurden am 2026-09-09
> unabhängig geschrieben. Diese Seite ist die verbindliche Zusammenführung: was
> gilt, wo sich die Seiten widersprachen und wie entschieden wurde, in welcher
> Reihenfolge gebaut wird. Detailbegründungen stehen in den Fachseiten.
> Entscheidungen sind in `VISION.md` §13 als D-30 bis D-36 protokolliert.

## 1. Das Produkt in einem Absatz

Ein System, vier Oberflächen: **Heute** (eine belegte Story, `/` als Titelseite,
`/geschichte/[slug]` als Volltext), **Stand der Welt** (Langzeitindex V1, 1:1
übernommen), **Karte** (nur verifizierte Orte) und der **Newsletter** (eine Story +
ein Index-Satz + Beleg, 06:30). 10 öffentliche Seiten statt 118 Routen. Kein Login,
kein B2B, keine App. Ordnungssystem sind die 8 Index-Bereiche, nicht die alten
Kategorien. Claim (Vorschlag, wartet auf Aaron): **„Wie die Welt ist. Jeden Tag ein Beleg."**

## 2. Was zwischen den Fachseiten strittig war — und wie es entschieden ist

| Streitpunkt | Produkt sagte | Beweis sagte | **Entscheidung** |
|---|---|---|---|
| Beweis-Pflicht | nur für die Titelstory, Label für den Rest (P-3) | für alles Veröffentlichte ab Stufe ② (B-1) | **B-1 für alles Neue.** Importiertes Alt-Archiv trägt ein ehrliches Label statt Nachprüfung (B-9). Tage ohne Story fängt der Reserve-Pool (B-3), sonst kein Newsletter (B-4). |
| Newsletter-Scheduler | — | — | Technik empfahl Vercel Cron primär. **Geändert:** Hobby-Cron feuert nur „irgendwann in der Stunde" — für ein 06:30-Ritual zu unpräzise. **Mini-`curl` 06:30 primär, Vercel-Cron als Fallback**, beide idempotent über die Tages-Sperre. |
| Warm-100 jetzt oder nach dem Umzug | Wachstum: `/go`-Kette im Alt-System fixen (W-3) | — | **Nach dem Umzug.** Aarons 100 persönliche Nachrichten sollen auf das neue Produkt zeigen. Kein Eingriff ins Alt-System. |
| Supabase-Reihenfolge | Technik: Export → pausieren → neu anlegen | Firma: Tavenlo erst prüfen | **Geändert (siehe §5):** MustSeen bleibt bis zum Cutover aktiv. Entwicklung gegen lokales Supabase (Docker). Cutover = pausieren, neu anlegen, importieren, umhängen — Minuten statt Wochen Dunkelheit. |

## 3. Angenommene Fachentscheidungen (CEO, 2026-09-09)

Alle Empfehlungen T-1…T-8, P-1…P-10, B-1…B-10, W-1…W-10 sind **angenommen**, mit diesen Abweichungen:
T-2 (Scheduler: Mini primär, s. o.) · W-3 (entfällt) · W-8 (Claim → Aaron) · W-10 (Google Business Profile bleibt zurückgestellt bis Steuer-/Sitzfrage geklärt).

Die wichtigsten davon in Klartext:

- **Daten:** 10 Tabellen mit Präfix `ne_`, UUIDs und Slugs der Alt-Stories bleiben → null Redirects, getötete Routen 410. Alt-Stories nur `impact ≥ 55` als `published`, Rest `rejected`. Unbestätigte Abonnenten nur < 30 Tage.
- **Pipeline:** ein Python-Prozess, 14 Schritte; deterministische Vorarbeit im Code, DeepSeek für Extraktion (~0,15 $/Nacht), **drei Claude-Code-Agenten**: Redakteur (Urteil, Endtexte), Zweiter Blick (blind gegenüber dem Finder, prüft jede Behauptung am Primärtext), Bildprüfer. Später: Reel. Budget < 1 $/Nacht sichtbar in `ne_runs`. Ein Batch pro Nacht, ein Tag Vorlauf (löst E-04).
- **Quellen:** drei Rollen — Finder / Beleg / Daten-Beat. Finder sind nie Beleg. 9 von 41 RSS-Quellen bleiben aktiv, Rest deaktiviert. Neue Daten-Beats: WHO, Weltbank, FAO, Ember, Eurostat, Destatis.
- **Beweis-Schicht:** Pflichtfelder Primärquelle (mit Zitat-Span), Zahl (Wert, Bezug, Kontext), Ort mit Genauigkeitsstufe, Bild-Label, Index-Domäne + Größenordnung + Mechanismus. Fehlt eines → `blocked`. Alle Schwellen in einer `gates.toml`.
- **Texte:** STIMME auf 10 Regeln; Ich-Perspektive gestrichen, Ersatz „Stimme aus der Quelle" (nur belegte Zitate) — löst E-06. Anti-Hype: Rest-Stand-Pflicht („schlecht und besser"), Superlativ nur mit Zahl + Quelle.
- **Karte:** nur `exact/city/region`; Land nie als Pin; Zeitregler 7/30/365/Start; Puls, Klang, Standort, `/bei-dir` gestrichen.
- **Storage:** Supabase bleibt (Bestand nach Rekompression ≤ 41 MB), R2 erst nach zweimaligem Wächter-Alarm. Google Fonts self-hosted (Abmahnrisiko). KI-Bild-Label an jedem generierten Bild (Art. 50 KI-VO).
- **Newsletter:** eine Story + Index-Satz + Beleg, Betreff ≤ 70 Zeichen aus eigenem Feld, DOI bleibt, `proxy_open` (Apple MPP) getrennt gezählt. Nordstern: **Ritual-Leser** (≥ 3 Öffnungen in 7 Tagen).
- **Reel-Modul:** ~2.400 Zeilen Kern aus 764 MB; `reel render <story-id>` → MP4 + Caption; ElevenLabs „Luca", Whisper-Gate Pflicht, Beleg-Szene, Map-Szene nur bei verifiziertem Ort. Character, Musik, IG-Zweig, Auto-Skript raus. Gebaut **nach** dem Kern.
- **SEO/GEO:** Muster aus dem Alt-Repo (JSON-LD mit Wikidata-`sameAs`, llms.txt, IndexNow, Sitemap) übernehmen, Texte nach D-12 umschreiben. SEO-Agent nur vorschlagend (E-08), kein Keyword-Tool (E-09).
- **Admin:** eine Seite — Freigabe mit Beweis-Ampel, Betrieb, Kosten (Messlatte 8 $), Abonnenten.

## 4. Was Aaron entscheiden muss (steht auch in HUMAN-TODO)

| # | Frage | Empfehlung |
|---|---|---|
| A-1 | Claim: „Wie die Welt ist. Jeden Tag ein Beleg." | annehmen |
| A-2 | Tavenlo: sterben lassen (Export liegt) oder eigene DB? Vertragsstand der 9 Kunden? | prüfen, dann (a) |
| A-3 | Repo `nureine-v2` öffentlich schalten? Ruleset läuft schon auf dem Free-Plan; öffentlich braucht es nur für Discussions-Reichweite und Vertrauen | später, vor dem Cutover |
| A-4 | Steuer-/Sitzfrage der OÜ (Teltow kommuniziert, Tallinn Rechtsträger) — Steuerberater | vor jedem NAP-/Wikidata-/GBP-Schritt |
| A-5 | Wortlaut Bild-Label + Archiv-Label (öffentlich sichtbar) | Vorschläge in `beweis.md` §2 abnicken |
| A-6 | Kontaktadresse `kontakt@nureine.de` einrichten (Impressum, SECURITY.md, Crossref-User-Agent) statt `admin@must-seen.com` | ja |

## 5. Reihenfolge Phase 2 (Neubau, Repo `nureine-v2`)

Entwicklung läuft gegen **lokales Supabase (Docker)**. Das Alt-System bleibt bis zum Cutover vollständig in Betrieb (Newsletter läuft weiter). Der Export vom 2026-09-09 ist Import-Quelle und Sicherheitsnetz.

| Woche | Inhalt | Fertig, wenn |
|---|---|---|
| **1** | Schema `ne_*` + Migrationen ab 0001 + RLS · Import-Skripte (Stories, Evidence-Label, Places, Subscribers, Sends) gegen den lokalen Export · Pipeline-Skelett (RSS → Dedupe → Volltext → Vorfilter → DeepSeek-Extraktion) · `gates.toml` | Import läuft idempotent durch, 1.335 Stories lokal, Pipeline liefert Kandidaten-JSON |
| **2** | Agenten Redakteur + Zweiter Blick (Prompt, Vertrag, Kosten in `ne_runs`) · Story-Seite mit Beweis-Modul · Titelseite · `/img`-Proxy · Newsletter-Versand mit Tages-Sperre | 7 Nächte Trockenlauf lokal, Kosten < 1 $/Nacht, Newsletter-HTML abgenommen |
| **3** | Stand der Welt (Port) + Methodik mit Sperrklausel · Karte (verifizierte Orte, Zeitregler) · Archiv (Monatsseiten) · Admin-Seite · Bildprüfer · SEO-Grundausstattung · Impressum/Datenschutz neu | alle 10 Seiten, Lighthouse ≥ 90, JSON-LD valide |
| **4** | Dry-Run-Woche gegen Live-Feeds (lokal) · Cutover-Runbook · **Cutover:** MustSeen pausieren → `nureine` anlegen → Migrationen → Import → Vercel-Projekt + Domain → Mini-Crontab (eine Zeile) → Alt-Crons aus → Cloudflare-Worker löschen | nureine.de liefert vom Neubau, erster Newsletter aus dem Neubau raus, Warm-100 startet |
| **danach** | Reel-Modul · Phase 4 Abriss (Alt-Repo archivieren, MustSeen löschen — Aaron) | |

Definition of Done für den Cutover: Titelstory mit vollständiger Beweis-Schicht · Newsletter idempotent · Healthcheck prüft **Ankommen** · alle 10 Seiten mit Metadaten, Sitemap, llms.txt · KI-Label sichtbar · keine Google-Fonts vom CDN · Kosten pro Nacht im Admin sichtbar.

## 6. Nicht gebaut (gegen Scope-Kriechen)

iOS, B2B, Podcast, Klang, Streak, Referral, `/bei-dir`, Nutzer-Standort, Puls der Welt, Kategorien-Archiv, Jugendschutz-Blur, IG/Threads-Automatik, Kommentar-Bot, Analyst-/Verbesserer-Agenten, Schätzspiel (vertagt), Globus (vertagt), Keyword-Tool, Reddit-Automatik, Paid.
