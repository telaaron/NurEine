import Foundation

/// Thin client over the production NurEine API. No server of our own — the app
/// reads the same endpoints the website uses.
enum API {
    static let base = "https://nureine.de"

    /// All stories, newest first.
    static func stories() async throws -> [Story] {
        try await get("/api/stories", as: [Story].self)
    }

    /// The website's featured "Heute" story (server-computed getLatestFeatured),
    /// so the app shows the exact same hero. Nil if none.
    static func featured() async throws -> Story? {
        try await get("/api/stories?featured=true", as: Story?.self)
    }

    /// One story by id.
    static func story(id: String) async throws -> Story {
        try await get("/api/stories/\(id)", as: Story.self)
    }

    struct SubscribeResult { let ok: Bool; let message: String }

    /// Subscribe an email to the daily newsletter (double-opt-in server-side).
    static func subscribe(email: String, categories: [String], ref: String?) async -> SubscribeResult {
        guard let url = URL(string: "\(base)/api/subscribe") else {
            return .init(ok: false, message: "Ungültige Anfrage.")
        }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body: [String: Any?] = ["email": email, "tier": "free", "categories": categories, "ref": ref]
        req.httpBody = try? JSONSerialization.data(withJSONObject: body.compactMapValues { $0 })
        do {
            let (data, resp) = try await URLSession.shared.data(for: req)
            let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
            let ok = (resp as? HTTPURLResponse).map { (200..<300).contains($0.statusCode) } ?? false
            let msg = (json?["message"] as? String) ?? (json?["error"] as? String) ?? ""
            return .init(ok: ok, message: msg)
        } catch {
            return .init(ok: false, message: "Keine Verbindung. Bitte versuche es später erneut.")
        }
    }

    // MARK: - Core

    private static func get<T: Decodable>(_ path: String, as: T.Type) async throws -> T {
        guard let url = URL(string: base + path) else { throw URLError(.badURL) }
        var req = URLRequest(url: url)
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        return try JSONDecoder().decode(T.self, from: data)
    }
}
