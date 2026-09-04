# Zustand: mac-mini-server

> Automatisch erzeugt von `ops/run/selfupdate.sh` — **2026-09-04T04:30:01Z**
> Diese Datei ist der Blick auf den Mini von überall: einfach hier auf GitHub lesen.

## System

| | |
|---|---|
| Läuft seit | up 7 weeks, 2 days, 15 hours, 14 minutes |
| Speicherplatz | 841G frei von 915G (4% belegt) |
| Arbeitsspeicher | 13Gi verfügbar von 15Gi |
| Auslastung | load average: 0,00, 0,02, 0,01 |
| Tailscale-Adresse | `100.123.159.38` |
| Claude Code | 2.1.209 (Claude Code) |
| cron-Dienst | active (17 Jobs) |

## Code-Stand

| | |
|---|---|
| Branch | `main` |
| Aktueller Commit | `6e9c80c chore(state): Zustandsbericht mac-mini-server 2026-09-03T19:30:01Z` |
| vom | 2026-09-03 21:31:07 +0200 |
| Hinter origin/main | 15 Commits |
| Vor origin/main | 3 Commits |
| Uncommittete Dateien | 0 |
| Branches nur lokal (ungesichert) | 18 |
| Letzter Pull | Pull fehlgeschlagen (divergiert?) — Handarbeit nötig |

## Letzte Agenten-Läufe

| Agent | Zeitpunkt (UTC) | Ergebnis |
|---|---|---|
| fetch | 20260904T011001Z | ✅ exit=0 |
| chefredakteur | 20260904T012916Z | ✅ exit=0 |
| redaktion | 20260904T013233Z | ✅ exit=0 |
| analyst | 20260904T014451Z | ✅ exit=0 |
| reel-regie | 20260903T060001Z | ✅ exit=0 |
| verbesserer | 20260903T081701Z | ✅ exit=0 |


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
