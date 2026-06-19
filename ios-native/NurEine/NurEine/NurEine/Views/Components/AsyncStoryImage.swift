import SwiftUI

/// Loads a story image through the caching /img proxy, with a tone-tinted
/// placeholder while loading and a graceful fallback. URLSession's shared cache
/// + the proxy's immutable headers mean images load once and stay cached.
struct AsyncStoryImage: View {
    let story: Story
    var width: Int = 900

    var body: some View {
        AsyncImage(url: ImageURL.proxied(story.imageUrl, width: width)) { phase in
            switch phase {
            case .success(let image):
                image.resizable().scaledToFill()
            case .empty:
                Theme.canvasSoft.overlay(ProgressView().tint(Theme.faint))
            case .failure:
                Tone.from(story.tone).color.opacity(0.18)
            @unknown default:
                Theme.canvasSoft
            }
        }
        .clipped()
    }
}
