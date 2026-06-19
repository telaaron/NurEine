import Foundation
import UIKit
import UserNotifications

/// Push registration. After the user grants permission, iOS hands us an APNs
/// device token (via the AppDelegate below); we POST it to the backend, which
/// sends the daily morning story to all registered tokens (api/cron/push).
/// The local test notification lives in MoreView; this is the real remote path.
@MainActor
enum Push {
    /// Ask permission and, if granted, register with APNs. Returns granted.
    static func requestAndRegister() async -> Bool {
        let center = UNUserNotificationCenter.current()
        let granted = (try? await center.requestAuthorization(options: [.alert, .sound, .badge])) ?? false
        if granted {
            UIApplication.shared.registerForRemoteNotifications()
        }
        return granted
    }

    /// Send the APNs token to the backend (best-effort; cached for retry).
    static func register(token: String) {
        Task {
            guard let url = URL(string: "\(API.base)/api/app/register-token") else { return }
            var req = URLRequest(url: url)
            req.httpMethod = "POST"
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try? JSONSerialization.data(
                withJSONObject: ["token": token, "platform": "ios"]
            )
            _ = try? await URLSession.shared.data(for: req)
            UserDefaults.standard.set(token, forKey: "apns_token")
        }
    }
}

/// Minimal app delegate to receive the APNs token (SwiftUI App lifecycle still
/// needs one for remote-notification callbacks). Wired via @UIApplicationDelegateAdaptor.
final class PushAppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02x", $0) }.joined()
        Push.register(token: token)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        // Silent — common in simulator / without entitlement.
    }

    // Show the morning push even while the app is open.
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        [.banner, .sound]
    }

    // Tap → deep link to the story (storyId in payload).
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse) async {
        if let id = response.notification.request.content.userInfo["storyId"] as? String {
            NotificationCenter.default.post(name: .openStory, object: id)
        }
    }
}

extension Notification.Name {
    static let openStory = Notification.Name("openStory")
}
