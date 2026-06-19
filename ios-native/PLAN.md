# NurEine — Native SwiftUI App (Plan)

Replaces the Capacitor app. Backend (Vercel/Supabase/cron) is untouched; this is
purely a native iOS client over the existing `https://nureine.de/api`.

## Why native
Real Liquid Glass (`.glassEffect()`, iOS 26+), native navigation/haptics/scroll,
and none of the webview battles (UIScene, CORS, `__data.json`, safe-areas).
The app is a thin reader, so the only "doubled" code is a small model + API
client (~300 lines) — the heavy backend logic stays web-only.

## Target
- iOS 26+ (Liquid Glass). Swift 6, SwiftUI.
- Bundle id `de.nureine.app` (same as Capacitor — reuses the Apple app record).

## Screens (mirror the approved design)
1. **Heute** (tab) — date header, hero story card (image, impact chip, dek),
   "Diese Woche" list. Pull-to-refresh.
2. **Archiv** (tab) — category filter chips + sort (Neueste/Wirkung), list.
3. **Karte** (tab) — MapKit (native!) with story annotations + bottom sheet.
4. **Mehr** (tab) — topics, push toggle, newsletter subscribe, share, links.
5. **Story-Detail** (pushed) — hero, Wirkungsindex bars, audio (AVPlayer),
   beat trust line, native share sheet.
6. **Onboarding** (sheet, first launch) — 3 pages, push permission.

## Architecture
```
ios-native/NurEine/
  NurEineApp.swift            app entry (@main, ScenePhase)
  Theme/
    Colors.swift              warm canvas + dark, amber accent (asset catalog)
    Typography.swift          Space Grotesk / Newsreader / Inter (bundled fonts)
  Models/
    Story.swift               Codable, mirrors /api/stories JSON
  Services/
    API.swift                 URLSession client → /api/*
    StoryStore.swift          @Observable, fetch-once + cache (mirrors store.svelte)
    ImageURL.swift            route Supabase imgs through /img proxy (WebP)
    Prefs.swift               UserDefaults (topics, onboarded, pushWanted)
    Push.swift                UNUserNotificationCenter (local test now; APNs later)
  Views/
    RootTabView.swift         TabView with .glassEffect tab bar
    TodayView.swift
    ArchiveView.swift
    MapView.swift
    MoreView.swift
    StoryDetailView.swift
    OnboardingView.swift
    Components/
      StoryCard.swift, ImpactBars.swift, AsyncStoryImage.swift, Chip.swift
```

## Liquid Glass usage
- Tab bar: system TabView already adopts Liquid Glass on iOS 26.
- Floating impact chip, sheet, headers: `.glassEffect(.regular, in: .capsule)`.
- Respect reduce-transparency.

## Milestones
- N0: Xcode project (GUI: File→New→App, SwiftUI, iOS 26) + theme/fonts/models.
- N1: API + StoryStore + Heute + Detail (read path, real data).
- N2: Archiv + Karte (MapKit) + Mehr.
- N3: Onboarding + local test notification + app icon.
- N4: APNs (needs Apple Developer account) + TestFlight.

## What I need from you
One-time: create the Xcode project via the GUI (I can't drive the GUI). Exact
steps will be given. Then I write every Swift file into ios-native/NurEine/.
