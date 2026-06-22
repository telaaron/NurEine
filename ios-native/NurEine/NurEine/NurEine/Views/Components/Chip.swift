import SwiftUI

/// Small uppercase category/tag pill — the mono "badge" style from the web app.
struct TagChip: View {
    let text: String
    var color: Color = Theme.amber

    var body: some View {
        Text(text.uppercased())
            .font(.system(size: 9, weight: .medium, design: .monospaced))
            .tracking(1.4)
            .foregroundStyle(color)
            .padding(.horizontal, 9)
            .padding(.vertical, 4)
            .background(color.opacity(0.12), in: .capsule)
    }
}

/// Eyebrow label — tiny amber mono uppercase with a leading rule.
struct Eyebrow: View {
    let text: String
    var body: some View {
        HStack(spacing: 8) {
            Rectangle().fill(Theme.amber).frame(width: 22, height: 1)
            Text(text.uppercased())
                .font(.system(size: 11, weight: .medium, design: .monospaced))
                .tracking(2)
                .foregroundStyle(Theme.amberDeep)
        }
    }
}

/// The floating impact score chip (glass).
struct ImpactChip: View {
    let score: Int
    var body: some View {
        // Solid dark chip (not glass) so the score stays legible over any image,
        // bright or dark. Amber number for the brand pop.
        VStack(spacing: 1) {
            Text("\(score)")
                .font(.display(24))
                .foregroundStyle(Theme.amber)
            Text("WIRKUNG")
                .font(.system(size: 7, weight: .semibold, design: .monospaced))
                .tracking(2)
                .foregroundStyle(.white.opacity(0.6))
        }
        .padding(.horizontal, 13)
        .padding(.vertical, 9)
        .background(.black.opacity(0.78), in: .rect(cornerRadius: 13))
        .overlay(RoundedRectangle(cornerRadius: 13).stroke(.white.opacity(0.12), lineWidth: 1))
    }
}
