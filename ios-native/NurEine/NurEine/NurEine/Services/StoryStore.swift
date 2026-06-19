import Foundation
import SwiftUI

/// Shared story store. Fetches the full list once and keeps it in memory so tab
/// switches are instant. Refreshes at most every 5 minutes (or on force / pull).
@Observable
final class StoryStore {
    private(set) var stories: [Story] = []
    private(set) var loading = false
    private(set) var errored = false

    private var lastFetch: Date = .distantPast
    private let freshness: TimeInterval = 5 * 60

    /// Highest-impact fresh story = the "Heute" hero.
    var hero: Story? {
        stories.max(by: { $0.impactScore < $1.impactScore })
    }

    /// Hero + the next four, for the "Diese Woche" list.
    var week: [Story] {
        guard let hero else { return [] }
        return stories.filter { $0.id != hero.id }.prefix(4).map { $0 }
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
            stories = try await API.stories()
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
