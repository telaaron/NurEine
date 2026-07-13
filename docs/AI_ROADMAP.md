# NurEine KI-Qualitätssystem — Fahrplan & Zeitplan

Lebendes Dokument. Was ist live, was kommt wann, worauf warten wir, welches
Ergebnis soll es bringen. Ergänzt `docs/AI_QUALITY_SYSTEM.md` (Architektur).
Stand: 2026-07-07.

---

## LIVE (steht & läuft)

| Baustein | Seit | Was es bringt |
|---|---|---|
| DB-Fundament (`nureine_ai_runs`, `nureine_improvements`) | 07-07 | Jeder Agentenlauf + jede Verbesserungs-Idee getrackt → Basis fürs Lernen & Dashboard |
| **Chefredakteur** (Cloud, ~02:04) | 07-07 | Bewertet Stories auf echte Relevanz, killt Score-Inflation, wählt Tages-Perlen. **Probelauf ok:** 3 Perlen kuratiert, 6 Kuriositäten abgewertet |
| **Analyst** (Cloud, ~01:33) | 07-07 | Misst IG/Newsletter-Performance, leitet Verbesserungs-Ideen ab, verifiziert alte Änderungen |
| **Veredler** (Cloud, ~02:36) | 07-07 | Formuliert die Perlen premium aus (Hooks, Betreff, Slides) |
| **Verbesserer** (lokal, Mac an) | 07-07 | Setzt essentielle Ideen im Code um → PR (Aaron merged) |
| **Reel-Regie** (Cloud, Mo/Mi/Fr) | 07-06 | Produziert Reels in Referenz-Qualität + analysiert |

---

## ALS NÄCHSTES (nach Aaron-OK, diese/nächste Woche)

### 1. Bild-Regie mit REALISTISCHEM Ansatz — ENTSCHIEDEN (Aaron 2026-07-08), Umbau offen
- **Warum:** Aaron: „Menschen wollen visuelle Aufhänger, keine abstrakten Bilder."
  Alter Paper-Collage-Stil raus.
- **Modell FIX: Seedream v4.5** (`fal-ai/bytedance/seedream/v4.5/text-to-image`, $0,04/Bild).
  Im Test klarer Sieger vs. altem flux-pro UND vs. FLUX.2 (wärmer, filmischer, saubere Hände).
- **Fotografen-DNA (übergeordneter Stil, konstant):** Leica 35mm Reportage-Lens, Kodak
  Portra 400 Emulation, warmes natürliches Licht, flache Tiefenschärfe, feines Filmkorn,
  EIN Terracotta-Akzent, dokumentarisch, kein Text/Logo. Prompt = Subject-first (Seedream-
  Regel), 30–100 Wörter, dann DNA. Motiv immer ins Konkret-Menschliche übersetzen
  (kein wörtliches „Forschung"/„Protein" — sondern die menschliche Szene dahinter).
- **Nur ~5–6 Premium-Bilder/Tag** (Perlen + Newsletter/Reel-Hero), nicht ~10. ~7–8€/Monat.
- **⚠️ ANATOMIE-HÄRTUNG (2026-07-12, nach Fehlbild „falscher Arm hinter Rücken"):** Drei
  Hebel gegen Körperfehler (falsche Arme, zu viele Finger, verschmolzene Glieder) — jetzt
  im SKILL `nureine-bild-regie` verankert: (1) **Hand-sichere Komposition per Default** —
  bei Menschen Hände NICHT zeigen (`waist-up`/Profil/`hands not visible`), NIE „hands behind
  back"/„crossed arms"/Gesten; das eliminiert die Fehlerklasse an der Quelle (billigster,
  wirksamster Hebel). (2) **Best-of-N** — `max_images: 4` in EINEM Seedream-Call, bestes
  wählen. (3) **Strenger Vision-Judge MIT Zoom auf Hände** (ffmpeg-crop) + Einzelpunkt-
  Checkliste; bei geringstem Zweifel Bild raus, lieber kein Bild. Seedream hat KEINEN
  negative_prompt/guidance_scale → alles positiv/kompositorisch lösen. Recherche-Belege:
  Flux/Midjourney sind bei Anatomie stärker als Seedream (falls je A/B nötig); MediaPipe
  Hands taugt NICHT als Gate (erkennt deformierte KI-Hände schlecht). Kein Modell ist
  fehlerfrei → Judge-Gate bleibt Pflicht.
- **Umbau (offen):** `scripts/fetch_stories.py` — image_prompt-Bau + `generate_image_fal`
  von flux-pro auf Seedream v4.5 + DNA umstellen; Bild-Gate auf „nur Perlen/Hero" verengen;
  Vision-QA modernisieren (statt LLaVA-NeXT). KI-Kennzeichnung bleibt.
- **Ergebnis-Ziel:** Bilder, die im Feed sofort als „echt & relevant" gelesen werden →
  höhere Verweildauer/Stopp-Kraft; messbar an saves/reach der bebilderten Posts.

### 1b. Strengerer Vorfilter — weniger, aber bessere Stories (Aaron 2026-07-08)
- **Was:** Statt ~22 Stories/Tag nur ~8–12 wirklich relevante in die DB. Chefredakteur +
  Vorfilter-Prompt (`fetch_stories.py`) strenger gegen Kuriosität/Lokal-Fluff.
- **Ergebnis-Ziel:** Weniger Rauschen, kuratierteres Archiv, höhere Perlenrate im Rohmaterial.

### 2. Quellen-Qualitäts-Layer — „haben wir gute Rohstoffe?"
- **Warum:** Aaron: nicht das Maximum aus schlechten Storys holen, sondern prüfen, ob
  uns die GUTEN fehlen. Probelauf zeigte: ScienceDaily Tech liefert fast nur Kuriosität.
- **Was:** Monatlicher Cloud-Agent, der `nureine_source_quality` auswertet (Perlenrate
  je Quelle), schwache Quellen drosselt/rauswirft, Lücken benennt (welche Themen/Regionen
  fehlen) und neue Quellen vorschlägt → `nureine_improvements`.
- **Warten auf:** ~2–3 Wochen Chefredakteur-Daten (echte Perlenraten je Quelle).
- **Ergebnis-Ziel:** Höhere Perlenrate im Rohmaterial → weniger „nichts Gutes heute".

### 3. Admin-Dashboard `/admin/ki`
- **Was:** Eine Seite: was lief letzte Nacht (`nureine_ai_runs`), Story-Qualitäts-
  Verteilung, Performance-Trend, offene/umgesetzte Verbesserungen + ob sie wirkten.
- **Warten auf:** nichts (Daten fließen schon). Aaron will es sich ansehen.
- **Ergebnis-Ziel:** Aaron sieht alles auf einen Blick, Rest läuft autonom.

---

## FUNDAMENT-FIX (aus Probelauf, Prio 1)

- **resonance_score-Skala vereinheitlichen (0–10 vs 0–100 gemischt).** Alt-Daten in
  0–10, neuer Agent in 0–100. Einmalige Migration (alte ×10 oder neu bewerten) +
  Schwellen im Code prüfen. Steht als Prio-1 in `nureine_improvements` → der
  Verbesserer nimmt es sich; bis dahin schreiben die Agenten immer 0–100.

---

## ZUKUNFT (angemerkt, damit nicht vergessen)

### Mac Mini als Dauer-Runner
- **Warum:** Claude-Code-Scheduled-Tasks laufen nur, wenn die App offen ist. Für
  echten Mac-unabhängigen 24/7-Nachtbetrieb braucht es einen immer-an-Rechner.
- **Was:** Aarons herumstehenden Mac Mini (älteres OS) als dedizierten NurEine-Runner
  einrichten — Claude Code drauf, die Nacht-Routinen laufen dort permanent.
- **Warten auf:** Prüfen, ob das OS Claude Code unterstützt (Mindest-macOS). Aaron
  entscheidet, wann er den Mini freiräumt.
- **Ergebnis-Ziel:** Alle Nacht-Agenten laufen zuverlässig, egal ob Aarons Haupt-Mac
  an ist. Alternative zum API-Key-Weg (GitHub Actions + ANTHROPIC_API_KEY).

### Weitere DeepSeek→Claude-Migrationen (schrittweise)
- Wenn die Veredelungs-Schicht bewiesen besser ist: einzelne DeepSeek-Calls ganz zu
  Claude ziehen (zuerst impact-Scoring in `fetch_stories.py`, dann IG-Kommentare in
  `comments.ts`). DeepSeek bleibt bis dahin Fallback/DB-Füller (Aaron: „für den Anfang ok").

---

## Messung (woran wir Erfolg festmachen)

- **Story-Qualität:** ⌀ resonance_score der Perlen, Anteil abgewerteter Kuriosität,
  Perlenrate je Quelle (steigt über Zeit?).
- **Reichweite:** shares/reach (Reels), Öffnungs-/Klickrate (Newsletter).
- **Selbstlernen:** Anteil `nureine_improvements` mit outcome='improved' (lernt das
  System wirklich?).
Der Analyst schreibt diese Zahlen nächtlich fort; das Dashboard zeigt den Trend.
