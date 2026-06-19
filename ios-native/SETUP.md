# Xcode project setup (one-time, ~1 min)

I write all the Swift code; you create the empty project shell once via Xcode's
wizard (it produces a correct modern iOS 26 project that I can't generate
reliably from the command line).

## Steps

1. Open **Xcode** → **File → New → Project…**
2. Choose **iOS → App** → Next.
3. Fill in:
   - **Product Name:** `NurEine`
   - **Team:** your Apple ID (or none for now)
   - **Organization Identifier:** `de` → so the **Bundle Identifier** reads
     `de.NurEine` … actually set Organization Identifier to `de` and Product
     Name `nureine` won't match. Simplest: after creating, go to the target's
     **General → Identity → Bundle Identifier** and set it to **`de.nureine.app`**
     (same as the Capacitor app, so it reuses the App Store record later).
   - **Interface:** SwiftUI
   - **Language:** Swift
   - **Storage:** None
   - Uncheck tests if asked (optional).
4. **Save location:** choose the repo's **`ios-native/`** folder. Xcode will make
   `ios-native/NurEine/NurEine.xcodeproj` and a `NurEine/` source folder.
5. It opens with a default `NurEineApp.swift` + `ContentView.swift`.

## Then tell me "Projekt erstellt"

I will:
- replace the default files with the real ones (already written in
  `ios-native/NurEine/…`),
- add them to the project,
- set Deployment Target to iOS 26, add the app icon + fonts,
- and we build + run.

If the wizard puts files in a slightly different place, just tell me the path of
the generated `.xcodeproj` and I adapt.
