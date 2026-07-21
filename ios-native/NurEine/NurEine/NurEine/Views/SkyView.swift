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
    /// Angetipptes Licht — zeigt, welche Ausgabe dahintersteckt.
    @State private var selected: Light?

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
                    // Antippbar: Der Himmel ist die Sammlung, nicht nur ein Bild —
                    // „was habe ich am 14. Juli gelesen?" muss beantwortbar sein.
                    .contentShape(.circle)
                    .onTapGesture { selected = light }
                    .accessibilityLabel(light.gifted ? "Geschenktes Licht" : light.title)
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
        .sheet(item: $selected) { light in
            LightDetailSheet(light: light)
                .presentationDetents([.height(light.gifted ? 210 : 280)])
                .presentationDragIndicator(.visible)
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

/// Was hinter einem angetippten Licht steckt — und der Weg zurück in die Ausgabe.
private struct LightDetailSheet: View {
    let light: Light

    @Environment(StoryStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    /// Die Story zum Licht, falls sie noch geladen ist.
    private var story: Story? {
        store.stories.first { $0.id == light.id }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            if light.gifted {
                // Die drei geschenkten Lichter stehen für Fortschritt, der schon
                // lief, bevor man dazukam — sie führen nirgendwohin.
                Text("Geschenktes Licht")
                    .font(.system(size: 11, weight: .medium, design: .monospaced))
                    .tracking(2)
                    .foregroundStyle(Theme.amberDeep)
                Text("Fortschritt, der schon läuft")
                    .font(.display(22, weight: .semibold))
                    .foregroundStyle(Theme.ink)
                Text("Drei Lichter, die schon brannten, bevor du dazugekommen bist.")
                    .font(.serif(16))
                    .foregroundStyle(Theme.muted)
            } else {
                Text(dayLabel)
                    .font(.system(size: 11, weight: .medium, design: .monospaced))
                    .tracking(2)
                    .foregroundStyle(Theme.amberDeep)
                Text(light.title)
                    .font(.display(21, weight: .semibold))
                    .foregroundStyle(Theme.ink)
                    .fixedSize(horizontal: false, vertical: true)

                if let s = story {
                    NavigationLink(value: s) {
                        HStack(spacing: 6) {
                            Text("Nochmal lesen")
                            Image(systemName: "arrow.right")
                        }
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Theme.amber)
                    }
                    .buttonStyle(.plain)
                    .simultaneousGesture(TapGesture().onEnded { dismiss() })
                } else {
                    // Ältere Ausgaben sind evtl. nicht mehr in der Liste — dann
                    // ehrlich sagen statt einen toten Knopf zeigen.
                    Text("Diese Ausgabe ist gerade nicht geladen.")
                        .font(.system(size: 13))
                        .foregroundStyle(Theme.faint)
                }
            }
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(24)
        .background(Theme.canvas)
    }

    private var dayLabel: String {
        guard let d = ArchiveTimeline.date(fromISO: light.day) else { return "Gelesen" }
        let f = DateFormatter()
        f.locale = Locale(identifier: "de_DE")
        f.dateFormat = "d. MMMM yyyy"
        return "Gelesen · \(f.string(from: d))"
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
