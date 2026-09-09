# Human-TODO — was nur Aaron kann

> **Der einzige Ort für diese Liste.** Stand 2026-09-08. Erledigtes wird gestrichen,
> nicht gelöscht (mit Datum). Reihenfolge = Priorität aus CEO-Sicht.

## Jetzt (blockiert den CEO)

- [x] ~~Die 8 Entscheidungen treffen~~ — **erledigt 2026-09-08** (VISION D-20…D-28).
- [ ] **Supabase „MustSeen" endgültig löschen** — **erst nach dem Cutover** (D-35; bis dahin läuft das Alt-System darauf weiter). Dashboard → Settings → General → Delete project; ref `gbfbhspqwaqvnoxitohd`. Voraussetzung: `_supabase-mustseen-export-2026-09-09/MANIFEST.md` überall OK zeigt und das Projekt bereits pausiert ist. Löschen kann und darf nur Aaron; der CEO-Agent pausiert nur.
- [ ] **Tavenlo entscheiden:** 9 Kunden (3 E-Mail-Domains, letzte Rechnung 23.07.2026), 13 Rechnungen, 7 PDFs. Beim Cutover (Pausieren von MustSeen) geht tavenlo offline — bis dahin läuft es weiter. Optionen: (a) sterben lassen, Export liegt in `tavenlo/_supabase-export-2026-09-09/`; (b) eigene DB woanders (Neon Free o. ä.). Empfehlung: (a), falls die 9 Kunden Testdaten sind — bitte kurz prüfen.
- [ ] **Vercel-Projekt `tavenlo` pausieren oder löschen**, sobald (a) feststeht. `mustseen` und `mustseen-bridge-engine` sind seit 2026-09-09 pausiert.
- [x] ~~Neues GitHub-Repo~~ — **angelegt 2026-09-09**: github.com/telaaron/nureine-v2 (privat; `nureine` ist vom Alt-Repo belegt, Umbenennung beim Umzug).
- [ ] **Repo öffentlich schalten?** Ohne GitHub Pro gibt es für private Repos keinen Branch-Schutz und keine Discussions für externes Feedback. Empfehlung: public, sobald keine Secrets/Altlasten drin sind (Entscheidung, siehe REBUILD-PLAN).

## Entscheidungen (aus der Spezifikation 2026-09-09, Empfehlung jeweils dabei)

- [ ] **A-1 Claim:** „Wie die Welt ist. Jeden Tag ein Beleg." — annehmen? Gilt dann für Title, JSON-LD, DOI-Mails, Endcard, Bios, Wikidata.
- [ ] **A-2 Tavenlo:** siehe unten (Vertragsstand der 9 Kunden prüfen; Rechnungen sind bis 2034 aufzubewahren — Export liegt).
- [ ] **A-3 Repo `nureine-v2` öffentlich?** Empfehlung: vor dem Cutover, sobald geprüft ist, dass keine Secrets in der Historie liegen.
- [ ] **A-4 Steuer-/Sitzfrage der OÜ:** Teltow wird kommuniziert, Rechtsträger ist Tallinn. Steuerberater fragen, **bevor** NAP, Wikidata oder Google Business Profile angefasst werden. (Firma-Spec §3.6)
- [ ] **A-5 Label-Wortlaute** für KI-Bild und Alt-Archiv abnicken (`wiki/spec/beweis.md` §2) — beide stehen öffentlich.
- [ ] **A-6 `kontakt@nureine.de` einrichten** (Impressum, SECURITY.md, Crossref-User-Agent) statt `admin@must-seen.com`.
- [ ] **Discussions-Kategorien** im neuen Repo anlegen (Fragen · Fehler an Inhalten · Quellenhinweise · Ideen) — GitHub hat dafür keine API, ~5 Minuten im Web.

## Betrieb — sofort, je unter 15 Minuten, 0 €

- [x] ~~Tailscale starten / Phase 0 einfrieren~~ — **erledigt 2026-09-09**: 12 Cron-Zeilen auf dem Mini auskommentiert (Backup `~/crontab.backup.2026-09-08.txt`). Aktiv bleiben: Fetch-Kette 03:10, selfupdate, healthcheck, highlight, indexnow.
## Accounts & Geld (nur bei „Übernehmen" der jeweiligen Funktion)

- [ ] **Eigenes Supabase-Projekt für NurEine** (Free-Tier reicht: DB 83 MB). Heute teilt NurEine Projekt `gbfbhspqwaqvnoxitohd` mit bridge/ledge/selah/websniper — ein Quota-Riss eines Produkts legt alle lahm (Vorfall 16.–20.07.). Empfehlung: neu anlegen, beim Rebuild dorthin.
- ~~Apple Developer Account~~ — entfällt (D-21, iOS gekillt).
- [ ] **fal.ai:** kommerzielle Bildlizenz im Plan einmal bestätigen.
- [ ] **Brevo:** SPF/DKIM/DMARC im DNS prüfen (offen seit Juni).
- [ ] **Vercel-Env prüfen:** `PUBLIC_BASE_URL`, `FAL_KEY`, `ELEVENLABS_API_KEY`, `ADMIN_SESSION_SECRET` gesetzt?

## Sichtbarkeit — 0 €, je ~30 Minuten, seit Juni offen

- [ ] Google Business Profile anlegen (NAP: NurEine · Teltow, Brandenburg · nureine.de — **Achtung:** Betreiber ist laut Impressum Aaron Technologies OÜ, Tallinn; NAP vorher festlegen)
- [ ] Google Publisher Center anmelden
- [ ] Gründerfoto `static/images/aaron.jpg` ablegen
- [ ] Impressum-Link in alle Social-Profile (TMG-Pflicht)

## Distribution — nie ausgeführt, in jedem Strategie-Doc seit Mai

- [ ] **Ein Kanal, den Aaron persönlich bedient** (Entscheidung 8). Warm-100 (100 persönliche Nachrichten in 14 Tagen) ist der billigste Test, ob das Produkt jemandem fehlt.

## Erledigt

- ~~18 Cronjobs installieren~~ — **hinfällig 2026-09-08**: laufen auf dem Mini seit Wochen.
- ~~Migrationen 00051/00052 einspielen~~ — offen, aber **verschoben**: beim Rebuild kommt ein neues Schema; nicht mehr ins alte investieren.
