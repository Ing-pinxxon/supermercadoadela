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
    color: "from-marca-500 to-marca-700",
  },
  {
    href: "/fiado",
    icono: "📒",
    titulo: "Fiados",
    texto: "Quién debe, cuánto, y los abonos cuando pagan.",
    color: "from-acento-500 to-acento-700",
  },
  {
    href: "/tareas",
    icono: "✅",
    titulo: "Tareas del día",
    texto: "La rutina de lunes a domingo, para ir marcando.",
    color: "from-gray-700 to-gray-900",
  },
];

export default async function Inicio() {
  const fecha = hoy();
  const admin = await esAdmin();

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Supermercado Adela</h1>
      <p className="mt-1 text-sm text-gray-500">{etiquetaLarga(fecha)}</p>

      <div className="escalonado mt-8 grid gap-3">
        {ATAJOS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 transition hover:shadow-md active:scale-[.99]"
          >
            <span
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${a.color} text-xl shadow-sm`}
            >
              {a.icono}
            </span>
            <span className="min-w-0">
              <span className="block font-semibold">{a.titulo}</span>
              <span className="mt-0.5 block text-sm text-gray-500">
                {a.texto}
              </span>
            </span>
          </Link>
        ))}
      </div>

      {admin && (
        <p className="mt-8 text-center text-xs text-gray-400">
          <Link href="/instalar" className="hover:underline">
            Estado de la base de datos
          </Link>
        </p>
      )}
    </main>
  );
}
