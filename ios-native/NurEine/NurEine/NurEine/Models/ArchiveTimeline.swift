import Foundation
import SwiftUI

/// Archiv-Timeline: gruppiert Stories nach Monat und Tag und berechnet den „Puls"
/// (Kategorie-Verteilung je Monat).
///
/// Swift-Gegenstück zu `src/lib/archive-timeline.ts` — die Website zeigt das
/// Archiv seit dem Redesign als Zeitreise (Monats-Kapitel statt Endlos-Grid),
/// und die App übernimmt genau diese Ordnung. Rein funktional, keine Seiteneffekte.

struct ArchiveDay: Identifiable {
    let iso: String            // YYYY-MM-DD (Berliner Zeit)
    let stories: [Story]       // stärkste zuerst
    let topCategory: String    // dominante Kategorie → Farbe des Tages-Punkts

    var id: String { iso }

    /// „Heute" / „Gestern" / „Mo" — die Website macht das genauso, es liest sich
    /// wärmer als ein reines Datum.
    var weekdayLabel: String {
        let today = ArchiveTimeline.berlinISO(Date())
        let yesterday = ArchiveTimeline.berlinISO(Date().addingTimeInterval(-86400))
        if iso == today { return "Heute" }
        if iso == yesterday { return "Gestern" }
        guard let d = ArchiveTimeline.date(fromISO: iso) else { return "" }
        let wd = Calendar(identifier: .gregorian).component(.weekday, from: d)
        return ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][max(0, min(6, wd - 1))]
    }

    /// „9. Jul"
    var dayLabel: String {
        guard let d = ArchiveTimeline.date(fromISO: iso) else { return "" }
        let cal = Calendar(identifier: .gregorian)
        let day = cal.component(.day, from: d)
        let month = cal.component(.month, from: d)
        let short = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
                     "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
        return "\(day). \(short[max(0, min(11, month - 1))])"
    }
}

struct CategoryShare: Identifiable {
    let category: String
    let count: Int
    let pct: Double
    var id: String { category }
}

struct ArchiveMonth: Identifiable {
    let key: String                    // YYYY-MM
    let label: String                  // „Juli 2026"
    let days: [ArchiveDay]
    let count: Int
    let topStory: Story?               // Höhepunkt des Monats
    let categoryShare: [CategoryShare] // der „Puls"

    var id: String { key }
}

enum ArchiveTimeline {
    private static let monthsDE = [
        "Januar", "Februar", "März", "April", "Mai", "Juni",
        "Juli", "August", "September", "Oktober", "November", "Dezember"
    ]

    /// Kategorie → Markenfarbe. Deckt sich mit CATEGORY_TONE der Website.
    static func color(for category: String) -> Color {
        switch category {
        case "klima", "tiere": Theme.sage
        case "gesundheit": Theme.rose
        case "wissenschaft", "innovation": Theme.sky
        default: Theme.amber          // gemeinschaft, kultur
        }
    }

    private static let berlinFormatter: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(identifier: "Europe/Berlin")
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    static func berlinISO(_ d: Date) -> String { berlinFormatter.string(from: d) }
    static func date(fromISO iso: String) -> Date? { berlinFormatter.date(from: iso) }

    /// Die API liefert publishedAt als ISO-8601-String; wir brauchen nur den Tag.
    private static func dayKey(of story: Story) -> String? {
        let raw = story.publishedAt
        // Häufigster Fall: der String beginnt bereits mit YYYY-MM-DD.
        if raw.count >= 10 {
            let head = String(raw.prefix(10))
            if head.count == 10, head.dropFirst(4).first == "-" { return head }
        }
        return nil
    }

    /// Häufigste Kategorie einer Liste (bei Gleichstand die erste, also stärkste).
    private static func dominant(_ stories: [Story]) -> String {
        var counts: [String: Int] = [:]
        for s in stories { counts[s.category, default: 0] += 1 }
        return counts.max { a, b in a.value < b.value }?.key
            ?? stories.first?.category ?? "gemeinschaft"
    }

    /// Stories → Monate → Tage, jeweils neueste zuerst.
    static func groupByMonth(_ stories: [Story]) -> [ArchiveMonth] {
        // Tag-Eimer
        var dayMap: [String: [Story]] = [:]
        for s in stories {
            guard let key = dayKey(of: s) else { continue }
            dayMap[key, default: []].append(s)
        }

        let days: [ArchiveDay] = dayMap
            .map { iso, list in
                let sorted = list.sorted { $0.impactScore > $1.impactScore }
                return ArchiveDay(iso: iso, stories: sorted, topCategory: dominant(sorted))
            }
            .sorted { $0.iso > $1.iso }

        // Monats-Eimer
        var monthMap: [String: [ArchiveDay]] = [:]
        for d in days { monthMap[String(d.iso.prefix(7)), default: []].append(d) }

        return monthMap
            .map { key, dayGroups in
                let all = dayGroups.flatMap(\.stories)
                var counts: [String: Int] = [:]
                for s in all { counts[s.category, default: 0] += 1 }
                let share = counts
                    .map { CategoryShare(category: $0.key, count: $0.value,
                                         pct: Double($0.value) / Double(max(all.count, 1))) }
                    .sorted { $0.count > $1.count }

                let parts = key.split(separator: "-")
                let year = parts.first.map(String.init) ?? ""
                let monthIdx = (parts.count > 1 ? Int(parts[1]) : nil) ?? 1

                return ArchiveMonth(
                    key: key,
                    label: "\(monthsDE[max(0, min(11, monthIdx - 1))]) \(year)",
                    days: dayGroups,
                    count: all.count,
                    topStory: all.max { $0.impactScore < $1.impactScore },
                    categoryShare: share
                )
            }
            .sorted { $0.key > $1.key }
    }
}
