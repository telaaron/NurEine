# SEO-Authority-Plan — nureine.de

**Stand:** 2026-07-10
**Ausgangslage (GSC, 28 Tage):** 1 Klick, ~62 Impressions, 4 Queries. Homepage + /archiv + /archiv/wissenschaft indexiert, ~1000 Story-URLs größtenteils NICHT indexiert (Status "Gefunden – zurzeit nicht indexiert").

## Die eine Wahrheit über dieses Projekt

Das **technische & On-Page-SEO ist bereits exzellent** (NewsMediaOrganization+WebSite-Schema, News-Sitemap, saubere Canonicals, www→apex-Redirect, pSEO-Hubs mit 20k Wörtern, SpeakableSpecification). Daran liegt es **nicht**.

Die Bremse ist zu ~90 % **Off-Site-Authority (Backlinks + Erwähnungen)** und zu ~10 % **Crawl-Budget-Fokus**. Eine 6 Monate alte Domain ohne eingehende Links wird von Google indexiert, aber nicht ernst genommen — Google kennt die Tiefe der Seite, investiert aber kein Crawl-Budget hinein. **Backlinks sind das Signal, das diesen Deckel löst.** Kein Code-Change ersetzt das.

Und zur Kernfrage *"Warum finde ich 'nur eine' nicht?"*:
> "nur eine" (mit Leerzeichen) ist Artikel + Zahlwort — eines der generischsten Wortpaare der Sprache. Dagegen konkurrierst du mit dem Wikipedia-Film "Nur eine Frau", IMDb und Millionen beiläufiger Treffer. Das ist **nicht gewinnbar und auch kein sinnvolles Ziel.** Das erreichbare, wichtige Ziel ist: Wer **"NurEine"** / **"nureine"** (zusammen) oder **"nureine gute nachrichten"** googelt, findet dich sofort auf #1 mit Sitelinks. Das kommt mit Brand-Signalen + ersten Backlinks von allein.

---

## Bereits umgesetzt (Code, dieser Session, 2026-07-10)

- [x] **Footer verlinkt jetzt die pSEO-Hubs** (`/gute-nachrichten/*` + `/gute-nachrichten/land/deutschland` + `/gute-nachrichten-app`) statt nur `/archiv/*`. Diese Landing-Pages hingen bisher nur an der XML-Sitemap → jetzt sitewide interner Crawl-Pfad von der indexierten Startseite. **Das ist der Hebel gegen "Discovered – not indexed".**
- [x] **Sitemap-Truncation gefixt.** `getStoryList()`/`getAllStories()` liefen in den harten PostgREST-1000-Zeilen-Deckel → Sitemap brach bei exakt 1000 Story-URLs ab, ältere Stories wurden nie entdeckt. Neuer `fetchAllRows()`-Paginator holt jetzt die komplette Liste.

**→ Nach Deploy:** Sitemaps in GSC neu einreichen + IndexNow-Ping (siehe unten).

---

## PRIORITÄT 1 — Off-Site-Fundament (0 €, macht Aaron, ~3–4 h gesamt)

Das ist die eigentliche Arbeit. Reihenfolge = Wirkung.

### 1.1 Google Unternehmensprofil (Google Business Profile) — WICHTIGSTER Einzelschritt
- URL: https://www.google.com/business/
- NAP festlegen (überall exakt identisch verwenden!):
  - **Name:** NurEine
  - **Ort:** Teltow, Brandenburg (Kategorie: „Nachrichtendienst" / „Verlag" / „Medienunternehmen")
  - **Website:** https://nureine.de
- Warum: eigenes Knowledge-Panel-Signal, verknüpft Brand-Name „NurEine" fest mit der Domain → löst direkt das „ich finde meine Marke nicht"-Problem.

### 1.2 Kostenlose Verzeichnisse mit dofollow-Backlink (NAP identisch!)
Jeweils Eintrag anlegen, Website-Feld = `https://nureine.de`, kurze (leicht variierte!) Beschreibung.

| Verzeichnis | URL | Hinweis |
|---|---|---|
| Webwiki | https://www.webwiki.de/ | dofollow, schnell |
| Cylex Branchenbuch | https://web2.cylex.de/ | groß, dofollow |
| Gelbe Seiten | https://www.gelbeseiten.de/ | hohe Autorität |
| Das Örtliche | https://www.dasoertliche.de/ | Standard-NAP |
| Das Telefonbuch | https://www.dastelefonbuch.de/ | national |
| 11880.com | https://www.11880.com/ | KMU |
| GoYellow | https://www.goyellow.de/ | Online-Branchenbuch |
| Brownbook | https://www.brownbook.de/ | international, dofollow |

**Regel:** Beschreibung pro Eintrag leicht umformulieren (kein Copy-Paste), Firmendaten aber 1:1 gleich. 8 solide Einträge > 30 Spam-Kataloge.

### 1.3 Branchen-/Themen-Relevanz (der qualitativ beste Link-Typ)
- **Netzwerk Journalismus** — Mitglied werden: https://www.netzwerk-journalismus.de/mitglied-werden/ (konstruktiver Journalismus, thematisch perfekt passend → potenzieller Profil-/Mitglieder-Link)
- **Bonn Institute for Constructive Journalism** — https://www.bonn-institute.org/ (Community/Newsletter; Vernetzung, evtl. Erwähnung)
- Recherchieren, ob "good news for you" / Perspective Daily / Good-News-Magazin eine Blogroll / Linkliste führen, in die NurEine passt.

### 1.4 Eine selbst geschriebene Pressemitteilung (0 €)
- **openPR:** 2 Pressemitteilungen/Jahr kostenlos: https://www.openpr.de/news/einstellen.html
- Fertiger Entwurf: siehe `docs/PRESSEMITTEILUNG_LAUNCH.md`
- Liefert 1 dofollow-Link von etablierter PR-Domain + Verteilung an Google News-Ökosystem.

---

## PRIORITÄT 2 — Bezahlte Abkürzung (nur wenn 1 abgehakt)

Deine Frage war „was kostet Option 3?". Antwort:

| Hebel | Kosten | Wann sinnvoll |
|---|---|---|
| openPR PM selbst einstellen | **0 €** | sofort (siehe 1.4) |
| openPR **Fachverteiler** DACH | **47–347 €** einmalig | wenn PM steht & du Reichweite an Redaktionen willst |
| openPR **PM-Full-Service** (schreiben+versenden) | **199 €** + USt | nur wenn keine Zeit für Text |
| 1 hochwertiger Themen-Gastbeitrag/Link (DR30+) | ~150–400 €/Link | ERST wenn Domain indexiert & Fundament steht |

**Empfehlung:** Erst 0-€-Fundament komplett. Bezahlte Links auf eine noch-nicht-ernstgenommene Domain verpuffen genauso wie sonst nichts passiert. Wenn Budget, dann **openPR-Fachverteiler (~47 €)** als günstigster echter Reichweiten-Hebel.

---

## PRIORITÄT 3 — Laufend (teils automatisierbar, teils Aaron)

- **Social-Signale als Crawl-Trigger:** Jede neue Top-Story mit Link auf Instagram/X/Reddit posten. Reddit (`r/GoodNews`, `r/UpliftingNews`, `r/de`) bringt echte Klicks + gelegentliche organische Links. (IG-Pipeline existiert bereits.)
- **IndexNow scharf schalten:** `INDEXNOW_KEY=23c37d00926a76325ec657ddf3692e7d` in Vercel setzen (Prod+Preview+Dev). Keyfile liefert bereits 200. Dann pingt der Cron neue Stories automatisch an Bing/Yandex.
- **GSC „Indexierung beantragen"** manuell für: `/`, `/gute-nachrichten/wissenschaft`, `/gute-nachrichten/land/deutschland`, `/stand-der-welt` (URL-Prüfung → Indexierung beantragen; API kann das nicht).

---

## Erwartung / Zeithorizont (ehrlich)

- **Woche 1–2:** pSEO-Hubs + tiefere Stories werden gecrawlt (Footer-Links + volle Sitemap). Erste Impressions auf „gute nachrichten [thema]".
- **Woche 2–4:** Brand-Query „NurEine" fest auf #1 mit Sitelinks (durch Business Profile + Backlinks).
- **Monat 2–3:** Erste Verzeichnis-/PR-Links verdaut → Crawl-Budget steigt, mehr Stories indexiert, erste echte Klicks auf Themen-Queries.
- **Monat 3+:** Mit ~10–20 sauberen Backlinks verlässt die Domain die „young/no-authority"-Zone → organisches Wachstum wird selbsttragend.

Es gibt keinen Schalter für „sofort #1". Der Hebel ist Authority, und Authority braucht eingehende Links + Zeit. Der Plan oben ist der schnellste seriöse Weg dahin.
