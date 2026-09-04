import { DIAS } from "@/lib/fechas";
import {
  ETIQUETA_FRANJA,
  ORDEN_FRANJA,
  rutina,
  type TareaRutina,
} from "@/lib/tareas";
import { Tarjeta, Campo, Texto, Seleccion, Vacio } from "@/components/ui";
import { Boton } from "@/components/boton";
import { crearTarea, editarTarea, alternarActiva } from "../actions";

export const dynamic = "force-dynamic";

/** Las casillas de los días. Se usan igual al crear y al editar. */
function Dias({ marcados }: { marcados?: number[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {DIAS.map((dia, i) => (
        <label
          key={dia}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-superficie-2 px-3 py-2 text-sm ring-1 ring-borde transition active:scale-95 hover:bg-superficie-2"
        >
          <input
            type="checkbox"
            name="diaSemana"
            value={i + 1}
            defaultChecked={marcados?.includes(i + 1)}
            className="accent-marca-500"
          />
          {dia.slice(0, 3)}
        </label>
      ))}
    </div>
  );
}

/** Los campos de una tarea, precargados cuando se está editando. */
function Campos({ tarea }: { tarea?: TareaRutina }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Tarea">
          <Texto
            name="titulo"
            required
            defaultValue={tarea?.titulo}
            placeholder="Revisar vencimientos"
          />
        </Campo>
        <Campo etiqueta="Franja">
          <Seleccion name="franja" defaultValue={tarea?.franja ?? "MANANA"}>
            {ORDEN_FRANJA.map((f) => (
              <option key={f} value={f}>
                {ETIQUETA_FRANJA[f]}
              </option>
            ))}
          </Seleccion>
        </Campo>
      </div>
      <Campo etiqueta="Detalle">
        <Texto
          name="detalle"
          defaultValue={tarea?.detalle ?? ""}
          placeholder="Opcional"
        />
      </Campo>
      <Campo etiqueta="Días">
        <Dias marcados={tarea?.dias} />
      </Campo>
    </>
  );
}

function Tarea({ tarea }: { tarea: TareaRutina }) {
  return (
    <li className={`py-2.5 ${tarea.quitada ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium">{tarea.titulo}</div>
          {tarea.detalle && (
            <div className="text-xs text-tinta-suave">{tarea.detalle}</div>
          )}
          <div className="mt-1 flex flex-wrap gap-1">
            {tarea.quitada ? (
              <span className="text-xs text-tinta-suave">
                Quitada de la rutina; lo que ya se marcó no se borró.
              </span>
            ) : (
              DIAS.map((dia, i) => (
                <span
                  key={dia}
                  className={`rounded px-1.5 py-0.5 text-xs ${
                    tarea.dias.includes(i + 1)
                      ? "bg-crema-200/20 font-medium text-crema-200"
                      : "text-tinta-tenue"
                  }`}
                >
                  {dia.slice(0, 3)}
                </span>
              ))
            )}
          </div>
        </div>

        <form action={alternarActiva} className="shrink-0">
          <input type="hidden" name="grupoId" value={tarea.grupoId} />
          <Boton
            type="submit"
            variante="secundario"
            className="px-3"
            confirmar={
              tarea.quitada
                ? undefined
                : `¿Quitar "${tarea.titulo}" de la rutina?`
            }
          >
            {tarea.quitada ? "Volver a poner" : "Quitar"}
          </Boton>
        </form>
      </div>

      {/* El formulario se abre aquí mismo, sin salir de la lista. */}
      <details className="group mt-1">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-lg px-1 py-1 text-xs font-medium text-crema-200 transition hover:bg-crema-200/10">
          <span className="transition group-open:rotate-90">›</span>
          Editar
        </summary>
        <form
          action={editarTarea}
          className="mt-2 space-y-3 rounded-xl bg-superficie-2 p-3"
        >
          <input type="hidden" name="grupoId" value={tarea.grupoId} />
          <Campos tarea={tarea} />
          <Boton type="submit">Guardar cambios</Boton>
          <p className="text-xs text-tinta-suave">
            El cambio aplica a todos los días de esta tarea. Si le quitas un
            día en el que ya se había marcado algo, ese historial se conserva.
          </p>
        </form>
      </details>
    </li>
  );
}

export default async function Rutina() {
  const tareas = await rutina();
  const puestas = tareas.filter((t) => !t.quitada);
  const quitadas = tareas.filter((t) => t.quitada);

  return (
    <div className="escalonado space-y-5">
      <div>
        <h1 className="display text-2xl font-black">Rutina semanal</h1>
        <p className="text-sm text-tinta-suave">
          Lo que se define aquí aparece automáticamente cada semana en la lista
          del día.
        </p>
      </div>

      <Tarjeta titulo="Agregar tarea">
        <form action={crearTarea} className="space-y-3">
          <Campos />
          <Boton type="submit">Agregar a la rutina</Boton>
        </form>
      </Tarjeta>

      {ORDEN_FRANJA.map((franja) => {
        const deLaFranja = puestas.filter((t) => t.franja === franja);
        return (
          <Tarjeta key={franja} titulo={ETIQUETA_FRANJA[franja]}>
            {deLaFranja.length === 0 ? (
              <Vacio>Sin tareas en esta franja.</Vacio>
            ) : (
              <ul className="divide-y divide-borde">
                {deLaFranja.map((t) => (
                  <Tarea key={t.grupoId} tarea={t} />
                ))}
              </ul>
            )}
          </Tarjeta>
        );
      })}

      {quitadas.length > 0 && (
        <Tarjeta titulo="Quitadas">
          <ul className="divide-y divide-borde">
            {quitadas.map((t) => (
              <Tarea key={t.grupoId} tarea={t} />
            ))}
          </ul>
        </Tarjeta>
      )}
    </div>
  );
}
