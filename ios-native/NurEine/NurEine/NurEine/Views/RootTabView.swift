import SwiftUI
import CoreSpotlight

/// The app's root. A native TabView (adopts Liquid Glass on iOS 26).
///
/// Der erste Tab ist das RITUAL (Aufdecken → Lesen in Schlägen → Licht in den
/// Himmel) — die neu erfundene Erfahrung, identisch zur Web-App unter /app.
/// Archiv und Karte bleiben für Stöberer erhalten (Aaron 2026-07-20), sind aber
/// bewusst NACHgeordnet: Der Einstieg ist die eine Ausgabe, nicht ein Feed.
/// Onboarding erscheint beim ersten Start, ein Push-Tap springt direkt ins Ritual.
struct RootTabView: View {
    @Environment(Prefs.self) private var prefs
    @Environment(StoryStore.self) private var store
    @State private var showOnboarding = false
    @State private var selection = 0
    @State private var deepLink: Story?

    var body: some View {
        TabView(selection: $selection) {
            Tab("Heute", systemImage: "sun.max", value: 0) {
                RitualView(deepLink: $deepLink)
            }
            Tab("Himmel", systemImage: "sparkles", value: 1) {
                SkyTab()
            }
            Tab("Archiv", systemImage: "archivebox", value: 2) {
                ArchiveView()
            }
            Tab("Karte", systemImage: "map", value: 3) {
                MapTabView()
            }
            Tab("Mehr", systemImage: "ellipsis", value: 4) {
                MoreView()
            }
        }
        .fullScreenCover(isPresented: $showOnboarding) {
            OnboardingView()
        }
        .onAppear {
            if !prefs.onboarded { showOnboarding = true }
        }
        .onReceive(NotificationCenter.default.publisher(for: .openStory)) { note in
            guard let id = note.object as? String else { return }
            openStory(id: id)
        }
        // Spotlight result tap → open that story.
        .onContinueUserActivity(CSSearchableItemActionType) { activity in
            if let full = activity.userInfo?[CSSearchableItemActivityIdentifier] as? String,
               full.hasPrefix("story:") {
                openStory(id: String(full.dropFirst("story:".count)))
            }
        }
    }

    private func openStory(id: String) {
        Task {
            await store.ensure()
            if let s = store.stories.first(where: { $0.id == id }) {
                selection = 0  // Ritual-Tab — der Push führt ins Lesen, nicht in einen Feed.
                deepLink = s
            }
        }
    }
}

/// Der Himmel als eigener Tab — die stille Sammlung, jederzeit erreichbar.
private struct SkyTab: View {
    @Environment(Collection.self) private var collection

    var body: some View {
        // NavigationStack, damit „Nochmal lesen" aus einem angetippten Licht
        // die Ausgabe öffnen kann.
        NavigationStack {
            content
                .navigationDestination(for: Story.self) { StoryDetailView(story: $0) }
                .toolbar(.hidden, for: .navigationBar)
        }
    }

    private var content: some View {
        ZStack {
            SkyView()

            VStack(alignment: .leading, spacing: 4) {
                Text("Dein Himmel")
                    .font(.system(size: 11, weight: .medium, design: .monospaced))
                    .tracking(2)
                    .foregroundStyle(Theme.amberDeep)
                HStack(spacing: 8) {
                    Text("\(collection.readCount)")
                        .font(.display(34, weight: .bold))
                        .monospacedDigit()
                        .foregroundStyle(Theme.amber)
                    Text(collection.readCount == 1 ? "Licht" : "Lichter")
                        .font(.system(size: 16))
                        .foregroundStyle(Theme.muted)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .padding(.horizontal, 24)
            .padding(.top, 16)
        }
    }
}
