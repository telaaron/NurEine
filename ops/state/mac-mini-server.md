# Zustand: mac-mini-server

> Automatisch erzeugt von `ops/run/selfupdate.sh` — **2026-08-20T19:30:01Z**
> Diese Datei ist der Blick auf den Mini von überall: einfach hier auf GitHub lesen.

## System

| | |
|---|---|
| Läuft seit | up 5 weeks, 2 days, 6 hours, 14 minutes |
| Speicherplatz | 838G frei von 915G (4% belegt) |
| Arbeitsspeicher | 13Gi verfügbar von 15Gi |
| Auslastung | load average: 0,00, 0,00, 0,00 |
| Tailscale-Adresse | `100.123.159.38` |
| Claude Code | 2.1.209 (Claude Code) |
| cron-Dienst | active (17 Jobs) |

## Code-Stand

| | |
|---|---|
| Branch | `main` |
| Aktueller Commit | `4eda51f fix(reel): veraltete Wortzahl war die Wurzel der 20-Sekunden-Videos` |
| vom | 2026-08-20 19:52:44 +0200 |
| Hinter origin/main | 0 Commits |
| Vor origin/main | 0 Commits |
| Uncommittete Dateien | 0 |
| Branches nur lokal (ungesichert) | 0 |
| Letzter Pull | aktuell (4eda51f) |

## Letzte Agenten-Läufe

| Agent | Zeitpunkt (UTC) | Ergebnis |
|---|---|---|
| fetch | 20260820T011001Z | ✅ exit=0 |
| chefredakteur | 20260820T012603Z | ✅ exit=0 |
| redaktion | 20260819T013353Z | ✅ exit=0 |
| analyst | 20260819T014417Z | ✅ exit=0 |
| reel-regie | 20260820T060001Z | ✅ exit=0 |
| verbesserer | 20260820T081701Z | ✅ exit=0 |


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
