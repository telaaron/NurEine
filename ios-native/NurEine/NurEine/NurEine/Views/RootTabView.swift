import SwiftUI

/// The app's root. A native TabView (adopts Liquid Glass on iOS 26) over four
/// sections. Onboarding is presented as a full-screen cover on first launch.
/// A morning-push tap deep-links into the story on the Heute tab.
struct RootTabView: View {
    @Environment(Prefs.self) private var prefs
    @Environment(StoryStore.self) private var store
    @State private var showOnboarding = false
    @State private var selection = 0
    @State private var deepLink: Story?

    var body: some View {
        TabView(selection: $selection) {
            Tab("Heute", systemImage: "sun.max", value: 0) {
                TodayView(deepLink: $deepLink)
            }
            Tab("Archiv", systemImage: "archivebox", value: 1) {
                ArchiveView()
            }
            Tab("Karte", systemImage: "map", value: 2) {
                MapTabView()
            }
            Tab("Mehr", systemImage: "ellipsis", value: 3) {
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
            Task {
                await store.ensure()
                if let s = store.stories.first(where: { $0.id == id }) {
                    selection = 0
                    deepLink = s
                }
            }
        }
    }
}
