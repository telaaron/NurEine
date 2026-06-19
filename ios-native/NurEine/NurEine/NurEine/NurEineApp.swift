import SwiftUI

@main
struct NurEineApp: App {
    @UIApplicationDelegateAdaptor(PushAppDelegate.self) private var pushDelegate
    @State private var store = StoryStore()
    @State private var prefs = Prefs()

    init() { Fonts.register() }

    var body: some Scene {
        WindowGroup {
            RootTabView()
                .environment(store)
                .environment(prefs)
                .tint(Theme.amber)
                .task { await store.ensure() }
        }
    }
}
