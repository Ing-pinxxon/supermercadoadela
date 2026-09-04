import Link from "next/link";
import { avanceSemana } from "@/lib/tareas";
import {
  DIAS,
  esFechaValida,
  etiquetaCorta,
  hoy,
  lunesDe,
  sumarDias,
} from "@/lib/fechas";
import { Tarjeta } from "@/components/ui";
import { Flechas } from "@/components/nav";

export const dynamic = "force-dynamic";

export default async function SemanaTareas({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>;
}) {
  const { semana } = await searchParams;
  const referencia = esFechaValida(semana) ? semana : hoy();
  const lunes = lunesDe(referencia);

  const { dias, detalle, total, hechas } = await avanceSemana(lunes);
  const hoyStr = hoy();

  return (
    <div className="escalonado space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="display text-2xl font-black">Semana</h1>
          <p className="text-sm text-tinta-suave">
            {etiquetaCorta(lunes)} — {etiquetaCorta(sumarDias(lunes, 6))} ·{" "}
            {hechas}/{total} tareas
          </p>
        </div>
        <Flechas
          atras={`/tareas/semana?semana=${sumarDias(lunes, -7)}`}
          hoy="/tareas/semana"
          adelante={`/tareas/semana?semana=${sumarDias(lunes, 7)}`}
        />
      </div>

      <div className="grid gap-3">
        {dias.map((fecha, i) => {
          const d = detalle[i];
          const pct = d.total > 0 ? Math.round((d.hechas / d.total) * 100) : 0;
          const completo = d.total > 0 && d.hechas === d.total;

          return (
            <Link
              key={fecha}
              href={`/tareas?dia=${fecha}`}
              className={`block rounded-2xl bg-superficie p-4 shadow-sm ring-1 transition hover:ring-crema-200 ${
                fecha === hoyStr ? "ring-2 ring-crema-200" : "ring-borde"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">
                  {DIAS[i]}{" "}
                  <span className="font-normal text-tinta-tenue">
                    {etiquetaCorta(fecha).split(" ").slice(1).join(" ")}
                  </span>
                </div>
                <span
                  className={`text-sm tabular ${
                    completo ? "text-crema-200" : "text-tinta-suave"
                  }`}
                >
                  {d.hechas}/{d.total}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-superficie-2">
                <div
                  className="h-full rounded-full bg-crema-200"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
