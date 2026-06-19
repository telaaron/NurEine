import SwiftUI
import AVKit

struct StoryDetailView: View {
    let story: Story
    @Environment(\.dismiss) private var dismiss
    @State private var player: AVPlayer?
    @State private var playing = false
    private var tone: Tone { .from(story.tone) }

    private var paragraphs: [String] {
        story.body.components(separatedBy: "\n\n").map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
    }
    private var shareURL: URL { URL(string: "\(API.base)/geschichte/\(story.slug)")! }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                // Edge-to-edge image reaching under the status bar (magazine cover).
                AsyncStoryImage(story: story, width: 900)
                    .frame(height: 300)
                    .frame(maxWidth: .infinity)
                    .clipped()

                // Paper content block pulled up over the image's lower edge.
                VStack(alignment: .leading, spacing: 0) {
                    TagChip(text: "\(Category.label(for: story.category)) · \(story.country)", color: tone.color)
                        .padding(.top, 22)
                    Text(story.title)
                        .font(.display(24))
                        .foregroundStyle(Theme.ink)
                        .padding(.top, 10)
                    Text("\(story.readingMinutes) Min · Quelle: \(story.source)")
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundStyle(Theme.faint)
                        .padding(.top, 8)

                    Text(story.dek)
                        .font(.custom("Newsreader", size: 16)).italic()
                        .foregroundStyle(Theme.inkSoft)
                        .lineSpacing(4)
                        .padding(.top, 14)

                    ForEach(paragraphs, id: \.self) { p in
                        Text(p)
                            .font(.custom("Newsreader", size: 15))
                            .foregroundStyle(Theme.inkSoft)
                            .lineSpacing(5)
                            .padding(.top, 14)
                    }

                    if !story.impactAxes.isEmpty { impactCard.padding(.top, 20) }
                    if let trust = trustLine { trust.padding(.top, 16) }

                    ShareLink(item: shareURL) {
                        HStack(spacing: 8) {
                            Image(systemName: "square.and.arrow.up")
                            Text("Diese Geschichte teilen")
                        }
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(Theme.paper)
                        .frame(maxWidth: .infinity)
                        .padding(13)
                        .background(Theme.ink, in: .capsule)
                    }
                    .padding(.top, 22)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 24)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Theme.canvas)
                .clipShape(.rect(topLeadingRadius: 22, topTrailingRadius: 22))
                .offset(y: -22)
            }
        }
        .background(Theme.canvas)
        .scrollContentBackground(.hidden)
        .ignoresSafeArea(edges: .top)
        .scrollIndicators(.hidden)
        // Floating glass controls over the cover image.
        .overlay(alignment: .topLeading) {
            Button { dismiss() } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(Theme.ink)
                    .frame(width: 38, height: 38)
                    .glassEffect(.regular, in: .circle)
            }
            .padding(.leading, 16)
            .padding(.top, 8)
        }
        .overlay(alignment: .topTrailing) {
            if story.audioUrl != nil {
                Button(action: toggleAudio) {
                    Image(systemName: playing ? "pause.fill" : "play.fill")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Theme.ink)
                        .frame(width: 38, height: 38)
                        .glassEffect(.regular, in: .circle)
                }
                .padding(.trailing, 16)
                .padding(.top, 8)
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .onDisappear { player?.pause() }
    }

    private var impactCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("WIRKUNGSINDEX")
                    .font(.system(size: 12, weight: .medium, design: .monospaced)).tracking(1.2)
                    .foregroundStyle(Theme.muted)
                Spacer()
                Text("\(story.impactScore)").font(.system(size: 22, weight: .semibold)).foregroundStyle(Theme.amberDeep)
                    + Text("/100").font(.system(size: 11)).foregroundStyle(Theme.faint)
            }
            ForEach(story.impactAxes, id: \.label) { axis in
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(axis.label).font(.system(size: 11)).foregroundStyle(Theme.muted)
                        Spacer()
                        Text("\(axis.value)").font(.system(size: 11, weight: .medium))
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Theme.rule).frame(height: 6)
                            Capsule().fill(tone.color)
                                .frame(width: geo.size.width * Double(axis.value) / 100, height: 6)
                        }
                    }
                    .frame(height: 6)
                }
            }
            if let ex = story.impactExplainer {
                Text(ex).font(.custom("Newsreader", size: 13)).foregroundStyle(Theme.muted).lineSpacing(2)
            }
        }
        .padding(15)
        .background(Theme.paper)
        .clipShape(.rect(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.rule, lineWidth: 1))
    }

    private var trustLine: (some View)? {
        let beatLabels = [
            "klima-energie": "Klima & Energie", "gesundheit-forschung": "Gesundheit & Forschung",
            "gesellschaft-bildung": "Gesellschaft & Bildung", "innovation-wirtschaft": "Innovation & Wirtschaft",
            "staedte-kommunen": "Städte & Kommunen"
        ]
        let beat = story.beat.flatMap { beatLabels[$0] }
        guard let beat else { return Optional<AnyView>.none }
        return AnyView(
            HStack(alignment: .top, spacing: 8) {
                Image(systemName: "checkmark.shield").foregroundStyle(Theme.sage).font(.system(size: 14))
                Text("Gefunden vom Beat ").foregroundStyle(Theme.muted)
                    + Text(beat).foregroundStyle(Theme.inkSoft)
            }
            .font(.system(size: 12))
        )
    }

    private func toggleAudio() {
        if player == nil, let urlStr = story.audioUrl, let url = URL(string: urlStr) {
            player = AVPlayer(url: url)
        }
        if playing { player?.pause() } else { player?.play() }
        playing.toggle()
    }
}
