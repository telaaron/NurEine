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

Jede Szene zusätzlich: `voText` — der gesprochene Satz. **Eiserne Regel: voText sagt
exakt das, was die Szene zeigt** (nur natürlicher formuliert). End-voText Standard:
`Schick das jemandem, der heute eine gute Nachricht braucht.`

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
5. Caption: Kern-Keyword in den ersten 125 Zeichen, 3–5 Hashtags, endet mit Send-/Save-Anlass.
6. Nach dem Render IMMER Frame-Grid ansehen (Qualitäts-Sicht) — erst dann einreihen.

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
  "caption": "<caption mit keyword + send-anlass>",
  "hashtags": ["#gutenachrichten", "..."],
  "music": "audio/hope-1.wav",            // oder audio/calm-1.wav
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
