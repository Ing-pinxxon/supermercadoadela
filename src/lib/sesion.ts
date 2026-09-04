/**
 * Quién está usando la app.
 *
 * Son dos claves compartidas del negocio, no cuentas por persona:
 *
 *  - `APP_PIN`       — la de la tienda. Registra, fía, marca tareas.
 *  - `APP_PIN_ADMIN` — la del administrador. Además ve la plata de la semana
 *                      y el histórico.
 *
 * La cookie guarda la clave con la que se entró (httpOnly, un mes), así que el
 * rol sale de comparar contra las dos variables: quien solo conoce la clave de
 * la tienda no puede fabricarse una sesión de administrador. La comparación es
 * de tiempo constante para no filtrar la clave carácter por carácter.
 *
 * Si no hay `APP_PIN`, la app queda abierta y todo el mundo es administrador:
 * es el modo de desarrollo local, y así `npm run dev` sigue siendo usable.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const COOKIE = "adela_pin";

export type Rol = "admin" | "usuario" | "abierto";

/** Compara sin delatar en cuántos caracteres coincidió. */
function igual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) {
    diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diferencia === 0;
}

/**
 * Rol a partir del valor de la cookie. Es pura y no usa nada de Node, así que
 * sirve igual en el middleware (que corre en el edge) y en las páginas.
 */
export function rolDe(cookie: string | undefined): Rol {
  const tienda = process.env.APP_PIN;
  const admin = process.env.APP_PIN_ADMIN;

  if (!tienda) return "abierto";
  if (!cookie) return "usuario";
  if (admin && igual(cookie, admin)) return "admin";
  if (igual(cookie, tienda)) return "usuario";
  return "usuario";
}

/** True si la cookie sirve para entrar (cualquiera de las dos claves). */
export function puedeEntrar(cookie: string | undefined): boolean {
  const tienda = process.env.APP_PIN;
  if (!tienda) return true;
  if (!cookie) return false;
  const admin = process.env.APP_PIN_ADMIN;
  return igual(cookie, tienda) || (Boolean(admin) && igual(cookie, admin!));
}

export async function rolActual(): Promise<Rol> {
  const galletas = await cookies();
  return rolDe(galletas.get(COOKIE)?.value);
}

/** Los números de la semana y el histórico son solo del administrador. */
export async function esAdmin(): Promise<boolean> {
  const rol = await rolActual();
  return rol === "admin" || rol === "abierto";
}

/**
 * Para las páginas y acciones de administrador. El middleware ya bloquea la
 * navegación; esto cubre lo que el middleware no ve (las server actions) y
 * deja la regla escrita al lado de lo que protege.
 */
export async function exigirAdmin(): Promise<void> {
  if (!(await esAdmin())) redirect("/caja");
}
