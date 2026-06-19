import Foundation
import SwiftUI

/// Local, no-login preferences (UserDefaults) — topics, onboarding, push intent.
/// Mirrors src/lib/app/prefs.ts.
@Observable
final class Prefs {
    var categories: Set<String> {
        didSet { defaults.set(Array(categories), forKey: "categories") }
    }
    var hasKids: Bool? {
        didSet { defaults.set(hasKids, forKey: "hasKids") }
    }
    var pushWanted: Bool {
        didSet { defaults.set(pushWanted, forKey: "pushWanted") }
    }
    var onboarded: Bool {
        didSet { defaults.set(onboarded, forKey: "onboarded") }
    }
    var email: String? {
        didSet { defaults.set(email, forKey: "email") }
    }

    private let defaults = UserDefaults.standard

    init() {
        categories = Set(defaults.stringArray(forKey: "categories") ?? [])
        hasKids = defaults.object(forKey: "hasKids") as? Bool
        pushWanted = defaults.bool(forKey: "pushWanted")
        onboarded = defaults.bool(forKey: "onboarded")
        email = defaults.string(forKey: "email")
    }
}
