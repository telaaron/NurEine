import SwiftUI

/// Das Archiv als ZEITREISE, nicht als Endlos-Grid.
///
/// Übernimmt das „Puls"-Design der Website (`src/lib/components/ArchivePulse.svelte`):
/// Monats-Kapitel mit farbigem Puls-Band (Kategorie-Verteilung), einem Höhepunkt
/// und kompakten Tageszeilen. Man sieht auf einen Blick, worum es in einem Monat
/// ging — statt nur „noch mehr Kacheln".
struct ArchiveView: View {
    @Environment(StoryStore.self) private var store
    @State private var category: Category? = nil
    /// Pro Monat: alle Tage zeigen statt nur der ersten sechs.
    @State private var expanded: Set<String> = []

    private var shown: [Story] {
        store.filtered(category: category, sort: .neueste)
    }
    private var months: [ArchiveMonth] {
        ArchiveTimeline.groupByMonth(shown)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 40) {
                    ForEach(months) { month in
                        monthSection(month)
                    }
                    if shown.isEmpty && !store.loading {
                        Text("Keine Geschichte in diesem Thema.")
                            .font(.serif(15))
                            .foregroundStyle(Theme.muted)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 48)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 28)
            }
            .background(Theme.canvas)
            .scrollContentBackground(.hidden)
            .refreshable { await store.ensure(force: true) }
            .safeAreaInset(edge: .top) { filterBar }
            .navigationDestination(for: Story.self) { StoryDetailView(story: $0) }
            .toolbar(.hidden, for: .navigationBar)
        }
    }

    // MARK: Monats-Kapitel

    @ViewBuilder
    private func monthSection(_ m: ArchiveMonth) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            monthHeader(m)
            if let top = m.topStory {
                highlightCard(top)
            }
            dayRows(m)
        }
    }

    private func monthHeader(_ m: ArchiveMonth) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Text(m.label)
                    .font(.display(28, weight: .bold))
                    .tracking(-0.8)
                    .foregroundStyle(Theme.ink)
                Text("\(m.count) \(m.count == 1 ? "gute Nachricht" : "gute Nachrichten")")
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.muted)
            }

            // Der PULS: ein Segment je Kategorie, Breite = Anteil.
            GeometryReader { geo in
                HStack(spacing: 2) {
                    ForEach(m.categoryShare) { c in
                        ArchiveTimeline.color(for: c.category)
                            .frame(width: max(3, geo.size.width * c.pct - 2))
                    }
                }
                .clipShape(.rect(cornerRadius: 6))
            }
            .frame(height: 11)
            .accessibilityLabel("Kategorie-Verteilung \(m.label)")

            // Legende — die vier stärksten Themen mit Anteil.
            FlowLayout(spacing: 12) {
                ForEach(m.categoryShare.prefix(4)) { c in
                    HStack(spacing: 5) {
                        Circle()
                            .fill(ArchiveTimeline.color(for: c.category))
                            .frame(width: 7, height: 7)
                        Text("\(c.category.capitalized) \(Int((c.pct * 100).rounded()))%")
                            .font(.system(size: 11))
                            .foregroundStyle(Theme.muted)
                    }
                }
            }
        }
        .padding(.bottom, 14)
        .overlay(alignment: .bottom) {
            Rectangle().fill(Theme.rule).frame(height: 1)
        }
        .padding(.bottom, 16)
    }

    /// Der Höhepunkt des Monats — die einzige Karte mit Bild.
    private func highlightCard(_ s: Story) -> some View {
        NavigationLink(value: s) {
            HStack(alignment: .top, spacing: 13) {
                AsyncStoryImage(story: s, width: 200)
                    .frame(width: 88, height: 88)
                    .clipShape(.rect(cornerRadius: 10))

                VStack(alignment: .leading, spacing: 5) {
                    Text("Höhepunkt · \(s.category)".uppercased())
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                        .tracking(1.2)
                        .foregroundStyle(ArchiveTimeline.color(for: s.category))
                    Text(s.title)
                        .font(.display(17, weight: .bold))
                        .foregroundStyle(Theme.ink)
                        .lineLimit(3)
                        .multilineTextAlignment(.leading)
                    Text("Wirkung \(s.impactScore)/100")
                        .font(.system(size: 11))
                        .foregroundStyle(Theme.muted)
                }
                Spacer(minLength: 0)
            }
            .padding(11)
            .background(Theme.paper, in: .rect(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.rule, lineWidth: 1))
        }
        .buttonStyle(.plain)
        .padding(.bottom, 18)
    }

    /// Die Tage als kompakte Zeilen — Datum, Farbpunkt, Titel, Wirkung.
    @ViewBuilder
    private func dayRows(_ m: ArchiveMonth) -> some View {
        let isOpen = expanded.contains(m.key)
        let days = isOpen ? m.days : Array(m.days.prefix(6))

        VStack(alignment: .leading, spacing: 0) {
            ForEach(days) { day in
                HStack(alignment: .top, spacing: 9) {
                    VStack(alignment: .leading, spacing: 1) {
                        Text(day.weekdayLabel)
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(Theme.ink)
                        Text(day.dayLabel)
                            .font(.system(size: 10))
                            .foregroundStyle(Theme.faint)
                    }
                    .frame(width: 58, alignment: .leading)

                    Circle()
                        .fill(ArchiveTimeline.color(for: day.topCategory))
                        .frame(width: 8, height: 8)
                        .padding(.top, 4)

                    VStack(alignment: .leading, spacing: 3) {
                        ForEach(day.stories) { s in
                            NavigationLink(value: s) {
                                HStack(spacing: 7) {
                                    Circle()
                                        .fill(ArchiveTimeline.color(for: s.category))
                                        .frame(width: 5, height: 5)
                                    Text(s.title)
                                        .font(.system(size: 13))
                                        .foregroundStyle(Theme.inkSoft)
                                        .lineLimit(1)
                                    Spacer(minLength: 4)
                                    Text("\(s.impactScore)")
                                        .font(.system(size: 11))
                                        .monospacedDigit()
                                        .foregroundStyle(Theme.faint)
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding(.vertical, 8)
                .overlay(alignment: .top) {
                    Rectangle().fill(Theme.rule).frame(height: 1)
                }
            }

            if m.days.count > 6 {
                Button {
                    if isOpen { expanded.remove(m.key) } else { expanded.insert(m.key) }
                } label: {
                    Text(isOpen
                         ? "weniger"
                         : "alle \(m.days.count) Tage im \(m.label.split(separator: " ").first.map(String.init) ?? "Monat")")
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.muted)
                        .underline()
                }
                .buttonStyle(.plain)
                .padding(.top, 10)
            }
        }
    }

    // MARK: Kopfleiste

    private var filterBar: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Archiv")
                .font(.display(34, weight: .bold))
                .tracking(-1)
                .foregroundStyle(Theme.ink)
                .padding(.horizontal, 20)
                .padding(.top, 6)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 7) {
                    chip("Alle", active: category == nil) { category = nil }
                    ForEach(Category.allCases) { c in
                        chip(c.label, active: category == c) { category = c }
                    }
                }
                .padding(.horizontal, 20)
            }

            Text("\(shown.count) Geschichten")
                .font(.system(size: 11, design: .monospaced))
                .foregroundStyle(Theme.faint)
                .padding(.horizontal, 20)
        }
        .padding(.bottom, 10)
        .background(Theme.canvas.opacity(0.94))
    }

    private func chip(_ label: String, active: Bool, _ tap: @escaping () -> Void) -> some View {
        Button(action: tap) {
            Text(label)
                .font(.system(size: 11, weight: .medium, design: .monospaced))
                // Aktiv = heller Text auf dunklem Grund, in BEIDEN Modi. Theme.paper
                // wäre im Dark selbst dunkel → unsichtbar (dieselbe Falle wie im Web).
                .foregroundStyle(active ? Color.white : Theme.muted)
                .padding(.horizontal, 13).padding(.vertical, 6)
                .background(active ? Theme.amberDeep : Theme.canvasSoft, in: .capsule)
        }
        .buttonStyle(.plain)
    }
}
