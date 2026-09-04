import { NextResponse, type NextRequest } from "next/server";
import { COOKIE } from "@/lib/sesion";

/** Cerrar sesión: borra la cookie y devuelve a la pantalla de la clave. */
export async function GET(peticion: NextRequest) {
  const respuesta = NextResponse.redirect(new URL("/entrar", peticion.url));
  respuesta.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return respuesta;
}
