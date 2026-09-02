#!/usr/bin/env python3
"""
Nulllauf des Langzeitindex (V0.5).

Rechnet den Index exakt nach der praeregistrierten Spezifikation
(docs/langzeitindex-spec.json) und schreibt CSV. KEINE Visualisierung —
das ist Absicht: Der wirksamste Schutz gegen unbewusstes Schoenrechnen ist,
die Zahl zu sehen, bevor man in sie investiert hat.

Am Ende werden die Abbruchkriterien aus der Praeregistrierung geprueft.
Schlaegt eines an, endet das Skript mit Exit-Code 1.

Aufruf:
    python3 scripts/index_build.py [--out out/index] [--offline]

Die Anker werden NIE aus den Daten berechnet — sie stehen in der Spec.
Wer sie aendert, aendert die Praeregistrierung und traegt das ins
Aenderungsprotokoll ein.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import logging
import math
import random
import sys
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SPEC_PATH = REPO / "docs" / "langzeitindex-spec.json"
CACHE_DIR = REPO / ".cache" / "langzeitindex"

WB_URL = "https://api.worldbank.org/v2/country/WLD/indicator/{code}?format=json&per_page=400"
OWID_URL = "https://ourworldindata.org/grapher/{slug}.csv?csvType=full"

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger("index_build")


# ---------------------------------------------------------------- Daten holen

def fetch_worldbank(code: str) -> dict[int, float]:
    """Weltreihe (WLD) eines World-Bank-Indikators als {jahr: wert}."""
    with urllib.request.urlopen(WB_URL.format(code=code), timeout=60) as resp:
        payload = json.load(resp)
    if not isinstance(payload, list) or len(payload) < 2 or not payload[1]:
        raise ValueError(f"{code}: keine Weltreihe")
    out = {}
    for row in payload[1]:
        if row.get("value") is not None and row.get("date") is not None:
            out[int(row["date"])] = float(row["value"])
    if not out:
        raise ValueError(f"{code}: Weltreihe leer")
    return out


def fetch_owid(slug: str, column: str) -> dict[int, float]:
    """Weltzeile einer OWID-Grapher-Reihe als {jahr: wert}."""
    req = urllib.request.Request(
        OWID_URL.format(slug=slug), headers={"User-Agent": "NurEine/langzeitindex"}
    )
    with urllib.request.urlopen(req, timeout=90) as resp:
        text = resp.read().decode("utf-8")
    rows = list(csv.DictReader(io.StringIO(text)))
    if not rows:
        raise ValueError(f"{slug}: leere CSV")
    if column not in rows[0]:
        raise ValueError(f"{slug}: Spalte '{column}' fehlt ({list(rows[0])[:6]})")
    out = {}
    for row in rows:
        if row.get("Entity") == "World" and row.get(column):
            out[int(row["Year"])] = float(row[column])
    if not out:
        raise ValueError(f"{slug}: keine World-Zeile")
    return out


def load_series(ind: dict, offline: bool) -> dict[int, float]:
    """Reihe laden, mit Cache — damit ein Wiederholungslauf reproduzierbar ist."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache = CACHE_DIR / f"{ind['id']}.json"
    if offline:
        if not cache.exists():
            raise FileNotFoundError(f"{ind['id']}: kein Cache fuer --offline")
        return {int(k): v for k, v in json.loads(cache.read_text()).items()}
    if ind["quelle"] == "worldbank":
        series = fetch_worldbank(ind["code"])
    else:
        series = fetch_owid(ind["code"], ind["spalte"])
    cache.write_text(json.dumps({str(k): v for k, v in sorted(series.items())}))
    return series


# ------------------------------------------------------- Normierung (Spec 7.1)

def normalize(x: float, anker0: float, anker100: float, k: float) -> float:
    """
    Saettigungsnormierung statt Kappung.

    p = Fortschrittsanteil zwischen den beiden externen Ankern, unbeschraenkt.
    Die Abbildung auf 0..100 saettigt: streng monoton, erreicht nie 0 und nie
    100, keine toten Zonen an den Raendern. Damit bewegt sich ein Indikator
    auch dann noch, wenn er jenseits des Referenzpunkts liegt (z. B. CO2).
    """
    if anker0 == anker100:
        raise ValueError("anker0 == anker100")
    p = (anker0 - x) / (anker0 - anker100)
    if p > 0:
        return 100.0 * p / (p + k)
    # jenseits des Referenzpunkts: asymptotisch gegen 0, nie exakt 0
    return 100.0 * k / (k - p) * 0.02


def interpolate_gaps(series: dict[int, float], von: int, bis: int) -> tuple[dict[int, float], set[int]]:
    """Luecken ZWISCHEN Messpunkten linear fuellen. Nie ueber den letzten Punkt hinaus."""
    known = sorted(y for y in series if von <= y <= bis)
    if not known:
        return {}, set()
    filled, interpolated = dict(series), set()
    for year in range(known[0], known[-1] + 1):
        if year in series:
            continue
        lo = max(y for y in known if y < year)
        hi = min(y for y in known if y > year)
        frac = (year - lo) / (hi - lo)
        filled[year] = series[lo] + frac * (series[hi] - series[lo])
        interpolated.add(year)
    return filled, interpolated


# ------------------------------------------------------- Aggregation (Spec 7.2)

def geometric_mean(values: list[float]) -> float:
    """Geometrisches Mittel — ein guter Bereich kann keinen schlechten wegrechnen."""
    if not values:
        raise ValueError("leere Liste")
    return math.exp(sum(math.log(max(v, 1e-9)) for v in values) / len(values))


def build(spec: dict, norm_by_year: dict[str, dict[int, float]], k_label: str = "") -> dict:
    """Domaenen- und Gesamtwerte je Jahr, unter Beachtung der Mindestabdeckung."""
    von, bis = spec["fenster"]["von"], spec["fenster"]["bis"]
    min_cov = spec["mindestabdeckung_domaene"]
    by_domain: dict[str, list[str]] = {}
    for ind in spec["indikatoren"]:
        by_domain.setdefault(ind["domaene"], []).append(ind["id"])

    results = {}
    for year in range(von, bis + 1):
        domain_values, coverage = {}, {}
        for domain, ids in by_domain.items():
            vals = [norm_by_year[i][year] for i in ids if year in norm_by_year[i]]
            coverage[domain] = (len(vals), len(ids))
            if len(vals) / len(ids) >= min_cov:
                domain_values[domain] = geometric_mean(vals)
        if len(domain_values) == len(by_domain):
            results[year] = {
                "index": geometric_mean(list(domain_values.values())),
                "domains": domain_values,
                "coverage": coverage,
            }
    return results


# ------------------------------------------------------------------ Pruefungen

def check_abort(spec: dict, results: dict, kern: dict, robust: float) -> list[str]:
    """Abbruchkriterien aus der Praeregistrierung (Abschnitt 11)."""
    crit = spec["abbruchkriterien"]
    fails = []
    years = sorted(results)
    if not years:
        return ["KEIN einziges Jahr berechenbar"]

    recent = [y for y in years if 2019 <= y <= 2023]
    if recent:
        worst = min(len(results[y]["domains"]) for y in recent)
        if worst < crit["min_domaenen_2019_2023"]:
            fails.append(f"Nur {worst} Bereiche in 2019–2023 (gefordert: {crit['min_domaenen_2019_2023']})")
    else:
        fails.append("Keine Jahre 2019–2023 berechenbar")

    if robust < crit["min_robustheitsquote"]:
        fails.append(f"Robustheitsquote {robust:.1%} < {crit['min_robustheitsquote']:.0%}")

    if kern:
        haupt_d = results[years[-1]]["index"] - results[years[0]]["index"]
        kern_d = kern[years[-1]] - kern[years[0]]
        if abs(haupt_d - kern_d) > crit["max_divergenz_kernreihe"]:
            fails.append(f"Kernreihe divergiert um {abs(haupt_d - kern_d):.2f} Punkte (max {crit['max_divergenz_kernreihe']})")

    if crit["abbruch_wenn_alle_domaenen_steigen"]:
        first, last = results[years[0]]["domains"], results[years[-1]]["domains"]
        deltas = {d: last[d] - first[d] for d in last if d in first}
        if deltas and all(v > 0 for v in deltas.values()):
            fails.append("ALLE Bereiche steigen — deutet auf Fehler in Normierung oder Ankern")
    return fails


def check_warnings(results: dict) -> list[str]:
    years = sorted(results)
    warn = []
    if 2020 in results and 2019 in results and 2021 in results:
        d19_20 = results[2020]["index"] - results[2019]["index"]
        d20_21 = results[2021]["index"] - results[2020]["index"]
        if d19_20 > 0 and d20_21 > 0:
            warn.append(f"Kein Knick 2020 (COVID): {d19_20:+.2f} dann {d20_21:+.2f} — Glaettung pruefen")
    idx = [results[y]["index"] for y in years]
    if all(b >= a for a, b in zip(idx, idx[1:])):
        warn.append("Index steigt monoton ueber den gesamten Zeitraum — auffaellig")
    return warn


def robustness(spec: dict, norm_by_year: dict, results: dict, draws: int = 10000) -> float:
    """
    Anteil der Zufallsgewichtungen, bei denen die Trendrichtung gleich bleibt.
    Dirichlet-verteilt ueber die Domaenen (Gamma-Trick, ohne numpy).
    """
    years = sorted(results)
    if len(years) < 2:
        return 0.0
    first_y, last_y = years[0], years[-1]
    domains = sorted(results[last_y]["domains"])
    base_up = results[last_y]["index"] > results[first_y]["index"]

    rng = random.Random(20260901)  # fester Seed -> reproduzierbar
    same = 0
    for _ in range(draws):
        w = [rng.gammavariate(1.0, 1.0) for _ in domains]
        total = sum(w)
        w = [x / total for x in w]
        a = sum(wi * math.log(max(results[first_y]["domains"][d], 1e-9)) for wi, d in zip(w, domains))
        b = sum(wi * math.log(max(results[last_y]["domains"][d], 1e-9)) for wi, d in zip(w, domains))
        if (b > a) == base_up:
            same += 1
    return same / draws


def multiverse(spec: dict, series: dict, results: dict) -> dict:
    """Perzentil der eigenen Variante unter allen vertretbaren Alternativen."""
    years = sorted(results)
    von, bis = years[0], years[-1]
    base_delta = results[bis]["index"] - results[von]["index"]
    deltas = []

    def norm_all(k: float) -> dict:
        out = {}
        for ind in spec["indikatoren"]:
            filled, _ = interpolate_gaps(series[ind["id"]], von, bis)
            out[ind["id"]] = {
                y: normalize(v, ind["anker0"], ind["anker100"], k)
                for y, v in filled.items() if von <= y <= bis
            }
        return out

    # andere Saettigungsparameter
    for k in (0.3, 0.5, 1.0, 2.0):
        r = build(spec, norm_all(k))
        if len(r) >= 2:
            ys = sorted(r)
            deltas.append(r[ys[-1]]["index"] - r[ys[0]]["index"])

    # arithmetisch statt geometrisch
    nb = norm_all(spec["aggregation"]["saettigung_k"])
    by_domain: dict[str, list[str]] = {}
    for ind in spec["indikatoren"]:
        by_domain.setdefault(ind["domaene"], []).append(ind["id"])
    ar = {}
    for y in range(von, bis + 1):
        dv = {}
        for d, ids in by_domain.items():
            vals = [nb[i][y] for i in ids if y in nb[i]]
            if vals:
                dv[d] = sum(vals) / len(vals)
        if len(dv) == len(by_domain):
            ar[y] = sum(dv.values()) / len(dv)
    if len(ar) >= 2:
        ys = sorted(ar)
        deltas.append(ar[ys[-1]] - ar[ys[0]])

    # jede Domaene einmal weglassen
    for drop in by_domain:
        sub = dict(spec)
        sub["indikatoren"] = [i for i in spec["indikatoren"] if i["domaene"] != drop]
        r = build(sub, nb)
        if len(r) >= 2:
            ys = sorted(r)
            deltas.append(r[ys[-1]]["index"] - r[ys[0]]["index"])

    below = sum(1 for d in deltas if d < base_delta)
    return {
        "eigene_delta": base_delta,
        "varianten": len(deltas),
        "perzentil": 100.0 * below / len(deltas) if deltas else 0.0,
        "min": min(deltas) if deltas else None,
        "max": max(deltas) if deltas else None,
    }


# ------------------------------------------------------------------------ Main

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="out/langzeitindex")
    ap.add_argument("--offline", action="store_true", help="nur Cache verwenden")
    args = ap.parse_args()

    spec = json.loads(SPEC_PATH.read_text())
    von, bis = spec["fenster"]["von"], spec["fenster"]["bis"]
    k = spec["aggregation"]["saettigung_k"]

    log.info("Langzeitindex — Nulllauf")
    log.info("Spec %s · Fenster %d–%d · k=%.2f", spec["spec_version"], von, bis, k)
    log.info("%d Indikatoren, %d Bereiche\n", len(spec["indikatoren"]), len(spec["domaenen"]))

    # 1) Reihen laden
    series, gaps = {}, {}
    for ind in spec["indikatoren"]:
        try:
            raw = load_series(ind, args.offline)
        except Exception as exc:
            log.error("  FEHLER %s: %s", ind["id"], exc)
            return 1
        filled, interp = interpolate_gaps(raw, von, bis)
        series[ind["id"]] = raw
        gaps[ind["id"]] = interp
        have = [y for y in range(von, bis + 1) if y in filled]
        flag = f"  interpoliert: {sorted(interp)}" if interp else ""
        log.info("  %-22s %d/%d Jahre%s", ind["id"], len(have), bis - von + 1, flag)

    # 2) Normieren
    norm_by_year = {}
    for ind in spec["indikatoren"]:
        filled, _ = interpolate_gaps(series[ind["id"]], von, bis)
        norm_by_year[ind["id"]] = {
            y: normalize(v, ind["anker0"], ind["anker100"], k)
            for y, v in filled.items() if von <= y <= bis
        }

    # 3) Aggregieren
    results = build(spec, norm_by_year)
    if not results:
        log.error("\nKein Jahr berechenbar — Abbruch.")
        return 1

    years = sorted(results)
    log.info("\nVerlauf")
    for y in years:
        log.info("  %d  %6.2f", y, results[y]["index"])

    log.info("\nBereiche  (%d → %d)", years[0], years[-1])
    first, last = results[years[0]]["domains"], results[years[-1]]["domains"]
    ordered = sorted(last, key=lambda d: last[d] - first[d], reverse=True)
    n_up = 0
    for d in ordered:
        delta = last[d] - first[d]
        n_up += delta > 0
        log.info("  %-16s %5.1f → %5.1f   %+6.1f", spec["domaenen"][d]["label"], first[d], last[d], delta)
    log.info("  %d steigen, %d fallen", n_up, len(ordered) - n_up)

    # 4) Kernreihe (nur Indikatoren ohne jede Luecke)
    kern_ids = [i["id"] for i in spec["indikatoren"] if not gaps[i["id"]]]
    kern = {}
    for y in years:
        vals = [norm_by_year[i][y] for i in kern_ids if y in norm_by_year[i]]
        if vals:
            kern[y] = geometric_mean(vals)
    log.info("\nKernreihe (%d lueckenlose Indikatoren): %.2f → %.2f",
             len(kern_ids), kern[years[0]], kern[years[-1]])

    # 5) Robustheit + Multiverse
    robust = robustness(spec, norm_by_year, results)
    mv = multiverse(spec, series, results)
    log.info("Robustheitsquote: %.1f %% (10.000 Zufallsgewichtungen)", robust * 100)
    log.info("Multiverse: eigenes Delta %+.2f, Perzentil %.0f von %d Varianten (Spanne %+.2f … %+.2f)",
             mv["eigene_delta"], mv["perzentil"], mv["varianten"], mv["min"], mv["max"])

    # 6) CSV schreiben
    out = REPO / args.out
    out.mkdir(parents=True, exist_ok=True)
    domains = sorted(spec["domaenen"])

    with (out / "index.csv").open("w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["jahr", "index", "kernreihe"] + domains)
        for y in years:
            w.writerow([y, f"{results[y]['index']:.4f}", f"{kern.get(y, ''):.4f}"]
                       + [f"{results[y]['domains'][d]:.4f}" for d in domains])

    with (out / "indikatoren.csv").open("w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["jahr", "id", "domaene", "rohwert", "normiert", "interpoliert"])
        for ind in spec["indikatoren"]:
            filled, interp = interpolate_gaps(series[ind["id"]], von, bis)
            for y in range(von, bis + 1):
                if y in filled:
                    w.writerow([y, ind["id"], ind["domaene"], f"{filled[y]:.4f}",
                                f"{norm_by_year[ind['id']][y]:.4f}", int(y in interp)])

    (out / "pruefung.json").write_text(json.dumps({
        "spec_version": spec["spec_version"], "fenster": [von, bis],
        "index_start": results[years[0]]["index"], "index_ende": results[years[-1]]["index"],
        "bewegung_pro_jahr": (results[years[-1]]["index"] - results[max(years[0], years[-1] - 10)]["index"])
                             / min(10, years[-1] - years[0]),
        "bereiche_steigend": n_up, "bereiche_fallend": len(ordered) - n_up,
        "robustheitsquote": robust, "multiverse": mv,
        "kernreihe_start": kern[years[0]], "kernreihe_ende": kern[years[-1]],
    }, indent=2, ensure_ascii=False))

    # 7) Abbruchkriterien
    fails = check_abort(spec, results, kern, robust)
    if mv["perzentil"] > spec["abbruchkriterien"]["max_perzentil_multiverse"]:
        fails.append(f"Eigene Variante im {mv['perzentil']:.0f}. Perzentil "
                     f"(max {spec['abbruchkriterien']['max_perzentil_multiverse']})")

    log.info("\nCSV: %s", out)
    for warn in check_warnings(results):
        log.warning("WARNUNG  %s", warn)

    if fails:
        log.error("\nABBRUCH — %d Kriterium/Kriterien verletzt:", len(fails))
        for f in fails:
            log.error("  · %s", f)
        log.error("\nNicht bauen. Konstruktion ueberarbeiten.")
        return 1

    log.info("\nAlle Abbruchkriterien bestanden. Der Index traegt.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
