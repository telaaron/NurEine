import AppIntents

/// "Hey Siri, was ist heute der Lichtblick?" — returns today's featured story as
/// spoken/visible text. Works from Spotlight, Shortcuts, and Siri without opening
/// the app.
struct TodaysLichtblickIntent: AppIntent {
    static var title: LocalizedStringResource = "Lichtblick des Tages"
    static var description = IntentDescription("Zeigt die gute Nachricht des Tages von NurEine.")

    func perform() async throws -> some IntentResult & ProvidesDialog & ShowsSnippetView {
        guard let url = URL(string: "https://nureine.de/api/stories?featured=true"),
              let (data, _) = try? await URLSession.shared.data(from: url),
              let s = try? JSONDecoder().decode(IntentStory.self, from: data) else {
            return .result(dialog: "Heute konnte ich keinen Lichtblick laden.")
        }
        let line = "\(s.title). \(s.dek)"
        return .result(
            dialog: IntentDialog(stringLiteral: line),
            view: LichtblickSnippet(title: s.title, dek: s.dek, impact: s.impactScore)
        )
    }
}

struct IntentStory: Decodable {
    let title: String; let dek: String; let impactScore: Int
}

/// App Shortcuts — makes the intent available to Siri with spoken phrases and
/// surfaces it in the Shortcuts app automatically.
struct NurEineShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: TodaysLichtblickIntent(),
            phrases: [
                "Was ist heute der Lichtblick in \(.applicationName)",
                "Zeig mir den Lichtblick in \(.applicationName)",
                "\(.applicationName) Lichtblick"
            ],
            shortTitle: "Lichtblick des Tages",
            systemImageName: "sun.max"
        )
    }
}

import SwiftUI
struct LichtblickSnippet: View {
    let title: String; let dek: String; let impact: Int
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("LICHTBLICK · WIRKUNG \(impact)")
                .font(.system(size: 10, weight: .semibold, design: .monospaced))
                .foregroundStyle(.secondary)
            Text(title).font(.headline)
            Text(dek).font(.subheadline).foregroundStyle(.secondary)
        }
        .padding()
    }
}
