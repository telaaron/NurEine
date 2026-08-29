# Zustand: mac-mini-server

> Automatisch erzeugt von `ops/run/selfupdate.sh` — **2026-08-29T19:30:01Z**
> Diese Datei ist der Blick auf den Mini von überall: einfach hier auf GitHub lesen.

## System

| | |
|---|---|
| Läuft seit | up 6 weeks, 4 days, 6 hours, 14 minutes |
| Speicherplatz | 838G frei von 915G (4% belegt) |
| Arbeitsspeicher | 13Gi verfügbar von 15Gi |
| Auslastung | load average: 0,00, 0,00, 0,22 |
| Tailscale-Adresse | `100.123.159.38` |
| Claude Code | 2.1.209 (Claude Code) |
| cron-Dienst | active (17 Jobs) |

## Code-Stand

| | |
|---|---|
| Branch | `main` |
| Aktueller Commit | `ce8c282 fix(reel): TTS ohne edge_tts lauffähig, Gate erkennt Dezimalzahlen` |
| vom | 2026-08-29 19:04:45 +0100 |
| Hinter origin/main | 3 Commits |
| Vor origin/main | 0 Commits |
| Uncommittete Dateien | 2 |
| Branches nur lokal (ungesichert) | 0 |
| Letzter Pull | kein Pull — uncommittete Änderungen im Arbeitsbaum |

## Letzte Agenten-Läufe

| Agent | Zeitpunkt (UTC) | Ergebnis |
|---|---|---|
| fetch | 20260829T011001Z | ⚠️ exit=1 |
| chefredakteur | 20260828T013157Z | ✅ exit=0 |
| redaktion | 20260828T013452Z | ✅ exit=0 |
| analyst | 20260828T014829Z | ✅ exit=0 |
| reel-regie | 20260829T060001Z | ✅ exit=0 |
| verbesserer | 20260829T081701Z | ✅ exit=0 |


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
