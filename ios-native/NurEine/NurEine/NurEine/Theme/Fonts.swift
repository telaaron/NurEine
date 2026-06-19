import SwiftUI
import CoreText

/// Bundled brand fonts (variable TTFs), registered at runtime — no Info.plist
/// entry needed. Space Grotesk = display headlines, Newsreader = editorial serif.
/// System (SF) covers the sans UI text, which already looks native.
enum Fonts {
    static func register() {
        for name in ["SpaceGrotesk", "Newsreader", "Newsreader-Italic"] {
            guard let url = Bundle.main.url(forResource: name, withExtension: "ttf") else { continue }
            CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
        }
    }
}

extension Font {
    /// Display headline — Space Grotesk. Variable font, weight applied via modifier.
    static func display(_ size: CGFloat, weight: Font.Weight = .semibold) -> Font {
        .custom("Space Grotesk", size: size).weight(weight)
    }
    /// Editorial serif — Newsreader.
    static func serif(_ size: CGFloat, italic: Bool = false) -> Font {
        let f = Font.custom("Newsreader", size: size)
        return italic ? f.italic() : f
    }
}
