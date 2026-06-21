import WidgetKit
import SwiftUI

// MARK: - Data

/// Minimal story shape the widget needs (decoded from /api/stories?featured=true).
struct WidgetStory: Decodable {
    let title: String
    let dek: String
    let category: String
    let country: String
    let impactScore: Int
    let imageUrl: String?
}

struct StoryEntry: TimelineEntry {
    let date: Date
    let story: WidgetStory?
    let image: Image?
}

// MARK: - Provider

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> StoryEntry {
        StoryEntry(date: Date(), story: nil, image: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (StoryEntry) -> Void) {
        Task { completion(await fetchEntry()) }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<StoryEntry>) -> Void) {
        Task {
            let entry = await fetchEntry()
            // Refresh after the next morning send (~06:30) or in 2h, whichever first.
            let next = Calendar.current.date(byAdding: .hour, value: 2, to: Date()) ?? Date().addingTimeInterval(7200)
            completion(Timeline(entries: [entry], policy: .after(next)))
        }
    }

    private func fetchEntry() async -> StoryEntry {
        guard let url = URL(string: "https://nureine.de/api/stories?featured=true"),
              let (data, _) = try? await URLSession.shared.data(from: url),
              let story = try? JSONDecoder().decode(WidgetStory.self, from: data)
        else { return StoryEntry(date: Date(), story: nil, image: nil) }

        var image: Image?
        if let raw = story.imageUrl, let u = proxied(raw, width: 600),
           let (imgData, _) = try? await URLSession.shared.data(from: u),
           let ui = UIImage(data: imgData) {
            image = Image(uiImage: ui)
        }
        return StoryEntry(date: Date(), story: story, image: image)
    }

    private func proxied(_ src: String, width: Int) -> URL? {
        guard src.hasPrefix("http") else { return nil }
        if src.contains("/img?") || !src.contains("supabase.co") { return URL(string: src) }
        let enc = src.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? src
        return URL(string: "https://nureine.de/img?url=\(enc)&w=\(width)")
    }
}

// MARK: - Views

struct NurEineWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: StoryEntry

    var body: some View {
        switch family {
        case .systemSmall: small
        case .accessoryRectangular: lockRect
        case .accessoryInline: Text(entry.story?.title ?? "Dein Lichtblick")
        default: medium
        }
    }

    // Home screen small: image background + impact chip + title.
    private var small: some View {
        ZStack(alignment: .bottomLeading) {
            (entry.image ?? Image(systemName: "sun.max")).resizable().scaledToFill()
            LinearGradient(colors: [.clear, .black.opacity(0.75)], startPoint: .center, endPoint: .bottom)
            VStack(alignment: .leading, spacing: 4) {
                Spacer()
                Text(entry.story?.title ?? "Dein Lichtblick für heute")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.white)
                    .lineLimit(3)
            }
            .padding(10)
        }
    }

    // Home screen medium: image left, text right with impact.
    private var medium: some View {
        HStack(spacing: 0) {
            (entry.image ?? Image(systemName: "sun.max"))
                .resizable().scaledToFill()
                .frame(width: 150)
                .clipped()
            VStack(alignment: .leading, spacing: 6) {
                Text((entry.story?.category ?? "heute").uppercased())
                    .font(.system(size: 9, weight: .medium, design: .monospaced))
                    .foregroundStyle(.secondary)
                Text(entry.story?.title ?? "Dein Lichtblick für heute")
                    .font(.system(size: 15, weight: .semibold))
                    .lineLimit(3)
                Spacer()
                if let s = entry.story {
                    Text("Wirkung \(s.impactScore) · \(s.country)")
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundStyle(.secondary)
                }
            }
            .padding(12)
        }
    }

    // Lock screen rectangular: tinted title + impact.
    private var lockRect: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("LICHTBLICK").font(.system(size: 9, weight: .semibold, design: .monospaced))
            Text(entry.story?.title ?? "Dein Lichtblick").font(.system(size: 13, weight: .medium)).lineLimit(2)
        }
    }
}

// MARK: - Widget

struct NurEineWidget: Widget {
    let kind = "NurEineWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            NurEineWidgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Dein Lichtblick")
        .description("Die gute Nachricht des Tages — direkt am Homescreen.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline])
    }
}

@main
struct NurEineWidgetBundle: WidgetBundle {
    var body: some Widget { NurEineWidget() }
}
