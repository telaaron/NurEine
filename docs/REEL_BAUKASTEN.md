# Reel-Baukasten — Handbuch für die tägliche Regie-Routine

Die Claude-Routine `nureine-reel-regie` produziert täglich das NurEine-Reel:
Story wählen → Dramaturgie bauen → Skript schreiben → rendern → SICHTEN → einreihen → posten.
Der Baukasten liefert die Bausteine, die Routine liefert die Anordnung — **jede Story
bekommt ihre eigene Dramaturgie**, aber Marke/Safe-Zones/Sync sind nicht verhandelbar.

## Szenen-Bausteine (Komposition `ReelDaily`, remotion/src/ReelDaily.tsx)

| kind | Zweck | Felder | Wann einsetzen |
|---|---|---|---|
| `hook` | Stopper, Frame 0 | `text` (≤9 Wörter), `punch` (Wort-Teilstring aus text), `kicker` (`GUTE NACHRICHT · <KAT>`) | Immer Szene 1 |
| `number` | Zahl-Count-up, dunkler Kontrast | `value` ("90%", "50 Mio"), `unit` (Wort oder null), `context` (≤12 Wörter) | Wenn eine ECHTE Kern-Zahl existiert; auch mehrfach möglich (Vorher/Nachher als 2 Szenen) |
| `beat` | Erzähl-Beat, hell | `text` (≤14 Wörter), `image` (Story-Bild-URL oder null), `pose` (`point-side`/`thinking`/`point-up`/`reading`/`idle`/`wave`) | 1–3×; erster Beat gern mit Bild |
| `proof` | Beleg-Stempel (USP!) | `source`, `impact` (Zahl oder null — **nur ≥50 zeigen**) | Fast immer vorletzte Szene |
| `end` | Share-CTA (Sends!) | `share` (schickbare Zeile), `cta` (Standard: `Schick’s jemandem, der das heute braucht`), `hasVo` (bool) | Immer letzte Szene |

Jede Szene zusätzlich: `voText` — der gesprochene Satz. **Eiserne Regeln:**
- voText erzählt DENSELBEN Fakt wie die Szene (gleiche Reihenfolge), aber **nicht
  wortgleich** — Screen = Essenz, Stimme = Erzählung, Untertitel = Gesprochenes.
- voText enthält **nur deutsche Wörter**. Englische Eigennamen (Quellen, Organisationen)
  kippen die Multilingual-Stimme in englische Aussprache → nur auf dem Screen zeigen,
  im VO umschreiben („eine Jugend-Tanzkompanie in England").
- **Ziffern im voText sind erlaubt** (seit 2026-07-11): render.mjs schreibt sie fürs TTS
  automatisch als deutsche Zahlwörter aus („97.000" → „siebenundneunzigtausend" — sonst
  liest die Multilingual-Stimme sie ENGLISCH) und die Captions zeigen wieder die
  Ziffern-Form. Abgedeckt: Tausender-Punkte, Dezimal-Komma, %, Mio/Mrd/Tsd, Jahreszahlen.
  ZWEI Ausnahmen von Hand schreiben: (a) „1 + Substantiv" → „ein/eine" ausschreiben
  („ein Baum", nicht „1 Baum" — der Konverter kennt kein Genus), (b) Ordinalzahlen
  („das 113." → „das einhundertdreizehnte" ausschreiben).
- **Gesprochene Zahlen menschlich runden:** Der Screen zeigt die exakte Zahl
  („160.566", „2,8 Monate"), die Stimme spricht die runde Menschen-Form („über
  160.000", „fast drei Monate"). Kommazahlen NIE als allererste gesprochene Worte
  (sperrig, bremst den Hook). Präzision = Bild, Fluss = Stimme.
- **Geläufige Wörter im voText:** ungewöhnliche/anglisierende Begriffe vermeiden
  („Klippe" statt „Kliff") — die Stimme spricht seltene Wörter unnatürlich, und
  falsche Betonungen einzelner Wörter gehören ins `remotion/tts-lexikon.json`.
- proof-voText EXAKT: `Belegt — von uns nachgeprüft.` (Quellenname steht im Bild).
- end-voText EXAKT: `Schick das jemandem, der heute eine gute Nachricht braucht.`
- Timing macht das System: die Stimme führt die Szenendauer (VO + kurzer Nachlauf).

## Dramaturgie-Rezepte (variieren!)

- **Zahl-Story**: hook → number → beat(Bild) → proof → end
- **Kontrast**: hook → number(vorher) → number(nachher) → beat → proof → end
- **Mensch/Charme**: hook → beat(Bild) → beat(Figur) → proof → end (keine Zahl erzwingen!)
- **Wow-Fakt**: hook → beat → number → proof → end
- Ziel gesamt: **18–30s**. Kein Beat wiederholt den Hook. Letzte Szene schließt ruhig.

## Regeln (nicht verhandelbar)

1. Hook-Text steht ab Frame 0, konkret, kein Clickbait, keine Frage.
2. `number.value` = die Zahl, um die es GEHT (nie Neben-Zahlen wie Alter/Jahreszahl).
3. Wirkungsindex nur zeigen, wenn ≥50 (`impact: null` sonst) — Quelle immer.
4. Duzen, warm, nie kitschig, keine Superlative ohne Beleg. Emojis sparsam (Caption ja, Szenen nein).
5. Caption (IG): Kern-Keyword in den ersten 125 Zeichen, 3–5 Hashtags, endet mit Send-/Save-Anlass.
6. Nach dem Render IMMER Frame-Grid ansehen (Qualitäts-Sicht) — erst dann einreihen.

## TikTok-Caption (`tiktok`-Block im Plan) — eigene Regeln

Dasselbe Reel läuft auch auf TikTok, aber mit **eigener Caption** (nicht die IG-Caption
kopieren). Regeln aus `docs/TIKTOK_PLAN.md` §3/§5:

- **Keyword-SEO:** Das Kern-Keyword MUSS in den **ersten ~60 Zeichen** stehen (TikTok
  gewichtet Caption-Anfang am stärksten) — und es MUSS im Video vorkommen (gesprochen
  UND als Texteinblendung; das ist ohnehin durch Hook/VO gegeben).
- **Hook sofort:** Payoff/Zahl/Überraschung in Zeile 1, kein Intro.
- **3–5 Hashtags**, nie mehr: `#gutenachrichten` immer zuerst (unser Marken-Tag) + 1 breit
  + 1–2 Thema. Kein Hashtag-Spam.
- **CTA = Save/Comment**, NICHT der IG-„Schick's jemandem"-Send-CTA: „Speichern für später."
  oder „Was denkst du? Schreib's in die Kommentare." (Save/Comment sind auf TikTok die
  starken Signale).
- **Quellenzeile** am Ende wie bei IG: „Quelle: … — von uns nachgeprüft." (Beleg = USP).
- Ton wie immer: duzen, warm, nie kitschig, kein Superlativ ohne Beleg.

Schreib den `tiktok`-Block ins `plan.json` (siehe Schema unten). Beim `--queue`-Schritt
persistiert `render.mjs` `tiktok.caption`/`tiktok.hashtags` automatisch nach
`nureine_stories` — von dort liest sie das Admin-Tool **/admin/tiktok** fürs manuelle
Posten. Fehlt der `tiktok`-Block, baut das Tool eine Caption regelbasiert aus den
Story-Feldern (`src/lib/server/social/tiktok-caption.ts`) — die feinere, handgeschriebene
Variante ist aber besser.

## TikTok-Master „Beweis-Loop 20" (`--tiktok`, Komposition ReelTikTok)

Seit 2026-07-11 entsteht ZUSÄTZLICH zum IG-Reel ein eigener TikTok-Master — NICHT die
IG-Dramaturgie kopieren. Vollständiges Rezept + Begründungen: `docs/TIKTOK_FORMAT_REZEPT.md`.
Gleiches plan.json-Schema, plus drei Felder:

```jsonc
"seo":   { "keyword": "<Kern-Keyword>" }, // PFLICHT: muss in Szene-1-voText UND Szene-1-Overlay
                                          // UND tiktok.caption (erste 60 Zeichen) stehen —
                                          // render.mjs bricht sonst ab (Dreifach-Platzierung)
"loop":  true,                            // Loop-Naht: Video endet auf dem Cold-Open-Layout
"badge": false                            // OPTIONAL: Rewatch-Badge aus (A/B Woche 3);
                                          // Default an = nutzt proof.impact
```

Dramaturgie-Regeln (Kurzform von Rezept §C):
1. **Szene 1 = `number` mit `"snap": true`** + `"kicker": "TAG <N> · NUR EINE"` — die
   Kernzahl steht ab Frame 0 (Cold Open, kein Count-up), voText spricht Zahl +
   `seo.keyword` als ERSTE Worte, **maximal ~6 Wörter** (Cold Open muss nach ≤2,5s
   weiterschneiden — ein 5s-Standbild am Anfang ist der größte Swipe-Treiber).
   **`"image"` (PFLICHT wenn vorhanden):** das Perlen-Bild liegt dunkel HINTER der
   Zahl — ohne visuellen Themen-Anker weiß man beim beiläufigen Scrollen nicht,
   worum es geht (Publikums-Feedback 2026-07-11).
   Ergebnis zuerst — die Neugier-Lücke ist „wie kann das echt sein?", nie „was ist passiert?".
2. Dann: `hook` (**SNAPBACK, nicht Verstärkung** — s. Spannungsphysik unten) → `beat`
   (Wer/Wo, mit Bild) → `beat` (Mechanismus/Aha) → `proof` → `end`. **Payoff komplett
   vor Sekunde 15.** Auf TikTok gibt es **KEINE Moderator-Figur** (Komposition blendet
   sie in Beats nicht mehr ein — externes + internes Panel 2026-07-11: 3D-Avatar ist der
   stärkste „Werbung/KI-Slop"-Marker der Skip-Personas).

**Spannungsphysik-Regeln (Kurzform — Herleitung + Quellen: `docs/HOOK_PSYCHOLOGIE.md`):**
- **Szene 2 = Snapback-Pflicht:** dreht die erwartete Richtung, statt die Zahl zu
  verstärken („Aber die naheliegende Erklärung ist es nicht." / „Vor fünf Jahren galt
  genau das als unmöglich."). Der Snapback ist implizit die Frage, deren Antwort der
  Mechanismus-Beat ist — NIE einen Bruch bauen, der sich im Video nicht auflöst.
- **Aha-Impasse:** Mechanismus-Beat beginnt mit Mini-Paradox, dann ~1s Pause (Punkt im
  voText), DANN die Auflösung. (Aha = +12 Pp. Erinnerung → Saves.)
- **Person → Zahl bei Mensch-Storys:** Charme-Storys dürfen mit Person+Bild kalt öffnen,
  Zahl kommt später als Verstärker (Statistik vor der Person dämpft Empathie).
- **Awe-Kontrast, wo ehrlich möglich:** Skalensprung inszenieren (1990→heute,
  Feld→Land, klein→riesig) — stärkster positiver Share-Treiber.
- **Elevation:** handelnde MENSCHEN benennen („Räum-Teams", „Botaniker"), nie nur
  Institutionen — moralische Schönheit ist die meist-weitergegebene Content-Klasse.
- **DM-CTA (Narrowcasting):** Caption-CTA adressiert EINEN konkreten Empfänger
  („Schick's der Person, die heute nur Doom gescrollt hat") — Sends sind Top-Signal.
- **Peak-Schutz:** Nach dem Stempel nichts Neues/Schwaches; Loop-Zeile kurz.
- **Konstruktive-Hoffnung-Check:** Problem anerkannt? Weg gezeigt („wirkt, weil…")?
  Wer handelt? Sonst kippt die Story in sedierende Beruhigung.
- **Anti-Regeln:** keine offene Lücke am Ende (Clickbait-Backfire), keine gespielte
  Überraschung (liest sich als Slop), Interrupt-Arten variieren (Habituation),
  Hoch-Arousal-positiv statt Rührseligkeit (deaktivierende Traurigkeit senkt Shares).
   **Bild-Gate:** nur fotorealistische Story-Bilder verwenden — die nächtlichen
   Perlen-Bilder der Bild-Regie (Seedream, Fotografen-DNA) sind erste Wahl;
   Metaphern-Clipart (Glühbirnen, Symbolgrafiken) NIE — ein slop-verdächtiges Bild
   kostet mehr als kein Bild, dann lieber Typo-Beat oder **Karten-Zoom** (s.u.).
   **⚠️ ANATOMIE-CHECK vor Verwendung (Pflicht seit 2026-07-12):** Bevor du ein Bild
   in den Cold-Open (`number.image`) oder Beat legst, ZOOME auf sichtbare Hände/Arme
   (`ffmpeg crop` + ansehen) und prüfe: 5 Finger/Hand? Arme in möglicher Richtung?
   Kein verschmolzenes Glied? Bei geringstem Zweifel Bild NICHT verwenden (Typo-Beat/
   Karte stattdessen). Falls du selbst ein Bild generierst (Seedream): `max_images: 4`
   (Best-of-N), hand-sichere Komposition (`waist-up, hands not visible` / Profil), NIE
   „hands behind back"/„crossed arms"/Gesten. Details: SKILL `nureine-bild-regie`.
   **Konkretheits-Check:** zentrale Entität benennen (Artname, Ort, Studie) und jede
   Zahl mit Referent — Share-Personas teilen nur Zitierbares.
   **Karten-Zoom-Baustein** (nur TikTok): `{ "kind": "map", "lat": <lat>, "lng": <lng>,
   "label": "<Ortsname>", "voText": "…" }` — kinoartiger Zoom von Kontinent-Höhe auf den
   Story-Ort (lat/lng stehen in `nureine_stories`), Ziel-Land in Kategorie-Farbe,
   Puls-Marker + Orts-Chip. Ideal als Wer/Wo-Beat, wenn der ORT die Story trägt oder
   kein starkes Bild existiert (echte Geografie = Anti-Slop-Visual).
3. Gesamt **45–60 gesprochene Wörter ≈ 19–22 s** (gemessen: deutsche TTS spricht
   ~2,3 Wörter/s bei +12%; Zahlen wie „97.000" zählen gesprochen als lange Wörter!).
   Blitz-Variante bei dünner Story: number → beat → proof → end, ~30 Wörter ≈ 13 s.
4. `end` im Loop-Modus: KEIN Send-CTA (`"cta": ""`), keine Figur — voText endet als
   Satzanfang, der in Szene 1 mündet, EXAKT: `Und die nächste gute Nachricht ist schon
   nachgeprüft. Nämlich:` (Loop-Naht; TikTok-Ausnahme von der End-VO-Regel oben).
   Automatisch dazu: dezente Icon-Pops Herz→Kommentar→Teilen unter der Share-Zeile
   (Engagement-Nudge; abschaltbar pro Video mit `"engage": false` in der end-Szene).
5. **`proof` = Wachstums-Archiv-Klimax** (Aaron-Reframe 2026-07-12: Der Klimax feiert
   den FORTSCHRITT, nicht unseren Prüfprozess — „von uns nachgeprüft" war für Viewer
   unverständlich). PFLICHT-Feld `"progress": <N>` — N = Anzahl veröffentlichter
   Stories im Archiv, per SQL: `SELECT count(*) FROM nureine_stories WHERE
   published_at IS NOT NULL;` Die Szene zeigt „Fortschritt Nr. N" + die wachsende
   Punkt-Spirale (jeder Punkt = eine geprüfte Nachricht, der heutige fliegt aus dem
   Stempel hinein) + Subline „Jeden Tag einer. Nur was geprüft ist, zählt." — DAS
   erklärt dem Viewer nebenbei, warum wir prüfen: Der Beleg ist die Eintrittskarte
   ins Archiv, nicht die Show. proof-voText EXAKT: `Geprüft und echt — Fortschritt
   Nummer <N>.` (Ziffer schreiben, wird automatisch deutsch gesprochen; Stempel
   behält Sound + Shake + Badge-Auflösung).
6. Hooks aus der Bibliothek in Rezept §D wählen; Overpromise-Audit: löst Sekunde ≤15
   den Hook wörtlich ein? Wenn nein → Story fürs Video aussetzen.

```bash
# TikTok-Master rendern + hochladen (eigener Slug-Suffix, sonst überschreiben sich VO-Dateien).
# REEL_TTS=eleven = Marken-Stimme (Aaron-Entscheid 2026-07-11; braucht .env geladen):
REEL_TTS=eleven node render.mjs --script tiktok-plan.json --slug <slug>-tt --out /tmp/reel-tiktok.mp4 --vo --tiktok --upload
# --tiktok = ReelTikTok-Komposition + engerer Schnitt (PAD 4, MINF 40, VO_TAIL 0.15s,
#            Sprechtempo +16%) + SEO-Check.
# --upload druckt die öffentliche MP4-URL (story_reels-Bucket) → in den Tagesreport an Aaron,
# der postet manuell via /admin/tiktok (Cover = Stempel-Frame ~Sek 14, „AI-generated"-Label AN).
```

**Stimme & Musik (Stand 2026-07-11, Publikums-Feedback „klingt wie Werbung"):**
- TTS-Backend: `REEL_TTS=eleven` nutzt die ElevenLabs-Marken-Stimme
  (`ELEVENLABS_API_KEY`/`ELEVENLABS_VOICE_ID` aus `.env`, Wort-Timestamps inklusive);
  Default `edge` = kostenlos. Sprechtempo steuert `REEL_RATE` (TikTok-Default +16%).
- Musik: warme Betten `audio/warm-1.mp3` (Felt-Piano-Lofi), `warm-2` (Akustik-Gitarre),
  `warm-3` (Ambient-Piano) — alle -20 LUFS. Die alten `uplift-1/2` klingen nach
  Werbung → für TikTok nicht mehr verwenden, bis Aaron anders entscheidet.

**Reichweiten-Signale (optional im tiktok-Block, docs/TIKTOK_PLAN.md §8d):** Du kannst
`tiktok.mentions` (1–2 verifizierte TikTok-Handles der Quelle, NUR wenn die Org wirklich
auf TikTok ist — nie erfinden) und `tiktok.location` (immer große DACH-Stadt wie „Berlin",
NIE der Story-Ort) mitliefern. Beides erscheint als Empfehlung in der /admin/tiktok-Checkliste
fürs manuelle Posten (Quelle @-erwähnen bringt kleinen Accounts +21% Reichweite).

Sicht-Checks vor Abnahme (zusätzlich zum Frame-Grid): (a) Frame 0 zeigt die Zahl voll
lesbar, (b) letzter Frame ≈ Frame 0 (Loop-Naht), (c) Badge oben rechts ab ~Sek 2 und
Auflösung im Stempel, (d) Mute-Test — funktioniert der Bogen ohne Ton?

## Kommandos

```bash
cd "/Volumes/SSD 500G/offloaded/home/aaronpfutzner/Dateien - Local/NurEine/remotion"
set -a; source ../.env; set +a          # SUPABASE_*, CRON_SECRET, DEEPSEEK_API_KEY

# 1. Story wählen (liefert null, wenn heute schon ein Reel existiert):
curl -fsS -X POST "$PUBLIC_BASE_URL/api/cron/social-reel-select" -H "Authorization: Bearer $CRON_SECRET"
# Volle Story-Daten: GET $PUBLIC_BASE_URL/api/reel-data/<slug>

# 2. Szenenplan als JSON schreiben (plan.json):
{
  "story": { "id": "<uuid>", "slug": "<slug>", "category": "kultur",
             "image": "<url|null>", "source": "<quelle>", "impactScore": 55,
             "shareHook": "<schickbare zeile>" },
  "caption": "<IG-caption mit keyword + send-anlass>",
  "hashtags": ["#gutenachrichten", "..."],
  "tiktok": {                              // TikTok-Variante (eigener Hook, siehe unten)
    "caption": "<tiktok-caption: keyword in ersten ~60 zeichen + save/comment-cta>",
    "hashtags": ["#gutenachrichten", "..."]
  },
  "music": "audio/uplift-1.mp3",           // oder audio/uplift-2.mp3 — NICHT hope-1/calm-1.wav (zu leise)
  "person": "frau",                        // "mann" | "frau" | weglassen (Seed wechselt ab);
                                           // die VO-Stimme folgt der Figur automatisch
  "scenes": [ { "kind": "hook", "text": "...", "punch": "...", "kicker": "GUTE NACHRICHT · KULTUR", "voText": "..." }, ... ]
}

# 3. Rendern (VO an; Stimme via REEL_VOICE, Default de-DE-FlorianMultilingualNeural):
node render.mjs --script plan.json --slug <slug> --out /tmp/reel.mp4 --vo
#    → Frame-Grid ansehen: ffmpeg -y -i /tmp/reel.mp4 -frames:v 1 -vf "fps=1/2,scale=300:-1,tile=7x2" grid.png

# 4. Einreihen + hochladen (erst nach bestandener Sicht!):
node render.mjs --script plan.json --slug <slug> --out /tmp/reel.mp4 --vo --queue

# 5. Sofort posten (Publish-Cron läuft sonst erst am nächsten Morgen):
curl -fsS -X POST "$PUBLIC_BASE_URL/api/cron/social-publish" -H "Authorization: Bearer $CRON_SECRET"
```

Voraussetzung lokal: `python3`-venv mit edge-tts (`TTS_PYTHON` env) — die Routine
legt ihn bei Bedarf an (`python3 -m venv .venv-tts && .venv-tts/bin/pip install edge-tts`).

## Leitplanken im System (falls die Routine ausfällt)

- GitHub-Action `render-reel.yml` (16:00 UTC, Mo/Di/Mi/Fr/Sa) rendert ein Standard-Skelett-Reel,
  aber NUR wenn bis dahin kein Reel existiert (Tages-Guard im Select-Endpoint).
- `publishDue`: max 2 Feed-Posts/Tag, ≥3h Abstand, nichts älter als 72h.
- Do = Carousel-Tag, So = Digest — die Routine produziert an diesen Tagen ein Reel
  nur, wenn die Story außergewöhnlich stark ist (2/Tag-Limit beachten).
