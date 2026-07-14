# ops/ — NurEine Mac-Mini-Runner

Der Mac Mini (Server Mid 2011, Ubuntu 24.04) übernimmt 24/7 die nächtlichen
NurEine-Routinen, damit Aarons MacBook frei ist. Claude-Routinen laufen über das
**Claude-Max-Abo (kein API-Key)** via `claude -p`, geplant per System-`cron`.

> **Erst-Einrichtung des Mini:** siehe [`MAC_MINI_SETUP.md`](MAC_MINI_SETUP.md) (Ubuntu
> installieren, WLAN, SSH). Diese README beginnt, sobald der Mini per SSH erreichbar ist.

---

## Inhalt von ops/

| Datei | Zweck |
|---|---|
| `MAC_MINI_SETUP.md` | Physische Erst-Einrichtung am Mini (Ubuntu, WLAN, SSH) |
| `setup.sh` | Ubuntu-Grundinstallation (Pakete, Node 22, Python, ffmpeg, Chromium-Libs) |
| `install-cron.sh` | Schreibt die gestaffelte crontab (wird nach dem Setup erzeugt) |
| `crontab.txt` | Der Nacht-Fahrplan (UTC), Quelle für `install-cron.sh` |
| `run/` | Wrapper-Skripte je Routine (laden env, rufen Skript/`claude -p`, loggen) |
| `prompts/` | Die Agenten-Prompts (1:1 aus den heutigen Scheduled-Tasks) |
| `env.runner.example` | Zusätzliche Runner-ENV (Token, Pfade) — Vorlage |

---

## Einrichtung (nach SSH-Zugang)

### 1. Grundsystem
```bash
git clone https://github.com/telaaron/NurEine.git ~/NurEine
cd ~/NurEine
bash ops/setup.sh
```

### 2. Repo-Toolchain (Reel + Fetch)
```bash
cd ~/NurEine/remotion
npm ci
python3 -m venv .venv-tts
.venv-tts/bin/pip install edge-tts
# TTS_PYTHON zeigt auf diesen venv-Python (in .env, s.u.)

cd ~/NurEine
python3 -m venv .venv
.venv/bin/pip install feedparser requests python-dotenv trafilatura Pillow
```

### 3. Claude Code + Abo-Token (KEIN API-Key)
```bash
# a) Claude Code installieren:
curl -fsSL https://claude.ai/install.sh | bash

# b) Langlebigen Abo-Token erzeugen — EINMALIG auf einem Rechner mit Browser
#    (z.B. Aarons MacBook), NICHT auf dem headless Mini:
claude setup-token
#    -> gibt einen Token 'sk-ant-oat01-...' aus. Diesen sicher notieren.

# c) Auf dem Mini als Runner-ENV hinterlegen (ops/env.runner, Rechte 600):
#    CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-...
#    Die Wrapper laden diese Datei. NIEMALS committen (ist in .gitignore).
```
> Hinweis: `CLAUDE_CODE_OAUTH_TOKEN` ist **nicht** mit `--bare` kompatibel. Die
> Agenten-Wrapper rufen `claude -p` daher OHNE `--bare` (normaler Print-Modus).

### 4. Secrets
```bash
cp .env.example .env
# .env mit den echten Werten füllen (Supabase, DeepSeek, FAL, Brevo, CRON_SECRET,
# PUBLIC_BASE_URL, ELEVENLABS_*). Zusätzlich TTS_PYTHON auf den venv-Python setzen:
#   TTS_PYTHON=/home/aaron/NurEine/remotion/.venv-tts/bin/python
cp ops/env.runner.example ops/env.runner   # dann CLAUDE_CODE_OAUTH_TOKEN eintragen
chmod 600 .env ops/env.runner
```
`.mcp.json` (Supabase-MCP) aus dem MacBook-Repo übernehmen, damit die Agenten in
`nureine_ai_runs` loggen können (`SUPABASE_PROJECT_REF` + `SUPABASE_ACCESS_TOKEN` in `.env`).

### 5. Smoke-Tests (vor dem cron!)
```bash
# Fetch-Export (schreibt nur Prompts, kein DB-Insert):
.venv/bin/python scripts/fetch_stories.py --export /tmp/fetch-test.jsonl && echo OK

# Ein Test-Reel rendern (prüft Chromium-Libs + ffmpeg + edge-tts):
#   -> siehe ops/run/reel.sh, bzw. docs/REEL_BAUKASTEN.md "Kommandos"

# Claude-Agent headless (prüft Token + Supabase-MCP-Schreibzugriff):
#   -> ops/run/analyst.sh  (leichtester Agent zuerst)
```

### 6. Cron scharfschalten
```bash
bash ops/install-cron.sh      # schreibt crontab.txt in die User-crontab
crontab -l                    # kontrollieren
```

### 7. GitHub-Actions abschalten (erst wenn der Mini eine Nacht bewiesen hat!)
Die 10 Thin-Trigger + Compute-Jobs laufen dann auf dem Mini. Doppel-Posting vermeiden:
die betroffenen `.github/workflows/*.yml` auf `workflow_dispatch`-only umstellen
(Cron auskommentieren, wie bei `fetch-stories`/`render-reel` bereits). YAMLs NICHT löschen
— sie sind der Notfall-Fallback, falls der Mini ausfällt.

---

## Der Nacht-Fahrplan (Prinzip)

Gestaffelt, **kein Overlap** — der Mini fährt nie zwei schwere Jobs gleichzeitig
(4 Kerne/16 GB reichen so locker). Fixt zugleich die Timing-Bugs aus
`docs/NACHT_ROUTINEN_PROBLEME.md` (strikte Kette, alles nach 03:00 UTC-nah). Zeiten in
**UTC** (wie die bisherigen Workflows). Finale Zeiten in `crontab.txt`.

Kette: **Analyst → Fetch → Chefredakteur → Veredler → Bild-Regie → Verbesserer → Reel-Regie**,
plus die Thin-Trigger zu ihren angestammten Zeiten, dazwischengelegt.

---

## Monitoring
- `nureine_cron_runs` + `nureine_ai_runs` (`layer='local'`) → Admin-Dashboard `/admin/ki`.
- Wrapper-Logs unter `~/nureine-logs/<routine>-<datum>.log` (Logrotation via logrotate).
- Healthcheck-Idee: Alarm, wenn die jüngste `nureine_ai_runs`-Zeile älter als erwartet ist.
