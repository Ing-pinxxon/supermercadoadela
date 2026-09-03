import { ETIQUETA_FRANJA, porFranja, type TareaDelDia } from "@/lib/tareas";
import { alternarTarea } from "@/app/tareas/actions";

export function Checklist({
  fecha,
  tareas,
}: {
  fecha: string;
  tareas: TareaDelDia[];
}) {
  const grupos = porFranja(tareas);

  if (grupos.length === 0) {
    return (
      <p className="rounded-xl bg-gray-50 px-3 py-6 text-center text-sm text-gray-500">
        No hay tareas de rutina para este día. Agrégalas en «Rutina».
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {grupos.map(({ franja, tareas: delGrupo }) => (
        <div key={franja}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {ETIQUETA_FRANJA[franja]}
          </h3>
          <ul className="space-y-2">
            {delGrupo.map((t) => (
              <li key={t.id}>
                <form action={alternarTarea}>
                  <input type="hidden" name="fecha" value={fecha} />
                  <input type="hidden" name="plantillaId" value={t.id} />
                  <button
                    type="submit"
                    className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                      t.hecha
                        ? "border-marca-100 bg-marca-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs ${
                        t.hecha
                          ? "border-marca-500 bg-marca-500 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {t.hecha ? "✓" : ""}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block text-sm font-medium ${
                          t.hecha ? "text-gray-400 line-through" : ""
                        }`}
                      >
                        {t.titulo}
                      </span>
                      {t.detalle && (
                        <span className="mt-0.5 block text-xs text-gray-500">
                          {t.detalle}
                        </span>
                      )}
                    </span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
