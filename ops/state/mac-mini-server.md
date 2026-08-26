# Zustand: mac-mini-server

> Automatisch erzeugt von `ops/run/selfupdate.sh` — **2026-08-26T10:23:50Z**
> Diese Datei ist der Blick auf den Mini von überall: einfach hier auf GitHub lesen.

## System

| | |
|---|---|
| Läuft seit | up 6 weeks, 21 hours, 8 minutes |
| Speicherplatz | 838G frei von 915G (4% belegt) |
| Arbeitsspeicher | 13Gi verfügbar von 15Gi |
| Auslastung | load average: 0.00, 0.00, 0.00 |
| Tailscale-Adresse | `100.123.159.38` |
| Claude Code | 2.1.209 (Claude Code) |
| cron-Dienst | active (17 Jobs) |

## Code-Stand

| | |
|---|---|
| Branch | `main` |
| Aktueller Commit | `52a58ca Merge remote-tracking branch 'origin/main'` |
| vom | 2026-08-26 11:23:45 +0100 |
| Hinter origin/main | 0 Commits |
| Vor origin/main | 0 Commits |
| Uncommittete Dateien | 0 |
| Branches nur lokal (ungesichert) | 0 |
| Letzter Pull | aktualisiert 46a52c6 → 52a58ca |

## Letzte Agenten-Läufe

| Agent | Zeitpunkt (UTC) | Ergebnis |
|---|---|---|
| fetch | 20260826T011001Z | ✅ exit=0 |
| chefredakteur | 20260826T013159Z | ✅ exit=0 |
| redaktion | 20260826T013439Z | ✅ exit=0 |
| analyst | 20260826T014722Z | ✅ exit=0 |
| reel-regie | 20260826T060001Z | ✅ exit=0 |
| verbesserer | 20260826T081701Z | ✅ exit=0 |


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
