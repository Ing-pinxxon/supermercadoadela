import { consultar } from "@/lib/db";
import type { TareaPlantilla } from "@/lib/tipos";
import { DIAS } from "@/lib/fechas";
import { ETIQUETA_FRANJA, ORDEN_FRANJA } from "@/lib/tareas";
import { Tarjeta, Campo, Texto, Seleccion, Vacio } from "@/components/ui";
import { Boton } from "@/components/boton";
import { crearTarea, alternarActiva } from "../actions";

export const dynamic = "force-dynamic";

export default async function Rutina() {
  const tareas = await consultar<TareaPlantilla>(
    `SELECT * FROM tarea_plantilla
      ORDER BY dia_semana ASC,
               CASE franja WHEN 'MANANA' THEN 1 WHEN 'TARDE' THEN 2 ELSE 3 END,
               orden ASC, titulo ASC`,
  );

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Rutina semanal</h1>
      <p className="-mt-3 text-sm text-gray-500">
        Lo que se define aquí aparece automáticamente cada semana en la lista
        del día.
      </p>

      <Tarjeta titulo="Agregar tarea">
        <form action={crearTarea} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo etiqueta="Tarea">
              <Texto name="titulo" required placeholder="Revisar vencimientos" />
            </Campo>
            <Campo etiqueta="Franja">
              <Seleccion name="franja" defaultValue="MANANA">
                {ORDEN_FRANJA.map((f) => (
                  <option key={f} value={f}>
                    {ETIQUETA_FRANJA[f]}
                  </option>
                ))}
              </Seleccion>
            </Campo>
          </div>
          <Campo etiqueta="Detalle">
            <Texto name="detalle" placeholder="Opcional" />
          </Campo>
          <Campo etiqueta="Días">
            <div className="flex flex-wrap gap-2">
              {DIAS.map((dia, i) => (
                <label
                  key={dia}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2 text-sm ring-1 ring-gray-200"
                >
                  <input
                    type="checkbox"
                    name="diaSemana"
                    value={i + 1}
                    className="accent-marca-500"
                  />
                  {dia.slice(0, 3)}
                </label>
              ))}
            </div>
          </Campo>
          <Boton type="submit">Agregar a la rutina</Boton>
        </form>
      </Tarjeta>

      {DIAS.map((nombreDia, i) => {
        const delDia = tareas.filter((t) => t.dia_semana === i + 1);
        return (
          <Tarjeta key={nombreDia} titulo={nombreDia}>
            {delDia.length === 0 ? (
              <Vacio>Sin tareas.</Vacio>
            ) : (
              <ul className="divide-y divide-gray-100">
                {delDia.map((t) => (
                  <li
                    key={t.id}
                    className={`flex items-center justify-between gap-3 py-2.5 ${
                      t.activa ? "" : "opacity-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{t.titulo}</div>
                      <div className="text-xs text-gray-500">
                        {ETIQUETA_FRANJA[t.franja]}
                        {t.detalle ? ` · ${t.detalle}` : ""}
                      </div>
                    </div>
                    <form action={alternarActiva}>
                      <input type="hidden" name="id" value={t.id} />
                      <Boton
                        type="submit"
                        variante="secundario"
                        className="px-3 py-1.5"
                      >
                        {t.activa ? "Quitar" : "Volver a poner"}
                      </Boton>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
        );
      })}
    </div>
  );
}
