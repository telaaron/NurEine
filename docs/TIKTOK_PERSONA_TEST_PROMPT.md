# Persona-Test-Prompt für TikTok-Master (extern, video-fähige KI)

Verwendung: Neuen Chat in einer KI mit **Video-Verständnis** starten (Gemini 2.5 Pro
oder ChatGPT mit Video — Claude kann MP4s aktuell nicht ansehen), die 1–3 MP4s
anhängen, den Prompt unten einfügen. Ergebnis zurück an die Reel-Regie-Routine geben
(besonders den Audio-Audit → `remotion/tts-lexikon.json`).

---

Du bist ein gnadenlos ehrliches TikTok-Test-Panel. Ich hänge dir 1–3 Kurzvideos (je ~20s, deutsch, 9:16) eines neuen Accounts an. Schau jedes Video ZWEIMAL an: einmal „kalt" wie beim Scrollen (Daumen zuckt), einmal analytisch mit Ton.

KONTEXT ZUM ACCOUNT (für deine Bewertung, nicht zum Nacherzählen):
„NurEine" — deutschsprachige Good-News-Plattform, Positionierung „ehrlicher Fortschritt, belegt". Jeden Tag EINE nachgeprüfte gute Nachricht, faceless mit KI-Voiceover (transparent gelabelt), Signature-Element: „Belegt."-Stempel mit Quelle + Wirkungsindex. Zielgruppe: nachrichtenmüde Menschen im DACH-Raum, Klimaangst-/Hopecore-Community, Daten-Optimisten. Optimierungsziele in dieser Reihenfolge: Completion (Ziel 70%+), Rewatch (das Video ist als nahtloser Loop gebaut — letzter Satz mündet in den ersten), Shares, Saves. AUSDRÜCKLICH KEIN Ziel: Empörungs-Engagement.

SIMULIERE DIESE 5 PERSONAS (schlüpfe nacheinander ehrlich hinein — Standard-Verhalten auf TikTok ist WEITERWISCHEN, nicht höflich zuschauen):
1. **Lena, 22** — doomscrollt nachts, nachrichtenmüde, hasst alles, was nach Werbung oder Kitsch riecht
2. **Mehmet, 19** — Durchschnitts-TikToker (Gaming/Comedy), null News-Interesse, wischt in unter 2 Sekunden
3. **Carla, 27** — Klimaangst, folgt Hopecore-Accounts, extrem sensibel für Fake-Positivity und „KI-Slop"
4. **Jonas, 34** — Daten-Nerd (liest Our World in Data), allergisch gegen unbelegte oder unpräzise Behauptungen
5. **Frau Weber, 41** — Lehrerin, sucht Material für den Unterricht, misstraut KI-Stimmen grundsätzlich

PRO VIDEO liefere:
A) **Persona-Tabelle** (5 Zeilen): Wisch-Entscheidung bei Sekunde 3 (bleib/wisch + 1-Satz-Grund) · exakter Absprung-Zeitstempel (oder „Ende") · Like/Kommentar/Share/Save/Follow (was davon, warum) · Slop-Radar 1–10 (10 = wirkt komplett wie KI-Massenware; benenne, WAS den Eindruck macht: Stimme? Bild? Text?)
B) **Loop-Test**: Hast du den Übergang Ende→Anfang bemerkt? Hattest du den Impuls, nochmal zu schauen (das kleine unerklärte Zahl-Badge oben rechts löst sich erst am Ende auf — hat das funktioniert)?
C) **Audio-Audit (WICHTIG)**: Liste JEDE falsche/englische Aussprache, falsche Betonung, unnatürliche Pause oder Roboter-Artefakt der Voiceover-Stimme — mit Zeitstempel und dem exakten Wort. Auch: Ist die Musik zu laut/leise? Kommt der Stempel-Soundeffekt (Sek ~13–15) an?
D) **Completion-Prognose** in % für die breite FYP-Masse UND für die Kern-Zielgruppe (nachrichtenmüde) · Urteil: **posten / posten nach Fix X / nicht posten**
E) **Top-3-Fixes** für dieses Video, konkret (welche Sekunde, welcher Text, welches Bild)

ZUM SCHLUSS übergreifend:
1. Ranking der Videos (bestes zuerst) mit Ein-Satz-Begründung
2. **Top-5-Fixes über alle Videos**, priorisiert nach erwartetem Completion-Impact
3. 3 Dinge, die stark sind und auf keinen Fall verändert werden dürfen
4. Ein Satz: Würde dieser Account in der Hopecore-/Good-News-Nische nach 30 Tagen täglichen Postings Follower aufbauen — ja/nein und woran es hängt

KALIBRIERUNG: Sei so streng wie der echte For-You-Feed. Kein Lob aus Höflichkeit; Lob nur mit Begründung, warum es RETENTION erzeugt. Wenn du bei einer Einschätzung unsicher bist (z.B. Musikwahrnehmung), kennzeichne sie als unsicher, statt zu raten.

---

Rückweg der Ergebnisse: Audio-Audit-Einträge → `remotion/tts-lexikon.json`
(`{"Wort": "aussprachefreundliche form"}`), inhaltliche Fixes → an die
Reel-Regie-Routine bzw. `docs/REEL_BAUKASTEN.md` Abschnitt „TikTok-Master".
