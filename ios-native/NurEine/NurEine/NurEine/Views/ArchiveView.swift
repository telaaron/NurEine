import SwiftUI

struct ArchiveView: View {
    @Environment(StoryStore.self) private var store
    @State private var category: Category? = nil
    @State private var sort: ArchiveSort = .neueste

    private var shown: [Story] { store.filtered(category: category, sort: sort) }

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: 11) {
                    ForEach(shown) { s in
                        NavigationLink(value: s) { StoryRow(story: s, thumbWidth: 200) }
                            .buttonStyle(.plain)
                    }
                    if shown.isEmpty && !store.loading {
                        Text("Keine Geschichte in diesem Thema.")
                            .font(.custom("Newsreader", size: 15))
                            .foregroundStyle(Theme.muted)
                            .padding(.vertical, 48)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 24)
            }
            .background(Theme.canvas)
            .scrollContentBackground(.hidden)
            .refreshable { await store.ensure(force: true) }
            .navigationTitle("Archiv")
            .navigationDestination(for: Story.self) { StoryDetailView(story: $0) }
            .safeAreaInset(edge: .top) { filterBar }
        }
    }

    private var filterBar: some View {
        VStack(spacing: 10) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 7) {
                    chip("Alle", active: category == nil) { category = nil }
                    ForEach(Category.allCases) { c in
                        chip(c.label, active: category == c) { category = c }
                    }
                }
                .padding(.horizontal, 20)
            }
            HStack {
                Text("\(shown.count) Geschichten")
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundStyle(Theme.faint)
                Spacer()
                Button {
                    sort = sort == .neueste ? .wirkung : .neueste
                } label: {
                    HStack(spacing: 4) {
                        Text(sort == .wirkung ? "Wirkung" : "Neueste")
                        Image(systemName: "arrow.up.arrow.down")
                    }
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundStyle(Theme.amberDeep)
                }
            }
            .padding(.horizontal, 20)
        }
        .padding(.vertical, 8)
        .background(.bar)
    }

    private func chip(_ label: String, active: Bool, _ tap: @escaping () -> Void) -> some View {
        Button(action: tap) {
            Text(label)
                .font(.system(size: 11, weight: .medium, design: .monospaced))
                .foregroundStyle(active ? Theme.paper : Theme.muted)
                .padding(.horizontal, 13).padding(.vertical, 6)
                .background(active ? Theme.ink : Theme.canvasSoft, in: .capsule)
        }
        .buttonStyle(.plain)
    }
}
