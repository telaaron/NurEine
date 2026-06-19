import Foundation

/// Build a cacheable image URL. Supabase serves story images as big PNGs with
/// `no-cache`; the production /img proxy returns resized WebP with a 1-year
/// immutable cache. Route Supabase URLs through it; pass others through.
enum ImageURL {
    static func proxied(_ src: String?, width: Int = 900) -> URL? {
        guard let src, src.hasPrefix("http") else { return nil }
        if src.contains("/img?") || !src.contains("supabase.co") {
            return URL(string: src)
        }
        let encoded = src.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? src
        return URL(string: "\(API.base)/img?url=\(encoded)&w=\(width)")
    }
}
