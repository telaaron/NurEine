import Foundation

/// Ein gesammeltes Licht — eine gelesene Ausgabe.
///
/// Spiegelt `src/lib/app-v2/collection.svelte.ts` der Web-App. Nichts verfällt:
/// Die Sammlung wächst still weiter, es gibt keine Serie, die reißen kann
/// (Aarons Weiche aus Phase 0: „stille Sammlung ohne Verfall").
struct Light: Identifiable, Codable, Hashable {
    let id: String        // story id — ein Licht je Ausgabe
    let title: String
    let category: String
    let day: String       // YYYY-MM-DD, der Tag der Ausgabe
    let gifted: Bool      // geschenkt beim Onboarding (Endowed Progress)

    /// Ruhige, aber stabile Position am Himmel — aus der id abgeleitet, damit
    /// dasselbe Licht immer am selben Fleck steht (kein Springen beim Neuzeichnen).
    var seed: Double {
        let h = id.unicodeScalars.reduce(UInt32(2166136261)) { acc, s in
            (acc ^ s.value) &* 16777619
        }
        return Double(h % 10000) / 10000.0
    }
}

/// Die Sammlung gelesener Ausgaben (UserDefaults — kein Login, kein Server).
@Observable
final class Collection {
    private(set) var lights: [Light] = []

    private let defaults = UserDefaults.standard
    private let key = "collection.v1"

    init() { load() }

    /// Drei geschenkte Lichter zum Start — der Himmel ist nie ganz leer
    /// (Endowed Progress: eine angefangene Sammlung führt man eher fort).
    static let giftedCount = 3

    var readCount: Int { lights.filter { !$0.gifted }.count }

    /// Ausgabe als gelesen ablegen. Idempotent — dieselbe Story gibt kein
    /// zweites Licht, egal wie oft das Ritual durchlaufen wird.
    @discardableResult
    func add(_ story: Story) -> Bool {
        guard !lights.contains(where: { $0.id == story.id }) else { return false }
        lights.append(
            Light(
                id: story.id,
                title: story.title,
                category: story.category,
                day: String(story.publishedAt.prefix(10)),
                gifted: false
            )
        )
        save()
        return true
    }

    func contains(_ story: Story) -> Bool {
        lights.contains { $0.id == story.id }
    }

    /// Die geschenkten Lichter einmalig anlegen (beim Onboarding-Abschluss).
    func gift() {
        guard !lights.contains(where: { $0.gifted }) else { return }
        let gifts = (0..<Self.giftedCount).map { i in
            Light(
                id: "gift-\(i)",
                title: "Fortschritt, der schon läuft",
                category: "gemeinschaft",
                day: "",
                gifted: true
            )
        }
        lights.insert(contentsOf: gifts, at: 0)
        save()
    }

    // MARK: Persistenz

    private func load() {
        guard let data = defaults.data(forKey: key),
              let decoded = try? JSONDecoder().decode([Light].self, from: data)
        else { return }
        lights = decoded
    }

    private func save() {
        guard let data = try? JSONEncoder().encode(lights) else { return }
        defaults.set(data, forKey: key)
    }
}
