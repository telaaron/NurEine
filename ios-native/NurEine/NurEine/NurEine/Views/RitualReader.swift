import SwiftUI

/// Der Ritual-Reader — eine Ausgabe in sechs Schlägen, per Tippen weiter.
///
/// Spiegelt `src/lib/app-v2/RitualReader.svelte`. Die DNA der Reel-Marke:
/// die Zahl ist der Held, der „Belegt."-Stempel ist die Signatur, und am Ende
/// ist man FERTIG — kein Weiterscrollen, kein nächster Artikel.
struct RitualReader: View {
    let story: Story
    /// Wird gerufen, wenn die Ausgabe abgeschlossen ist (Licht → Himmel).
    var onDone: (Story) -> Void

    @State private var beat = 0

    private let lastBeat = 5

    var body: some View {
        ZStack {
            Theme.canvas.ignoresSafeArea()

            VStack(alignment: .leading, spacing: 0) {
                threads
                Spacer(minLength: 0)
                content
                Spacer(minLength: 0)
                hint
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 18)
        }
        // Die ganze Fläche ist der Weiter-Knopf — ein Beat, ein Tipp.
        .contentShape(Rectangle())
        .onTapGesture { advance() }
        .animation(.easeInOut(duration: 0.42), value: beat)
    }

    // MARK: Fortschritt

    /// Sechs Fäden oben — man sieht, wie viel noch kommt (und dass es endlich ist).
    private var threads: some View {
        HStack(spacing: 6) {
            ForEach(0...lastBeat, id: \.self) { i in
                Capsule()
                    .fill(i <= beat ? Theme.amber : Theme.rule)
                    .frame(height: 3)
            }
        }
    }

    private var hint: some View {
        Text(beat == lastBeat ? "" : hintText)
            .font(.system(size: 11, weight: .medium))
            .tracking(1.6)
            .foregroundStyle(Theme.faint)
            .frame(maxWidth: .infinity)
    }

    private var hintText: String {
        switch beat {
        case 0: "TIPPEN — WER DAHINTERSTECKT"
        case 1: "TIPPEN — WAS SICH ÄNDERT"
        case 2: "TIPPEN — WARUM DAS WIRKT"
        case 3: "TIPPEN FÜR DEN BELEG"
        default: "TIPPEN ZUM ABSCHLUSS"
        }
    }

    // MARK: Die Schläge

    @ViewBuilder
    private var content: some View {
        switch beat {
        case 0: coldOpen
        case 1: headline
        case 2: mechanism
        case 3: impact
        case 4: proof
        default: closing
        }
    }

    /// Schlag 1 — die Zahl. Erst der Beleg, dann die Geschichte.
    private var coldOpen: some View {
        VStack(alignment: .leading, spacing: 14) {
            Eyebrow(text: "Ein Beleg von heute")
            Text("\(story.impactScore)")
                .font(.display(96, weight: .bold))
                .monospacedDigit()
                .kerning(-4)
                .foregroundStyle(Theme.ink)
            Text("von 100 Wirkungsindex")
                .font(.system(size: 15))
                .foregroundStyle(Theme.muted)
            if let ex = story.impactExplainer, !ex.isEmpty {
                Text(ex)
                    .font(.serif(19))
                    .foregroundStyle(Theme.inkSoft)
                    .lineSpacing(5)
                    .padding(.top, 6)
            }
        }
        .transition(.opacity)
    }

    /// Schlag 2 — worum es geht.
    private var headline: some View {
        VStack(alignment: .leading, spacing: 14) {
            Eyebrow(text: story.country)
            Text(story.title)
                .font(.display(32, weight: .semibold))
                .foregroundStyle(Theme.ink)
                .lineSpacing(2)
            Text(story.dek)
                .font(.serif(19))
                .foregroundStyle(Theme.inkSoft)
                .lineSpacing(5)
        }
        .transition(.opacity)
    }

    /// Schlag 3 — der Mechanismus: warum es überhaupt funktioniert.
    private var mechanism: some View {
        VStack(alignment: .leading, spacing: 14) {
            Eyebrow(text: "Was sich ändert")
            Text(story.body.split(separator: "\n\n").first.map(String.init) ?? story.dek)
                .font(.serif(19))
                .foregroundStyle(Theme.ink)
                .lineSpacing(6)
        }
        .transition(.opacity)
    }

    /// Schlag 4 — die drei Achsen. Nie eine nackte Zahl, immer erklärt.
    private var impact: some View {
        VStack(alignment: .leading, spacing: 18) {
            Eyebrow(text: "Warum das wirkt")
            ForEach(story.impactAxes, id: \.label) { axis in
                VStack(alignment: .leading, spacing: 7) {
                    HStack {
                        Text(axis.label)
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(Theme.ink)
                        Spacer()
                        Text("\(axis.value)")
                            .font(.display(17, weight: .semibold))
                            .monospacedDigit()
                            .foregroundStyle(Theme.amber)
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Theme.rule)
                            Capsule()
                                .fill(Theme.amber)
                                .frame(width: geo.size.width * CGFloat(axis.value) / 100)
                        }
                    }
                    .frame(height: 6)
                }
            }
        }
        .transition(.opacity)
    }

    /// Schlag 5 — der Stempel. Die Signatur der Marke.
    private var proof: some View {
        VStack(alignment: .leading, spacing: 18) {
            StampView()
            Text("Quelle: \(story.source)")
                .font(.serif(17, italic: true))
                .foregroundStyle(Theme.inkSoft)
            Link(destination: URL(string: "\(API.base)/geschichte/\(story.slug)")!) {
                HStack(spacing: 5) {
                    Text("Zur Originalquelle")
                    Image(systemName: "arrow.up.right")
                }
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(Theme.amber)
            }
        }
        .transition(.opacity)
    }

    /// Schlag 6 — fertig. Kein „nächster Artikel", nur der Weg in den Himmel.
    private var closing: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Das war deine Ausgabe.")
                .font(.display(30, weight: .semibold))
                .foregroundStyle(Theme.ink)
            Text("Morgen die nächste. Belegt.")
                .font(.serif(19))
                .foregroundStyle(Theme.muted)

            ShareLink(
                item: URL(string: "\(API.base)/geschichte/\(story.slug)")!,
                message: Text(story.dek)
            ) {
                HStack(spacing: 7) {
                    Image(systemName: "square.and.arrow.up")
                    Text("Teilen")
                }
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(Theme.amber)
            }

            Button {
                onDone(story)
            } label: {
                Text("Fertig — in den Himmel")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Theme.canvas)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(Capsule().fill(Theme.amber))
            }
            .padding(.top, 4)
        }
        .transition(.opacity)
    }

    private func advance() {
        guard beat < lastBeat else { return }
        beat += 1
    }
}

/// Der „Belegt."-Stempel — schräg eingeschlagen, wie im Reel.
struct StampView: View {
    @State private var slammed = false

    var body: some View {
        Text("Belegt.")
            .font(.display(30, weight: .bold))
            .foregroundStyle(Theme.amber)
            .padding(.horizontal, 20)
            .padding(.vertical, 10)
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(Theme.amber, lineWidth: 5)
            )
            .rotationEffect(.degrees(-4))
            .scaleEffect(slammed ? 1 : 1.6)
            .opacity(slammed ? 1 : 0)
            .onAppear {
                withAnimation(.spring(response: 0.34, dampingFraction: 0.55)) {
                    slammed = true
                }
            }
    }
}
