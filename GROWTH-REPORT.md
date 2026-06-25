# Growth Engine Report — NurEine — 2026-06-25

## 1. Product snapshot (Phase 0)
- **What:** Autonome Good-News-Plattform. Web (SvelteKit/Vercel) + täglicher
  Newsletter + native iOS-App (SwiftUI, fertig, vor App-Store-Launch).
- **Conversion goal:** Newsletter-Signups + (bald) App-Installs.
- **Hook:** Evergreen (täglich frische Stories), kein Saison-Event.
- **Languages/markets:** Deutsch / DACH.
- **Baseline (GSC, 90 T):** ~3 Impressions, 2 Queries, 0 Clicks → praktisch
  unsichtbar. 13 Newsletter-Subs. ~700 Story-Seiten, 0 indexiert.

## 2. Breadth map (Phase 1)
- **SERP-Shape "gute nachrichten":** ZDFheute (ÖR-Autorität), goodnews.eu (96k IG),
  nur-positive-nachrichten.de, gute-nachrichten.com.de. NurEine taucht nicht auf.
- **App-Konkurrenz (rankt + KI-zitiert):** goodnews.eu "Good News App" (seit 2017,
  iOS+Android), goodnewsapp.de "The Good News App". Beide mit identischem Pitch
  ("kein Algorithmus, kuratiert, werbefrei").
- **GEO citation gap:** Auf "beste App für gute Nachrichten ohne Algorithmus"
  nennen ChatGPT/Perplexity die beiden Konkurrenten — **NurEine nicht**.
- **Competitor wedge (was NurEine hat, die nicht):** messbarer Wirkungsindex
  (0–100), "eine Geschichte/Tag" statt sechs, /stand-der-welt Daten-Dashboard,
  öffentliche Methodik. → die GEO-Antwort baut genau darauf.

## 3. Plan (ICE-ranked) — APPROVED ✓

### Builds (gebaut + live)
| # | Bet | Item | ICE | Status |
|---|---|---|---|---|
| 1 | GEO | llms.txt + /gute-nachrichten-app (FAQ-Schema) | 8.3 | ✅ live |
| 2 | pSEO | /gute-nachrichten/{thema} (7) + /land/{land} (14) | 7.0 | ✅ live |
| 5 | Attribution | /go tracked redirector → nureine_events | 7.3 | ✅ live |
| 4 | Community | Reddit-Kit (GROWTH-REDDIT-KIT.md) | 6.3 | ✅ bereit (manuell) |

### Wartet auf Apple Developer Account
| # | Bet | Item | ICE |
|---|---|---|---|
| 6 | ASO | App-Store-Keywords/Beschreibung | 6.7 |

### 💰 Money gate (nicht gestartet, brauchen Budget-OK)
| Item | Bet | Status |
|---|---|---|
| Brand-Defense ASA | 9 | ⏸ später (Account + Budget) |
| OOH | 10 | ⏸ später |

## 4. Built / fixed (Phase 2) — alles verifiziert live ✓
- `https://nureine.de/llms.txt` (200) — KI-Profil, nennt NurEine + Wirkungsindex.
- `https://nureine.de/gute-nachrichten-app` (200) — GEO-Antwortseite, FAQPage-JSON-LD.
- `https://nureine.de/gute-nachrichten/{klima,gesundheit,…}` (200) — Themen-Hubs.
- `https://nureine.de/gute-nachrichten/land/{deutschland,usa,…}` (200) — Länder-Hubs.
- robots.txt verweist auf llms.txt; alle in sitemap.xml; bei GSC neu eingereicht.

## 5. Attribution (Phase 3)
- `/go?bet=&src=&asset=&to=` loggt `go_click` in `nureine_events` (bet/src/asset/
  platform), routet iOS→App Store / android→Play / desktop→Site.
- Jeder künftige geteilte Link (Reddit, IG, Newsletter) nutzt `/go` → pro Kanal
  messbar im `/admin`-Funnel. Reddit-Links im Kit sind bereits getaggt.
- **TODO bei App-Launch:** echte App-Store-URL in `/go` eintragen (Platzhalter).

## 6. Verify (Phase 4) — Zeithorizont
- **Sofort messbar:** /go-Klicks (sobald du Links teilst).
- **Tage–Wochen:** Google-Indexierung (GSC: GEO-Seite "discovered - not indexed").
- **Wochen:** AI-Zitierung (re-query in ~2 Wochen: "beste app gute nachrichten"
  → nennt es NurEine?).
- **Ehrliche Lage:** Tech-Hebel sind gebaut + getaggt, aber sie ziehen nicht von
  allein. Der sofort-wirksame Hebel ist menschlich: /go-Links in Reddit/Warm-100/
  IG streuen. → GROWTH-REDDIT-KIT.md, 3×/Woche.

## 7. Was als Nächstes wirkt (priorisiert)
1. **Reddit 3×/Woche** (Kit fertig) — schnellster Gratis-Reichweiten-Hebel.
2. **Warm-100** — 100 persönliche Nachrichten mit /go-Ref-Link (STRATEGY.md §7).
3. **In ~2 Wochen:** GSC-Impressions + AI-Zitierung prüfen; nachlegen wo's zieht.
4. **App-Launch:** ASO + echte Store-URL in /go.
