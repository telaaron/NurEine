import SwiftUI
import MapKit

struct MapTabView: View {
    @Environment(StoryStore.self) private var store
    @State private var selected: Story?
    @State private var path: [Story] = []
    @State private var camera: MapCameraPosition = .region(
        MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 30, longitude: 10),
            span: MKCoordinateSpan(latitudeDelta: 120, longitudeDelta: 120)
        )
    )

    var body: some View {
        NavigationStack(path: $path) {
            Map(position: $camera) {
                ForEach(store.located) { s in
                    if let c = s.coordinate {
                        Annotation("", coordinate: CLLocationCoordinate2D(latitude: c.lat, longitude: c.lng)) {
                            Button { selected = s } label: {
                                Circle()
                                    .fill(Tone.from(s.tone).color)
                                    .frame(width: max(10, min(20, 8 + Double(s.impactScore) / 12)))
                                    .overlay(Circle().stroke(Theme.paper, lineWidth: 2))
                            }
                        }
                    }
                }
            }
            .mapStyle(.standard(pointsOfInterest: PointOfInterestCategories.excludingAll))
            .ignoresSafeArea(edges: .top)
            .overlay(alignment: .top) {
                HStack {
                    Text("Karte der Hoffnung")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(Theme.ink)
                        .padding(.horizontal, 12).padding(.vertical, 7)
                        .glassEffect(.regular, in: .capsule)
                    Spacer()
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
            }
            .navigationDestination(for: Story.self) { StoryDetailView(story: $0) }
            .toolbar(.hidden, for: .navigationBar)
            .sheet(item: $selected) { s in
                MapStoryPeek(story: s) {
                    selected = nil
                    path = [s]
                }
                .presentationDetents([.height(170)])
                .presentationBackground(Theme.paper)
                .presentationDragIndicator(.visible)
            }
        }
    }
}

/// A peek card shown when a map pin is tapped. Tapping it opens the full detail
/// (via the parent's navigation path), so there is exactly one back button.
private struct MapStoryPeek: View {
    let story: Story
    let open: () -> Void
    private var tone: Tone { .from(story.tone) }

    var body: some View {
        Button(action: open) {
            HStack(spacing: 11) {
                AsyncStoryImage(story: story, width: 200)
                    .frame(width: 56, height: 56)
                    .clipShape(.rect(cornerRadius: 10))
                VStack(alignment: .leading, spacing: 4) {
                    Text("\(Category.label(for: story.category)) · \(story.country)".uppercased())
                        .font(.system(size: 9, weight: .medium, design: .monospaced))
                        .tracking(1.4)
                        .foregroundStyle(tone.color)
                    Text(story.title)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(Theme.ink)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                    Text("\(story.readingMinutes) Min · Wirkung \(story.impactScore)")
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundStyle(Theme.muted)
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.right").foregroundStyle(Theme.faint)
            }
            .padding(16)
        }
        .buttonStyle(.plain)
    }
}
