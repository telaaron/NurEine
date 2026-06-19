import SwiftUI

struct TodayView: View {
    @Environment(StoryStore.self) private var store

    private var dateText: String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "de_DE")
        f.dateFormat = "EEEE, d. MMMM"
        return f.string(from: Date())
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    header

                    if store.loading && store.stories.isEmpty {
                        HeroSkeleton().padding(.horizontal, 20)
                    } else if store.errored {
                        ConnectionLost { Task { await store.ensure(force: true) } }
                    } else if let hero = store.hero {
                        NavigationLink(value: hero) {
                            HeroCard(story: hero)
                        }
                        .buttonStyle(.plain)
                        .padding(.horizontal, 20)

                        weekSection
                    }
                }
                .padding(.top, 8)
                .padding(.bottom, 24)
            }
            .background(Theme.canvas)
            .scrollContentBackground(.hidden)
            .refreshable { await store.ensure(force: true) }
            .navigationDestination(for: Story.self) { StoryDetailView(story: $0) }
            .toolbar(.hidden, for: .navigationBar)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(dateText)
                .font(.system(size: 13, design: .monospaced))
                .foregroundStyle(Theme.faint)
            Text("Heute")
                .font(.display(34))
                .foregroundStyle(Theme.ink)
            Eyebrow(text: "Ehrlicher Fortschritt · heute")
                .padding(.top, 12)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 20)
        .padding(.bottom, 14)
    }

    @ViewBuilder
    private var weekSection: some View {
        if !store.week.isEmpty {
            Text("DIESE WOCHE")
                .font(.system(size: 11, weight: .medium, design: .monospaced))
                .tracking(2)
                .foregroundStyle(Theme.amberDeep)
                .padding(.horizontal, 22)
                .padding(.top, 22)
                .padding(.bottom, 10)

            VStack(spacing: 11) {
                ForEach(store.week) { s in
                    NavigationLink(value: s) { StoryRow(story: s) }
                        .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 20)
        }
    }
}
