# STRATEGY.md — NurEine

> Lebendes Strategie-Dokument. Referenz für alle weiteren Sessions.
> Erstellt: 2026-06-12 (Phase-0-Daten gemessen, Benchmarks live recherchiert).
> Ergänzt: ROADMAP.md (Produkt), GROWTH.md (Social-Mechanik), BUSINESS.md (B2B), BACKLOG.md (Tasks).

---

## 0 · Zahlenbild (gemessen 2026-06-12, nicht geschätzt)

| Metrik | Wert | Quelle |
|---|---|---|
| Newsletter-Abonnenten | **13** (11 bestätigt), +1–4/Woche seit Anfang Mai | `nureine_subscribers` |
| B2B-Kunden | **0 aktiv** (1 Eintrag, nicht aktiv) | `nureine_b2b_clients` |
| Zustellrate (30 T) | 284/284 = 100 %, 0 Bounces | Brevo API |
| Öffnungsrate (30 T) | 46 unique Opens ≈ 16 % gemessen — **unzuverlässig**: 346 Proxy-Loads (Apple MPP) | Brevo API |
| Klickrate (30 T) | 104 unique Klicks ≈ 37 % — Mini-Sample, größtenteils Eigen-/Freundeskreis | Brevo API |
| Instagram | 13 Feed-Posts + 33 Stories seit 07.06. · ~4 Follower · 129 Profilaufrufe/30 T | IG + Memory 11.06. |
| **Saves/Reach (Nordstern!)** | **KEINE Daten** — Insights-API schlägt seit Tag 1 still fehl (`updated:0`) | Graph-API-Test heute |
| Website (30 T) | 714 Pageviews / 60 Sessions — Großteil Aaron selbst (localhost + /admin). Externe Referrer: FB 8, Google ~17, IG 2 → **echter Fremd-Traffic < 100 Views/Monat** | `nureine_events` |
| Redaktion (14 T) | 945 KI-Entscheidungen, 78 akzeptiert (8,3 %, ~12:1) · 389 Stories total | `nureine_fetch_log` |
| Pipeline-Gesundheit | 13/19 fetch-Runs (7 T) mit „DeepSeek returned unparseable response" — Teilverlust pro Run | `nureine_cron_runs` |
| Betriebskosten | ~13,50 $/30 T · DeepSeek-Guthaben 45,59 $ · ElevenLabs 47,5 % verbraucht | /admin/kosten |
| Threads | Setup fertig 12.06., erster Auto-Post 13.06. 08:15 UTC | env + Cron |

**Diagnose in einem Satz:** Das Produkt ist auf 10.000-Abonnenten-Niveau ausgebaut,
die Distribution ist bei null — und die Maschine verschleiert das, weil sie täglich
„Fortschritt" produziert (46 IG-Posts an ~4 Follower).

---

## 1 · Benchmarks — was die Besten wirklich gemacht haben

### Direkte Vorbilder (Good News, Newsletter-first)

| Plattform | Kernzahlen | Übertragbares Prinzip | Greift 0→1? |
|---|---|---|---|
| **Nice News** (US) | ~1 Mio. Subs in 3 Jahren; profitabel nach 2 J.; >90 % Umsatz aus Inbox-Sponsoring | Wachstum = **Cross-Promos + Giveaways mit anderen Newslettern** + Word-of-Mouth, erst dann Paid. Zielgruppe: weiblich, 35+ | Teils — Swaps brauchen ~500+ Subs als Tauschware |
| **Fix the News** (ehem. Future Crunch) | Bezahlmodell, Spenden-Anteil | Paid-Newsletter funktioniert in der Nische — aber erst nach Jahren Vertrauensaufbau | Nein (Paywall bewusst verschoben ✓) |
| **Positive.News** | Member-finanziert | Ownership-Modell („Leser besitzen das Magazin") als Bindung | Nein, später prüfbar |
| **Good News Movement** (IG) | 6 Mio. Follower, journalist-run | „0 politics"-Klarheit + menschliches Gesicht (Michelle Figueroa steht sichtbar dahinter) | **Ja: menschliches Gesicht ist kostenlos** |

### Mechanik-Vorbilder (andere Nische, übertragbare Maschinen)

| Plattform | Kernzahlen | Übertragbares Prinzip | Greift 0→1? |
|---|---|---|---|
| **1440** | 4+ Mio. Subs, kein VC; früh 65 % Open-Rate | Phase 1: **Forwarding + Swaps mit gleich großen Newslettern**. Phase 2: Paid ab Product-Market-Fit (CAC 2–3 $, Payback 5–6 Mo., >1 M $/Monat reinvestiert) | Phase-1-Mechanik ja; Paid erst mit B2B-Umsatz |
| **Morning Brew** | Referral = 30 % aller Subs (früh 80 % des Wachstums); Milestones 5/25/100/1000 | Referral skaliert **mit** der Liste, nicht aus dem Nichts — bei 13 Subs mathematisch irrelevant, ab 1.000 Pflicht | Mechanik existiert schon ✓ — aktivieren ab ~500 |
| **beehiiv-Ökosystem** | Plattform-Ø Open-Rate >41 % (2025) | Ehrlicher Benchmark für „gut": 40 %+ Open, nicht 20 % | Messlatte ab Tag 1 |

### DACH-Realitäts-Check — warum hat es hier noch keiner geschafft?

| Player | Status | Woran es hängt |
|---|---|---|
| Good News Magazin | klein, Print-DNA | journalistisch gedacht, keine Wachstumsmechanik |
| Squirrel News | Non-Profit-Aggregator | kein Geschäftsmodell-Druck, kein Funnel |
| Perspective Daily | ~14k zahlende Mitglieder (Stand 2016!) | Member-Paywall ab Tag 1 = Wachstumsbremse |
| goodnews.eu | 96k IG | größter Social-Player, aber kein B2B, kein Index |
| COSMO Daily Good News | ÖR-Reichweite | nur Audio, kein owned Channel |

**Antwort: Chance, kein Strukturproblem.** Kein DACH-Player hat je die
Morning-Brew/1440-Mechanik (Referral + Swaps + Paid-Flywheel + Sponsoring)
auf Good News angewendet — alle kommen aus Journalismus/Non-Profit, keiner aus
Growth. Strukturelle Gegenwinde existieren (DSGVO/Double-Opt-in kostet
geschätzt 20–30 % Signup-Conversion; kleinerer Sprachraum; ÖR-Gratis-Konkurrenz),
aber sie erklären nicht das Fehlen eines Gewinners — fehlende Mechanik erklärt es.
NurEine hat die Mechanik gebaut. Es fehlt nur der Anschub.

### Warnungen

- **Upworthy:** 87 Mio. → ~20 Mio. monatliche Besucher binnen eines Jahres nach
  Facebook-Algo-Änderung 2013/14. Lehre: **Social ist geliehene Reichweite, E-Mail-Liste
  ist das Asset.** Jeder Social-Kanal ist nur Funnel in den Newsletter.
- **ze.tt:** Reichweite ohne Geschäftsmodell → eingestellt. NurEine hat das inverse
  Problem (Modell ohne Reichweite) — das ist heilbar, weil 15 $/Monat Kosten =
  praktisch unendlicher Runway. **Zeit ist unser unfairer Vorteil.**

---

## 2 · Kanal-Entscheidungen (gegen Ist-Daten)

### Instagram — Format-Pivot nötig
- **Befund:** 1 Carousel/Tag + bis 15 Stories/Tag an ~4 Follower. Saves (Nordstern laut
  GROWTH.md) seit Tag 1 **nicht messbar** — Insights-Call scheitert still (vermutlich
  fehlt `instagram_manage_insights` im Token; Fehler ist ab jetzt im Cron-Response sichtbar).
- **Entscheidung:** (1) Insights-Messung fixen, **bevor** weiter A/B-getestet wird —
  blind testen ist Beschäftigungstherapie. (2) **Reels ergänzen, 3–5/Woche:** Für
  Accounts ohne Follower ist der Reels-Empfehlungs-Feed 2026 der einzige organische
  Reichweitenhebel; Carousels belohnen Bestands-Audience, die nicht existiert. Assets
  (Story-Bild + Hook + ElevenLabs-Audio) existieren — Pipeline ist [AGENT]-baubar.
  (3) Carousel 1/Tag weiterlaufen lassen (kostet nichts), IG-Stories auf ~4/Tag
  drosseln (15/Tag an 4 Follower = Rauschen).
- Wie @goodnews_movement & Co. groß wurden: menschliches Gesicht + geteilte Emotion,
  nicht Brand-Posting. Spricht für Personal-Brand-Option (s. u.).

### Threads — laufen lassen, nicht investieren
Automatisiert ab 13.06., 0 Aufwand. Links zählen dort wenig, Reichweiten-Mechanik
text-lastig. Kein aktiver Invest, reine Präsenz. Time-Waste-Grenze: sobald jemand
manuell Threads bespielen will → nein.

### Newsletter — das Asset, Kern-Playbook
- Täglich 6:20 ✓, Personalisierung ✓, Referral-Infra ✓. Frequenz/Format nicht anfassen.
- **Betreffzeilen:** aktuell Story-Titel. Besser: `share_hook` (existiert pro Story!) —
  Neugier-Lücke statt Schlagzeile. [AGENT]-Task, dann ab ~500 Subs echtes A/B.
- **Erste 1.000 ohne Budget — Reihenfolge:**
  1. **Warm-100** (Tag 1–30): Aarons Netzwerk — Musiker-Szene, Gemeinde, Schule,
     Familie. 100+ persönliche 1:1-Nachrichten. Warm konvertiert >50 %.
  2. **Reddit** (ab Woche 1, dauerhaft): einziger Gratis-Kanal mit sofortiger
     Reichweite ohne Follower-Aufbau. Details unten.
  3. **PR/Gründerstory** (Woche 2–6): „20-Jähriger aus Teltow betreibt vollautonome
     KI-Redaktion für 15 $/Monat" ist eine echte Story für t3n/OMR/Gründerszene/Lokalpresse.
  4. **Swaps ab ~500** (Nice-News-/1440-Phase-1-Mechanik): DACH-Newsletter <5k in
     Achtsamkeit/Nachhaltigkeit/Mental Health. Liste vorbereiten lassen ([EXTERN]).
  5. **Referral aktivieren ab ~500** (Morning-Brew-Mechanik, Belohnung digital,
     0 € COGS: exklusiver Monats-Tiefenbrief statt Merch).
- **Kostenfalle früh erkennen:** Brevo Free = 300 Mails/Tag → bei ~300 Abonnenten
  täglich erreicht. Brevo Starter (~9–25 €/Mo) ab da einplanen.

### Reddit — höchster Sofort-ROI, NIEMALS automatisieren
- r/UpliftingNews (Millionen Member — Größenordnung, nicht exakt verifiziert), r/de,
  r/Optimismus, r/Futurology. Weltbank-Reporter-Stories („Kindersterblichkeit-Daten,
  die kein Medium meldet") sind dort **einzigartiger** Content — kein anderer
  Good-News-Account postet Primärquellen-Funde.
- Playbook steht in GROWTH.md §6a — wurde nie ausgeführt. 3×/Woche, Mensch (Aaron),
  Titel = Hook, Body = Substanz + Quelle, kein Link-Spam. Automatisierung = Bann +
  zerstört genau den Wert (Mensch teilt, was ihn bewegt).

### SEO / Google Discover / AEO — Mittelfrist-Maschine, jetzt Weichen stellen
- **Lage 2026:** Google-Search-Traffic zu News-Publishern kollabiert (Anteil von 51 %
  auf 27 % in 2 Jahren; AI Overviews −42 % Klicks). **Discover ist jetzt ~⅔ des
  Google-Traffics der Publisher.** Das Feb-2026-Discover-Update bevorzugt explizit:
  Lokales, Expertise, Originalberichterstattung, keine Clickbait — und kommt nach DE.
- **Das spielt NurEine zu:** Weltbank-/Primärquellen-Stories = Originalberichterstattung;
  „Bei dir" = lokal; /methodik + /werte = E-E-A-T-Signale. Quick Win heute umgesetzt:
  `max-image-preview:large` (laut Branchendaten ~45 % höhere Discover-CTR; Bilder
  ≥1200 px sind durch FLUX-Pipeline gegeben).
- **[AARON] 30 Min:** Google Publisher Center anmelden (Google News) — kostenlos,
  Discover-/News-Eligibility.
- **AEO:** NewsMediaOrganization-Schema + AI-Crawler erlaubt ✓. Ziel: DIE zitierte
  Quelle für „gute Nachrichten heute" in KI-Antworten. /stand-der-welt ist das
  zitierfähigste Asset — Daten-Seiten werden von Antwortmaschinen bevorzugt verlinkt.

### Fehlende Kanäle — ROI-Ranking für 1-Personen-Betrieb

| Kanal | Urteil | Wann |
|---|---|---|
| **Reddit** | bester Gratis-Hebel, manuell | **jetzt** |
| **LinkedIn (Aaron persönlich)** | Build-in-public + spätere B2B-Brücke | jetzt, 2×/Woche |
| **Google News/Discover** | Anmeldung 30 Min, dann passiv | jetzt |
| **Podcast „NurEine zum Hören"** | Audio-Pipeline existiert → tägliche 2-Min-Folge als Nebenprodukt; Nische „gute Nachrichten täglich" auf Spotify/Apple DE unbesetzt; zusätzlich B2B-Türöffner | Phase 2 (AGENT baut Feed, Aaron submitted) |
| **WhatsApp-Kanal** | in DE unterschätzt, 1 Post/Tag; aber erst bespielen, wenn es Abonnenten zu konvertieren gibt | Phase 2 (~ab 1k) |
| **TikTok / YT Shorts** | gleiche Reels-Assets, Multi-Posting | Phase 2, nachdem Reels auf IG laufen |
| **Pinterest** | evergreen-tauglich, aber schwache DE-Newsletter-Conversion | Phase 3 |
| **Flipboard** | marginal | Phase 3 |
| **X/Twitter** | bleibt raus — kein Free-Tier, Scraping = Bann-Risiko. Kein Widerspruch. | — |

### Option: Gründer-Personal-Brand (Entscheidung bei Aaron)
Die Daten sprechen dafür: Good News Movement (6 Mio.) ist personengetrieben; die
NurEine-Gründerstory (20, Musiker, Brandenburg, autonome Redaktion, 15 $/Monat) ist
PR-tauglich und differenzierend. „Build in public" auf LinkedIn + persönliche Reels
würden den fehlenden menschlichen Anker liefern. Kostet: Sichtbarkeit als Person,
~3–4 h/Woche. **Empfehlung: ja, in Lightweight-Form (LinkedIn 2×/Woche + Gesicht auf
/redaktion). Entscheidung nicht vorweggenommen.**

---

## 3 · B2B — Status und Schwelle

- **Ist:** 0 aktive Kunden. Das BUSINESS.md-Playbook (Warm-Calls, Pilot-Garantie,
  LinkedIn-Outreach) ist vollständig — und wurde nie ausgeführt.
- **Monetarisierung der Vorbilder:** Nice News >90 % Inbox-Sponsoring; 1440 95 % Ads;
  Morning Brew Sponsoring → beide erst ab sechsstelliger Reichweite. Member-Modelle
  (Positive.News, Perspective Daily) = langsam. **NurEines B2B-Screen/Whitelabel-Modell
  ist der richtige DACH-Weg** (Sponsoring braucht Reichweite, Screens brauchen Vertrauen).
- **Mindest-Schwelle für aktiven Verkauf:** ~1.000 Subs + nachweisbare Open-Rate >40 %
  + 1 Pilot-Testimonial. Vorher wirkt jedes Pitch-Deck leer.
- **Was VOR der Schwelle geht:** 3 Gratis-Piloten aus warmem Netzwerk einsammeln
  (Pilot-Garantie aus BUSINESS.md). Piloten kosten nichts, liefern Testimonials + 
  Produkt-Feedback für den Screen-Feed.
- **Logischste erste 10 zahlende Kunden:** Pflegeheime/Kliniken (Wartezimmer),
  Schulen (kurze Zyklen), Physio-/Zahnarztpraxen, HR in 50–500-MA-Firmen,
  Corporate-Wellness-/BGM-Berater als Multiplikatoren (Affiliate, BUSINESS.md Phase 3).

---

## 4 · Positionierung — Stress-Test

**Der eine Satz (Leser und B2B identisch):**
> „NurEine zeigt jeden Tag eine belegte Geschichte, wo die Welt besser wird —
> ausgewählt nach messbarer Wirkung, nicht nach Klicks."

**Angriffsflächen + Antworten:**

| Vorwurf | Antwort (existiert schon / fehlt) |
|---|---|
| „Realitätsflucht / rosa Brille" | ✓ /werte + Ehrlichkeits-Layer („Was wir nicht zeigen") + „Grenzen mitschreiben" in jedem Draft |
| „Feel-Good-Kitsch" | ✓ Wirkungsindex + 12:1-Ablehnungsquote öffentlich auf /redaktion |
| „KI-Content-Farm" | ⚠️ **größtes Risiko.** /methodik existiert, aber die KI-Autorenschaft ist nicht above-the-fold. Wenn ein Journalist „aufdeckt", dass alles KI-geschrieben ist, muss die Antwort sein: „Steht auf jeder Seite." → proaktive Kennzeichnung (s. §5) |
| „Greenwashing-Plattform für B2B-Kunden" | teilweise — Werbefreiheit + Quellen-Transparenz; B2B-Inhalte nie redaktionell mischen (Grundsatz schriftlich fixieren, wenn B2B startet) |

**Das fehlende 5-Sekunden-Signal (Live-Check heute):** Hero, Wirkungsindex 85/100,
„389 Quellen geprüft", Methodik-Hinweis — alles da. Es fehlt: **ein Mensch.** Kein
Gesicht, kein Name, kein „wer macht das und warum". Vertrauen entsteht bei News
über Menschen, nicht über Scores. Fix kostet nichts: Foto + 2 Sätze von Aaron auf
/redaktion + eine Byline-Zeile unter dem Hero („Autonome Redaktion, von einem
Menschen verantwortet — so arbeiten wir →"). Abonnentenzahl bewusst NICHT zeigen
(13 schadet); Presse-Logos nachrüsten, sobald PR greift.

---

## 5 · Automatisierung — wo die Grenze ist

Die Frage ist beantwortet was automatisiert wird (fast alles). Wo Vollautomation
**Vertrauen zerstören** würde:

1. **IG-Kommentar-KI: entschärfen.** Ein Bot, der auf einer Empathie-Marke als
   Mensch wirkt und Anteilnahme simuliert, ist der Vertrauens-GAU, wenn es
   auffällt — und es fällt auf. Bei 4 Followern kostet Selbst-Antworten 5 Min/Tag.
   Optionen: (a) abschalten, (b) kennzeichnen („— NurEine-Redaktionsassistent"),
   (c) Drafts in den Admin statt Auto-Post. **Entscheidung [AARON], Empfehlung: c.**
2. **Reddit/Communities: nur Mensch.** Automatisierung = Bann + Wertvernichtung.
3. **Der eine menschliche Touchpoint:** 1 Satz von Aaron im Newsletter
   („Was mich heute daran bewegt hat: …"), optional, 2 Min/Tag. Das ist der
   Unterschied zwischen Maschine-mit-Mensch und Content-Farm.
4. **KI-Transparenz ist Pflicht, bevor sie jemand „aufdeckt":** sichtbares Label
   auf Story-Seiten („KI-recherchiert und -geschrieben, Quellen offen, Mensch
   verantwortet — Methodik →"). Als Stärke framen, nicht als Kleingedrucktes.
   EU-AI-Act-Transparenzpflichten für KI-generierte Inhalte kommen ohnehin.

---

## 6 · Prioritätsmatrix

### Der EINE Hebel jetzt
**Aarons tägliche Distributions-Stunde.** Produktion, Versand, Social-Posting sind
automatisiert — der einzige nicht-automatisierbare Engpass ist menschliche
Distribution: persönliche Nachrichten, Reddit-Posts, Presse-Pitches. 60–90 Min/Tag,
jeden Tag, 90 Tage. Kein neues Feature ändert die Lage; keine der Maschinen
funktioniert ohne dieses Schwungrad-Anschieben.

### Top-3-Maßnahmen 90 Tage

| # | Maßnahme | Owner | Erwarteter Effekt | Messgröße |
|---|---|---|---|---|
| 1 | **Warm-100:** 100+ persönliche 1:1-Nachrichten (WhatsApp/IG/Gemeinde/Musik-Szene), je mit Ref-Link | AARON | 50–100 Subs in 30 Tagen (warm konvertiert >50 %) | bestätigte Subs (Ziel 100 bis Tag 30) |
| 2 | **Reddit-Routine:** 3 Posts/Woche (r/UpliftingNews mit Weltbank-Funden, r/de), AGENT bereitet wöchentlich Kandidaten + EN-Übersetzungen vor | AARON (+AGENT) | 1–2 Posts >500 Upvotes in 90 T; +150–400 Subs | reddit-Referrer in `nureine_events`, Signups/Post |
| 3 | **Gründerstory-PR:** Pitch an t3n, Gründerszene, OMR, DLF Nova, MAZ/Lokalpresse („20-Jähriger betreibt autonome Good-News-Redaktion für 15 $/Mo") | AARON (Pitch-Texte: AGENT) | 1–2 Veröffentlichungen → 300–1.000 Subs + Backlinks (Discover-Autorität) | Presse-Referrer, Subs-Sprung, Backlinks |

Parallel [AGENT] (blockiert Aaron nicht): Reels-Pipeline, Insights-Fix, 
DeepSeek-Parser-Fix, Betreff aus share_hook, KI-Transparenz-Badge. → BACKLOG.md.

**Alle Zahlen sind Ziele, keine Prognosen.**

### 12-Monats-Roadmap (Mechanik-Wechsel pro Stufe)

| Stufe | Zeitraum | Mechanik | Meilenstein-Kriterien |
|---|---|---|---|
| **0 → 1.000** | M1–3 | Hand-zu-Hand: Warm-100, Reddit, PR. Reels-Maschine anlaufen lassen. KEINE Swaps/Ads (nichts zu tauschen) | 1.000 bestätigte Subs · Open >40 % · Saves messbar · 3 B2B-Gratis-Piloten |
| **1.000 → 10.000** | M4–8 | Maschinen zünden: Newsletter-Swaps (jetzt Tauschware da), Referral-Programm live (digitale Belohnung), TikTok/Shorts-Multi-Posting, WhatsApp-Kanal, Podcast-Feed, Discover greift | 10.000 Subs · Referral ≥15 % des Wachstums · 1. zahlender B2B-Kunde (499 €) |
| **10.000 → 50.000** | M9–12+ | Geld arbeitet: B2B-MRR (Ziel 5–10 Kunden ≈ 2,5–5 k €) finanziert Paid-Test (Meta Ads auf /warum, Ziel-CAC <2 €, 1440-Playbook), Cross-Promos mit größeren Lettern, PR Runde 2 | 50.000 Subs · CAC<LTV belegt · B2B-MRR ≥5 k € |

Kosten-Voraussicht: Brevo Starter ab ~300 Subs (~9–25 €/Mo), Supabase Pro ab ~10k
(~25 $/Mo) — bleibt unter 100 €/Mo bis weit in Stufe 2. Runway bleibt unendlich.

---

## 7 · Wenn du nur eine Sache tust

Schreib in den nächsten 14 Tagen 100 Menschen, die dich kennen, eine persönliche
Nachricht mit deinem Ref-Link — Musik-Szene, Gemeinde, Schule, Familie. Nicht als
Gründer, der verkauft, sondern als Mensch, den eine Geschichte bewegt hat (dein
eigener Hormozi-Leitsatz aus GROWTH.md). Das ist unbequemer als ein weiteres Feature
zu bauen — genau deshalb ist es der Hebel: Die Maschine kann alles außer das. 100
warme Kontakte ≈ 50–100 Abonnenten = 5–8× deine heutige Liste, in zwei Wochen, für 0 €.

---

## 8 · Der blinde Fleck (ehrliche Antwort auf die Abschlussfrage)

**Der Kategorie-Fehler:** Gründer von Good-News-Plattformen glauben, das Produkt
(Kuration, Index, Design) sei das Geschäft. Das Geschäft ist die **Liste und die
Beziehung** — Content ist in dieser Kategorie Commodity, selbst exzellente Kuration
ist kopierbar; eine Beziehung zu 100.000 Lesern nicht. Nice News und 1440 haben
mittelmäßig differenzierte Produkte und Weltklasse-Distribution. Im DACH-Raum
existiert das Spiegelbild: gute journalistische Produkte ohne Wachstumsmechanik.

**Bei NurEine ist er konkret schon angelegt — dreifach belegt aus Repo und Daten:**

1. **Drei Strategie-Dokumente, null Ausführung der Mensch-Tasks.** BUSINESS.md
   (Mai): „Diese Woche: 20 Warm-Outreach-Messages" → `nureine_b2b_clients` hat
   1 Eintrag, 0 aktiv. GROWTH.md §6: Reddit-Playbook, Swap-Pitch fertig formuliert →
   0 Reddit-Referrer in `nureine_events`. ROADMAP §5: „Referral anstoßen" →
   0 `referral_signup`-Events. Gebaut wurde stattdessen: Reporter-Bots, Audio-Cockpit,
   Kosten-Cockpit, Roadmap-Seite — alles gut, nichts davon adressiert den Engpass.
2. **Die Automatisierung erzeugt Fortschritts-Gefühl ohne Fortschritt.** 46 Posts,
   389 Stories, 19 Cron-Jobs — und 13 Abonnenten. Die Maschine läuft so überzeugend,
   dass das Stillstehen der einzigen Zahl, die zählt, nicht weh tut.
3. **Die Nordstern-Metrik war nie angeschlossen.** „Saves pro Post" steht als DIE
   Metrik in GROWTH.md — gemessen wurde sie keinen einzigen Tag (Insights-API
   scheiterte still mit `updated:0`). Dass das fünf Wochen niemandem auffiel, ist
   der Beweis: Es wurde gebaut, nicht gewachsen.

**Das Gegen-Asset:** 15 $/Monat Betriebskosten bedeuten unendlichen Runway. ze.tt
starb an Reichweite ohne Modell; NurEine hat Modell ohne Reichweite — der einzige
Zustand, der durch pure Konsistenz heilbar ist. Nice News brauchte 3 Jahre bis
1 Mio. Die Maschine kann 3 Jahre durchhalten. Die offene Frage ist nur, ob der
Mensch jeden Tag eine Stunde verteilt.
