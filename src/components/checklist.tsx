import { ETIQUETA_FRANJA, porFranja, type TareaDelDia } from "@/lib/tareas";
import { alternarTarea } from "@/app/tareas/actions";
import { FormAccion } from "@/components/form-accion";

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
      <p className="rounded-xl bg-superficie-2 px-3 py-6 text-center text-sm text-tinta-suave">
        No hay tareas de rutina para este día. Agrégalas en «Rutina».
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {grupos.map(({ franja, tareas: delGrupo }) => (
        <div key={franja}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-tinta-tenue">
            {ETIQUETA_FRANJA[franja]}
          </h3>
          <ul className="space-y-2">
            {delGrupo.map((t) => (
              <li key={t.id}>
                <FormAccion action={alternarTarea}>
                  <input type="hidden" name="fecha" value={fecha} />
                  <input type="hidden" name="plantillaId" value={t.id} />
                  <button
                    type="submit"
                    className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                      t.hecha
                        ? "border-crema-200/30 bg-crema-200/10"
                        : "border-borde bg-superficie-2 hover:border-borde-fuerte"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs ${
                        t.hecha
                          ? "border-crema-200 bg-crema-200 text-sobre-crema"
                          : "border-crema-200/50"
                      }`}
                    >
                      {t.hecha ? "✓" : ""}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block text-sm font-medium ${
                          t.hecha ? "text-tinta-tenue line-through" : ""
                        }`}
                      >
                        {t.titulo}
                      </span>
                      {t.detalle && (
                        <span className="mt-0.5 block text-xs text-tinta-suave">
                          {t.detalle}
                        </span>
                      )}
                    </span>
                  </button>
                </FormAccion>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
