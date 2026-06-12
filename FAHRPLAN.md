# FAHRPLAN.md — Aarons Abarbeitungs-Liste

> Streng der Reihe nach. Ein Schritt pro Tag reicht — aber JEDEN Tag einer.
> Erledigtes abhaken (`[x]`), nicht löschen. Stand: 2026-06-13.

## Woche 1 — Fundament + erste Pitches

- [ ] **Tag 1 (heute): Training.** PITCH-TRAINING.md §0 lesen, Kern-Pitch (1-Satz
      + 30-Sek) 5× laut aufsagen. Dann ein KI-Rollenspiel Stufe 1 (§8). 20 Min.
- [ ] **Tag 1: Erste 5 Warm-Nachrichten.** Die 5 wohlwollendsten Menschen
      (Familie, beste Freunde), Variante A. Ziel ist Momentum, nicht Perfektion.
- [ ] **Tag 2: Foto + 3 Sätze für /redaktion.** Wer du bist, warum du das baust.
      Foto kann Handy-Selfie mit Tageslicht sein — echt schlägt professionell.
      Dann mir geben → ich baue es ein (Backlog #10).
- [ ] **Tag 2: 8 Warm-Nachrichten** (ab jetzt täglich ~8, Drill aus §8).
- [ ] **Tag 3: Google Publisher Center.** publishercenter.google.com →
      nureine.de anmelden/verifizieren. 30 Min, einmalig, dann passiv.
- [ ] **Tag 4: Reddit-Account vorbereiten.** Falls Account <2 Wochen alt oder
      <50 Karma: erst 3–4 Tage normal kommentieren (ehrlich, hilfreich), KEINE
      eigenen Posts. Parallel: 8 Warm-Nachrichten.
- [ ] **Tag 5: KI-Rollenspiel Stufe 2–3** (PITCH-TRAINING §8). 15 Min.
- [ ] **Tag 6: Erster Reddit-Post** (r/de ODER r/UpliftingNews, Template §2).
      Eine Weltbank-/Primärquellen-Story nehmen. 30 Min nach Post: auf JEDEN
      Kommentar antworten.
- [ ] **Tag 7: Wochen-Review** (§8-Metriken, 5 Min) + Referral-Stand im
      Admin-Funnel ansehen.

## Woche 2 — PR + Routine

- [ ] Warm-Nachrichten weiter (Ziel Ende Woche 2: ~60 verschickt)
- [ ] Reddit-Post #2 und #3 (andere Subs/Storys)
- [ ] **PR-Mails an t3n + Lokalpresse (MAZ)** — Templates PITCH-TRAINING §3.
      VORAUSSETZUNG: /redaktion mit deinem Gesicht ist live (Tag 2 erledigt).
- [ ] KI-Rollenspiel Stufe 4 (kritischer Journalist) — VOR dem ersten
      Interview bestehen.
- [ ] LinkedIn-Profil aktualisieren („Gründer NurEine — eine belegte gute
      Nachricht pro Tag") + erster Build-in-public-Post (z. B.: „Ich betreibe
      eine Nachrichtenredaktion, in der ich der einzige Mensch bin. So sieht
      sie von innen aus: …")

## Woche 3–4 — Skalieren, was funktioniert

- [ ] Warm-100 vollmachen (100 verschickt bis Tag 30)
- [ ] PR-Welle 2: Gründerszene, OMR, DLF Nova (je eigener Winkel, §3-Tabelle)
- [ ] Reddit-Rhythmus 3×/Woche halten
- [ ] LinkedIn 2×/Woche
- [ ] 3 Personen aus Warm-Kontakten mit Schule/Pflege/HR-Bezug → B2B-Pilot-Frage
      (PITCH-TRAINING §5)
- [ ] Monats-Review: Welcher Kanal hat Subs gebracht? (Admin-Funnel) → Woche 5+
      verdoppelt den Gewinner-Kanal

## Einmalige Technik-Reste (zwischendurch, je <15 Min)

- [ ] **IG-Token mit `instagram_manage_insights` neu ziehen.** Diagnose bestätigt
      (2026-06-13): Graph-API Code 10 „Application does not have permission" —
      der App/dem Token fehlt die Insights-Berechtigung. Weg: Meta-App-Dashboard
      → App „NurEine Poster" → Berechtigung `instagram_manage_insights` hinzufügen,
      dann OAuth-URL aus Memory „Der Token-Weg" MIT diesem Scope erweitern, neuen
      Page-Token in Vercel setzen. ZWISCHENLÖSUNG LÄUFT: Likes/Kommentare werden
      seit heute nächtlich automatisch gezogen (22:00 UTC) — Saves/Reach bleiben
      blind bis zum neuen Token.
- [ ] Vercel: prüfen, dass ELEVENLABS_API_KEY + FAL_KEY in production stehen
      (laut Memory seit 11.06. drin — einmal /admin „Status prüfen" klicken)
- [ ] Brevo Starter einplanen, sobald >250 Abonnenten (Free-Limit 300 Mails/Tag)

## Was du NICHT tust (genauso wichtig)

- Keine neuen Features anfragen, bevor Warm-100 fertig ist
- Kein TikTok/Pinterest/WhatsApp-Kanal vor 1.000 Subs
- Keine Paid Ads
- Nicht täglich Follower zählen — sonntags Metriken, fertig
