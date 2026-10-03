import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, puedeEntrar, rolDe, rutaParaPedirAdmin } from "@/lib/sesion";
import { esPublica } from "@/lib/rutas";

/** Lo que solo ve el administrador: la plata de la semana y el histórico. */
const SOLO_ADMIN = [
  "/caja/semana",
  "/caja/tablero",
  "/caja/historico",
  "/instalar",
  "/admin/tienda",
  "/admin/google",
];

/**
 * Puerta de entrada: la tienda queda abierta; la administración pide clave, y
 * las pantallas de plata piden además la de administrador.
 *
 * Son claves compartidas del negocio, no cuentas por persona.
 */
export function middleware(peticion: NextRequest) {
  const { pathname } = peticion.nextUrl;
  const cookie = peticion.cookies.get(COOKIE)?.value;

  if (esPublica(pathname)) {
    // Una acción del servidor se puede invocar con un POST a cualquier ruta,
    // también a una pública. La tienda no usa ninguna, así que en una página
    // pública solo puede ser alguien de afuera tratando de llamar las de la
    // administración: sin sesión, no.
    if (peticion.headers.has("next-action") && !puedeEntrar(cookie)) {
      return new NextResponse("Sin permiso", { status: 401 });
    }
    return NextResponse.next();
  }

  // De aquí para abajo es la administración: Google no la indexa.
  const noIndexar = (r: NextResponse) => {
    r.headers.set("X-Robots-Tag", "noindex, nofollow");
    return r;
  };

  if (pathname.startsWith("/entrar") || pathname.startsWith("/salir")) {
    return noIndexar(NextResponse.next());
  }

  if (!puedeEntrar(cookie)) {
    const destino = peticion.nextUrl.clone();
    destino.pathname = "/entrar";
    destino.search = "";
    // Quien abre directo una pantalla interna vuelve a ella después de entrar.
    if (pathname !== "/admin") destino.searchParams.set("volver", pathname + peticion.nextUrl.search);
    return noIndexar(NextResponse.redirect(destino));
  }

  const rol = rolDe(cookie);
  if (rol === "usuario" && SOLO_ADMIN.some((r) => pathname.startsWith(r))) {
    // Se le pide la clave de administrador, y de ahí vuelve a donde iba. No se
    // lo manda a otra pantalla: si la base está mal, esa también fallaría.
    const destino = new URL(
      rutaParaPedirAdmin(pathname + peticion.nextUrl.search),
      peticion.url,
    );
    return noIndexar(NextResponse.redirect(destino));
  }

  return noIndexar(NextResponse.next());
}

export const config = {
  // Deja pasar los archivos estáticos de Next.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
