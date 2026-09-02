# Zustand: mac-mini-server

> Automatisch erzeugt von `ops/run/selfupdate.sh` — **2026-09-02T19:30:01Z**
> Diese Datei ist der Blick auf den Mini von überall: einfach hier auf GitHub lesen.

## System

| | |
|---|---|
| Läuft seit | up 7 weeks, 1 day, 6 hours, 14 minutes |
| Speicherplatz | 841G frei von 915G (4% belegt) |
| Arbeitsspeicher | 13Gi verfügbar von 15Gi |
| Auslastung | load average: 0,00, 0,00, 0,00 |
| Tailscale-Adresse | `100.123.159.38` |
| Claude Code | 2.1.209 (Claude Code) |
| cron-Dienst | active (17 Jobs) |

## Code-Stand

| | |
|---|---|
| Branch | `main` |
| Aktueller Commit | `2bbb3c5 docs(tts): Dengue trifft dasselbe Muster wie Trachom — auch mit ElevenLabs` |
| vom | 2026-09-02 19:33:21 +0200 |
| Hinter origin/main | 0 Commits |
| Vor origin/main | 13 Commits |
| Uncommittete Dateien | 0 |
| Branches nur lokal (ungesichert) | 8 |
| Letzter Pull | aktuell (2bbb3c5) |

## Letzte Agenten-Läufe

| Agent | Zeitpunkt (UTC) | Ergebnis |
|---|---|---|
| fetch | 20260902T011001Z | ✅ exit=0 |
| chefredakteur | 20260902T012325Z | ✅ exit=0 |
| redaktion | 20260902T012537Z | ✅ exit=0 |
| analyst | 20260902T013451Z | ✅ exit=0 |
| reel-regie | 20260902T060001Z | ✅ exit=0 |
| verbesserer | 20260902T081701Z | ✅ exit=0 |


## Fernwartung

```bash
# Direkt auf den Mini (von überall, via Tailscale):
ssh aaron@100.123.159.38

# Update anstoßen:
ssh aaron@100.123.159.38 'cd ~/NurEine && ops/run/selfupdate.sh'

# Nur den Zustand neu erheben:
ssh aaron@100.123.159.38 'cd ~/NurEine && ops/run/selfupdate.sh --report'
```

*Exit-Codes: 0 = ok · 20 = Claude-Wochenlimit · 21 = 5h-Limit auch nach Retry · sonst Fehler*
