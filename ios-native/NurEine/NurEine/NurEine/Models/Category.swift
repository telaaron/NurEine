import SwiftUI

/// Story categories — mirrors src/lib/categories.ts and the DB check constraint.
enum Category: String, CaseIterable, Identifiable {
    case klima, gesundheit, wissenschaft, gemeinschaft, tiere, kultur, innovation

    var id: String { rawValue }

    var label: String {
        switch self {
        case .klima: "Klima"
        case .gesundheit: "Gesundheit"
        case .wissenschaft: "Wissenschaft"
        case .gemeinschaft: "Gemeinschaft"
        case .tiere: "Tiere"
        case .kultur: "Kultur"
        case .innovation: "Innovation"
        }
    }

    var emoji: String {
        switch self {
        case .klima: "🌍"
        case .gesundheit: "🩺"
        case .wissenschaft: "🔬"
        case .gemeinschaft: "🤝"
        case .tiere: "🦋"
        case .kultur: "🎭"
        case .innovation: "💡"
        }
    }

    static func label(for slug: String) -> String {
        Category(rawValue: slug)?.label ?? slug
    }
}

/// Tone → accent color, mirroring src/lib/utils.ts toneStyles + the category map.
enum Tone: String {
    case amber, sage, rose, sky

    var color: Color {
        switch self {
        case .amber: Theme.amber
        case .sage: Theme.sage
        case .rose: Theme.rose
        case .sky: Theme.sky
        }
    }

    static func from(_ raw: String) -> Tone { Tone(rawValue: raw) ?? .amber }
}
