# NurEine — Effizienz- & Spar-Konzept (2026-07-16)

**Anlass:** Supabase hat das Projekt gesperrt (`exceed_egress_quota`,
`exceed_cached_egress_quota`, `exceed_storage_size_quota`). Website zeigte
„0 Geschichten", Newsletter fand keine Story — die DB antwortete nur noch mit der
Sperr-Meldung. Kein Code-Bug: ein **Ressourcen-Problem**.

## Die harten Zahlen (gemessen, nicht geschätzt)

| Bucket | Dateien | Größe | Ø/Datei |
|---|---|---|---|
| **story_images** | 1002 | **971 MB** | **992 kB** |
| story_reels | 22 | 152 MB | 7.1 MB |
| websniper | 88 | 55 MB | 640 kB |
| story_audio | 22 | 12 MB | 548 kB |
| avatars | 19 | 11 MB | 600 kB |
| **Summe** | | **~1,2 GB** | (Free-Tier: 1 GB) |

**Davon wertlos:** 237 Bilder von Sub-55-Stories + 13 von Dubletten + 2 verwaiste
= **252 Bilder ≈ 245 MB reiner Müll**. Die 763 „echten" sind PNG @ ~1 MB — als
WebP wären es ~100 kB.

## Ursachenanalyse — warum es explodiert ist

1. **PNG statt WebP.** Seedream liefert 2560px-PNGs (2–6 MB). Wir speichern sie
   fast unkomprimiert. Ein Story-Bild braucht real ~1200px WebP ≈ 100 kB.
2. **Kein Aufräumen.** Bilder von aussortierten (impact<55) und doppelten Stories
   bleiben liegen — 25% des Speichers ist Müll.
3. **Egress pro Abruf.** Jedes 1-MB-Bild geht bei JEDEM Seitenaufruf/OG-Preview/
   share-card-Render raus. Der `/img`-Proxy hilft, aber die Quelle bleibt riesig.
4. **share-card/OG rendern live.** Jeder IG-Abruf triggert Satori + lädt das
   Vollbild aus dem Bucket → doppelter Egress (rein + raus).
5. **Reels 7 MB × 22.** Videos gehören nicht dauerhaft in denselben Speicher.

## Das Konzept — 3 Stufen

### Stufe 1: SOFORT (bringt ~85% Ersparnis, ohne Qualitätsverlust)

| Maßnahme | Ersparnis | Wie |
|---|---|---|
| **Bilder → WebP @1200px** | 971 MB → **~90 MB** | Beim Upload (Bild-Regie + fetch) `sharp`/`cwebp` q80. Bestand einmalig konvertieren. |
| **Müll löschen** | −245 MB | 252 Bilder von Sub-55/Dubletten/verwaisten Stories entfernen. |
| **OG/share-card cachen** | Egress −70% | Gerenderte Karten in einen Bucket schreiben statt bei jedem Abruf neu zu rendern+ausliefern (heute: `s-maxage`, aber der Ursprungs-Render zieht jedes Mal das Vollbild). |
| **Reels auslagern** | −152 MB | MP4s nach dem Posten löschen (IG/TikTok hosten sie ja) oder auf den Mac Mini. |

**Ergebnis: ~1,2 GB → ~120 MB.** Passt wieder locker in den Free-Tier.

### Stufe 2: STRUKTURELL (verhindert Rückfall)

- **Upload-Gate:** Kein Bild >200 kB darf in den Bucket. Hard-Check im Code.
- **Retention:** Bilder von Stories, die 30 Tage alt UND nie Perle/gepostet waren,
  automatisch löschen (Nacht-Routine).
- **Bild nur für Perlen** (ist schon so — Stufe ③ des Qualitätsmodells) → ~2-4
  neue Bilder/Tag statt 18. Bei 100 kB/Bild = 12 MB/Monat statt 540 MB.
- **Egress-Monitor:** Der Analyst meldet wöchentlich Storage/Egress-Trend, bevor
  das Limit wieder reißt.

### Stufe 3: MAC MINI (Aarons Server, ab Samstag)

Der Mac Mini ändert die Rechnung grundlegend — aber **nicht alles gehört dorthin**:

| Was | Wohin | Warum |
|---|---|---|
| **Bild-/Video-Speicher** | **Mac Mini** ✅ | Genau der Kostentreiber. Quasi unbegrenzt, kein Egress-Limit. Bilder via eigener Domain ausliefern. |
| **Nacht-Routinen** | **Mac Mini** ✅ | Löst das „Rechner nachts aus"-Problem (heute wieder passiert). |
| **Rendering (Reels/Karten)** | **Mac Mini** ✅ | CPU-lastig, kein Vercel-Timeout mehr. |
| **Postgres-DB** | **Supabase behalten** ⚠️ | Die DB ist NICHT das Problem (Tabellen sind winzig). Selbst-Hosten heißt: Backups, Updates, Uptime, Erreichbarkeit von Vercel aus. Hohes Risiko für wenig Ersparnis. |

**Empfehlung:** Mac Mini = **Speicher + Routinen + Rendering**. DB bleibt bei
Supabase. So verschwindet der Kostentreiber, ohne dass die Seite von Aarons
Internetanschluss/Stromausfall abhängt.

## Sofort-Reihenfolge

1. **Aaron:** Supabase-Sperre lösen (Spend-Cap/Upgrade) → Seite lebt wieder.
2. **Claude:** Müll-Bilder löschen (−245 MB) → evtl. reicht das schon unter's Limit.
3. **Claude:** WebP-Konvertierung Bestand + Upload-Pipeline.
4. **Claude:** OG/share-card-Caching.
5. **Samstag:** Mac Mini als Speicher + Routinen-Runner.
