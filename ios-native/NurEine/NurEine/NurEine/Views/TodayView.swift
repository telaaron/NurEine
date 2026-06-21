import SwiftUI

struct TodayView: View {
    @Environment(StoryStore.self) private var store
    @Environment(\.horizontalSizeClass) private var sizeClass
    @Binding var deepLink: Story?
    @State private var path: [Story] = []

    private var isPad: Bool { sizeClass == .regular }

    private var dateText: String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "de_DE")
        f.dateFormat = "EEEE, d. MMMM yyyy"
        return f.string(from: Date())
    }

    var body: some View {
        NavigationStack(path: $path) {
            ScrollView {
                if isPad {
                    iPadEditorial
                } else {
                    iPhoneStack
                }
            }
            .background(Theme.canvas)
            .scrollContentBackground(.hidden)
            .refreshable { await store.ensure(force: true) }
            .navigationDestination(for: Story.self) { StoryDetailView(story: $0) }
            .toolbar(.hidden, for: .navigationBar)
            .onChange(of: deepLink) { _, story in
                if let story { path = [story]; deepLink = nil }
            }
        }
    }

    // MARK: iPhone (compact) — single column stack.

    private var iPhoneStack: some View {
        VStack(alignment: .leading, spacing: 0) {
            header(masthead: false)
            content(heroWidth: 900)
        }
        .padding(.top, 8)
        .padding(.bottom, 24)
    }

    @ViewBuilder
    private func content(heroWidth: Int) -> some View {
        if store.loading && store.stories.isEmpty {
            HeroSkeleton().padding(.horizontal, 20)
        } else if store.errored {
            ConnectionLost { Task { await store.ensure(force: true) } }
        } else if let hero = store.hero {
            NavigationLink(value: hero) { HeroCard(story: hero) }
                .buttonStyle(.plain)
                .padding(.horizontal, 20)
            weekSection
        }
    }

    // MARK: iPad (regular) — three-column editorial "newspaper" front page.

    private var iPadEditorial: some View {
        VStack(spacing: 0) {
            masthead

            if let hero = store.hero {
                HStack(alignment: .top, spacing: 28) {
                    sideColumn        // left: secondary stories
                        .frame(width: 280)
                    centerColumn(hero)  // middle: big featured
                        .frame(maxWidth: .infinity)
                    railColumn        // right: rail (ticker, newsletter, discover)
                        .frame(width: 300)
                }
                .padding(.horizontal, 40)
                .padding(.top, 24)
                .padding(.bottom, 40)
            } else if store.loading {
                HeroSkeleton().frame(maxWidth: 700).padding(40)
            } else if store.errored {
                ConnectionLost { Task { await store.ensure(force: true) } }
            }
        }
    }

    // Newspaper masthead: centered title + date, hairline rules.
    private var masthead: some View {
        VStack(spacing: 8) {
            Rectangle().fill(Theme.rule).frame(height: 1).padding(.horizontal, 40)
            HStack {
                Eyebrow(text: "Ehrlicher Fortschritt")
                Spacer()
                VStack(spacing: 3) {
                    Text("NurEine").font(.display(30)).foregroundStyle(Theme.ink)
                    Text(dateText).font(.system(size: 12, design: .monospaced)).foregroundStyle(Theme.faint)
                }
                Spacer()
                Text("\(store.stories.count) Geschichten")
                    .font(.system(size: 11, design: .monospaced)).foregroundStyle(Theme.faint)
            }
            .padding(.horizontal, 40)
            .padding(.vertical, 6)
            Rectangle().fill(Theme.rule).frame(height: 1).padding(.horizontal, 40)
        }
        .padding(.top, 12)
    }

    private var hero: Story? { store.hero }

    // Left: 2–3 secondary stories stacked, editorial side-bar style.
    private var sideColumn: some View {
        VStack(alignment: .leading, spacing: 20) {
            ForEach(Array(store.afterHero.prefix(3))) { s in
                NavigationLink(value: s) { SideStory(story: s) }
                    .buttonStyle(.plain)
            }
        }
    }

    private func centerColumn(_ hero: Story) -> some View {
        NavigationLink(value: hero) { HeroCard(story: hero) }
            .buttonStyle(.plain)
    }

    // Right rail: more headlines + a newsletter/discover block.
    private var railColumn: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("MEHR HEUTE")
                .font(.system(size: 11, weight: .medium, design: .monospaced))
                .tracking(2).foregroundStyle(Theme.amberDeep)
            ForEach(Array(store.afterHero.dropFirst(3).prefix(5))) { s in
                NavigationLink(value: s) { RailHeadline(story: s) }
                    .buttonStyle(.plain)
                Rectangle().fill(Theme.rule).frame(height: 1)
            }
        }
    }

    // MARK: shared bits

    private func header(masthead: Bool) -> some View {
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
