import SwiftUI

/// Der Himmel — jede gelesene Ausgabe ein Licht.
///
/// Spiegelt `src/lib/app-v2/SkyView.svelte`. Bewusst kein Zähler-Wettbewerb,
/// keine Serie: Die Sammlung wächst still. Unten glimmt der Morgen (Amber),
/// oben steht die Nacht — die Lichter steigen über die Zeit nach oben.
struct SkyView: View {
    @Environment(Collection.self) private var collection

    /// Ein frisch hinzugekommenes Licht fliegt hinein statt einfach da zu sein.
    var flyIn: Light?

    @State private var arrived = false

    var body: some View {
        GeometryReader { geo in
            ZStack {
                nightSky
                dawnGlow(height: geo.size.height)

                ForEach(collection.lights) { light in
                    let p = position(for: light, in: geo.size)
                    LightDot(
                        light: light,
                        isNew: light.id == flyIn?.id,
                        arrived: arrived
                    )
                    .position(x: p.x, y: p.y)
                }

                if collection.lights.isEmpty {
                    emptyHint
                }
            }
        }
        .onAppear {
            // Das neue Licht fliegt nach kurzem Moment an seinen Platz.
            withAnimation(.easeOut(duration: 1.4).delay(0.25)) { arrived = true }
        }
    }

    // MARK: Bestandteile

    private var nightSky: some View {
        LinearGradient(
            colors: [Color(UIColor(hex: 0x0B0B0D)), Color(UIColor(hex: 0x14120F))],
            startPoint: .top,
            endPoint: .bottom
        )
        .ignoresSafeArea()
    }

    /// Der Morgen glimmt am unteren Rand — die Marke ist „vor Sonnenaufgang".
    private func dawnGlow(height: CGFloat) -> some View {
        VStack {
            Spacer()
            LinearGradient(
                colors: [.clear, Theme.amber.opacity(0.30)],
                startPoint: .top,
                endPoint: .bottom
            )
            .frame(height: height * 0.34)
        }
        .ignoresSafeArea()
        .allowsHitTesting(false)
    }

    private var emptyHint: some View {
        Text("Noch kein Licht. Deine erste Ausgabe wartet.")
            .font(.serif(17))
            .foregroundStyle(Theme.muted)
            .multilineTextAlignment(.center)
            .padding(.horizontal, 40)
    }

    /// Ruhige Streuung: ältere Lichter stehen höher, die Seite kommt aus dem Seed.
    /// Deterministisch — dasselbe Licht landet immer am selben Fleck.
    private func position(for light: Light, in size: CGSize) -> CGPoint {
        guard let idx = collection.lights.firstIndex(of: light) else { return .zero }
        let total = max(collection.lights.count, 1)
        // Neueste unten (nah am Morgen), älteste oben.
        let depth = Double(total - idx) / Double(total + 1)
        let y = size.height * (0.10 + depth * 0.68)
        // Seitliche Streuung aus dem Seed, Ränder freilassen.
        let x = size.width * (0.12 + light.seed * 0.76)
        return CGPoint(x: x, y: y)
    }
}

/// Ein einzelnes Licht. Geschenkte Lichter glimmen blasser als selbst gelesene.
private struct LightDot: View {
    let light: Light
    let isNew: Bool
    let arrived: Bool

    @State private var breathe = false

    private var size: CGFloat { light.gifted ? 7 : 10 }
    private var core: Color { light.gifted ? Theme.muted : Theme.amber }

    var body: some View {
        ZStack {
            Circle()
                .fill(core.opacity(light.gifted ? 0.20 : 0.34))
                .frame(width: size * 3.4, height: size * 3.4)
                .blur(radius: 9)
            Circle()
                .fill(core.opacity(light.gifted ? 0.55 : 1))
                .frame(width: size, height: size)
        }
        .scaleEffect(breathe ? 1.06 : 0.96)
        // Das frische Licht steigt von unten herein.
        .offset(y: isNew && !arrived ? 220 : 0)
        .opacity(isNew && !arrived ? 0 : 1)
        .onAppear {
            withAnimation(.easeInOut(duration: 3.6).repeatForever(autoreverses: true)) {
                breathe = true
            }
        }
    }
}
