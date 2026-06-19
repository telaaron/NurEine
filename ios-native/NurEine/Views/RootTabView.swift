import SwiftUI

/// The app's root. A native TabView (adopts Liquid Glass on iOS 26) over four
/// sections. Onboarding is presented as a full-screen cover on first launch.
struct RootTabView: View {
    @Environment(Prefs.self) private var prefs
    @State private var showOnboarding = false

    var body: some View {
        TabView {
            Tab("Heute", systemImage: "sun.max") {
                TodayView()
            }
            Tab("Archiv", systemImage: "archivebox") {
                ArchiveView()
            }
            Tab("Karte", systemImage: "map") {
                MapTabView()
            }
            Tab("Mehr", systemImage: "ellipsis") {
                MoreView()
            }
        }
        .fullScreenCover(isPresented: $showOnboarding) {
            OnboardingView()
        }
        .onAppear {
            if !prefs.onboarded { showOnboarding = true }
        }
    }
}
