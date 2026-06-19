import SwiftUI
import UserNotifications

struct MoreView: View {
    @Environment(Prefs.self) private var prefs
    @State private var email = ""
    @State private var subMsg = ""
    @State private var subOk = false
    @State private var subBusy = false
    @State private var testMsg = ""

    private let links: [(String, String)] = [
        ("Der Stand der Welt", "https://nureine.de/stand-der-welt"),
        ("Methodik — so wählen wir", "https://nureine.de/methodik"),
        ("Unsere Werte", "https://nureine.de/werte"),
        ("So arbeiten wir", "https://nureine.de/redaktion")
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 26) {
                    Text("Mehr")
                        .font(.system(size: 34, weight: .semibold))
                        .foregroundStyle(Theme.ink)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.top, 8)
                    pushCard
                    topics
                    newsletter
                    shareButton
                    linkList
                    Text("NurEine · Teltow, Brandenburg · 2026")
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundStyle(Theme.faint)
                        .frame(maxWidth: .infinity)
                }
                .padding(20)
            }
            .background(Theme.canvas)
            .scrollContentBackground(.hidden)
            .toolbar(.hidden, for: .navigationBar)
        }
    }

    @ViewBuilder private var pushCard: some View {
        @Bindable var p = prefs
        VStack(alignment: .leading, spacing: 12) {
            Toggle(isOn: $p.pushWanted) {
                VStack(alignment: .leading, spacing: 3) {
                    Text("Morgen-Benachrichtigung").font(.system(size: 15, weight: .medium)).foregroundStyle(Theme.ink)
                    Text("Dein Lichtblick um 6:25 Uhr — direkt am Sperrbildschirm.")
                        .font(.custom("Newsreader", size: 13)).foregroundStyle(Theme.muted)
                }
            }
            .tint(Theme.sage)
            Button(action: testNotification) {
                Label("Test-Benachrichtigung senden", systemImage: "bell")
                    .font(.system(size: 13)).foregroundStyle(Theme.inkSoft)
                    .frame(maxWidth: .infinity).padding(11)
                    .overlay(Capsule().stroke(Theme.ruleStrong, lineWidth: 1))
            }
            if !testMsg.isEmpty {
                Text(testMsg).font(.custom("Newsreader", size: 12)).foregroundStyle(Theme.muted)
            }
        }
        .padding(15)
        .background(Theme.paper)
        .clipShape(.rect(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.rule, lineWidth: 1))
    }

    private var topics: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("DEINE THEMEN").font(.system(size: 11, weight: .medium, design: .monospaced)).tracking(2).foregroundStyle(Theme.amberDeep)
            FlowLayout(spacing: 8) {
                ForEach(Category.allCases) { c in
                    let on = prefs.categories.contains(c.rawValue)
                    Button {
                        if on { prefs.categories.remove(c.rawValue) } else { prefs.categories.insert(c.rawValue) }
                    } label: {
                        Text("\(c.emoji) \(c.label)")
                            .font(.system(size: 13))
                            .foregroundStyle(on ? Theme.paper : Theme.inkSoft)
                            .padding(.horizontal, 13).padding(.vertical, 9)
                            .background(on ? Theme.ink : Theme.paper, in: .capsule)
                            .overlay(Capsule().stroke(Theme.rule, lineWidth: on ? 0 : 1))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    @ViewBuilder private var newsletter: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("NEWSLETTER").font(.system(size: 11, weight: .medium, design: .monospaced)).tracking(2).foregroundStyle(Theme.amberDeep)
            if subOk {
                Text(subMsg).font(.custom("Newsreader", size: 13)).foregroundStyle(Theme.inkSoft)
                    .padding(14).frame(maxWidth: .infinity, alignment: .leading)
                    .background(Theme.sage.opacity(0.12), in: .rect(cornerRadius: 14))
            } else {
                HStack(spacing: 8) {
                    TextField("Deine E-Mail", text: $email)
                        .textInputAutocapitalization(.never).keyboardType(.emailAddress)
                        .padding(.horizontal, 16).padding(.vertical, 11)
                        .background(Theme.paper, in: .capsule)
                        .overlay(Capsule().stroke(Theme.ruleStrong, lineWidth: 1))
                    Button(action: doSubscribe) {
                        Text(subBusy ? "…" : "Abo").font(.system(size: 14, weight: .medium)).foregroundStyle(Theme.paper)
                            .padding(.horizontal, 18).padding(.vertical, 11).background(Theme.amber, in: .capsule)
                    }.disabled(subBusy)
                }
                if !subMsg.isEmpty { Text(subMsg).font(.custom("Newsreader", size: 13)).foregroundStyle(Theme.inkSoft) }
            }
        }
    }

    private var shareButton: some View {
        ShareLink(item: URL(string: "https://nureine.de")!,
                  subject: Text("NurEine"),
                  message: Text("Eine gute Nachricht am Tag — ehrlicher Fortschritt, belegt.")) {
            Label("NurEine weiterempfehlen", systemImage: "square.and.arrow.up")
                .font(.system(size: 14, weight: .medium)).foregroundStyle(Theme.ink)
                .frame(maxWidth: .infinity).padding(13)
                .overlay(Capsule().stroke(Theme.ruleStrong, lineWidth: 1))
        }
    }

    private var linkList: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("ENTDECKEN").font(.system(size: 11, weight: .medium, design: .monospaced)).tracking(2).foregroundStyle(Theme.amberDeep)
            VStack(spacing: 0) {
                ForEach(links, id: \.0) { label, url in
                    Link(destination: URL(string: url)!) {
                        HStack {
                            Text(label).font(.system(size: 14)).foregroundStyle(Theme.inkSoft)
                            Spacer()
                            Image(systemName: "chevron.right").font(.system(size: 12)).foregroundStyle(Theme.faint)
                        }
                        .padding(14)
                    }
                    if label != links.last?.0 { Divider().overlay(Theme.rule) }
                }
            }
            .background(Theme.paper)
            .clipShape(.rect(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.rule, lineWidth: 1))
        }
    }

    private func doSubscribe() {
        let addr = email.trimmingCharacters(in: .whitespaces)
        guard !addr.isEmpty else { subMsg = "Bitte gib eine E-Mail-Adresse ein."; return }
        subBusy = true; subMsg = ""
        Task {
            let res = await API.subscribe(email: addr, categories: Array(prefs.categories), ref: nil)
            subOk = res.ok; subMsg = res.message
            if res.ok { prefs.email = addr }
            subBusy = false
        }
    }

    private func testNotification() {
        Task {
            let center = UNUserNotificationCenter.current()
            let settings = await center.notificationSettings()
            var granted = settings.authorizationStatus == .authorized
            if settings.authorizationStatus == .notDetermined {
                granted = (try? await center.requestAuthorization(options: [.alert, .sound, .badge])) ?? false
            }
            guard granted else { testMsg = "Benachrichtigungen sind in den iOS-Einstellungen deaktiviert."; return }
            let content = UNMutableNotificationContent()
            content.title = "Dein Lichtblick für heute"
            content.body = "Ein Dorf in Kenia hat gerade eine Million Bäume gepflanzt — und die Daten zeigen, es wirkt."
            content.sound = .default
            let req = UNNotificationRequest(identifier: UUID().uuidString, content: content,
                                            trigger: UNTimeIntervalNotificationTrigger(timeInterval: 4, repeats: false))
            try? await center.add(req)
            testMsg = "Sperr jetzt dein iPhone — die Benachrichtigung kommt in ein paar Sekunden."
        }
    }
}
