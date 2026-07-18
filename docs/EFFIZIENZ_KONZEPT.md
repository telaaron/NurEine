# NurEine — Effizienz-Konzept (nach dem Quota-Vorfall 2026-07-16)

**Anlass:** Supabase hat das Free-Tier-Kontingent gerissen (Egress + Cached Egress
+ Storage) und das Projekt gesperrt. nureine.de war ab dem 16.07. offline, bis die
Abrechnungsperiode am **20.07.** zurücksetzt. Kein Datenverlust — aber 4 Tage tot.

Dieses Dokument hält fest, **warum** es passiert ist und **welche Regeln** das
verhindern. Es ist bewusst kurz: nur was wirkt.

---

## 1. Die drei Ursachen (gemessen, nicht geraten)

| # | Ursache | Größenordnung |
|---|---|---|
| **A** | **Unkomprimierte Seedream-PNGs** im `story_images`-Bucket: 2,7–5 MB pro Bild statt <150 KB | 971 MB / 1002 Objekte — **der Storage-Treiber** |
| **B** | **Bilder ohne Proxy eingebettet**: ein 40px-Avatar auf `/karte` zog das volle Original (2–6 MB) bei jedem Aufruf | Egress-Treiber |
| **C** | **Redundante og_images**: ~1000 OG-Bilder à ~200 KB im Bucket, obwohl `/api/og/[slug]` sie live rendert (1 J. CDN-Cache) | ~200 MB, vermeidbar |

---

## 2. Die Regeln (ab sofort verbindlich, stehen in CLAUDE.md)

### R1 — Anzeige: NIE eine Supabase-URL direkt in `<img src>`
Immer `storyImageSrc(hero, base, breite)` aus `src/lib/story-images.ts`.
Der `/img`-Proxy skaliert, liefert WebP, cached 1 Jahr am CDN → Supabase wird pro
Variante **einmal** angefasst statt bei jedem Aufruf.
Breite = CSS-Pixel × 2 (Retina). Ein 40px-Avatar braucht `w=96`, **nicht** das
1536px-Original.

### R2 — Upload: nie unkomprimiert
`scripts/image_utils.py::encode_story_image()` — max 1200px, JPEG q85, <150 KB.
Gilt für JEDEN Storage-Upload (Bild-Regie, Backfills, Skripte).

### R3 — Nichts speichern, was sich rendern lässt
OG-/Share-Cards werden live gerendert und ein Jahr gecacht. Sie gehören **nicht**
dauerhaft in den Storage. Gleiches gilt für abgeleitete Varianten.

### R4 — Ephemeres löschen
Fertige Reel-MP4s (`story_reels`) sind nach dem Posten auf IG/TikTok Kopien.
Vorlese-Audio (`story_audio`) nutzt gerade niemand. Beides gehört aufgeräumt,
nicht archiviert.

---

## 3. Was sofort umgesetzt ist

- ✅ **R1** — `storyImageSrc()` als einzige kanonische Funktion; `/karte` (40px-Avatar
  lud das Original!) und `/admin` auf den Proxy umgestellt; die drei Archiv-Ansichten
  (Puls/Spur/Logbuch) nutzen sie statt je eigener Kopie.
- ✅ **R2** — Bild-Regie komprimiert vor dem Upload (seit 16.07.).
- ✅ Cache-Header waren schon korrekt (`/img` 1 Jahr immutable, share-card/OG 1 Tag
  + stale-while-revalidate).

## 4. Was noch offen ist (nach dem 20.07., wenn der Storage wieder erreichbar ist)

1. **Aufräumen** (der große Gewinn, ~400 MB+) — **Werkzeug:** `scripts/purge_storage.py`
   (Trockenlauf per Default, `--apply` zum Löschen; setzt beim Bild-Purge die
   referenzierende `image_url` auf NULL → Typo-Karte statt 404):
   - `story_reels` leeren (152 MB) — MP4s liegen längst auf IG/TikTok
     → `python scripts/purge_storage.py --only reels --apply`
   - `story_audio` leeren (12 MB) — Feature ungenutzt
     → `python scripts/purge_storage.py --only audio --apply`
   - >1 MB PNGs in `story_images` löschen (~484 MB) — betroffene Stories
     zeigen dann die Typo-Karte, das ist gewollt und sieht gut aus
     → `python scripts/purge_storage.py --only images --apply`
   - `og_images` prüfen: Bucket auflösen, `og_image_url` auf `/api/og/<slug>`
     umbiegen (R3) → ~200 MB
2. **Egress-Wächter**: wöchentlicher Check gegen das Kontingent, warnt VOR der
   Sperre statt danach.
3. **Mac Mini** (ab 18.07.): self-hosted Supabase = kein Egress-/Storage-Cap.
   Löst das Problem strukturell — die Regeln oben bleiben trotzdem sinnvoll
   (Ladezeit, Kosten, Sauberkeit).

---

## 5. Merksatz

> Jedes Byte, das Supabase verlässt, kostet Kontingent.
> Skalieren am Rand (CDN), komprimieren beim Upload, nichts doppelt speichern.
