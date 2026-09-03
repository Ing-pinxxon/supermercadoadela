import { NextResponse, type NextRequest } from "next/server";

/**
 * Puerta de entrada: si hay APP_PIN configurado, nadie ve la app sin la clave.
 * Es una sola clave compartida del negocio, no usuarios individuales. Suficiente
 * para que la URL no quede abierta a internet, pero no es un sistema de cuentas.
 */
export function middleware(peticion: NextRequest) {
  const pin = process.env.APP_PIN;
  if (!pin) return NextResponse.next();

  const { pathname } = peticion.nextUrl;
  if (pathname.startsWith("/entrar")) return NextResponse.next();

  if (peticion.cookies.get("adela_pin")?.value === pin) {
    return NextResponse.next();
  }

  const destino = peticion.nextUrl.clone();
  destino.pathname = "/entrar";
  destino.search = "";
  return NextResponse.redirect(destino);
}

export const config = {
  // Deja pasar los archivos estáticos de Next.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
