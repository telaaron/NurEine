import SwiftUI

/// Der Einstieg — das Morgen-Ritual.
///
/// Spiegelt `src/routes/app/+page.svelte` + `RitualScreen.svelte`: die Ausgabe
/// liegt verdeckt da, man deckt sie auf, liest sie in Schlägen, und am Ende
/// steigt ein Licht in den Himmel. Danach ist man fertig — kein Feed.
struct RitualView: View {
    @Environment(StoryStore.self) private var store
    @Environment(Collection.self) private var collection

    /// Push-/Spotlight-Tap öffnet direkt diese Ausgabe.
    @Binding var deepLink: Story?

    private enum Phase { case cover, reading, sky }
    @State private var phase: Phase = .cover
    @State private var justAdded: Light?

    /// Die Ausgabe des Tages — der Deep-Link hat Vorrang vor der Tages-Story.
    private var story: Story? { deepLink ?? store.hero }

    var body: some View {
        ZStack {
            switch phase {
            case .cover: cover
            case .reading:
                if let s = story {
                    RitualReader(story: s, onDone: finish)
                        .transition(.opacity)
                }
            case .sky:
                skyStage.transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.5), value: phase)
        .task { await store.ensure() }
        .refreshable { await store.ensure(force: true) }
        .onChange(of: deepLink) { _, new in
            // Push-Tap: direkt ins Lesen springen.
            if new != nil { phase = .reading }
        }
    }

    // MARK: Aufdecken

    private var cover: some View {
        ZStack {
            Theme.canvas.ignoresSafeArea()

            VStack(spacing: 26) {
                Text(todayLabel)
                    .font(.system(size: 11, weight: .medium, design: .monospaced))
                    .tracking(2)
                    .foregroundStyle(Theme.amberDeep)

                Spacer()

                if store.errored && store.stories.isEmpty {
                    ConnectionLost { Task { await store.ensure(force: true) } }
                } else if story == nil {
                    ProgressView().tint(Theme.amber)
                } else {
                    coveredCard
                }

                Spacer()

                if story != nil {
                    Button {
                        phase = .reading
                    } label: {
                        Text("Ausgabe aufdecken")
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundStyle(Theme.canvas)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 17)
                            .background(Capsule().fill(Theme.amber))
                    }
                }
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 22)
        }
    }

    /// Die verdeckte Karte — sie verrät nichts außer dem Versprechen.
    private var coveredCard: some View {
        VStack(spacing: 14) {
            Text("NUREINE")
                .font(.system(size: 12, weight: .medium, design: .monospaced))
                .tracking(4)
                .foregroundStyle(Theme.amberDeep)
            Text("Eine Geschichte.\nDann bist du fertig.")
                .font(.display(24, weight: .semibold))
                .foregroundStyle(Theme.ink)
                .multilineTextAlignment(.center)
                .lineSpacing(3)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 78)
        .background(
            RoundedRectangle(cornerRadius: 22)
                .fill(Theme.paper)
                .overlay(RoundedRectangle(cornerRadius: 22).stroke(Theme.rule, lineWidth: 1))
        )
    }

    // MARK: Himmel

    private var skyStage: some View {
        ZStack {
            SkyView(flyIn: justAdded)

            VStack {
                HStack(spacing: 8) {
                    Text("\(collection.readCount)")
                        .font(.display(30, weight: .bold))
                        .monospacedDigit()
                        .foregroundStyle(Theme.amber)
                    Text(collection.readCount == 1 ? "Licht" : "Lichter")
                        .font(.system(size: 15))
                        .foregroundStyle(Theme.muted)
                    Spacer()
                }
                .padding(.horizontal, 24)
                .padding(.top, 12)

                Spacer()

                Button {
                    // Zurück zur Ruhe — die Ausgabe ist erledigt.
                    deepLink = nil
                    phase = .cover
                } label: {
                    Text("Schließen")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(Theme.amber)
                        .padding(.vertical, 14)
                        .padding(.horizontal, 34)
                        .background(Capsule().stroke(Theme.amber.opacity(0.5), lineWidth: 1))
                }
                .padding(.bottom, 26)
            }
        }
    }

    // MARK: Ablauf

    private func finish(_ s: Story) {
        let isNew = collection.add(s)
        justAdded = isNew ? collection.lights.last : nil
        phase = .sky
    }

    private var todayLabel: String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "de_DE")
        f.dateFormat = "d. MMMM"
        return "Deine Ausgabe · \(f.string(from: Date()))"
    }
}
