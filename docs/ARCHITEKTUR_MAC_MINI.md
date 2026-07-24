# Mac Mini vs. Cloud — was gehört wohin?

**Für den Architekten.** Stand 2026-07-17, nach dem Supabase-Quota-Ausfall.

---

## Die eine Zahl, die alles entscheidet

| | Ist | Free-Tier-Limit | Auslastung |
|---|---|---|---|
| **Datenbank** | **83 MB** (1092 Stories, 21 Subscriber) | 500 MB | **17 %** ✅ |
| **Storage** (Bilder/Videos) | **~1,2 GB** | 1 GB | **>120 %** ❌ |
| **Egress** (Bytes raus) | Limit gerissen | 5 GB/Monat | **>100 %** ❌ |

**Die Datenbank war nie das Problem.** Sie ist winzig und wächst langsam
(~3 MB/Monat). Gesprengt haben ausschließlich **Storage** (unkomprimierte
Seedream-PNGs à 2,7–5 MB) und **Egress** (dieselben Bilder ausliefern).

> **Daraus folgt: Postgres NICHT migrieren. Nur die Bytes verlagern.**
> Eine 83-MB-DB self-hosted zu betreiben, kauft nichts — kostet aber Verfügbarkeit,
> Backups, Updates und ein Risiko, das ihr heute nicht habt.

---

## Empfehlung: die Trennlinie

### ☁️ BLEIBT in der Cloud (Supabase)

| Was | Warum |
|---|---|
| **Postgres** (alle Tabellen) | 83 MB von 500 MB. Braucht 24/7-Uptime, weil Vercel bei **jedem Seitenaufruf** liest. Ein Mac Mini hinter einer Privat-Leitung ist dafür der falsche Ort: Stromausfall/Neustart/DSL-Störung = Website tot. Supabase macht Backups, Updates, Failover. |
| **Auth / RLS-Policies** | Sicherheitskritisch, hängt an Postgres. |
| **Realtime / Edge Functions** | Falls genutzt — hängt an Postgres. |

### 🖥️ ZIEHT auf den Mac Mini

| Was | Warum | Gewinn |
|---|---|---|
| **Bild-/Video-Archiv** (`story_images`, `story_reels`, `story_audio`, `og_images`) | **Das ist die Ursache.** Bilder brauchen keine Transaktionen, keine RLS — nur Platz. Der Mini hat quasi unbegrenzt. | **~1,2 GB → 0** im Cloud-Storage |
| **Alle nächtlichen Agenten** (Fetch → Chefredakteur → Redaktion → Analyst, Verbesserer, Reel-Regie) | Laufen heute nur, wenn dein Rechner an ist — das war der Grund für mehrere leere Nächte. | echte 24/7-Kette |
| **Render-Last** (Remotion/ffmpeg) | CPU-schwer, braucht keine Cloud. | schneller, kostenlos |

### Der Knackpunkt: Wie kommen die Bilder zum Besucher?

Nicht direkt vom Mini — dessen Upload-Leitung wäre der Flaschenhals und seine
IP nicht öffentlich. **Der Mini ist die Quelle, ein CDN die Auslieferung:**

```
Mac Mini (Original-Archiv)
   └─► einmalig pushen ─► Objektspeicher mit CDN (Cloudflare R2*)
                              └─► /img-Proxy (Vercel) ─► Besucher
```

\* **R2 ist hier der eigentliche Hebel**: Cloudflare berechnet **keinen Egress**.
Genau die Kostenart, die euch gesperrt hat, fällt damit strukturell weg —
10 GB Speicher gratis, danach ~$0,015/GB/Monat. Ihr habt schon einen
Cloudflare-Account (Newsletter-Worker).

Alternative ohne neuen Dienst: Bilder im Repo/Vercel ausliefern. Geht bei
~1000 Bildern nicht sinnvoll (Deploy-Größe, Git-Historie).

---

## Vorschlag in einem Satz

> **Postgres bleibt in Supabase. Der Mac Mini wird Agenten-Runner + Bild-Archiv.
> Die Auslieferung übernimmt Cloudflare R2 (kein Egress).**

Das löst beide Ursachen (Storage + Egress), lässt aber die Verfügbarkeit der
Website unangetastet — sie hängt weiter an Diensten mit Uptime-Garantie, nicht
an einem Gerät in deiner Wohnung.

---

## Reihenfolge (Vorschlag)

1. **Mini als Agenten-Runner** (Samstag). Löst „Rechner nachts aus" sofort.
   Kein Migrationsrisiko, sofortiger Nutzen.
2. **R2-Bucket anlegen**, `/img`-Proxy auf R2 zeigen lassen (eine Zeile:
   `ALLOWED_HOST`). Neue Bilder gehen nach R2.
3. **Alt-Bestand umziehen**: Mini lädt Bilder aus Supabase → R2, DB-URLs
   umschreiben. Danach Supabase-Storage leeren → Egress-Problem strukturell weg.
4. **Postgres**: nichts tun. Erst wieder anschauen, wenn die DB >300 MB geht
   (aktuell ~8 Jahre entfernt) oder Supabase teuer wird.

---

## Was ich bewusst NICHT empfehle

- **Postgres self-hosted auf dem Mini.** Der Gewinn wäre 83 MB Speicher; der
  Preis: Website hängt an deiner Wohnung. Falscher Tausch.
- **Alles auf den Mini.** Ein Single-Point-of-Failure ohne Backup-Strategie
  ist schlechter als der Status quo.
- **Supabase Pro (25 $)** als Dauerlösung. Löst das Symptom, nicht die Ursache
  — mit R2 + Kompression braucht ihr den Free-Tier gar nicht zu verlassen.

## Offene Fragen für den Architekten

1. Wie kommt der Mini ans Netz (fester Anschluss? VPN/Tailscale für Zugriff)?
2. Backup des Bild-Archivs auf dem Mini — Time Machine oder zweite Platte?
3. Soll der Mini auch die **Vercel-Builds** übernehmen? (Eher nein — Vercel
   baut kostenlos und schnell.)
