import { consultar } from "@/lib/db";
import { diaSemana, semanaDe } from "@/lib/fechas";
import { FRANJAS, type Franja } from "@/lib/tipos";

export { ETIQUETA_FRANJA } from "@/lib/tipos";
export const ORDEN_FRANJA = FRANJAS;

export type TareaDelDia = {
  id: string;
  titulo: string;
  detalle: string | null;
  franja: Franja;
  hecha: boolean;
};

/** Tareas de la rutina que aplican a esa fecha, con su estado de ese día. */
export async function tareasDelDia(fecha: string): Promise<TareaDelDia[]> {
  const filas = await consultar<{
    id: string;
    titulo: string;
    detalle: string | null;
    franja: Franja;
    hecha: boolean | null;
  }>(
    `SELECT t.id, t.titulo, t.detalle, t.franja, h.hecha
       FROM tarea_plantilla t
       LEFT JOIN tarea_hecha h
              ON h.plantilla_id = t.id AND h.fecha = $1
      WHERE t.dia_semana = $2 AND t.activa
      ORDER BY
        CASE t.franja WHEN 'MANANA' THEN 1 WHEN 'TARDE' THEN 2 ELSE 3 END,
        t.orden ASC, t.titulo ASC`,
    [fecha, diaSemana(fecha)],
  );

  return filas.map((f) => ({ ...f, hecha: f.hecha ?? false }));
}

export type TareaRutina = {
  grupoId: string;
  titulo: string;
  detalle: string | null;
  franja: Franja;
  /** Los días en que la tarea está puesta. 1 = lunes … 7 = domingo. */
  dias: number[];
  /** Sin ningún día puesto, pero guardada porque tiene historial. */
  quitada: boolean;
};

/**
 * La rutina vista como tareas, no como filas.
 *
 * Una tarea que se repite son varias filas de `tarea_plantilla`, una por día,
 * cada una con su propio historial. `grupo_id` es lo que las hace «la misma
 * tarea», y es lo que permite editarlas juntas.
 */
export async function rutina(): Promise<TareaRutina[]> {
  const filas = await consultar<{
    grupo_id: string;
    titulo: string;
    detalle: string | null;
    franja: Franja;
    dias: number[] | null;
  }>(
    `SELECT COALESCE(grupo_id, id) AS grupo_id,
            (array_agg(titulo ORDER BY dia_semana))[1]  AS titulo,
            (array_agg(detalle ORDER BY dia_semana))[1] AS detalle,
            (array_agg(franja ORDER BY dia_semana))[1]  AS franja,
            array_agg(dia_semana ORDER BY dia_semana)
              FILTER (WHERE activa) AS dias
       FROM tarea_plantilla
      GROUP BY COALESCE(grupo_id, id)
      ORDER BY MIN(orden) ASC, 2 ASC`,
  );

  return filas.map((f) => ({
    grupoId: f.grupo_id,
    titulo: f.titulo,
    detalle: f.detalle,
    franja: f.franja,
    dias: f.dias ?? [],
    quitada: (f.dias ?? []).length === 0,
  }));
}

/** Agrupa las tareas de un día por franja, en orden mañana → tarde → noche. */
export function porFranja(tareas: TareaDelDia[]) {
  return ORDEN_FRANJA.map((franja) => ({
    franja,
    tareas: tareas.filter((t) => t.franja === franja),
  })).filter((g) => g.tareas.length > 0);
}

/** Cuántas tareas hay y cuántas se cumplieron, día por día de la semana. */
export async function avanceSemana(fecha: string) {
  const dias = semanaDe(fecha);
  const detalle = await Promise.all(
    dias.map(async (f) => {
      const tareas = await tareasDelDia(f);
      return {
        fecha: f,
        total: tareas.length,
        hechas: tareas.filter((t) => t.hecha).length,
        tareas,
      };
    }),
  );

  return {
    dias,
    detalle,
    total: detalle.reduce((s, d) => s + d.total, 0),
    hechas: detalle.reduce((s, d) => s + d.hechas, 0),
  };
}
