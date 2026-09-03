import { consultar, consultarUna } from "@/lib/db";
import { CLAVE_CONCEPTO } from "@/lib/caja";

/**
 * El archivo: las semanas que venían de la hoja de cálculo. Es de solo lectura;
 * sirve para comparar contra lo que se registre desde ahora.
 */

export type SemanaHistorica = {
  lunes: string;
  ingreso_bruto: number;
  venta_efectivo: number;
  total_salidas: number;
  dias: number;
};

export async function semanasArchivo(): Promise<SemanaHistorica[]> {
  return consultar<SemanaHistorica>(
    `SELECT (date_trunc('week', fecha))::date::text AS lunes,
            SUM(ingreso_bruto)::int   AS ingreso_bruto,
            SUM(venta_efectivo)::int  AS venta_efectivo,
            SUM(total_salidas)::int   AS total_salidas,
            COUNT(*)::int             AS dias
       FROM historico_dia
      GROUP BY 1
      ORDER BY 1`,
  );
}

export async function resumenArchivo() {
  return consultarUna<{
    dias: number;
    desde: string;
    hasta: string;
    ingreso: number;
    venta: number;
    salidas: number;
    dudosos: number;
  }>(
    `SELECT COUNT(*)::int AS dias,
            MIN(fecha)::text AS desde,
            MAX(fecha)::text AS hasta,
            SUM(ingreso_bruto)::int  AS ingreso,
            SUM(venta_efectivo)::int AS venta,
            SUM(total_salidas)::int  AS salidas,
            COUNT(*) FILTER (WHERE NOT detalle_cuadra)::int AS dudosos
       FROM historico_dia`,
  );
}

/** Promedio de ingreso por día de la semana: dónde estaban los días fuertes. */
export async function porDiaSemana() {
  return consultar<{ dia: number; promedio: number; dias: number }>(
    `SELECT EXTRACT(ISODOW FROM fecha)::int AS dia,
            AVG(ingreso_bruto)::int         AS promedio,
            COUNT(*)::int                   AS dias
       FROM historico_dia
      GROUP BY 1
      ORDER BY 1`,
  );
}

/**
 * En qué se iba la plata, según el detalle importado. Agrupa las variantes de
 * escritura ("Mac pollo", "Macpollo", "Mac Pollo") con la misma clave que usa
 * la app en vivo.
 */
export async function conceptosArchivo(tope = 12) {
  return consultar<{ concepto: string; total: number; veces: number }>(
    `SELECT (array_agg(concepto ORDER BY length(concepto)))[1] AS concepto,
            SUM(monto)::int AS total,
            COUNT(*)::int   AS veces
       FROM historico_detalle
      WHERE tipo = 'SALIDA'
      GROUP BY ${CLAVE_CONCEPTO}
      ORDER BY total DESC
      LIMIT $1`,
    [tope],
  );
}

/** Lo registrado en la app (no el archivo), semana por semana. */
export async function semanasActuales(): Promise<SemanaHistorica[]> {
  return consultar<SemanaHistorica>(
    `WITH dia AS (
       SELECT c.fecha,
              c.venta_efectivo,
              COALESCE(m.salidas, 0)  AS salidas,
              COALESCE(m.entradas, 0) AS entradas
         FROM cierre_dia c
         LEFT JOIN (
           SELECT fecha,
                  SUM(monto) FILTER (WHERE tipo = 'SALIDA')  AS salidas,
                  SUM(monto) FILTER (WHERE tipo = 'ENTRADA') AS entradas
             FROM movimiento GROUP BY fecha
         ) m ON m.fecha = c.fecha
     )
     SELECT (date_trunc('week', fecha))::date::text AS lunes,
            SUM(venta_efectivo + salidas - entradas)::int AS ingreso_bruto,
            SUM(venta_efectivo)::int AS venta_efectivo,
            SUM(salidas)::int        AS total_salidas,
            COUNT(*)::int            AS dias
       FROM dia
      GROUP BY 1
      ORDER BY 1`,
  );
}

/** Comparación archivo vs. lo que va corrido, en promedio por semana completa. */
export function compararPromedios(
  archivo: SemanaHistorica[],
  actual: SemanaHistorica[],
) {
  const completas = (s: SemanaHistorica[]) => s.filter((x) => x.dias >= 5);
  const promedio = (s: SemanaHistorica[]) =>
    s.length === 0
      ? null
      : Math.round(s.reduce((a, x) => a + x.ingreso_bruto, 0) / s.length);

  const a = promedio(completas(archivo));
  const b = promedio(completas(actual));

  return {
    archivo: a,
    actual: b,
    semanasArchivo: completas(archivo).length,
    semanasActuales: completas(actual).length,
    variacion: a && b ? Math.round(((b - a) / a) * 100) : null,
  };
}
