# NurEine Mac-Mini-Runner — Betriebshandbuch

**Was ist das?** Ein Mac Mini (Server, Mid 2011) mit Ubuntu, der 24/7 die
nächtlichen NurEine-Routinen ausführt, damit Aarons MacBook frei bleibt.
Die Claude-Agenten laufen über Aarons **Claude-Max-Abo (kein API-Key, keine
Extra-Kosten)** per `claude -p`, gestartet von System-`cron`.

> Erst-Einrichtung (Ubuntu installieren etc.): siehe [`MAC_MINI_SETUP.md`](MAC_MINI_SETUP.md).
> Diese Datei ist der **laufende Betrieb**: reinkommen, nachsehen, ändern, reparieren.

---

## 1. Zugriff — wie komme ich auf den Mini?

| | |
|---|---|
| **Adresse** | `192.168.178.3` (im Heimnetz; Hostname `mac-mini-server`) |
| **Benutzer** | `aaron` |
| **Login** | `ssh aaron@192.168.178.3` — passwortlos per SSH-Key vom MacBook |
| **sudo** | passwortlos (`/etc/sudoers.d/aaron-nopasswd`) |
| **Projekt** | `/home/aaron/NurEine` (Git-Klon von `github.com/telaaron/NurEine`) |

```bash
# Vom MacBook aus:
ssh aaron@192.168.178.3

# Einzelbefehl ohne Login-Shell:
ssh aaron@192.168.178.3 'cd ~/NurEine && git log -1 --oneline'
```

**IP hat sich geändert?** Am Router (Fritzbox) nach `mac-mini-server` suchen.
Vorbeugen: DHCP-Reservierung setzen. Notfalls Monitor anschließen → `hostname -I`.

**Mini reagiert nicht?** Ping testen (`ping 192.168.178.3`). Der Ruhezustand ist
maskiert (sleep/suspend/hibernate → `/dev/null`), der Mini schläft also nie ein.
Hilft nichts: Stromkabel ziehen/stecken — cron startet automatisch wieder mit.

---

## 2. Die Routinen — wo liegen sie, wie ändere ich sie?

**Wichtiger Unterschied zum MacBook:** Auf dem MacBook sind es Claude-Code-
**Scheduled-Tasks** (die man links in der App sieht, laufen nur bei offener App).
Auf dem Mini sind es **cron-Jobs**, die dieselben Prompts per `claude -p` ausführen.

| Was | Wo (auf dem Mini) |
|---|---|
| **Prompts der Routinen** | `~/NurEine/ops/prompts/<name>.md` |
| **Gemeinsame Team-Basis** (liest jede Routine zuerst) | `~/NurEine/ops/prompts/_nureine-team.md` |
| **Zeitpläne** | `crontab -l` (Quelle im Repo: `ops/crontab.txt`) |
| **Wrapper-Skripte** | `~/NurEine/ops/run/{agent,trigger,pyjob}.sh` |
| **Logs** | `~/nureine-logs/agent-<name>.log` |
| **Secrets** | `~/NurEine/.env` + `~/NurEine/ops/env.runner` (beide `chmod 600`) |
| **Ersetzte/alte Prompts** | `~/NurEine/ops/prompts/_ersetzt/` (Rückfall-Option) |

### Aktuelle Kette (Stand 2026-07-19)

```
Fetch 03:10 → Chefredakteur 03:40 → Redaktion 04:10 → Analyst 05:10
(+ Reel-Regie 08:00 täglich, Verbesserer 10:17)
```
Alle Zeiten **lokale Berlin-Zeit** (der Mini läuft in `Europe/Berlin`).
„Redaktion" ersetzt seit 2026-07-16 die früher getrennten Veredler + Bild-Regie.

### Eine Routine ändern

```bash
ssh aaron@192.168.178.3
nano ~/NurEine/ops/prompts/redaktion.md     # Prompt bearbeiten
```
Fertig — beim nächsten Cron-Lauf gilt der neue Text. Kein Neustart nötig.

> **Achtung:** Diese Prompts sind **bewusst NICHT im Git** (`.gitignore`:
> `ops/prompts/*.md`), weil sie Aarons Arbeitsanweisungen sind und sich oft ändern.
> Sicherung: siehe „Routinen vom MacBook synchronisieren" unten.

### Eine Zeit ändern

```bash
# Sauber: im Repo ops/crontab.txt bearbeiten, dann
ssh aaron@192.168.178.3 'cd ~/NurEine && bash ops/install-cron.sh'

# Schnell (nur auf dem Mini, geht beim nächsten install-cron verloren):
ssh aaron@192.168.178.3 'crontab -e'
```

### Eine Routine SOFORT von Hand starten (Test)

```bash
ssh aaron@192.168.178.3 'cd ~/NurEine && ops/run/agent.sh analyst'
# Läuft im Vordergrund. Für lange Jobs besser:
ssh aaron@192.168.178.3 'cd ~/NurEine && nohup ops/run/agent.sh redaktion > ~/test.log 2>&1 &'
```

### Routinen vom MacBook auf den Mini synchronisieren

Wenn Aaron auf dem MacBook Routinen ändert/zusammenlegt, müssen sie **manuell**
nachgezogen werden (die Claude-App synct nicht auf den Mini). Vom MacBook aus:

```bash
cd ~/.claude/scheduled-tasks
TMP=$(mktemp -d)
MINIPROJ="/home/aaron/NurEine"
MACPROJ="/Volumes/SSD 500G/offloaded/home/aaronpfutzner/Dateien - Local/NurEine"
MACTASKS="/Users/aaronpfutzner/.claude/scheduled-tasks"
MINIPROMPTS="/home/aaron/NurEine/ops/prompts"
fix() { sed -e "s#$MACPROJ#$MINIPROJ#g" -e "s#$MACTASKS#$MINIPROMPTS#g" "$1"; }

fix _nureine-team.md > "$TMP/_nureine-team.md"
for p in "nureine-fetch:fetch" "nureine-chefredakteur:chefredakteur" \
         "nureine-redaktion:redaktion" "nureine-analyst:analyst" \
         "nureine-reel-regie:reel-regie" "nureine-verbesserer:verbesserer"; do
  fix "${p%%:*}/SKILL.md" > "$TMP/${p##*:}.md"
done
scp "$TMP"/*.md aaron@192.168.178.3:~/NurEine/ops/prompts/ && rm -rf "$TMP"
```
**Die Pfad-Ersetzung ist Pflicht** — sonst suchen die Agenten die Team-Basis und
das Projekt unter MacBook-Pfaden, die es auf dem Mini nicht gibt.

---

## 3. Nachsehen: Läuft alles?

```bash
# Was steht an?
ssh aaron@192.168.178.3 'crontab -l | grep -v "^#"'

# Lief letzte Nacht was? (Logs, neueste zuerst)
ssh aaron@192.168.178.3 'ls -lt ~/nureine-logs/ | head'
ssh aaron@192.168.178.3 'tail -40 ~/nureine-logs/agent-fetch.log'

# Exit-Codes aller Läufe:
ssh aaron@192.168.178.3 'grep -h "exit=" ~/nureine-logs/*.log | tail -20'

# Läuft gerade ein Agent?
ssh aaron@192.168.178.3 'pgrep -fa "agent.sh|claude -p"'

# cron-Dienst gesund?
ssh aaron@192.168.178.3 'systemctl is-active cron && systemctl is-enabled cron'

# Systemlast / Speicher
ssh aaron@192.168.178.3 'uptime; free -h; df -h /'
```

**In der DB nachsehen** (der ehrlichste Beweis): Tabelle `nureine_ai_runs`
(`layer`, `agent`, `status`, `started_at`) und `nureine_cron_runs`.
Dashboard: `/admin/ki` auf nureine.de.

---

## 3b. Den „Chat" eines Agenten ansehen (Denkverlauf)

Die cron-Agenten laufen **headless** (`claude -p`) — es gibt keine sichtbare
Oberfläche wie in der Claude-App. Aber jeder Lauf wird komplett mitgeschrieben.
Drei Wege, um zu sehen, was ein Agent denkt/tut:

**1. Voller Denkverlauf einer Session** (Gedanken + jeder Tool-/SQL-Aufruf + Ergebnis):
```bash
ssh aaron@192.168.178.3
ls -t ~/.claude/projects/-home-aaron-NurEine/*.jsonl | head   # neueste Session
# menschenlesbar rausziehen:
tail -40 ~/.claude/projects/-home-aaron-NurEine/<datei>.jsonl | python3 -c '
import json,sys
for l in sys.stdin:
  try:
    m=json.loads(l).get("message",{}); r=m.get("role","")
    for c in (m.get("content") or []):
      if c.get("type")=="text" and c.get("text","").strip(): print(f"[{r}] {c[\"text\"][:400]}")
      elif c.get("type")=="tool_use": print(f"TOOL {c.get(\"name\")}: {json.dumps(c.get(\"input\",{}),ensure_ascii=False)[:250]}")
  except: pass'
```

**2. End-Ergebnis live mitlesen** (während ein Agent läuft):
```bash
ssh aaron@192.168.178.3 'tail -f ~/nureine-logs/agent-analyst.log'
```

**3. Selbst interaktiv einen Claude auf dem Mini öffnen** (echter Chat wie in der App,
mit Supabase-MCP): Login mit `-t` (Terminal), env laden, `claude` starten:
```bash
ssh -t aaron@192.168.178.3
cd ~/NurEine && set -a && source ops/env.runner && source .env && set +a && unset ANTHROPIC_API_KEY
claude          # interaktive Sitzung; z.B. einen Prompt aus ops/prompts/ von Hand durchsprechen
```

---

## 4. Der Claude-Zugang (Abo, kein API-Key)

- Claude Code liegt unter `~/.local/bin/claude` (nativer Binary).
- Authentifiziert über einen **langlebigen OAuth-Token** aus Aarons Max-Abo:
  `CLAUDE_CODE_OAUTH_TOKEN` in `~/NurEine/ops/env.runner` (chmod 600).
- Erzeugt wurde er **einmalig auf dem MacBook** mit `claude setup-token`
  (Browser-Login). Gültigkeit ~1 Jahr.
- `agent.sh` ruft: `claude -p "<prompt>" --permission-mode bypassPermissions
  --output-format json` — **ohne `--bare`** (der Abo-Token ist nicht bare-kompatibel).
- `bypassPermissions` ist nötig, damit im Cron-Kontext keine MCP-/Tool-Freigabe
  hängen bleibt.

**Token erneuern** (wenn er abläuft oder ungültig wird):
```bash
# Auf dem MacBook (braucht Browser):
claude setup-token
# Dann auf dem Mini eintragen (Token NICHT durch Chats schicken):
printf 'CLAUDE_CODE_OAUTH_TOKEN=%s\n' "<TOKEN>" | ssh aaron@192.168.178.3 \
  'umask 077; grep -v "^CLAUDE_CODE_OAUTH_TOKEN=" ~/NurEine/ops/env.runner > /tmp/er && cat >> /tmp/er && mv /tmp/er ~/NurEine/ops/env.runner && chmod 600 ~/NurEine/ops/env.runner'
```

**Testen, ob der Abo-Zugang lebt:**
```bash
ssh aaron@192.168.178.3 'cd ~/NurEine && set -a && source ops/env.runner && set +a && \
  unset ANTHROPIC_API_KEY && ~/.local/bin/claude -p "sage: ok" --output-format json | head -c 300'
```

---

## 5. Was auf dem Mini installiert ist

| Komponente | Zweck | Prüfen |
|---|---|---|
| Ubuntu 24.04 LTS, Europe/Berlin | Basis | `timedatectl` |
| Node 22 + npm | Remotion-Render | `node -v` |
| Python 3.12 + `~/NurEine/.venv` | Fetch-Skripte (feedparser, requests, trafilatura, Pillow) | `.venv/bin/python -V` |
| `~/NurEine/remotion/.venv-tts` + edge-tts | Voiceover (`TTS_PYTHON` in `.env`) | `remotion/.venv-tts/bin/python -c "import edge_tts"` |
| Remotion 4.0.290 + Chromium-Libs + ffmpeg | Reel-Rendering | `ls remotion/node_modules/remotion` |
| Claude Code (`~/.local/bin/claude`) | die Agenten | `claude --version` |
| Supabase-MCP (`~/NurEine/.mcp.json`) | DB-Zugriff der Agenten | `claude mcp list` |

**Belegte Leistung:** kompletter TikTok-Reel-Render (20 s, 1080×1920, h264+aac)
in **59 Sekunden**. Die Hardware (i7 Quad, 16 GB) ist reichlich dimensioniert.

---

## 6. Häufige Probleme

### Eine Routine lief nicht
1. `tail -50 ~/nureine-logs/agent-<name>.log` — was steht am Ende?
2. Prompt vorhanden? `ls ~/NurEine/ops/prompts/<name>.md`
3. Token gültig? (Test aus Abschnitt 4)
4. cron aktiv? `systemctl is-active cron`
5. Kein Eintrag in `nureine_ai_runs` **trotz** Log ohne Fehler → sehr wahrscheinlich
   **Supabase-Kontingent (402)**, siehe unten.

### „402" / Supabase antwortet nicht
Bei aufgebrauchtem Supabase-Kontingent ist die **REST-API gesperrt** (Storage +
PostgREST), **direkte SQL-Zugriffe per MCP laufen aber weiter**. Symptom: Agenten
hängen oder schreiben nichts, obwohl technisch alles läuft. Das ist **kein
Mini-Problem** — es löst sich mit dem Kontingent-Reset.
Die Agenten haben dafür den **Festplatten-Fallback** (`.agent-spool/`): Ergebnisse
werden lokal geparkt und später nachgeladen.

### Reel-Render schlägt fehl
- `Error loading image ... 404`: Bildpfad. Relative Pfade brauchen `staticFile()`
  → der `imgSrc()`-Helper in `remotion/src/ReelTikTok.tsx` erledigt das.
  Bilder liegen unter `remotion/public/`.
- Kein Voiceover: `TTS_PYTHON` muss in `.env` auf
  `/home/aaron/NurEine/remotion/.venv-tts/bin/python` zeigen (sonst scheitert die
  VO **still**).

### Code ist auf dem Mini veraltet
Der Mini fährt den Git-Stand. Änderungen müssen **committet und gepusht** sein:
```bash
ssh aaron@192.168.178.3 'cd ~/NurEine && git fetch origin && git reset --hard origin/main'
```
> Lektion aus der Einrichtung: Ein wichtiger Fix (`imgSrc()`) lag uncommittet auf
> dem MacBook — der Mini scheiterte daran. **Was der Mini können soll, muss ins Git.**

---

## 7. Aufgabenteilung (wer macht was)

| Läuft wo | Was |
|---|---|
| **Mac Mini** | Alle Claude-Nacht-Routinen, Reel-Rendering, Thin-Trigger (curl auf `/api/cron/*`), Python-Compute-Jobs. Künftig zusätzlich: Bild-Archiv. |
| **Supabase** | Postgres-Datenbank (bleibt) |
| **Vercel** | Website + die `/api/cron/*`-Endpoints, die der Mini antriggert |
| **Cloudflare Worker** | Newsletter-Cron (eigenständig, unabhängig vom Mini) |
| **Cloudflare R2** (geplant) | Bild-Auslieferung ohne Egress-Kosten |
| **GitHub Actions** | Nur noch **Fallback** — Crons sollen deaktiviert werden, sobald der Mini eine Nacht bewiesen hat (sonst doppelte Läufe!) |

---

## 8. Merksätze

- **Prompts ändern:** direkt auf dem Mini in `ops/prompts/` — wirkt sofort.
- **Zeiten ändern:** `ops/crontab.txt` + `install-cron.sh`.
- **Code ändern:** committen + pushen, dann auf dem Mini `git reset --hard origin/main`.
- **Nichts doppelt laufen lassen:** entweder MacBook-Routinen ODER Mini — nie beide.
- **Der Mini schläft nie** und startet cron nach jedem Reboot automatisch.
