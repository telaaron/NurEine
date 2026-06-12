# BACKLOG.md — NurEine Task-Backlog

> Priorisiert nach STRATEGY.md (2026-06-12). Owner-Legende:
> **[AGENT]** = frische KI-Session kann autonom umsetzen (Prompt ist self-contained).
> **[AARON]** = braucht den Gründer (Außenauftritt, Accounts, Entscheidungen).
> **[EXTERN]** = an Dritte delegierbar, Briefing liegt bei.
> Erledigtes nach unten in „Done" verschieben, nicht löschen.

---

## P0 — diese Woche

### 1. [AARON] Warm-100-Kampagne starten
Der wichtigste Task im Backlog. 100+ persönliche 1:1-Nachrichten an Musik-Szene,
Gemeinde, Schule, Familie, Bekannte — über 14 Tage (~8/Tag). Ton: „Hey, ich bau
gerade was — jeden Morgen eine gute Nachricht, belegt statt Kitsch. Magst du
reinschauen?" + dein persönlicher Ref-Link (steht auf /einstellungen).
Ziel: 100 bestätigte Abonnenten bis Tag 30. Tracking: Admin-Funnel (Top-Werber).

### 2. [AARON] Erster Reddit-Post (Routine: 3×/Woche)
Playbook: GROWTH.md §6a. Erster Kandidat: eine Weltbank-Reporter-Story
(official_stats-Badge) in r/UpliftingNews auf Englisch — Primärquellen-Daten,
die kein Medium meldet, sind dort einzigartig. Titel = Zahl/Kontrast, Body =
Substanz + Quelle, „Source: nureine.de" am Ende, KEIN Link im Titel.
NIEMALS automatisieren (Bann + Wertvernichtung).

### 3. [AGENT] IG-Insights reparieren (Nordstern-Metrik anschließen)
Saves/Reach sind seit Tag 1 NULL — `refreshInsights()` in
`src/lib/server/social/queue.ts` scheiterte still; seit 2026-06-12 wird die erste
Fehlerursache im Cron-Response (`skipped`-Feld) zurückgegeben. Vorgehen:
`POST https://nureine.de/api/cron/social-insights` mit `Authorization: Bearer
$CRON_SECRET` (lokale .env) aufrufen, Fehlertext lesen. Wahrscheinliche Ursache:
Token fehlt `instagram_manage_insights`-Scope. Fixpfad A: Token-Re-OAuth mit
Scope (Anleitung mit allen Fallen: Projekt-Memory „nureine-social-growth-2026-06",
Abschnitt „Der Token-Weg"; Scope war bei App-Config ungültig → ggf. App-Produkt
„Instagram API with Facebook Login" prüfen). Fixpfad B (Fallback, ohne neuen Scope):
`GET /{media-id}?fields=like_count,comments_count` als Proxy-Metrik in
nureine_social_posts speichern (neue Spalten via neue Migration, nie alte editieren).

### ~~4. [AGENT] DeepSeek-Parser robust machen~~ ✅ 2026-06-13
response_format json_object + Retry mit JSON-Reminder + Salvage-Extraktion +
Roh-Antwort-Snippet im Fehler. Beobachten: Fehlerquote in nureine_cron_runs
sollte gegen 0 gehen.

### 5. [AARON] Google Publisher Center anmelden (~30 Min)
publishercenter.google.com → nureine.de verifizieren (Search Console existiert
vermutlich; sonst zuerst). Google News + Discover-Eligibility, kostenlos, passiv.
`max-image-preview:large` ist seit 2026-06-12 gesetzt; Bilder ≥1200 px ✓ (FLUX).

### ~~6. IG-Kommentar-KI~~ ✅ 2026-06-13 — Option c umgesetzt
KI entwirft nur noch (status 'pending'), gepostet wird nach Freigabe in
/admin/social („Antworten"/„Verwerfen"). Migration 00030.

---

## P1 — nächste 2–4 Wochen

### 7. [AGENT] Reels-Pipeline (IG-Format-Pivot)
Ziel: 15–30-Sek-MP4 pro Top-Story automatisch erzeugen. Bausteine existieren:
Story-Bild (Supabase Storage), Hook/slides (DB-Felder), ElevenLabs-TTS
(`scripts/fetch_stories.py` Stage 8, eleven_v3 + Emotion-Tags). Bauplan:
ffmpeg (Ken-Burns-Zoom auf Story-Bild + Text-Overlay Hook → Auflösung → „mehr auf
nureine.de" + TTS-Audiospur + Untertitel), Output 1080×1920 MP4 in Storage-Bucket,
Vorschau in /admin/social, Veröffentlichung via Graph API `media_type=REELS`
(gleiches 2-Step-Muster wie igPostStory in queue.ts, inkl. waitForContainer).
Frequenz: 3/Woche aus Top-Stories (impact ≥75). Approval-Gate wie Feed-Posts.
ACHTUNG: ElevenLabs-Kontingent 47,5 % verbraucht — Reels nutzen die ohnehin
generierten Top-2-Audios, KEINE zusätzlichen TTS-Calls.

### ~~8. [AGENT] Newsletter-Betreff aus share_hook~~ ✅ 2026-06-13
dailySubject(): share_hook → Titel → Standard, max 70 Zeichen. Vorher war der
Betreff JEDEN Tag identisch (Threading + null Neugier). Noch offen (ab ~500
Subs): Betreff-Variante in newsletter_sends loggen für echtes A/B.

### ~~9. [AGENT] KI-Transparenz-Badge~~ ✅ 2026-06-13
Story-Detailseite (Meta-Zeile „KI-recherchiert · von Menschen verantwortet"
→ /methodik) + Newsletter-Footer-Zeile. Mainpage-Byline unter Kompass-Strip
(„Autonome Redaktion, von einem Menschen verantwortet — so arbeiten wir"
→ /redaktion) ebenfalls live.

### 10. [AARON] Gesicht auf /redaktion + Hero-Byline
Foto + 2–3 Sätze („Wer dahintersteht und warum") auf /redaktion. Das fehlende
5-Sekunden-Vertrauenssignal (STRATEGY.md §4). Seiten-Einbau danach: [AGENT]
(eine Byline-Zeile unter Mainpage-Hero: „Autonome Redaktion, von einem Menschen
verantwortet — so arbeiten wir →/redaktion").

### 11. [AARON] PR-Pitch versenden (Texte: AGENT auf Zuruf)
Story: „20-jähriger Musiker aus Teltow betreibt vollautonome Good-News-Redaktion
für 15 $/Monat — mit öffentlichem Wirkungsindex." Ziele: t3n, Gründerszene, OMR,
DLF Nova, MAZ Potsdam, Übermedien (Meta-Winkel: KI-Transparenz). Je 5 Zeilen,
persönlich, 1 konkreter Datenpunkt (12:1-Ablehnungsquote, /stand-der-welt).
Erst nach #9/#10 (KI-Transparenz + Gesicht), sonst zerlegt die Recherche das Framing.

### 12. [AGENT] Wöchentliche Reddit-Kandidaten vorbereiten
Kleines Skript/Cron: jeden Montag die 5 stärksten Stories der Woche
(impact ≥75, bevorzugt source_type=official_stats) als fertige Reddit-Drafts
(EN-Titel nach Hook-Formel, EN-Body 3–4 Sätze + Primärquellen-Link, Sub-Empfehlung)
in den Admin legen (/admin/social oder eigene Sektion). Aaron kopiert nur noch.
Posten bleibt IMMER manuell.

---

## P2 — nach den ersten ~500 Subs

### 13. [AGENT] Referral-Belohnung aktivieren
Infra existiert (referral_code/count, Migration 00019). Belohnung digital, 0 € COGS:
ab 3 bestätigten Referrals exklusiver „Stand der Welt"-Monats-Tiefenbrief
(sendWorldMetricsNewsletter-Variante) + Badge auf /einstellungen. Schwellen-Check
beim Confirm-Credit, Versand-Flag auf Subscriber. Morning-Brew-Mechanik, greift
erst mit Volumen — deshalb P2.

### 14. [EXTERN] Swap-Partner-Recherche (Briefing fertig)
> **Briefing:** „Recherchiere 50 deutschsprachige Newsletter mit geschätzt 500–10.000
> Abonnenten in den Nischen Achtsamkeit, Nachhaltigkeit, Mental Health, Wissenschaft,
> Familie/Eltern. Pro Newsletter: Name, URL, Thema, geschätzte Größe (Quelle angeben),
> Kontakt-E-Mail oder LinkedIn des Betreibers, Anmelde-Link. Format: CSV. Quellen:
> Substack/beehiiv-Verzeichnisse, Steady, LinkedIn. Keine Massen-Medien, keine
> Konzern-Newsletter." — Ergebnis in Admin-Backlog; Swap-Pitch steht in GROWTH.md §6b.

### 15. [AGENT] Podcast-Feed „NurEine zum Hören"
MP3s existieren (Top-2/Tag, ElevenLabs v3). Bauen: RSS-Feed-Endpoint
(`/podcast.xml`, iTunes-Tags, Kategorie News), Episode = Tages-Top-Audio mit
Story-Intro, Cover 3000×3000 aus Brand-Assets. Danach [AARON]: Submission an
Spotify/Apple/Amazon (Accounts nötig). Nische „tägliche gute Nachrichten" DE
ist unbesetzt (COSMO nur WDR-Player).

### 16. [AGENT] Embeddable Widget „Gute Nachricht des Tages"
ROADMAP §3.5. iframe/Web-Component (`/embed`), zeigt Tages-Hero (Titel, Bild,
Wirkungsindex, Link). Docs-Seite /embed mit Copy-Paste-Code. Zielgruppe: NGOs,
Blogs, Schulen → Backlinks (Discover-Autorität) + B2B-Türöffner.

### 17. [AARON] WhatsApp-Kanal anlegen
Ab ~1.000 Subs. 1 Post/Tag (Karte + share_hook — Assets aus /heute). In DE
unterschätzter Kanal; vorher fehlt die Konvertierungsmasse.

### 18. [AARON] 3 B2B-Gratis-Piloten einsammeln
BUSINESS.md Phase 1 (Pilot-Garantie). Aus Warm-100-Kontakten: wer arbeitet in
Schule/Pflege/HR? Screen-Feed existiert. Ziel: 1 Testimonial für die Verkaufsphase.

---

## P3 — Roadmap (nicht jetzt anfassen)

- TikTok/YouTube-Shorts-Multi-Posting (gleiche Reels-Assets) — nach IG-Reels-Beweis.
- Paid Acquisition (Meta Ads auf /warum, Ziel-CAC <2 €) — erst mit B2B-MRR.
- Paywall „NurEine Plus" — Kriterien in ROADMAP §8 (>500 aktive, Tagesklima-Daten).
- Pinterest, Flipboard. Englische Version. Native Apps.
- Brevo Starter einplanen ab ~300 Subs (Free-Limit 300 Mails/Tag).

---

## Done

- 2026-06-13: **IG-Feed-Posts-Bug gefixt** — Generator legte Drafts mit
  scheduled_for=nächster Morgen 05:30 an, Publish-Cron (05:30) lief aber VOR dem
  Generator (06:15) → jeder Draft wartete ~23h; manuell früh gepostete Drafts
  hinterließen Tage ohne Auto-Post. Jetzt: Draft sofort fällig, Generate-Cron
  postet im Autopilot direkt nach dem Anlegen (1/Tag-Guard bleibt) — [AGENT]
- 2026-06-13: DeepSeek-Parser robust (#4), Kommentar-Freigabe-Queue (#6,
  Migration 00030), Betreff aus share_hook (#8), KI-Transparenz-Badges +
  Hero-Byline (#9/#10-Teil), PITCH-TRAINING.md + FAHRPLAN.md — [AGENT]
- 2026-06-12: `max-image-preview:large` gesetzt (Discover-CTR) — [AGENT]
- 2026-06-12: refreshInsights gibt Fehlerursache im `skipped`-Feld zurück statt still `updated:0` — [AGENT]
- 2026-06-12: STRATEGY.md + BACKLOG.md angelegt — [AGENT]
