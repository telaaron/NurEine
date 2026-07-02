import SwiftUI

/// Large hero story card (Heute). Image + tone tag + impact chip, then title,
/// dek, meta — the editorial card from the approved design.
struct HeroCard: View {
    let story: Story
    var large = false   // iPad center column: taller image + lead paragraph to fill the space
    private var tone: Tone { .from(story.tone) }

    private var lead: String? {
        guard large else { return nil }
        return story.body
            .components(separatedBy: "\n\n")
            .first { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }?
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var body: some View {
        // amber tab peeking below the framed panel (matches website hero)
        ZStack(alignment: .bottom) {
            RoundedRectangle(cornerRadius: 16)
                .fill(Theme.amber)
                .frame(height: 26)
                .padding(.horizontal, 16)
                .offset(y: 12)
            card
        }
    }

    private var card: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Image band — tag top-left, impact chip overlapping the lower-right
            // seam (like the website hero). Text never sits on the image.
            ZStack(alignment: .topLeading) {
                AsyncStoryImage(story: story, width: large ? 1200 : 900)
                    .frame(height: large ? 380 : 200)
                    .frame(maxWidth: .infinity)
                    .clipped()
                TagChip(text: Category.label(for: story.category), color: tone.color)
                    .padding(12)
            }
            .frame(maxWidth: .infinity)
            .overlay(alignment: .bottomTrailing) {
                ImpactChip(score: story.impactScore)
                    .padding(.trailing, 12)
                    .offset(y: 18)
            }

            VStack(alignment: .leading, spacing: 10) {
                Text(story.title)
                    .font(.display(large ? 38 : 30, weight: .bold))
                    .tracking(-1.0)
                    .foregroundStyle(Theme.ink)
                    .lineSpacing(large ? 1 : 0)
                    .fixedSize(horizontal: false, vertical: true)
                Text(story.dek)
                    .font(.custom("Newsreader", size: large ? 18 : 15))
                    .foregroundStyle(Theme.inkSoft)
                    .lineSpacing(4)
                    .fixedSize(horizontal: false, vertical: true)
                if let lead {
                    Text(lead)
                        .font(.custom("Newsreader", size: 16))
                        .foregroundStyle(Theme.inkSoft)
                        .lineSpacing(6)
                        .lineLimit(6)
                        .padding(.top, 4)
                }
                HStack(spacing: 6) {
                    Circle().fill(tone.color).frame(width: 6, height: 6)
                    Text("\(story.readingMinutes) Min · \(story.country)")
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundStyle(Theme.muted)
                    if large {
                        Spacer()
                        Text("Weiterlesen →").font(.system(size: 12, weight: .medium)).foregroundStyle(tone.color)
                    }
                }
                .padding(.top, 2)
            }
            .padding(.horizontal, large ? 24 : 18)
            .padding(.top, 26)
            .padding(.bottom, large ? 24 : 18)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Theme.paper)
        .clipShape(.rect(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(Theme.rule, lineWidth: 1))
        .shadow(color: .black.opacity(0.06), radius: 16, x: 0, y: 8)
    }
}

/// Compact row (Diese Woche / Archiv).
struct StoryRow: View {
    let story: Story
    var thumbWidth: Int = 200
    private var tone: Tone { .from(story.tone) }

    var body: some View {
        HStack(spacing: 11) {
            AsyncStoryImage(story: story, width: thumbWidth)
                .frame(width: 60, height: 60)
                .clipShape(.rect(cornerRadius: 10))
            VStack(alignment: .leading, spacing: 5) {
                Text(Category.label(for: story.category).uppercased())
                    .font(.system(size: 9, weight: .medium, design: .monospaced))
                    .tracking(1.4)
                    .foregroundStyle(tone.color)
                Text(story.title)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Theme.ink)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
        .padding(10)
        .frame(maxWidth: .infinity)
        .background(Theme.paper)
        .clipShape(.rect(cornerRadius: 13))
        .overlay(RoundedRectangle(cornerRadius: 13).stroke(Theme.rule, lineWidth: 1))
    }
}

struct HeroSkeleton: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Theme.canvasSoft.aspectRatio(16.0 / 10.0, contentMode: .fill)
            VStack(alignment: .leading, spacing: 10) {
                RoundedRectangle(cornerRadius: 6).fill(Theme.canvasSoft).frame(height: 16).frame(maxWidth: 220)
                RoundedRectangle(cornerRadius: 6).fill(Theme.canvasSoft).frame(height: 14)
            }
            .padding(16)
        }
        .background(Theme.paper)
        .clipShape(.rect(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(Theme.rule, lineWidth: 1))
        .redacted(reason: .placeholder)
    }
}

struct ConnectionLost: View {
    let retry: () -> Void
    var body: some View {
        VStack(spacing: 14) {
            Text("Verbindung verloren.")
                .font(.custom("Newsreader", size: 18))
                .foregroundStyle(Theme.muted)
            Button(action: retry) {
                Text("Erneut versuchen")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(Theme.paper)
                    .padding(.horizontal, 22).padding(.vertical, 11)
                    .background(Theme.ink, in: .capsule)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 48)
    }
}

// MARK: - iPad editorial components

/// Left-column side story (iPad): tag, title, serif dek, image below, divider —
/// the "newspaper secondary story" look.
struct SideStory: View {
    let story: Story
    private var tone: Tone { .from(story.tone) }
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(Category.label(for: story.category).uppercased())
                .font(.system(size: 9, weight: .medium, design: .monospaced))
                .tracking(1.4).foregroundStyle(tone.color)
            Text(story.title)
                .font(.display(19))
                .foregroundStyle(Theme.ink)
                .lineLimit(3)
                .fixedSize(horizontal: false, vertical: true)
            AsyncStoryImage(story: story, width: 400)
                .frame(height: 130)
                .clipShape(.rect(cornerRadius: 12))
            Text(story.dek)
                .font(.custom("Newsreader", size: 14))
                .foregroundStyle(Theme.inkSoft)
                .lineLimit(3)
                .lineSpacing(3)
            HStack(spacing: 5) {
                Circle().fill(tone.color).frame(width: 5, height: 5)
                Text("\(story.readingMinutes) Min · \(story.country)")
                    .font(.system(size: 10, design: .monospaced)).foregroundStyle(Theme.muted)
            }
            Rectangle().fill(Theme.rule).frame(height: 1).padding(.top, 4)
        }
    }
}

/// Right-rail compact headline (iPad): small thumb + title.
struct RailHeadline: View {
    let story: Story
    private var tone: Tone { .from(story.tone) }
    var body: some View {
        HStack(alignment: .top, spacing: 11) {
            AsyncStoryImage(story: story, width: 160)
                .frame(width: 64, height: 64)
                .clipShape(.rect(cornerRadius: 9))
            VStack(alignment: .leading, spacing: 4) {
                Text(Category.label(for: story.category).uppercased())
                    .font(.system(size: 8, weight: .medium, design: .monospaced))
                    .tracking(1.2).foregroundStyle(tone.color)
                Text(story.title)
                    .font(.display(15, weight: .medium))
                    .foregroundStyle(Theme.ink)
                    .lineLimit(3)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
    }
}
