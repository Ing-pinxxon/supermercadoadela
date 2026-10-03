/**
 * La tienda en línea: lo que ve cualquier cliente sin clave y lo que lee
 * Google. Todo lo demás es la administración y pide la clave como siempre.
 */
export function esPublica(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/c/") ||
    pathname.startsWith("/p/") ||
    pathname.startsWith("/api/carrito") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.webmanifest" ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon") ||
    pathname.startsWith("/opengraph-image")
  );
}
