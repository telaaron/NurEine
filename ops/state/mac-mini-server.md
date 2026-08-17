# Zustand: mac-mini-server

> Automatisch erzeugt von `ops/run/selfupdate.sh` — **2026-08-17T06:43:37Z**
> Diese Datei ist der Blick auf den Mini von überall: einfach hier auf GitHub lesen.

## System

| | |
|---|---|
| Läuft seit | up 4 weeks, 5 days, 17 hours, 28 minutes |
| Speicherplatz | 840G frei von 915G (4% belegt) |
| Arbeitsspeicher | 13Gi verfügbar von 15Gi |
| Auslastung | load average: 0,06, 0,07, 0,17 |
| Tailscale-Adresse | `100.123.159.38` |
| Claude Code | 2.1.209 (Claude Code) |
| cron-Dienst | active (17 Jobs) |

## Code-Stand

| | |
|---|---|
| Branch | `main` |
| Aktueller Commit | `7af2d8f chore(state): Zustandsbericht mac-mini-server 2026-08-17T06:41:29Z` |
| vom | 2026-08-17 08:42:06 +0200 |
| Hinter origin/main | 1 Commits |
| Vor origin/main | 0 Commits |
| Uncommittete Dateien | 1 |
| Branches nur lokal (ungesichert) | 1 |
| Letzter Pull | kein Pull — uncommittete Änderungen im Arbeitsbaum |

## Letzte Agenten-Läufe

| Agent | Zeitpunkt (UTC) | Ergebnis |
|---|---|---|
| fetch | 20260817T011001Z | ✅ exit=0 |
| chefredakteur | 20260817T013205Z | ✅ exit=0 |
| redaktion | 20260817T013358Z | ✅ exit=0 |
| analyst | 20260817T014625Z | ✅ exit=0 |
| reel-regie | 20260817T060001Z | ✅ exit=0 |
| verbesserer | 20260816T081701Z | ✅ exit=0 |


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
