# Firma light — Accounts, Kosten, Recht, Haftung (Stand 2026-09-09)

> Fachteil zum Rebuild (Phase 1). Betreiber: **Aaron Technologies OÜ, Tallinn** (Impressum live).
> Keine Rechtsberatung — jede Zeile hier ist Warnstufe + Beleg + „prüfen lassen".
> Belege: Datei im Repo oder URL. Unsicheres ist als **zu prüfen** markiert.
> Entscheidungen (D-20…D-28) stehen in `VISION.md` §13; hier nur ihre Folgen für Konten und Pflichten.

## 1. Accounts-Register

Status-Legende: **bleibt** · **neu** (zweite Instanz für den Neubau) · **kündigen** · **ruht** (Konto bleibt, Nutzung endet).
Login-Ort = wo das Konto liegt, keine Secrets. Keys liegen in `~/.claude/secrets/keys.env` bzw. Vercel-Env.

| Dienst | Zweck im Neubau | Plan / Kosten | Inhaber / Login-Ort | Status | Kündigungs- / Umzugsschritt |
|---|---|---|---|---|---|
| **Vercel** | Hosting SvelteKit, Vercel Cron (ersetzt CF-Worker), Web Analytics | Hobby 0 € — Team „Aaron Technologies Projects", 13 Projekte; `must-seen.com` + `mustseen-bridge-engine` pausiert | Aaron, vercel.com | bleibt + **neu** (Projekt `nureine-v2`) | Env per `vercel env pull` sichern → neues Projekt aus `telaaron/nureine-v2` → Domain in Phase 3 umhängen → Alt-Projekt pausieren. **zu prüfen:** Hobby-Plan ist laut Vercel-Bedingungen für nicht-kommerzielle Nutzung; Betreiber ist eine OÜ mit USt-ID — Pro (20 $/Mo) oder Bestätigung, dass es toleriert wird |
| **Supabase** | DB (~8 Tabellen), Storage `story_images` | Free 0 € (500 MB DB, 1 GB Storage, 5 GB Egress); Konto erlaubt 2 aktive Projekte | Aaron, supabase.com | **neu** (`nureine`, Region EU) · `MustSeen` `gbfbhspqwaqvnoxitohd` **pausieren → löschen** · `JazzChords` bleibt | heute: Export (läuft, §6) → pausieren; löschen erst nach Import-Verifikation im Neubau. **zu prüfen:** Region des Alt-Projekts (DSE spricht von US-Übermittlung); Free-Projekte werden nach ~7 Tagen Inaktivität pausiert — tägliche Pipeline verhindert das |
| **Cloudflare** | heute Newsletter-Trigger 04:40 (`workers/newsletter-cron/wrangler.toml`) | Free 0 € | Aaron, dash.cloudflare.com | **kündigen (Worker)**, Konto ruht | nach Cutover `wrangler delete`; `CRON_SECRET` im Neubau neu erzeugen. **zu prüfen:** liegt das DNS von nureine.de bei Cloudflare? Dann bleibt das Konto Pflicht |
| **Brevo** | Newsletter-Versand, DOI-Mails, Webhook Bounces (`src/routes/api/webhooks/brevo`) | Free 0 € — 300 Mails/Tag (= Grenze bei ~300 Abos) | Aaron, app.brevo.com | **bleibt** | Kontakte **inkl. Blacklist/Abmeldungen** exportieren (§6); SPF/DKIM/DMARC prüfen (offen seit 06/2026); Reply-To muss echtes Postfach sein (`.env.example`) |
| **DeepSeek** | ein LLM-Aufruf pro Artikel (`deepseek-chat`) | Prepaid, Cent-Beträge; Guthaben 45,59 $ (06/2026) | Aaron, platform.deepseek.com | **bleibt** | nichts; Guthaben-Alarm einrichten (ein 402 hat den Fetch schon gestoppt) |
| **fal.ai** | Story-Bilder + TikTok-Bilder (Seedream v4.5, `fetch_stories.py:100`) | Pay-per-use 0,04 $/Bild, ~7–8 €/Mo bisher | Aaron, fal.ai/dashboard | **bleibt** | kommerzielle Nutzung der Outputs im Plan bestätigen (Human-TODO seit 06/2026) |
| **ElevenLabs** | TikTok-Stimme „Luca" (D-22) | Plan **zu prüfen** (Docs: Free ~10k Zeichen, 47,5 % verbraucht 06/2026; Fakten 09/2026 zählen ihn zu den 15 $/Mo) | Aaron, elevenlabs.io | **bleibt** (nur TikTok) | Vorlesen-Feature ist gekillt → Key nur noch im TikTok-Modul; Plan ggf. auf Free zurück |
| **OpenAI** | TTS-Fallback der Edge Function `generate-audio` | Key nur in Supabase-Edge-Secrets (`.env.example`) | Aaron, platform.openai.com | **kündigen** (Key löschen) | entfällt mit dem Kill des Vorlesens; Key im Alt-Projekt widerrufen |
| **edge-tts / Whisper** | TTS-Fallback, Aussprache-Gate (lokal) | 0 €, kein Konto | — | bleibt | nichts |
| **Meta: Instagram `nureine.de`, FB-Seite, App „NurEine Poster"** | manuelles Posten; Automation gekillt (D-22) | 0 € | Aaron, business.facebook.com | **ruht** | Page-Token in Vercel entfernen, App-Berechtigungen zurückziehen; Impressum-Link in Bio (§3.6) |
| **Threads** | — | 0 € | Meta-Konto | **ruht** | `THREADS_ACCESS_TOKEN` löschen |
| **TikTok** (Creator-Konto) | manuelles Posten mit KI-Label | 0 € | Aaron, tiktok.com | **bleibt** | Impressum-Link in Bio; Auto-Post-Anbieter (upload-post ~16–24 $/Mo) **nicht** anlegen |
| **Apple Developer** | — | 99 €/Jahr, nie gekauft | — | **entfällt** (D-21) | nichts |
| **Google Search Console** | Indexierung, Domain-Property | 0 € | Aaron, search.google.com | **bleibt** | Domain-Property überlebt den Umzug; Sitemap neu einreichen |
| **Google Publisher Center / Business Profile** | Discover-Eligibility / Brand-Signal | 0 € | nicht angelegt | **offen** | erst nach NAP-Entscheid (§3.7) |
| **IndexNow / Bing** | Sofort-Indexierung | 0 € | Key-Datei `static/<key>.txt` | **bleibt** | neuen Key im neuen Repo erzeugen (alter steht in `.env.example`, ist aber ohnehin öffentlich) |
| **Domain nureine.de** | NAP-Anker | ~10–15 €/Jahr, Registrar **zu prüfen** | Aaron | **bleibt** | Auto-Renew + Inhaber = OÜ prüfen (WHOIS/Registrar-Konto) |
| **GitHub** | `telaaron/nureine-v2` (privat); Alt-Repo archivieren; Action `langzeitindex.yml` (So 03:00 UTC) | Free 0 € (2.000 Actions-Min/Mo privat) | Aaron (`telaaron`), `gh` auf Mini eingeloggt | bleibt + **neu** | Secrets im neuen Repo setzen; Alt-Repo nach Phase 3 read-only |
| **Tailscale** | SSH MacBook ↔ Mini (100.123.159.38) | Personal 0 € | Aaron | **bleibt** | nichts; auf dem MacBook derzeit gestoppt (Human-TODO) |
| **Mac Mini** (`mac-mini-server`, Linux) | Runner: 1 Cron (Pipeline) + Agenten, Bild-Archiv | Hardware da; Strom **zu messen** (~2–4 €/Mo geschätzt) | Aaron, physisch | **bleibt** | Crontab von 17 auf 1 Eintrag; `crontab -l` vorher sichern |
| **Anthropic Claude Max** | Claude-Code-Agenten (D-24) | Abo, Preis **zu prüfen** (Plan 5×/20×); nicht NurEine-spezifisch | Aaron, claude.ai | **bleibt** | §2: Kontingent ist die Grenze. **zu prüfen:** Nutzungsbedingungen für unbeaufsichtigten Cron-Betrieb des Abos |
| **Esri ArcGIS Online** (Karten-Kacheln, `src/lib/map/basemap.ts:26`) | Basemap `/karte` | 0 €, kein Konto | — | **zu prüfen** | Esri-Nutzungsbedingungen für kommerzielle Einbindung ohne Developer-Konto; Attribution „Tiles © Esri" ist gesetzt |
| **ip-api.com** (`src/routes/bei-dir/+page.svelte:108`) | IP-Geolokation | Free = nur nicht-kommerziell, **kein HTTPS im Free-Tier** → der Aufruf scheitert vermutlich still | — | **kündigen** (Code + CSP + DSE) | `/bei-dir` ist laut Rebuild-Plan ohnehin nicht Kern |
| **Google Fonts** (`src/app.html:8-24`) | Schriften | 0 € | — | **ersetzen** (self-host) | §3.4 |
| Gemini, Resend, ManyChat, SEMrush, openPR-Verteiler | — | — | — | **nie aktiv / entfällt** | keine Konten anlegen |

## 2. Kosten-Blatt

**Heute (bar):** ~15 $/Monat = fal.ai ~7–8 € + DeepSeek Cents + ElevenLabs (`wiki/00-LAGE.md`, `wiki/inventar/docs.md` (b)). Alles andere 0 €.

**Ziel Neubau: < 20 €/Monat bar.**

| Posten | Annahme | €/Monat |
|---|---|---|
| fal.ai Seedream | 1 Story-Bild/Tag + ~4 TikTok-Bilder/Tag × 0,04 $ | ~5–6 |
| DeepSeek | 1 Aufruf/Artikel, ~50 Artikel/Tag Vorfilter → ~5 Analysen | < 1 |
| ElevenLabs | nur TikTok-VO; Free reicht bei ~1 Video/Tag à 300 Zeichen, sonst Starter ~5 $ | 0–5 |
| Domain | Jahrespreis / 12 | ~1 |
| Mini-Strom | Schätzung | ~2–4 |
| Vercel Hobby, Supabase Free, Brevo Free, GitHub, Tailscale, GSC | 0 € — **solange** 16→300 Abos, 500 MB DB, Hobby toleriert | 0 |
| **Summe** | | **~9–17 €** |

**Was das Claude-Max-Abo trägt:** alle Agentenläufe (heute ~776 $ nominal seit 19.07., Fetch Ø 8 $/Nacht für Ø 1 Story — Mini-Logs). Die Grenze ist **Kontingent, nicht Geld**: 5-Stunden-Fenster + Wochenlimit des Abos. Wird es erschöpft, stehen Pipeline **und** Aarons interaktive Sessions. Konsequenz für D-24: Budget pro Lauf sichtbar machen, Messlatte deutlich unter 8 $ nominal/Nacht; DeepSeek für alles Deterministische.

**Fällt mit dem Kill weg:** Apple 99 €/Jahr (nie gezahlt, jetzt endgültig vom Tisch), upload-post/Blotato 16–29 $/Mo (nie gebucht), Supabase Pro 25 $/Mo (war als Dauerlösung erwogen — eigenes Projekt macht es unnötig), Reel-Regie-Agent 146 $ nominal Kontingent, 7 Social-Cron-Trigger, OpenAI-TTS-Key. **Kostenrisiken nach oben:** Brevo > 300 Mails/Tag (Starter ab ~9 €), Vercel-Hobby-Klärung (Pro 20 $), Egress-Leck bei Bildern (Regel `storyImageSrc`, `CLAUDE.md`).

## 3. Rechts-Check (Warnstufe · Beleg · Handlung)

Warnstufe: **A** = jetzt handeln (Abmahn-/Bußgeldrisiko) · **B** = vor Cutover · **C** = beobachten.

### 3.1 Impressum (`src/routes/impressum/+page.svelte`, live geprüft 2026-09-09)

| Punkt | Befund | Stufe |
|---|---|---|
| § 5 DDG: Firma, Rechtsform, Anschrift, Register-Nr. 17336129, Vertretung (Aaron Julius Weege), USt-ID EE102955587 | **vorhanden** | — |
| § 18 Abs. 2 MStV Verantwortlicher mit Anschrift | vorhanden („Anschrift wie oben") | — |
| Schnelle elektronische Kontaktaufnahme | nur E-Mail `admin@must-seen.com` — Fremddomain, kein zweiter Kanal; Kommentar `TODO Aaron` im Code | **B** — eigene Adresse `@nureine.de` mit echtem Postfach; zweiter Kontaktweg (Formular/Telefon) prüfen lassen |
| Fußzeile „Stand Juni 2026 … ersetzt keine Rechtsberatung" | steht **live** — signalisiert Unfertigkeit | **B** — Satz entfernen, Datum aktualisieren |
| Anwendbares Recht: OÜ (EE) mit deutschsprachigem Angebot für den deutschen Markt | Impressum erfüllt DDG **und** estnische Angaben — doppelt ist unschädlich. Ob MStV (Gegendarstellung, Sorgfalt) gilt, ist Marktort-/Herkunftslandfrage | **C — prüfen lassen** |
| Impressum `noindex`, nicht in Sitemap | zulässig; Link im Footer muss von jeder Seite erreichbar sein (2 Klicks) | C — im Neubau sicherstellen |

### 3.2 Datenschutzerklärung (`src/routes/datenschutz/+page.svelte`, live)

| Dienst | Ist in DSE | Ist im Code | Handlung |
|---|---|---|---|
| Brevo (DOI, AVV) | § 3–4: DOI, IP+Zeitpunkt, AVV Art. 28 | DOI mit IP-Speicherung `api/subscribe/+server.ts:161` ✓ | **B**: Brevo-AVV (DPA in den AGB) einmal herunterladen und ablegen; Firmierung „Sendinblue GmbH bzw. SAS" gegen aktuelle Brevo-Angabe prüfen |
| Vercel Hosting + **Web Analytics** | § 5 Hosting ✓; § 6 nennt „eigene Analyse" | `injectAnalytics` (`+layout.svelte:10`, Script von `va.vercel-scripts.com`) + eigenes `/api/track` | **B**: Vercel Web Analytics ausdrücklich nennen (cookielos, Hash) |
| Supabase (Region) | „Übermittlung in die USA per SCC" | Region des Alt-Projekts **zu prüfen** | **B**: neues Projekt in EU anlegen, DSE danach auf EU-Verarbeitung + Supabase-DPA umstellen |
| ip-api.com | § 7 genannt | Free-Endpoint nur nicht-kommerziell, HTTPS nur Pro → Funktion vermutlich tot | **A**: aus Code, CSP (`vercel.json:25`) und DSE entfernen |
| Google Fonts | **nicht genannt** | `preconnect` + Stylesheet von `fonts.googleapis.com` (`app.html:8,18,24`) = IP-Übermittlung an Google ohne Einwilligung; LG München I 2022 (3 O 17493/20) löste Abmahnwelle aus | **A**: Fonts self-hosten (Newsreader, Inter, Space Grotesk, JetBrains Mono sind OFL); `preconnect` und CSP-Einträge entfernen |
| Esri-Kacheln (`server.arcgisonline.com`) | **nicht genannt** | Browser lädt Kacheln direkt von Esri (US) → IP-Übermittlung | **B**: in DSE aufnehmen oder EU-Tile-Quelle/Proxy; Nutzungsbedingungen prüfen |
| Feedback-Formular, Referral-Capture, Story-Einreichung (`/api/feedback`, `captureRef`, `/api/submit-story`) | nicht genannt | IP nur gehasht (`feedback/+server.ts`) | **C**: im Neubau nur aufnehmen, was bleibt |
| Aufsichtsbehörde | „eine Datenschutz-Aufsichtsbehörde" | — | C: zuständig ist wohl die estnische AKI — **prüfen lassen** |
| DSB / EU-Vertreter | nicht nötig (< 20 Personen, Sitz in der EU) | — | — |

### 3.3 EU-KI-VO Art. 50 (Transparenz; gilt seit 2026-08-02)

| Output | Wo steht die Kennzeichnung heute | Bewertung | Neubau |
|---|---|---|---|
| **KI-Text** (Story, Summary) | Story-Seite „KI-recherchiert · von Menschen verantwortet" (`geschichte/[slug]/+page.svelte:246`), `/methodik:95`, Impressum | Art. 50 Abs. 4 S. 2 Ausnahme greift bei menschlicher redaktioneller Kontrolle + Verantwortung — Label trotzdem behalten | Label auf jeder Story + Newsletter-Fußzeile |
| **KI-Bild** (Seedream, fotorealistisch) | **nirgends am Bild**: `alt=""`, keine Bildunterschrift (`+page.svelte:232`); nur im Reel („Illustration & Stimme: KI", `ReelTikTok.tsx:784`) | **A** — realistische Darstellungen realer Ereignisse/Orte können als Deepfake i.S.v. Abs. 4 S. 1 gelten; Kennzeichnung fehlt auf Web, Newsletter, OG-Bild, Karte | Pflichtfeld `image_ai: true` → Caption „KI-Illustration, kein Foto" an jedem Ausspielort (Web, Mail, OG, Social-Caption) |
| **KI-Stimme** (ElevenLabs im TikTok) | im Video-Abspann (`ReelTikTok.tsx:784`) + Plattform-Label „KI-generierte Inhalte" per Admin-Checkliste (`admin/tiktok/+page.svelte:141`) | ausreichend, aber **manuell** — hängt am Häkchen | Checkliste bleibt Pflicht; Label im Video nicht abschaltbar |
| Maschinenlesbare Markierung (Abs. 2) | Anbieterpflicht (fal/ByteDance, ElevenLabs), nicht NurEine | C — Metadaten beim Komprimieren (`image_utils.py`) nicht strippen, falls vorhanden | prüfen |

### 3.4 Urheberrecht

| Vorgang | Beleg | Risiko | Regel für den Neubau |
|---|---|---|---|
| Volltext-Extraktion fremder Artikel (`trafilatura`, `fetch_stories.py:1665`) | interne Analyse | TDM-Schranke (§ 44b UrhG / Art. 4 DSM-RL) greift nur ohne maschinenlesbaren Nutzungsvorbehalt — viele Verlage setzen ihn (robots.txt, TDM-Header) | **B**: Vorbehalt respektieren (robots/`tdm-reservation` prüfen, Log), nur Text speichern, den man braucht, nie Volltext ausliefern |
| Deutsche Neufassung (~600 Wörter, `summary` 3–5 Sätze; Prompt `fetch_stories.py:1259,1283` verlangt „Zitate aus dem Originaltext") | Ausspielung | Übernahme von Struktur + Formulierungen eines einzelnen Artikels = unfreie Bearbeitung; Presse-Leistungsschutzrecht § 87g UrhG bei mehr als „sehr kurzen Auszügen" | **B**: Fakten frei, Formulierungen nicht; Zitate nur kurz, in Anführungszeichen, mit Quelle (§ 51 UrhG); Ziel = **Primärquelle** (Studie, Behörde), nicht Aggregator (`nureine-aggregator-verkuerzungsfehler`) |
| Fremde Bilder | keine — alle Bilder KI-generiert | — | so lassen |
| fal.ai / Seedream-Bilder kommerziell | fal-ToS räumt Output-Rechte ein; ByteDance-Modellbedingungen **zu prüfen** | C | Human-TODO bestätigen; keine Markenlogos/reale Personen prompten |
| Esri-Kacheln, Weltbank/WHO-Daten (Langzeitindex) | Attribution gesetzt; CC-BY-4.0 bei Weltbank | C | Quellenzeile auf `/stand-der-welt` |

### 3.5 Impressumspflicht in Social-Profilen
Instagram, TikTok, Threads, FB-Seite: geschäftsmäßiges Angebot → Impressum in 2 Klicks erreichbar (Link auf `/impressum` in der Bio). Heute **offen** (`wiki/HUMAN-TODO.md`). Stufe **A**, 10 Minuten, 0 €.

### 3.6 NAP-Widerspruch: „Teltow" vs. „Tallinn"

| Stelle | sagt | Beleg |
|---|---|---|
| Impressum, Datenschutz | Aaron Technologies OÜ, **Tallinn** | live |
| Footer, Newsletter-Fußzeile, DOI-Mail, `llms.txt`, `/ueber-uns`, JSON-LD `NewsMediaOrganization.address` | **Teltow, Brandenburg, DE** | `Footer.svelte:86`, `newsletter.ts:108,406`, `subscribe/+server.ts:124`, `+layout.svelte:204`, `ueber-uns:123` |
| Wikidata-Vorlage | P17 = Deutschland, P159 = Teltow | `ops/wikidata/nureine-quickstatements.txt:15-16` |
| `/redaktion` | „Aaron, 20, Musiker aus Teltow" | `redaktion/+page.svelte:98` |

**Bewertung:** Rechtsträger ist eindeutig die OÜ (Impressum, USt-ID). „Teltow" ist als *Redaktionssitz/Arbeitsort* vertretbar, als *Firmensitz* falsch.
**Hauptrisiko (Stufe A, steuerlich):** Wird eine estnische OÜ faktisch aus Deutschland geführt, kann der Ort der Geschäftsleitung/eine Betriebsstätte in DE liegen — mit deutscher Steuerpflicht. Das ist eine bekannte Falle bei e-Residency-Firmen. **Steuerberater prüfen lassen, bevor Teltow weiter als Sitz kommuniziert wird.**
**Regel bis dahin:** Impressum/DSE/Rechnungen = OÜ Tallinn. Footer/Newsletter/JSON-LD/llms.txt: „Redaktion in Teltow, Brandenburg · Betreiber Aaron Technologies OÜ, Tallinn" (ein Satz, beides wahr). Wikidata: P159 nur mit Qualifikator „Redaktionssitz" oder weglassen, P17 auf EE oder mit Beleg Impressum. **Google Business Profile: nicht anlegen** — ohne besuchbare Geschäftsadresse in Teltow droht Sperrung; Nutzen für ein Online-Medium ohnehin fraglich.

## 4. Tavenlo-Kunden (geht mit dem Pausieren von `MustSeen` offline)

Bestand: 9 Kunden (3 E-Mail-Domains), letzte Rechnung 23.07.2026, 7 Rechnungs-PDFs im Bucket, `ledge_invoices` — **exportiert** (Fakten 2026-09-09). Was Tavenlo vertraglich war (SaaS? Dienstleistung?), ist im NurEine-Repo nicht belegt → alles unten **prüfen**.

| Pflicht | Warnung | Handlung |
|---|---|---|
| Rechnungsaufbewahrung | EE: 7 Jahre (Raamatupidamise seadus); DE: 8 Jahre für Belege (seit 2025) — welches gilt, hängt an §3.6 | PDFs + `ledge_invoices` unveränderbar, an zwei Orten, bis mind. **2034** |
| Kundeninformation | Abschaltung ohne Ankündigung kann Vertragsverletzung sein, wenn Leistung noch geschuldet ist (Laufzeit? Vorauszahlung nach 23.07.?) | **prüfen**: Verträge/Laufzeiten; ggf. kurze Mail an 3 Domains mit Abschaltdatum, Datenexport-Angebot, Rückerstattung offener Zeiträume |
| DSGVO für Kundendaten | Kundendaten (Namen, Mails, Rechnungen) im Export = weiterhin Verarbeitung; Art. 17 Löschung, sobald Aufbewahrungszweck endet | Export getrennt von NurEine, verschlüsselt, Zugriff nur Aaron; Kundenstammdaten außerhalb der Rechnungen nach Abschluss löschen |
| Umsatzsteuer | Rechnungen mit USt-ID der OÜ → Meldung in EE läuft weiter, Umsatz 0 | Buchhalter informieren |

## 5. Haftung beim „Beweis"-Anspruch — minimaler Prozess

Risiko: falsche Tatsachenbehauptung (Zahl, Ort, Zuschreibung) → Berichtigungs-/Unterlassungsanspruch, bei journalistisch-redaktionellen Telemedien ggf. **Gegendarstellung** (§ 20 MStV); zusätzlich Reputationsschaden für ein Produkt, dessen Versprechen „belegt" ist. Ist-Befund: `/methodik:95` verspricht öffentliche Korrektur, aber im Code gibt es **keinen** Korrektur-Mechanismus (0 Treffer „Korrektur" in Story-/Redaktionsseiten); 3 von 5 geprüften Archiv-Storys waren faktisch falsch (`nureine-aggregator-verkuerzungsfehler`).

| Baustein | Minimum im Neubau |
|---|---|
| Wortwahl | „belegt durch …" mit Link, nie „bewiesen"; Zahl immer mit Einheit, Zeitraum, Quelle |
| Quellenangabe | Pflichtfelder je Story: Primärquelle-URL, Abrufdatum, Archivkopie (Wayback-Snapshot-URL), Zitat-Stelle der Zahl (VISION §4.2) |
| Korrektur | Felder `corrected_at`, `correction_note`; sichtbarer Kasten „Korrigiert am …: vorher/nachher" auf der Story; Korrektur > Kernaussage → ein Satz im nächsten Newsletter; Korrekturen-Liste unter `/methodik` |
| Eingang | eine Adresse `redaktion@nureine.de` (Impressum), Reaktion binnen 48 h, Log (Datum, Rüge, Entscheidung) |
| Depublizieren | Story bleibt mit Korrekturhinweis online; Löschung nur bei Rechtsanspruch, dann 410 + Notiz |
| Sperrklausel D-26 | fallender Index = Titelmeldung — genau dieser Prozess macht sie glaubwürdig |

## 6. Datenexport / Backup vor dem Abriss

| Bestand | Status | Ziel-Ort | Aufbewahrung |
|---|---|---|---|
| DB-JSONL aller Tabellen (NurEine + Fremdprodukte), Schema inkl. RLS-Policies, Storage-Buckets (`story_images`, `story_reels`, Audio) | **läuft** (2026-09-09) | externe SSD, verschlüsselt (age/gpg) + 1 Offsite-Kopie (privater Cloud-Ordner, nicht im Repo) | NurEine: bis Import verifiziert + 12 Monate; Fremdprodukte: bis Eigentümer entscheidet |
| **Brevo-Kontakte inkl. Blacklist/Abmeldungen + DOI-Zeitstempel** | offen | wie oben | Abmeldungen **dauerhaft** — Re-Import eines Abgemeldeten = UWG-Verstoß; Einwilligungsnachweise, solange Abo besteht + 3 Jahre |
| Vercel-Env (`vercel env pull`), Cloudflare-Secret, `~/.claude/secrets/keys.env`, Supabase-Edge-Function-Secrets | offen | nur lokal verschlüsselt, nie Cloud | bis neue Secrets aktiv, dann rotieren |
| Analytics-Snapshot (Vercel Web Analytics CSV, GSC-Export, `nureine_events`, `nureine_newsletter_sends`) | offen — Vercel-Hobby-Retention ist kurz | wie DB | 12 Monate (Basislinie für den Neubau) |
| Mini: `crontab -l`, `ops/state`, Bild-Archiv, Agenten-Logs mit `total_cost_usd` | offen | Mini + SSD | Logs 6 Monate (Kostenmesslatte D-24) |
| Tavenlo: 7 PDFs, `ledge_invoices`, Kundenstamm | **exportiert** | **getrennter** verschlüsselter Ordner | Rechnungen bis 2034 (§4); Rest bis Vertragsende + Verjährung, dann löschen |
| Alt-Repo | archivieren nach Phase 3 | GitHub read-only | unbegrenzt |

Prüfschritt vor `pause`: Zeilenzahlen je Tabelle im Export = `count(*)` in der DB; Bucket-Dateizahl = Objektliste; ein Story-Bild und eine Rechnung stichprobenhaft öffnen.

## 7. Warnungen für den CEO (priorisiert)

1. **Steuer-/Sitzfrage der OÜ** (§3.6): Teltow als kommunizierter Sitz einer aus Deutschland geführten estnischen OÜ ist das teuerste offene Risiko — vor jedem NAP-, Wikidata- oder GBP-Schritt Steuerberater fragen.
2. **Google Fonts vom Google-CDN** (§3.2): bekannter Abmahn-Tatbestand, in 30 Minuten behebbar (self-host), bis dahin live auf jeder Seite.
3. **KI-Bilder ohne Kennzeichnung** (§3.3): Art. 50 KI-VO gilt seit 02.08.2026; fotorealistische Seedream-Bilder tragen auf Web, Newsletter, OG kein Label — nur im Reel.
4. **Tavenlo-Abschaltung heute** (§4): 9 Kunden gehen offline, ohne dass Vertragsstand/Vorauszahlungen belegt sind — erst prüfen, dann pausieren, oder Kunden vorab informieren.
5. **Brevo-Export ohne Blacklist** (§6): wer nur „bestätigte Kontakte" exportiert und neu importiert, verliert die Abmeldungen — das ist der eine Import-Fehler, der Beschwerden erzeugt.

Nachrang (B/C): Vercel-Hobby-Kommerzfrage, ip-api/Esri in DSE, Impressum-Fußnote „Gerüst", Max-Abo-Bedingungen für Cron-Betrieb, TDM-Vorbehalt beim Crawlen.

## 8. Human-TODO-Kandidaten (nur Aaron; Aufwand / Kosten)

| # | Aufgabe | Min | € |
|---|---|---|---|
| 1 | Steuerberater/Buchhalter (EE + DE) zur Sitz-/Betriebsstättenfrage anfragen; bis zur Antwort Teltow nur als „Redaktion" bezeichnen | 20 | Beratung offen |
| 2 | Tavenlo: Verträge/Laufzeiten der 9 Kunden sichten; Entscheidung „Mail an 3 Domains ja/nein" **vor** dem Pausieren | 30 | 0 |
| 3 | Brevo: Vollexport Kontakte + Blacklist + Statistik (CSV) herunterladen; AVV-PDF ablegen | 15 | 0 |
| 4 | Supabase: neues Projekt `nureine` in **EU-Region** anlegen, Keys nach `keys.env` (`NUREINE_V2_*`); Region des Alt-Projekts notieren | 10 | 0 |
| 5 | Vercel: Support/Docs zu Hobby + kommerziell (OÜ) klären; ggf. Pro | 15 | 0 oder 20 $/Mo |
| 6 | Impressum-Link in Instagram-, TikTok-, Threads-, FB-Bio; eigene Kontaktadresse `@nureine.de` mit Postfach einrichten | 20 | 0 (Postfach ggf. 1 €/Mo) |
| 7 | fal.ai: kommerzielle Nutzung für Seedream im Plan bestätigen (Screenshot ablegen) | 10 | 0 |
| 8 | ElevenLabs: aktuellen Plan/Kontingent prüfen, ggf. auf Free zurück | 5 | 0 bis −5 $/Mo |
| 9 | `vercel env pull` + Cloudflare-Secret + Edge-Secrets sichern, OpenAI-Key widerrufen | 15 | 0 |
| 10 | Domain: Registrar, Inhaber (OÜ?), Auto-Renew, DNS-Ort prüfen | 10 | 0 |
| 11 | Wikidata-Vorlage (`ops/wikidata/`) **nicht** einspielen, bis #1 geklärt ist | 0 | 0 |
| 12 | Anthropic-Bedingungen: unbeaufsichtigter Cron-Betrieb mit Max-Abo zulässig? (Docs/Support) | 15 | 0 |
