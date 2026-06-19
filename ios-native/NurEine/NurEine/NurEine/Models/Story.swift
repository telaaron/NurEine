import Foundation

/// A NurEine story. Mirrors the JSON returned by `https://nureine.de/api/stories`
/// (the StoryResult shape). Only the fields the app uses are decoded; unknown
/// fields are ignored.
struct Story: Identifiable, Decodable, Hashable {
    let id: String
    let slug: String
    let title: String
    let dek: String
    let body: String
    let category: String
    let country: String
    let source: String
    let readingMinutes: Int
    let impactScore: Int
    let tone: String
    let imageUrl: String?
    let audioUrl: String?
    let publishedAt: String
    let createdAt: String?
    let coordsX: Double?
    let coordsY: Double?

    // Wirkungsindex axes (optional).
    let impactReach: Int?
    let impactDurability: Int?
    let impactEvidence: Int?
    let impactExplainer: String?

    // Reporter transparency (optional).
    let beat: String?
    let sourceType: String?

    enum CodingKeys: String, CodingKey {
        case id, slug, title, dek, body, category, country, source, tone
        case readingMinutes, impactScore, imageUrl, audioUrl, publishedAt, createdAt
        case coordsX, coordsY
        case impactReach, impactDurability, impactEvidence, impactExplainer
        case beat, sourceType
    }

    static func == (lhs: Story, rhs: Story) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}

extension Story {
    /// Coordinate pair if the story is geolocated.
    var coordinate: (lat: Double, lng: Double)? {
        guard let lat = coordsX, let lng = coordsY else { return nil }
        return (lat, lng)
    }

    /// The three impact axes that have a value, for the detail bars.
    var impactAxes: [(label: String, value: Int)] {
        var out: [(String, Int)] = []
        if let r = impactReach { out.append(("Reichweite", r)) }
        if let d = impactDurability { out.append(("Dauerhaftigkeit", d)) }
        if let e = impactEvidence { out.append(("Belegbarkeit", e)) }
        return out
    }
}
