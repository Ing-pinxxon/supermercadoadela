import { calle } from "@/lib/calle";

/**
 * La calle de diciembre de la portada, como imagen. Se arma al construir y el
 * navegador la guarda: la página no carga con los 180 KB del dibujo adentro.
 */
export const dynamic = "force-static";

export function GET() {
  return new Response(calle(), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
