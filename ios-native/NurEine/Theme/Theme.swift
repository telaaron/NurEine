import SwiftUI

/// NurEine design tokens, mirroring src/app.css (light) + the warm dark layer.
/// Colors adapt to light/dark automatically via UITraitCollection.
enum Theme {
    // MARK: Surfaces
    static let canvas = dynamic(light: 0xF5F1EA, dark: 0x181512)
    static let canvasSoft = dynamic(light: 0xEFE9DF, dark: 0x201C18)
    static let paper = dynamic(light: 0xFAF6EE, dark: 0x221E1A)

    // MARK: Ink
    static let ink = dynamic(light: 0x1A1815, dark: 0xF0E9DF)
    static let inkSoft = dynamic(light: 0x3A342C, dark: 0xC4BAAC)
    static let muted = dynamic(light: 0x6B6359, dark: 0x8A7F70)
    static let faint = dynamic(light: 0x9A9087, dark: 0x6B6359)

    // MARK: Rules
    static let rule = dynamicA(light: (0x1A1815, 0.12), dark: (0xF0E9DF, 0.12))
    static let ruleStrong = dynamicA(light: (0x1A1815, 0.22), dark: (0xF0E9DF, 0.22))

    // MARK: Brand accents
    static let amber = dynamic(light: 0xC87340, dark: 0xE9B58E)
    static let amberDeep = dynamic(light: 0x9C5527, dark: 0xC87340)
    static let sage = dynamic(light: 0x5A7A52, dark: 0x7A9A72)
    static let rose = dynamic(light: 0xB87A7A, dark: 0xC99595)
    static let sky = dynamic(light: 0x6C8AA8, dark: 0x8AA6C2)

    // MARK: Builders
    static func dynamic(light: Int, dark: Int) -> Color {
        Color(UIColor { tc in
            tc.userInterfaceStyle == .dark ? UIColor(hex: dark) : UIColor(hex: light)
        })
    }
    static func dynamicA(light: (Int, Double), dark: (Int, Double)) -> Color {
        Color(UIColor { tc in
            let v = tc.userInterfaceStyle == .dark ? dark : light
            return UIColor(hex: v.0, alpha: v.1)
        })
    }
}

extension UIColor {
    convenience init(hex: Int, alpha: Double = 1) {
        self.init(
            red: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255,
            alpha: alpha
        )
    }
}
