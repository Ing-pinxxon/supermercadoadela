/**
 * Qué sitio es este despliegue. El mismo código sirve para dos webs:
 *
 *  - `SITIO=tienda` — la tienda en línea (tienda-adela.vercel.app). Solo la
 *    tienda y la administración del catálogo. No tiene DATABASE_URL: la caja,
 *    los fiados y las tareas ni existen aquí, así que no los puede tocar.
 *  - `SITIO=app`    — la app de todos los días (supermercadoadela.vercel.app).
 *    La caja, los fiados y las tareas; lo de la tienda manda a la otra web.
 *  - sin `SITIO`    — todo junto, como en el computador para desarrollar.
 *
 * Es pura (sin nada de Node), así que sirve en el middleware y en las páginas.
 */
export type Sitio = "tienda" | "app" | "todo";

export function sitio(): Sitio {
  const v = process.env.SITIO;
  return v === "tienda" || v === "app" ? v : "todo";
}

/** La dirección de la tienda, para mandar allá desde la app. */
export function urlTienda(): string {
  return (process.env.TIENDA_URL ?? "https://tienda-adela.vercel.app").replace(/\/+$/, "");
}

/** Lo de la administración que trabaja con el catálogo (la API), no con la caja. */
export function esAdminTienda(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/catalogo") ||
    pathname.startsWith("/admin/tienda") ||
    pathname.startsWith("/admin/google")
  );
}
