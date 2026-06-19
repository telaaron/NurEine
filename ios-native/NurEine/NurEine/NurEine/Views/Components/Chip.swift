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
        VStack(spacing: 2) {
            Text("\(score)")
                .font(.system(size: 22, weight: .semibold))
                .foregroundStyle(Theme.ink)
            Text("WIRKUNG")
                .font(.system(size: 7, weight: .medium, design: .monospaced))
                .tracking(2)
                .foregroundStyle(Theme.faint)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .glassEffect(.regular, in: .rect(cornerRadius: 12))
    }
}
