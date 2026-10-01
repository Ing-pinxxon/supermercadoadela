/**
 * Lo registrado en la app, desde el primer día que se usó.
 *
 * Es la contraparte de src/lib/historico.ts, que tiene el archivo de la hoja:
 * los dos no se mezclan. El inicio no se escribe a mano — es el primer día con
 * algo anotado.
 *
 * Las cuentas usan la misma fórmula del día que src/lib/caja.ts:
 *   ingreso bruto = venta en efectivo + salidas − entradas
 */
import { consultar, consultarUna } from "@/lib/db";
import type { SemanaHistorica } from "@/lib/historico";

/** El primer día con algo registrado en la app, o null si todavía no hay nada. */
export async function inicioApp(): Promise<string | null> {
  const fila = await consultarUna<{ inicio: string | null }>(
    `SELECT LEAST(
              (SELECT MIN(fecha) FROM movimiento),
              (SELECT MIN(fecha) FROM cierre_dia)
            )::text AS inicio`,
  );
  return fila?.inicio ?? null;
}

export type SemanaApp = SemanaHistorica & { venta_transferencia: number };

/**
 * Cada día con algo registrado, con su ingreso bruto. Base de las sumas por
 * semana y por día de la semana, para que las dos salgan de la misma cuenta.
 */
const DIAS_APP = `
  WITH mov AS (
    SELECT fecha,
           SUM(monto) FILTER (WHERE tipo = 'SALIDA')  AS salidas,
           SUM(monto) FILTER (WHERE tipo = 'ENTRADA') AS entradas
      FROM movimiento
     GROUP BY fecha
  ),
  dia AS (
    SELECT COALESCE(c.fecha, m.fecha)                     AS fecha,
           COALESCE(c.venta_efectivo, 0)                  AS venta_efectivo,
           COALESCE(c.venta_transferencia, 0)             AS venta_transferencia,
           COALESCE(m.salidas, 0)                         AS salidas,
           COALESCE(m.entradas, 0)                        AS entradas,
           c.fecha IS NOT NULL AND c.venta_efectivo > 0   AS con_venta
      FROM cierre_dia c
      FULL JOIN mov m ON m.fecha = c.fecha
  )`;

/** Semana por semana, desde que se empezó a usar la app. */
export async function semanasApp(): Promise<SemanaApp[]> {
  return consultar<SemanaApp>(
    `${DIAS_APP}
     SELECT (date_trunc('week', fecha))::date::text           AS lunes,
            SUM(venta_efectivo + salidas - entradas)::int      AS ingreso_bruto,
            SUM(venta_efectivo)::int                           AS venta_efectivo,
            SUM(venta_transferencia)::int                      AS venta_transferencia,
            SUM(salidas)::int                                  AS total_salidas,
            COUNT(*)::int                                      AS dias
       FROM dia
      GROUP BY 1
      ORDER BY 1`,
  );
}

/**
 * Promedio de ingreso bruto por día de la semana (1 = lunes … 7 = domingo).
 * Solo cuenta días con venta anotada: un día con pagos y sin la venta todavía
 * daría un «ingreso» negativo que no dice nada de cuánto se vendió.
 */
export async function porDiaSemanaApp() {
  return consultar<{ dia: number; promedio: number; dias: number }>(
    `${DIAS_APP}
     SELECT EXTRACT(ISODOW FROM fecha)::int                        AS dia,
            AVG(venta_efectivo + salidas - entradas)::int          AS promedio,
            COUNT(*)::int                                          AS dias
       FROM dia
      WHERE con_venta
      GROUP BY 1
      ORDER BY 1`,
  );
}
