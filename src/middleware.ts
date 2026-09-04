import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, puedeEntrar, rolDe } from "@/lib/sesion";

/** Lo que solo ve el administrador: la plata de la semana y el histórico. */
const SOLO_ADMIN = ["/caja/semana", "/caja/historico", "/instalar"];

/**
 * Puerta de entrada: si hay APP_PIN configurado, nadie ve la app sin clave, y
 * las pantallas de plata piden además la clave de administrador.
 *
 * Son claves compartidas del negocio, no cuentas por persona. Suficiente para
 * que la URL no quede abierta a internet.
 */
export function middleware(peticion: NextRequest) {
  const { pathname } = peticion.nextUrl;
  if (pathname.startsWith("/entrar") || pathname.startsWith("/salir")) {
    return NextResponse.next();
  }

  const cookie = peticion.cookies.get(COOKIE)?.value;

  if (!puedeEntrar(cookie)) {
    const destino = peticion.nextUrl.clone();
    destino.pathname = "/entrar";
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  const rol = rolDe(cookie);
  if (rol === "usuario" && SOLO_ADMIN.some((r) => pathname.startsWith(r))) {
    // No existe para él: se lo devuelve a lo suyo, que es el día de hoy.
    const destino = peticion.nextUrl.clone();
    destino.pathname = "/caja";
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  return NextResponse.next();
}

export const config = {
  // Deja pasar los archivos estáticos de Next.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
