import SwiftUI

/// iPad layout helpers. The core fix for "everything stretched full-width":
/// content gets a centered max-width column instead of running edge to edge.
extension View {
    /// Constrain to a comfortable reading/content width and center it. On iPhone
    /// (compact) this is effectively the full width; on iPad it stops sprawl.
    func contentWidth(_ max: CGFloat = 720) -> some View {
        frame(maxWidth: max).frame(maxWidth: .infinity)
    }
}

/// Adaptive column count for grids: 1 on iPhone, 2–3 on iPad by width.
enum Grid {
    static func columns(for width: CGFloat) -> Int {
        switch width {
        case ..<700: 1
        case ..<1100: 2
        default: 3
        }
    }
}
