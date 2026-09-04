import Link from "next/link";
import { hoy, etiquetaLarga } from "@/lib/fechas";
import { esAdmin } from "@/lib/sesion";

export const dynamic = "force-dynamic";

const ATAJOS = [
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
    href: "/tareas",
    icono: "✅",
    titulo: "Tareas del día",
    texto: "La rutina de lunes a domingo, para ir marcando.",
    color: "bg-crema-200",
  },
];

export default async function Inicio() {
  const fecha = hoy();
  const admin = await esAdmin();

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

      {admin && (
        <p className="mt-8 text-center text-xs text-tinta-tenue">
          <Link href="/instalar" className="hover:underline">
            Estado de la base de datos
          </Link>
        </p>
      )}
    </main>
  );
}
