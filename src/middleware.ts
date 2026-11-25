import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, puedeEntrar, rolDe, rutaParaPedirAdmin } from "@/lib/sesion";
import { esPublica } from "@/lib/rutas";
import { esAdminTienda, sitio, urlTienda } from "@/lib/sitio";

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
  const modo = sitio();

  // La web de la tienda solo tiene la tienda y la administración del catálogo:
  // la caja, los fiados y las tareas no existen allá (ni tiene la base para eso).
  if (
    modo === "tienda" &&
    !esPublica(pathname) &&
    !esAdminTienda(pathname) &&
    !pathname.startsWith("/entrar") &&
    !pathname.startsWith("/salir")
  ) {
    return new NextResponse("No existe", { status: 404, headers: { "X-Robots-Tag": "noindex, nofollow" } });
  }

  // La app de todos los días manda lo de la tienda a la otra web.
  if (modo === "app") {
    const otra = (ruta: string) =>
      NextResponse.redirect(new URL(ruta + peticion.nextUrl.search, `${urlTienda()}/`), 307);
    if (pathname === "/") return NextResponse.redirect(new URL("/admin", peticion.url), 307);
    if (pathname.startsWith("/c/") || pathname.startsWith("/p/")) return otra(pathname);
    if (pathname.startsWith("/api/carrito")) return new NextResponse("No existe", { status: 404 });
    if (esAdminTienda(pathname) && pathname !== "/admin") return otra(pathname);
  }

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
