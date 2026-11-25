import Link from "next/link";
import { hoy, etiquetaLarga } from "@/lib/fechas";
import { esAdmin } from "@/lib/sesion";
import { sitio, urlTienda } from "@/lib/sitio";

export const dynamic = "force-dynamic";

const TODOS = [
  {
    href: "/caja",
    icono: "🧾",
    titulo: "Caja y proveedores",
    texto: "Registro del día, pagos a proveedores y gastos.",
    color: "bg-crema-200",
  },
  {
    href: "/fiado",
    icono: "📒",
    titulo: "Fiados",
    texto: "Quién debe, cuánto, y los abonos cuando pagan.",
    color: "bg-crema-200",
  },
  {
    href: "/admin/catalogo",
    icono: "🏷️",
    titulo: "Catálogo de la tienda",
    texto: "Precios, stock, fotos y combos de la tienda en línea.",
    color: "bg-crema-200",
  },
  {
    href: "/tareas",
    icono: "✅",
    titulo: "Tareas del día",
    texto: "La rutina de lunes a domingo, para ir marcando.",
    color: "bg-crema-200",
  },
];

const DATOS_TIENDA = {
  href: "/admin/tienda",
  icono: "🏪",
  titulo: "Datos de la tienda",
  texto: "WhatsApp, dirección, horario y el anuncio de temporada.",
  color: "bg-crema-200",
};

/**
 * Los atajos según la web: en la de la tienda solo lo del catálogo; en la app
 * de todos los días, el catálogo lleva a la web de la tienda.
 */
function atajos() {
  const modo = sitio();
  if (modo === "tienda") return [TODOS[2], DATOS_TIENDA];
  if (modo === "app")
    return TODOS.map((a) => (a.href === "/admin/catalogo" ? { ...a, href: `${urlTienda()}/admin/catalogo` } : a));
  return TODOS;
}

export const metadata = { title: "Administración" };

export default async function InicioAdmin() {
  const fecha = hoy();
  const admin = await esAdmin();
  const modo = sitio();
  const ATAJOS = atajos();

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <h1 className="display text-4xl font-black">Supermercado Adela</h1>
      <p className="mt-1 text-sm text-tinta-suave">{etiquetaLarga(fecha)}</p>

      <div className="escalonado mt-8 grid gap-3">
        {ATAJOS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group flex items-center gap-4 rounded-2xl bg-superficie p-4 shadow-sm ring-1 ring-borde transition hover:ring-borde-fuerte active:scale-[.99]"
          >
            <span
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${a.color} text-xl shadow-md shadow-verde-950/30`}
            >
              {a.icono}
            </span>
            <span className="min-w-0">
              <span className="block font-semibold">{a.titulo}</span>
              <span className="mt-0.5 block text-sm text-tinta-suave">
                {a.texto}
              </span>
            </span>
          </Link>
        ))}
      </div>

      {admin && modo !== "tienda" && (
        <Link
          href="/caja/tablero"
          className="mt-3 flex items-center gap-4 rounded-2xl bg-superficie p-4 shadow-sm ring-1 ring-borde transition hover:ring-borde-fuerte active:scale-[.99]"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-crema-200 text-xl shadow-md shadow-verde-950/30">
            📊
          </span>
          <span className="min-w-0">
            <span className="block font-semibold">Tablero</span>
            <span className="mt-0.5 block text-sm text-tinta-suave">
              Cómo va el negocio desde que empezaste a usar la app.
            </span>
          </span>
        </Link>
      )}

      <p className="mt-8 flex justify-center gap-4 text-center text-xs text-tinta-tenue">
        <Link href={modo === "app" ? urlTienda() : "/"} className="hover:underline">
          Ver la tienda en línea →
        </Link>
        {admin && modo !== "tienda" && (
          <Link href="/instalar" className="hover:underline">
            Estado de la base de datos
          </Link>
        )}
      </p>
    </main>
  );
}
