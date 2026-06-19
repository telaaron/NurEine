import SwiftUI

/// Large hero story card (Heute). Image + tone tag + impact chip, then title,
/// dek, meta — the editorial card from the approved design.
struct HeroCard: View {
    let story: Story
    private var tone: Tone { .from(story.tone) }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Image band — fixed ratio, tag top-left, impact chip overlapping the
            // lower-right seam (like the website hero). Text never sits on the image.
            ZStack(alignment: .topLeading) {
                AsyncStoryImage(story: story, width: 900)
                    .frame(height: 200)
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
                    .font(.system(size: 23, weight: .semibold))
                    .foregroundStyle(Theme.ink)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
                Text(story.dek)
                    .font(.custom("Newsreader", size: 15))
                    .foregroundStyle(Theme.inkSoft)
                    .lineSpacing(4)
                    .fixedSize(horizontal: false, vertical: true)
                HStack(spacing: 6) {
                    Circle().fill(tone.color).frame(width: 6, height: 6)
                    Text("\(story.readingMinutes) Min · \(story.country)")
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundStyle(Theme.muted)
                }
                .padding(.top, 2)
            }
            .padding(.horizontal, 18)
            .padding(.top, 26)
            .padding(.bottom, 18)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Theme.paper)
        .clipShape(.rect(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(Theme.rule, lineWidth: 1))
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
