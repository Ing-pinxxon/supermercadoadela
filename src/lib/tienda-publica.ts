/**
 * Lo que comparten las páginas de la tienda en línea.
 */
import { catalogoConfigurado, ErrorCatalogo, type TiendaVista } from "@/lib/api-catalogo";

/**
 * Trae algo de la API para una página pública.
 *
 * Si la API no está configurada todavía, o si se está construyendo la app y la
 * API no contesta, devuelve null y la página muestra «estamos preparando la
 * tienda». En cualquier otro caso el error sigue: así Next deja la última
 * versión buena guardada en vez de reemplazarla por un aviso.
 */
export async function leerPublico<T>(traer: () => Promise<T>): Promise<T | null> {
  try {
    return await traer();
  } catch (e) {
    const construyendo = process.env.NEXT_PHASE === "phase-production-build";
    if (e instanceof ErrorCatalogo && (!catalogoConfigurado() || construyendo)) return null;
    throw e;
  }
}

/** «573147167595» → «314 716 7595». */
export function telefonoLegible(digitos: string) {
  const local = digitos.startsWith("57") && digitos.length === 12 ? digitos.slice(2) : digitos;
  return local.length === 10 ? `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}` : digitos;
}

export function enlaceWhatsApp(t: Pick<TiendaVista, "whatsapp">, texto: string) {
  return `https://wa.me/${t.whatsapp}?text=${encodeURIComponent(texto)}`;
}

export function direccionCompleta(t: Pick<TiendaVista, "direccion" | "barrio" | "ciudad">) {
  return [t.direccion, t.barrio, t.ciudad].filter(Boolean).join(", ");
}

/** El enlace de «Cómo llegar»: el de Maps si lo pusieron, si no, una búsqueda. */
export function enlaceMapa(t: TiendaVista) {
  return (
    t.mapsUrl ??
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${t.nombre}, ${direccionCompleta(t)}`)}`
  );
}

export const LEYENDAS_LICOR = [
  "El exceso de alcohol es perjudicial para la salud. Ley 30 de 1986.",
  "Prohíbase el expendio de bebidas embriagantes a menores de edad. Ley 124 de 1994.",
];
