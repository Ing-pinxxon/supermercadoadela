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
