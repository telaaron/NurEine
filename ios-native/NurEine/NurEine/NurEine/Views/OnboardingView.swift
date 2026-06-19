import SwiftUI
import UserNotifications

struct OnboardingView: View {
    @Environment(Prefs.self) private var prefs
    @Environment(\.dismiss) private var dismiss
    @State private var step = 0

    var body: some View {
        VStack {
            HStack {
                Spacer()
                Button("Überspringen") { finish() }
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundStyle(Theme.muted)
            }
            .padding(.horizontal, 20).padding(.top, 12)

            Spacer()
            content
            Spacer()

            HStack(spacing: 7) {
                ForEach(0..<3) { i in
                    Capsule().fill(i == step ? Theme.amber : Theme.ruleStrong)
                        .frame(width: i == step ? 22 : 7, height: 7)
                }
            }
            .padding(.bottom, 16)

            footer.padding(.horizontal, 28).padding(.bottom, 28)
        }
        .background(Theme.canvas.ignoresSafeArea())
    }

    @ViewBuilder private var content: some View {
        switch step {
        case 0:
            stepView(icon: "sun.max", title: "Eine gute Nachricht.\nJeden Morgen.",
                     body: "Kein Feed, kein Algorithmus, kein Sog. Eine belegte Geschichte über echten Fortschritt — in zwei Minuten.")
        case 1:
            VStack(spacing: 16) {
                Text("Was bewegt dich?").font(.system(size: 30, weight: .semibold)).foregroundStyle(Theme.ink)
                Text("Wähle deine Themen — oder lass alle an.")
                    .font(.custom("Newsreader", size: 16)).foregroundStyle(Theme.inkSoft).multilineTextAlignment(.center)
                FlowLayout(spacing: 9) {
                    ForEach(Category.allCases) { c in
                        let on = prefs.categories.contains(c.rawValue)
                        Button {
                            if on { prefs.categories.remove(c.rawValue) } else { prefs.categories.insert(c.rawValue) }
                        } label: {
                            Text("\(c.emoji) \(c.label)").font(.system(size: 14))
                                .foregroundStyle(on ? Theme.paper : Theme.inkSoft)
                                .padding(.horizontal, 15).padding(.vertical, 10)
                                .background(on ? Theme.ink : Theme.paper, in: .capsule)
                                .overlay(Capsule().stroke(Theme.rule, lineWidth: on ? 0 : 1))
                        }.buttonStyle(.plain)
                    }
                }.padding(.horizontal, 28)
            }
        default:
            stepView(icon: "bell", title: "Dürfen wir dich morgens wecken?",
                     body: "Dein Lichtblick erscheint um 6:25 Uhr direkt am Sperrbildschirm — bevor das Postfach dich stresst. Eine Nachricht. Mehr nicht.")
        }
    }

    private func stepView(icon: String, title: String, body: String) -> some View {
        VStack(spacing: 16) {
            ZStack {
                Circle().fill(Theme.amber).frame(width: 88, height: 88)
                Image(systemName: icon).font(.system(size: 40)).foregroundStyle(Theme.paper)
            }
            Text(title).font(.system(size: 30, weight: .semibold)).foregroundStyle(Theme.ink).multilineTextAlignment(.center)
            Text(body).font(.custom("Newsreader", size: 16)).foregroundStyle(Theme.inkSoft)
                .multilineTextAlignment(.center).lineSpacing(4).padding(.horizontal, 36)
        }
    }

    @ViewBuilder private var footer: some View {
        if step < 2 {
            Button { step += 1 } label: { cta(step == 0 ? "Los geht’s" : "Weiter") }
        } else {
            VStack(spacing: 14) {
                Button { requestPush() } label: { cta("Benachrichtigung erlauben") }
                Button("Vielleicht später") { finish() }
                    .font(.system(size: 14)).foregroundStyle(Theme.muted)
            }
        }
    }

    private func cta(_ t: String) -> some View {
        Text(t).font(.system(size: 16, weight: .medium)).foregroundStyle(Theme.paper)
            .frame(maxWidth: .infinity).padding(16).background(Theme.ink, in: .capsule)
    }

    private func requestPush() {
        Task {
            let granted = (try? await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .sound, .badge])) ?? false
            prefs.pushWanted = granted
            finish()
        }
    }

    private func finish() {
        prefs.onboarded = true
        dismiss()
    }
}
