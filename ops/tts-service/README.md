# Lokaler TTS-Service — Sprachaufnahmen ohne Cloud

Läuft auf dem Mac Mini und erzeugt Voiceover **lokal, kostenlos, offline**.
Jeder Agent und die Reel-Pipeline sprechen ihn per HTTP an — wie einen Cloud-Dienst,
nur dass die Daten das Haus nie verlassen und nichts abgerechnet wird.

**Adresse:** `http://192.168.178.3:8123`  ·  **Läuft als:** systemd-Dienst `nureine-tts`

---

## Schnellstart

```bash
# Läuft der Dienst?
curl http://192.168.178.3:8123/health

# Audio erzeugen (MP3 zurück)
curl -X POST http://192.168.178.3:8123/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Guten Morgen. Hier ist eine gute Nachricht."}' \
  -o vo.mp3
```

---

## Engines

| Engine | Geschwindigkeit | Wann nutzen |
|---|---|---|
| **`piper`** (Standard) | **RTF ~0,3** → 3× schneller als Echtzeit. 20-Sek-Voiceover in ~6 s | Produktion. Immer erste Wahl auf dem Mini. |
| **`chatterbox`** | Deutlich langsamer (CPU ohne AVX2) | Nur wenn Prosodie/Voice-Cloning wichtiger ist als Zeit |

> **Warum Piper der Standard ist:** Der Mini ist ein 2011er-Sandy-Bridge ohne AVX2.
> Piper (ONNX) läuft darauf hervorragend, große Transformer-Modelle nicht.

### Stimmen

| Stimme | Qualität | Charakter |
|---|---|---|
| `de_DE-thorsten_emotional-medium` | medium | **Empfohlen.** 8 Emotionen (s.u.) — mit `amused` warm und zugewandt |
| `de_DE-thorsten-medium` | medium | Sachlich, neutral. Klingt schnell nach unbeteiligtem Vorlesen |
| `de_DE-kerstin-low` | low | Weiblich, aber hörbar rauer (nur `low` verfügbar) |
| `de_DE-ramona-low` | low | Weiblich, `low` |

**Emotionen** (nur `thorsten_emotional`): `amused`, `angry`, `disgusted`, `drunk`,
`neutral`, `sleepy`, `surprised`, `whisper`.
Für NurEine passt **`amused`** — warm, ohne kitschig zu werden. `neutral` klingt
unbeteiligt, `surprised` kann für Hook-Szenen funktionieren.

```bash
curl -X POST http://192.168.178.3:8123/tts -H "Content-Type: application/json" \
  -d '{"text":"…","voice":"de_DE-thorsten_emotional-medium","emotion":"amused"}' -o vo.mp3
```

Weitere Stimmen ablegen in `~/tts-service/models/` (je `.onnx` + `.onnx.json` von
[huggingface.co/rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices)).
Verfügbare deutsche Stimmen dort: thorsten, thorsten_emotional, eva_k, kerstin,
karlsson, ramona, pavoque, mls — die meisten nur in `low`/`x_low`.

---

## API

### `POST /tts`
```jsonc
{
  "text":    "Der zu sprechende Text",              // Pflicht
  "engine":  "piper",                               // piper | chatterbox
  "voice":   "de_DE-thorsten_emotional-medium",     // optional
  "emotion": "amused",                              // nur thorsten_emotional
  "format":  "mp3",                                 // mp3 | wav
  "speed":   1.0,                                   // 0.5–2.0
  "words":   false                                  // true → JSON mit Wort-Timings statt Audio-Bytes
}
```
- `words: false` → Audio-Bytes (`audio/mpeg` bzw. `audio/wav`)
- `words: true` → `{"audio_base64": "...", "words": [{"t":"Wort","s":0.1,"e":0.4}]}`

### `GET /health` · `GET /voices`
Verfügbare Engines und Stimmen.

### `POST /v1/audio/speech` (OpenAI-kompatibel)
Für Tools, die das OpenAI-TTS-Format sprechen:
```bash
curl -X POST http://192.168.178.3:8123/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{"input":"Text","model":"piper","response_format":"mp3"}' -o out.mp3
```

---

## Nutzung in der Reel-Pipeline

`remotion/scripts/tts.py` hat die Engine **`local`**:

```bash
cd ~/NurEine/remotion
.venv-tts/bin/python scripts/tts.py --engine local \
  --text "…" --out vo.mp3 --words words.json --rate "+16%"
```

Beim Rendern über `render.mjs` steuerbar per Umgebungsvariable:
```bash
REEL_TTS=local node render.mjs --script plan.json --slug … --vo
```

| Variable | Default | Zweck |
|---|---|---|
| `REEL_TTS` | `edge` | `edge` \| `eleven` \| **`local`** |
| `TTS_LOCAL_URL` | `http://192.168.178.3:8123` | Adresse des Dienstes |
| `TTS_LOCAL_ENGINE` | `piper` | `piper` \| `chatterbox` |

Die Wort-Timings kommen im selben Format wie bei edge-tts (`t`/`start`/`end` +
`brk`/`sbrk`), Remotion synchronisiert die Captions also unverändert.

> **Hinweis zu den Timings:** Piper liefert keine nativen Wortgrenzen — der Service
> verteilt sie proportional zur Wortlänge über die Audiodauer. Für Reel-Captions
> ausreichend; wenn es wortgenau sein muss, bleibt `eleven` die präzisere Wahl.

---

## Betrieb

```bash
systemctl status nureine-tts          # Status
sudo systemctl restart nureine-tts    # neu starten
sudo journalctl -u nureine-tts -f     # Logs live
```

Der Dienst startet automatisch beim Booten. Er ist auf `Nice=5` und 4 Threads
begrenzt, damit er die nächtlichen Agenten-Routinen nicht ausbremst.

**Service-Dateien** (auf dem Mini, nicht im Repo — Modelle sind groß):
```
~/tts-service/
  ├─ server.py          ← aus ops/tts-service/server.py deployed
  ├─ .venv/             ← piper-tts, fastapi, uvicorn, torch, chatterbox
  └─ models/            ← *.onnx Stimmen
```

### Aktualisieren nach Code-Änderung
```bash
scp ops/tts-service/server.py aaron@192.168.178.3:~/tts-service/server.py
ssh aaron@192.168.178.3 'sudo systemctl restart nureine-tts'
```

---

## Fehlersuche

| Symptom | Ursache / Lösung |
|---|---|
| `nicht erreichbar` | Dienst tot → `sudo systemctl restart nureine-tts`; Mini erreichbar? `ping 192.168.178.3` |
| `Piper-Stimme nicht gefunden` | `.onnx` fehlt in `~/tts-service/models/` → `GET /voices` zeigt Vorhandene |
| `Chatterbox nicht verfügbar` (503) | Paket nicht installiert oder Import scheitert → `piper` nutzen |
| Sehr langsam | Läuft vermutlich `chatterbox` → auf `piper` wechseln (`TTS_LOCAL_ENGINE=piper`) |
| Kein Ton in Captions-Sync | Wort-Timings prüfen: `words.json` darf nicht leer sein |
