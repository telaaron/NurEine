#!/usr/bin/env bash
# ============================================================================
# healthcheck.sh — EIN taeglicher Check fuer die ganze Pipeline. Mail nur bei Problem.
#
# Ersetzt repo-watchdog.sh + reel-watchdog.sh (Aaron 2026-08-03: "nicht ewig viele
# crons, lieber beim kleinsten Problem eine Mail").
#
# Grundsatz: STILLE = ALLES GUT. Es kommt nur Post, wenn wirklich etwas kaputt ist.
# Ein Log, in das niemand schaut, ist kein Alarm — deshalb geht der Befund raus.
#
# Geprueft wird, was in den letzten Wochen tatsaechlich still kaputtgegangen ist:
#   1. Repo: Mini auf main, synchron, kritische Skripte importierbar
#      (main war 2 Wochen kaputt — 1140 Zeilen aus fetch_stories.py geloescht)
#   2. Reel: wurde heute ein Master gebaut?
#      (Cron meldete exit=0, aber der Agent lief im Hintergrund -> kein Video)
#   3. Stories: kommt ueberhaupt noch Nachschub?
#      (der Fetch-Job war tot, ohne dass es jemand merkte)
#   4. Agenten-Laeufe: hat eine Nacht-Routine hart gefehlt?
#
# Aufruf:  healthcheck.sh [--test]   (--test schickt die Mail auch bei "alles gut")
# ============================================================================
set -uo pipefail
# ROOT NICHT hartkodieren (2026-09-02): Hier stand "/home/aaron/NurEine". Auf
# jedem anderen Rechner — und auf macOS ist $HOME=/Users/… — bricht `cd || exit 1`
# ab, BEVOR eine Pruefung laeuft. Und weil der Abbruch vor dem Mail-Block liegt,
# kommt keine Mail. In einem Werkzeug, dessen Konzept "Stille = alles gut" ist,
# sieht der eigene Ausfall exakt wie ein gesundes System aus.
# Dieselbe Ableitung wie in agent.sh/trigger.sh/pyjob.sh/selfupdate.sh.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG="${NUREINE_LOGDIR:-$HOME/nureine-logs}/healthcheck.log"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
HEUTE="$(date -u +%Y-%m-%d)"
cd "$ROOT" || exit 1
set -a; source "$ROOT/.env"; set +a

PROBLEME=()   # je Eintrag: "Titel|Detail|Was zu tun ist"

# ── 1. Repo ────────────────────────────────────────────────────────────────
BRANCH="$(git branch --show-current)"
if [ "$BRANCH" != "main" ]; then
  PROBLEME+=("Mini steht auf '$BRANCH' statt main|Der Stand laeuft auseinander — Fixes auf einem Feature-Branch sind nirgends gesichert (der Mini kann nicht pushen).|cd $ROOT && git checkout main && git pull --ff-only origin main")
else
  if git fetch -q origin 2>/dev/null; then
    AHEAD="$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)"
    BEHIND="$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)"
    if [ "$AHEAD" -gt 0 ]; then
      PROBLEME+=("$AHEAD Commit(s) nur auf dem Mini|$(git log --oneline origin/main..HEAD | head -3)|Von einer Maschine mit GitHub-Zugang sichern, sonst beim naechsten reset weg")
    fi
    if [ "$BEHIND" -gt 0 ] && ! git merge --ff-only origin/main -q 2>/dev/null; then
      PROBLEME+=("$BEHIND Commit(s) hinter origin/main, ff nicht moeglich|Lokale Aenderungen blockieren das Nachziehen.|cd $ROOT && git stash && git pull --ff-only origin main")
    fi
  fi
fi

for f in scripts/fetch_stories.py remotion/scripts/tts.py remotion/scripts/verify_vo.py; do
  [ -f "$f" ] || continue
  python3 -c "import ast; ast.parse(open('$f').read())" 2>/dev/null || \
    PROBLEME+=("$f nicht importierbar|SyntaxError — der zugehoerige Cronjob stirbt still, ohne Fehlermeldung.|python3 -c \"import ast; ast.parse(open('$f').read())\" zeigt die Zeile")
done

# ── 2./3. Reel + Stories (eine DB/Storage-Abfrage) ─────────────────────────
BEFUND="$(python3 - <<'PY' 2>/dev/null
import json, os, urllib.request, datetime
U = os.environ["SUPABASE_URL"].rstrip("/"); K = os.environ["SUPABASE_SERVICE_KEY"]
heute = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")
def get(path):
    r = urllib.request.Request(U + path, headers={"apikey": K, "Authorization": "Bearer " + K})
    return json.load(urllib.request.urlopen(r, timeout=30))
out = {}
try:
    req = urllib.request.Request(U + "/storage/v1/object/list/story_reels",
        data=json.dumps({"prefix": "reels", "limit": 1000,
                         "sortBy": {"column": "created_at", "order": "desc"}}).encode(),
        headers={"apikey": K, "Authorization": "Bearer " + K, "Content-Type": "application/json"})
    objs = json.load(urllib.request.urlopen(req, timeout=30))
    out["reels_heute"] = sum(1 for o in objs if (o.get("created_at") or "").startswith(heute))
except Exception as e:
    out["reels_heute"] = -1; out["reel_fehler"] = str(e)[:120]
try:
    seit = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2)).isoformat()
    out["stories_48h"] = len(get(f"/rest/v1/nureine_stories?select=id&created_at=gte.{seit}"))
except Exception as e:
    out["stories_48h"] = -1; out["story_fehler"] = str(e)[:120]

# AUSLIEFERUNG (Vorfall 2026-09-02): Produktion und Verteilung sind zwei Paar
# Schuhe. Stories und Newsletter liefen taeglich weiter, waehrend Instagram vier
# und TikTok sechs Tage komplett stand — und NICHTS schlug an, weil dieser Check
# nur prueft, ob etwas PRODUZIERT wird, nie ob es ANKOMMT. Ein Entwurf, der
# liegen bleibt, sieht in der DB genauso aus wie einer, der gleich rausgeht.
for kanal, feld in (("instagram", "ig"), ("tiktok", "tiktok")):
    try:
        rows = get("/rest/v1/nureine_social_posts?select=posted_at"
                   f"&platform=eq.{kanal}&status=eq.posted"
                   "&order=posted_at.desc&limit=1")
        if rows and rows[0].get("posted_at"):
            letzter = datetime.datetime.fromisoformat(rows[0]["posted_at"].replace("Z", "+00:00"))
            alter = (datetime.datetime.now(datetime.timezone.utc) - letzter).days
            out[f"{feld}_tage_still"] = alter
        else:
            out[f"{feld}_tage_still"] = 999
    except Exception as e:
        out[f"{feld}_tage_still"] = -1; out[f"{feld}_fehler"] = str(e)[:120]

# Entwuerfe, die sich stapeln: sicheres Zeichen fuer einen kaputten Publish-Pfad.
try:
    out["ig_entwuerfe"] = len(get("/rest/v1/nureine_social_posts?select=id"
                                  "&platform=eq.instagram&status=in.(draft,failed)"))
except Exception:
    out["ig_entwuerfe"] = -1
print(json.dumps(out))
PY
)"
if [ -z "$BEFUND" ]; then
  PROBLEME+=("Supabase nicht erreichbar|Weder Bucket noch Datenbank abfragbar.|Keys in $ROOT/.env pruefen, Supabase-Status ansehen")
else
  R=$(echo "$BEFUND" | python3 -c "import json,sys; print(json.load(sys.stdin).get('reels_heute',-1))")
  S=$(echo "$BEFUND" | python3 -c "import json,sys; print(json.load(sys.stdin).get('stories_48h',-1))")
  [ "$R" = "0" ] && PROBLEME+=("Heute kein Reel gebaut|Die Reel-Regie (08:00) hat kein Video produziert. Achtung: ein gruener exit=0 ist KEIN Beweis — der Agent darf den Render nicht im Hintergrund starten.|tail -40 ~/nureine-logs/agent-reel-regie.log")
  [ "$S" = "0" ] && PROBLEME+=("Seit 48h keine neue Story|Der Fetch-Job liefert keinen Nachschub — ohne Stories gibt es auch keine Reels.|tail -40 ~/nureine-logs/agent-fetch.log")

  # AUSLIEFERUNG — der blinde Fleck bis 2026-09-02.
  IG=$(echo "$BEFUND" | python3 -c "import json,sys; print(json.load(sys.stdin).get('ig_tage_still',-1))")
  TT=$(echo "$BEFUND" | python3 -c "import json,sys; print(json.load(sys.stdin).get('tiktok_tage_still',-1))")
  DR=$(echo "$BEFUND" | python3 -c "import json,sys; print(json.load(sys.stdin).get('ig_entwuerfe',-1))")
  [ "$IG" != "-1" ] && [ "$IG" -gt 2 ] && PROBLEME+=("Instagram seit $IG Tagen ohne Post|Der Feed steht. Geschrieben wird weiter, nur veroeffentlicht nichts mehr — das faellt ohne diesen Check tagelang niemandem auf.|curl -sS -X POST \$PUBLIC_BASE_URL/api/cron/social-publish -H \"Authorization: Bearer \$CRON_SECRET\" ; und nureine_social_posts nach status=draft/failed durchsehen")
  [ "$TT" != "-1" ] && [ "$TT" -gt 4 ] && PROBLEME+=("TikTok seit $TT Tagen ohne Post|TikTok laeuft manuell ueber /admin/tiktok — laenger als vier Tage Stille heisst meist: es liegt ein fertiges Reel da, das niemand hochgeladen hat.|/admin/tiktok oeffnen und die fertigen MP4s pruefen")
  [ "$DR" != "-1" ] && [ "$DR" -gt 3 ] && PROBLEME+=("$DR Instagram-Entwuerfe stapeln sich|Entwuerfe, die liegen bleiben, sind das Symptom eines kaputten Publish-Pfads (abgelaufener Token, geloeschtes Video, Timeout).|Fehler-Spalte in nureine_social_posts lesen: die letzten Eintraege mit status=failed")
fi

# ── 3b. ElevenLabs-Kontingent ──────────────────────────────────────────────
# Warum (Vorfall 2026-08-15): Das Kontingent lief leer, die Pipeline fiel still auf
# edge-tts zurueck. Folge: andere Stimme, Aussprachefehler, und weil edge langsamer
# spricht, kuerzte die Regie den Text — aus 30-Sekuendern wurden 19-Sekuender. Der
# Agent MELDETE das taeglich in seinem Log, aber niemand las es. Jetzt kommt es per Mail,
# BEVOR die Qualitaet kippt.
if [ -n "${ELEVENLABS_API_KEY:-}" ]; then
  EL="$(curl -sS --max-time 25 "https://api.elevenlabs.io/v1/user" \
        -H "xi-api-key: $ELEVENLABS_API_KEY" 2>/dev/null | python3 -c "
import json,sys
try: s=json.load(sys.stdin).get('subscription',{})
except Exception: print('-1 0'); raise SystemExit
u,l=s.get('character_count',0),s.get('character_limit',0)
print(f'{u} {l}')" 2>/dev/null)"
  set -- $EL
  U="${1:--1}"; L="${2:-0}"
  if [ "$U" = "-1" ]; then
    PROBLEME+=("ElevenLabs nicht abfragbar|Kontingent-Stand unbekannt — moeglicherweise Key ungueltig.|Key in $ROOT/.env pruefen: curl -H \"xi-api-key: \$ELEVENLABS_API_KEY\" https://api.elevenlabs.io/v1/user")
  elif [ "$L" -gt 0 ]; then
    REST=$(( L - U )); PROZ=$(( 100 * REST / L ))
    if [ "$PROZ" -lt 10 ]; then
      PROBLEME+=("ElevenLabs-Kontingent bei $PROZ % ($REST von $L Zeichen)|Reicht noch fuer ~$(( REST / 450 )) Reels. Ist es leer, faellt die Pipeline auf edge-tts zurueck: andere Stimme, Aussprachefehler, und die Videos werden kuerzer (~20s statt 30s).|Testrenders laufen automatisch mit edge. Bis zum Reset entweder pausieren oder bewusst mit edge weiterproduzieren.")
    fi
  fi
fi

# ── 4. Nacht-Routinen ──────────────────────────────────────────────────────
for a in fetch chefredakteur reel-regie; do
  L="${NUREINE_LOGDIR:-$HOME/nureine-logs}/agent-${a}.log"
  [ -f "$L" ] || continue
  LETZTER="$(grep "agent=$a start" "$L" 2>/dev/null | tail -1 | grep -oE '[0-9]{8}' | head -1)"
  [ -z "$LETZTER" ] && continue
  ALTER=$(( ( $(date -u +%s) - $(date -u -d "$LETZTER" +%s 2>/dev/null || echo 0) ) / 86400 ))
  [ "$ALTER" -gt 2 ] && PROBLEME+=("Routine '$a' lief seit $ALTER Tagen nicht|Letzter Start: $LETZTER|crontab -l | grep $a  —  und $L pruefen")
done

# ── 5. Zombie-Laeufe (nureine_ai_runs haengt in status=running) ────────────
# Wiederholt beobachtet (zuletzt 03.08., Team-Board #146 + Idee #50): ein
# Cloud-Agent bleibt ohne finished_at haengen, die Kette merkt es nicht.
# >90 Min running -> als 'failed' schliessen, damit Kollegen es sehen.
ZOMBIES="$(python3 - <<'PY' 2>/dev/null
import json, os, urllib.request, urllib.parse, datetime
U = os.environ["SUPABASE_URL"].rstrip("/"); K = os.environ["SUPABASE_SERVICE_KEY"]
CUTOFF = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=90)).isoformat()
def req(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(U + path, data=data, method=method,
        headers={"apikey": K, "Authorization": "Bearer " + K, "Content-Type": "application/json"})
    raw = urllib.request.urlopen(r, timeout=30).read()
    return json.loads(raw) if raw else None  # PATCH antwortet mit 204 + leerem Body
q = "/rest/v1/nureine_ai_runs?select=id,agent,started_at&status=eq.running&started_at=lt." + urllib.parse.quote(CUTOFF)
stale = req("GET", q)
for row in stale:
    req("PATCH", f"/rest/v1/nureine_ai_runs?id=eq.{row['id']}", {
        "status": "failed",
        "finished_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "error": "watchdog: >90 Min ohne finished_at (healthcheck.sh)",
    })
print(json.dumps([f"{r['agent']}#{r['id']} seit {r['started_at']}" for r in stale]))
PY
)"
if [ -n "$ZOMBIES" ] && [ "$ZOMBIES" != "[]" ]; then
  PROBLEME+=("Zombie-Lauf/-Laeufe beendet (>90 Min running)|$ZOMBIES|nureine_ai_runs war fuer die Kette unsichtbar haengen geblieben, status steht jetzt auf 'failed'")
fi

# ── Ergebnis ───────────────────────────────────────────────────────────────
if [ ${#PROBLEME[@]} -eq 0 ] && [ "${1:-}" != "--test" ]; then
  echo "[$STAMP] OK — keine Probleme" >>"$LOG"
  exit 0
fi

ANZ=${#PROBLEME[@]}
echo "[$STAMP] $ANZ Problem(e)" >>"$LOG"
printf '%s\n' "${PROBLEME[@]}" >>"$LOG"

BODY="<p>Der tägliche Check der NurEine-Pipeline hat <strong>$ANZ Problem(e)</strong> gefunden.</p>"
[ "$ANZ" -eq 0 ] && BODY="<p>Testlauf — es gibt <strong>keine</strong> Probleme. So sähe eine Meldung aus:</p>"
for p in "${PROBLEME[@]}"; do
  T="${p%%|*}"; REST="${p#*|}"; D="${REST%%|*}"; F="${REST##*|}"
  BODY="$BODY<div style='margin:18px 0;padding:14px 16px;border-left:3px solid #bd6a35;background:#fbf8f1'>
<div style='font-weight:600;color:#16140f'>$T</div>
<div style='color:#6b6359;margin-top:6px;font-size:14px'>$D</div>
<div style='margin-top:10px;font-family:ui-monospace,monospace;font-size:13px;color:#16140f'>$F</div></div>"
done
BODY="$BODY<p style='color:#9a9087;font-size:13px'>Mac Mini · $(date '+%d.%m.%Y %H:%M') · Details: ~/nureine-logs/healthcheck.log<br>
Diese Mail kommt nur, wenn etwas nicht stimmt. Keine Mail = alles läuft.</p>"

PAYLOAD="$(python3 - <<PY
import json, os
print(json.dumps({
  "sender": {"email": os.environ.get("BREVO_FROM_EMAIL", "noreply@nureine.de"),
             "name": "NurEine Pipeline"},
  "to": [{"email": os.environ.get("HEALTHCHECK_TO") or os.environ.get("BREVO_REPLY_TO_EMAIL")}],
  "subject": "NurEine Pipeline: $ANZ Problem(e)" if $ANZ else "NurEine Pipeline: Testlauf",
  "htmlContent": """$BODY"""
}))
PY
)"
CODE="$(curl -sS -o /tmp/hc-mail.out -w "%{http_code}" -X POST "https://api.brevo.com/v3/smtp/email" \
  -H "api-key: $BREVO_API_KEY" -H "Content-Type: application/json" -d "$PAYLOAD")"
if [ "$CODE" = "201" ]; then
  echo "[$STAMP] Mail verschickt" >>"$LOG"
else
  echo "[$STAMP] MAIL FEHLGESCHLAGEN (HTTP $CODE): $(head -c 200 /tmp/hc-mail.out)" >>"$LOG"
fi
exit 1
