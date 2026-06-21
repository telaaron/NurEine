import Foundation
import CoreSpotlight
import UniformTypeIdentifiers

/// Index stories into Spotlight so a system search ("Sambia Bildung") surfaces
/// NurEine stories, and tapping a result deep-links into the app. Called after
/// the store loads. Cheap; re-indexing the same id just updates it.
enum Spotlight {
    static func index(_ stories: [Story]) {
        let items = stories.prefix(60).map { s -> CSSearchableItem in
            let attr = CSSearchableItemAttributeSet(contentType: .text)
            attr.title = s.title
            attr.contentDescription = s.dek
            attr.keywords = [Category.label(for: s.category), s.country, "gute Nachricht", "NurEine"]
            return CSSearchableItem(
                uniqueIdentifier: "story:\(s.id)",
                domainIdentifier: "stories",
                attributeSet: attr
            )
        }
        CSSearchableIndex.default().indexSearchableItems(items) { _ in }
    }
}
