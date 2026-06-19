import Foundation
import SwiftUI

/// Shared story store. Fetches the full list once and keeps it in memory so tab
/// switches are instant. Refreshes at most every 5 minutes (or on force / pull).
@Observable
final class StoryStore {
    private(set) var stories: [Story] = []
    private(set) var featured: Story?
    private(set) var loading = false
    private(set) var errored = false

    private var lastFetch: Date = .distantPast
    private let freshness: TimeInterval = 5 * 60

    /// The "Heute" hero = exactly the website's featured story (server-computed
    /// getLatestFeatured), fetched from /api/stories?featured=true. Falls back to
    /// the newest story only if the featured call returned nothing.
    var hero: Story? {
        featured ?? stories.sorted { $0.publishedAt > $1.publishedAt }.first
    }

    /// Newest stories after the hero, for the "Diese Woche" list (by published date).
    var week: [Story] {
        guard let hero else { return [] }
        return stories
            .filter { $0.id != hero.id }
            .sorted { $0.publishedAt > $1.publishedAt }
            .prefix(4)
            .map { $0 }
    }

    /// Geolocated stories for the map.
    var located: [Story] { stories.filter { $0.coordinate != nil } }

    @MainActor
    func ensure(force: Bool = false) async {
        let fresh = Date().timeIntervalSince(lastFetch) < freshness
        if !force && fresh && !stories.isEmpty { return }
        if loading { return }

        loading = true
        errored = false
        defer { loading = false }
        do {
            async let list = API.stories()
            async let feat = try? API.featured()
            stories = try await list
            featured = await feat ?? nil
            lastFetch = Date()
        } catch {
            if stories.isEmpty { errored = true }
        }
    }

    func filtered(category: Category?, sort: ArchiveSort) -> [Story] {
        let base = category == nil ? stories : stories.filter { $0.category == category!.rawValue }
        switch sort {
        case .neueste:
            return base.sorted { $0.publishedAt > $1.publishedAt }
        case .wirkung:
            return base.sorted { $0.impactScore > $1.impactScore }
        }
    }
}

enum ArchiveSort { case neueste, wirkung }
