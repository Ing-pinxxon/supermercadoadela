import Link from "next/link";
import { hoy, etiquetaLarga } from "@/lib/fechas";

export default function Inicio() {
  const fecha = hoy();

  return (
    <main className="mx-auto max-w-md px-5 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Supermercado Adela</h1>
      <p className="mt-1 text-sm text-gray-500">{etiquetaLarga(fecha)}</p>

      <div className="mt-8 grid gap-4">
        <Link
          href="/caja"
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition hover:ring-marca-500"
        >
          <div className="text-lg font-semibold">Caja y proveedores</div>
          <p className="mt-1 text-sm text-gray-500">
            Registro del día, pagos a proveedores, gastos y cuadre semanal.
          </p>
        </Link>

        <Link
          href="/tareas"
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition hover:ring-marca-500"
        >
          <div className="text-lg font-semibold">Tareas del día</div>
          <p className="mt-1 text-sm text-gray-500">
            La rutina de lunes a domingo, para ir marcando lo que ya se hizo.
          </p>
        </Link>
      </div>

      <p className="mt-8 text-center text-xs text-gray-400">
        <Link href="/instalar" className="hover:underline">
          Estado de la base de datos
        </Link>
      </p>
    </main>
  );
}
