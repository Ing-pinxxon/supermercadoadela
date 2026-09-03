import Link from "next/link";
import { tareasDelDia } from "@/lib/tareas";
import {
  esFechaValida,
  etiquetaLarga,
  hoy,
  sumarDias,
} from "@/lib/fechas";
import { Tarjeta } from "@/components/ui";
import { Checklist } from "@/components/checklist";

export const dynamic = "force-dynamic";

export default async function TareasHoy({
  searchParams,
}: {
  searchParams: Promise<{ dia?: string }>;
}) {
  const { dia } = await searchParams;
  const fecha = esFechaValida(dia) ? dia : hoy();
  const tareas = await tareasDelDia(fecha);

  const hechas = tareas.filter((t) => t.hecha).length;
  const pct = tareas.length > 0 ? Math.round((hechas / tareas.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">{etiquetaLarga(fecha)}</h1>
          <p className="text-sm text-gray-500">
            {hechas} de {tareas.length} hechas
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link
            href={`/tareas?dia=${sumarDias(fecha, -1)}`}
            className="rounded-lg bg-white px-3 py-2 ring-1 ring-gray-300"
          >
            ←
          </Link>
          <Link
            href="/tareas"
            className="rounded-lg bg-white px-3 py-2 ring-1 ring-gray-300"
          >
            Hoy
          </Link>
          <Link
            href={`/tareas?dia=${sumarDias(fecha, 1)}`}
            className="rounded-lg bg-white px-3 py-2 ring-1 ring-gray-300"
          >
            →
          </Link>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-marca-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <Tarjeta>
        <Checklist fecha={fecha} tareas={tareas} />
      </Tarjeta>
    </div>
  );
}
