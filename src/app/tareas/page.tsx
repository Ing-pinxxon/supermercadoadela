import { tareasDelDia } from "@/lib/tareas";
import {
  esFechaValida,
  etiquetaLarga,
  hoy,
  sumarDias,
} from "@/lib/fechas";
import { Tarjeta } from "@/components/ui";
import { Flechas } from "@/components/nav";
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
    <div className="escalonado space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="display text-2xl font-black">{etiquetaLarga(fecha)}</h1>
          <p className="text-sm text-tinta-suave">
            {hechas} de {tareas.length} hechas
          </p>
        </div>
        <Flechas
          atras={`/tareas?dia=${sumarDias(fecha, -1)}`}
          hoy={fecha === hoy() ? undefined : "/tareas"}
          adelante={`/tareas?dia=${sumarDias(fecha, 1)}`}
        />
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-verde-900/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-crema-300 to-crema-100 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <Tarjeta>
        <Checklist fecha={fecha} tareas={tareas} />
      </Tarjeta>
    </div>
  );
}
