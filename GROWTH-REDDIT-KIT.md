# Reddit-Distributions-Kit — NurEine

Der schnellste Gratis-Reichweiten-Hebel. **Mensch (du), nie automatisiert**
(Auto-Posting = Bann + zerstört den Wert). 3 Posts/Woche, je 5 Min.

## Die Regeln (damit du nicht gebannt wirst)
1. **Erst geben, dann nehmen.** Sei echtes Community-Mitglied: kommentiere/upvote
   andere Posts in der Woche, bevor du eigenes postest. Reddit hasst Drive-by-Promo.
2. **Titel = Hook, Body = Substanz + Quelle.** Kein "Schaut meine App". Die
   Geschichte selbst ist der Post. Der NurEine-Link kommt dezent ans Ende.
3. **Primärquelle verlinken** (UN, Mongabay, Grist…), NICHT nur nureine.de. Reddit
   belohnt die Originalquelle. NurEine als "hier kuratiert + Wirkungsindex" dahinter.
4. **Ein Post pro Subreddit pro Woche.** Nicht dieselbe Story in 5 Subs (= Spam-Flag).
5. **Deutsch in r/de & Co., Englisch in r/UpliftingNews & Co.** (übersetze den Hook).

## Subreddits (Start)
| Subreddit | Sprache | Was passt |
|---|---|---|
| r/UpliftingNews | EN | wirkungsstarke globale Good News (Top-Hebel, Millionen Member) |
| r/de | DE | DACH-relevante / deutsche Stories |
| r/Optimismus | DE | alles Positive, klein aber passgenau |
| r/Futurology | EN | Innovation/Klima/Tech-Durchbrüche |
| r/solarpunk | EN | Klima/Nachhaltigkeit/Gemeinschaft |
| r/science | EN | nur peer-reviewed, sehr streng — nur die belegtesten |

## Fertige Posts (diese Woche)

Jeder Link ist getaggt (`/go?bet=community&src=reddit`) → erscheint im
`/admin`-Funnel als `go_click`, src=reddit. So siehst du, was Reddit wirklich bringt.

### Post 1 — r/UpliftingNews (EN)
**Title:** The UN just passed the world's first binding rules for autonomous vehicles
**Body:**
> The UN has adopted the first global regulatory framework for self-driving cars —
> a real step toward safer, accountable automation instead of a patchwork of
> national rules.
> Source (UN News): [link to primary source]
> I found this via NurEine, a German good-news project that scores each story by
> a measurable "impact index" (reach × durability × evidence): https://nureine.de/go?bet=community&src=reddit&asset=un-autonomous-vehicles

### Post 2 — r/de (DE)
**Title:** Pakistan schafft die Steuer auf Periodenprodukte ab
**Body:**
> Pakistan streicht die Steuer auf Menstruationsprodukte — ein konkreter Schritt
> gegen Periodenarmut für Millionen.
> Quelle: [Primärquelle verlinken]
> Gefunden über NurEine, das gute Nachrichten nach einem messbaren Wirkungsindex
> kuratiert (statt nach Klicks): https://nureine.de/go?bet=community&src=reddit&asset=pakistan-perioden

### Post 3 — r/Futurology oder r/solarpunk (EN)
**Title:** DHL is putting cargo back on sail-powered ships to cut shipping emissions
**Body:**
> Wind-assisted cargo: DHL is using sail freighters to cut emissions on ocean
> routes — old tech, new urgency.
> Source (Reasons to be Cheerful): [link]
> Via NurEine (good news ranked by a measurable impact score): https://nureine.de/go?bet=community&src=reddit&asset=dhl-sail-ships

## Weitere starke Kandidaten (für nächste Wochen)
Hol jederzeit frische über `curl -s "https://nureine.de/api/stories?limit=40"`
und nimm die mit hohem `impactScore` + Primärquelle (`sourceType`:
official_stats / peer_review / registry). Aktuell stark:
- UN: Methan schnell reduzierbar (78, UN News) → r/Futurology, r/climate
- Korallenriffe widerstandsfähiger als gedacht (75) → r/science, r/ocean
- Chicago baut größtes Luftmessnetz der USA (72, Grist) → r/environment
- Ausgestorbene Tiere kehren in Rios Regenwald zurück (70, Mongabay) → r/UpliftingNews
- Indigene Kulturen sind Klimaretter (70, Grist) → r/solarpunk

## Nach 2 Wochen messen
`/admin` → Funnel → filtere `go_click` mit `src=reddit`. Welcher Subreddit / welche
Story brachte Klicks → Signups? Das sagt dir, wo du nachlegst. Wenn ein Post
>500 Upvotes macht: dieselbe Story-Art wiederholen.
