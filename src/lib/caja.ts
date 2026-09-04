import { consultar, consultarUna } from "@/lib/db";
import { diaSemana, lunesDe, semanaDe, sumarDias } from "@/lib/fechas";
import { claveSql } from "@/lib/texto";
import type { CierreDia, Movimiento } from "@/lib/tipos";

export type ResumenDia = {
  fecha: string;
  /** Todo lo que salió de la caja: proveedores, mercado, trabajador, gastos. */
  salidas: number;
  /** De esas salidas, cuánto se pagó por transferencia. No cambia la cuenta. */
  salidasTransferencia: number;
  /** Plata que entró sin ser venta del día: prestados, abonos, aportes. */
  entradas: number;
  ventaEfectivo: number;
  /** Venta que entró por Nequi o transferencia. Va aparte de la de efectivo. */
  ventaTransferencia: number;
  /** venta efectivo + salidas − entradas. La fórmula de la hoja, de caja. */
  ingresoBruto: number;
  /** El bruto más lo que se vendió por transferencia: todo lo que se vendió. */
  totalVendido: number;
  cerrado: boolean;
  observaciones: string | null;
  /** Hay algo registrado ese día (venta o movimientos). */
  hayDatos: boolean;
};

/**
 * Resumen de un día. Es la única fuente de verdad de la aritmética de caja:
 * cualquier pantalla que muestre plata debe pasar por aquí.
 */
export async function resumenDia(fecha: string): Promise<ResumenDia> {
  const [cierre, totales] = await Promise.all([
    consultarUna<CierreDia>(`SELECT * FROM cierre_dia WHERE fecha = $1`, [
      fecha,
    ]),
    consultarUna<{
      salidas: number;
      salidas_transferencia: number;
      entradas: number;
      cuantos: number;
    }>(
      `SELECT
         COALESCE(SUM(monto) FILTER (WHERE tipo = 'SALIDA'), 0)::int  AS salidas,
         COALESCE(SUM(monto) FILTER (WHERE tipo = 'SALIDA'
                                       AND medio = 'TRANSFERENCIA'), 0)::int
           AS salidas_transferencia,
         COALESCE(SUM(monto) FILTER (WHERE tipo = 'ENTRADA'), 0)::int AS entradas,
         COUNT(*)::int AS cuantos
       FROM movimiento WHERE fecha = $1`,
      [fecha],
    ),
  ]);

  const salidas = totales?.salidas ?? 0;
  const entradas = totales?.entradas ?? 0;
  const ventaEfectivo = cierre?.venta_efectivo ?? 0;
  const ventaTransferencia = cierre?.venta_transferencia ?? 0;
  const ingresoBruto = ventaEfectivo + salidas - entradas;

  return {
    fecha,
    salidas,
    salidasTransferencia: totales?.salidas_transferencia ?? 0,
    entradas,
    ventaEfectivo,
    ventaTransferencia,
    ingresoBruto,
    totalVendido: ingresoBruto + ventaTransferencia,
    cerrado: cierre?.cerrado ?? false,
    observaciones: cierre?.observaciones ?? null,
    hayDatos: cierre !== null || (totales?.cuantos ?? 0) > 0,
  };
}

export type ResumenSemana = Awaited<ReturnType<typeof resumenSemana>>;

/** Resumen de los 7 días de la semana a la que pertenece `fecha`. */
export async function resumenSemana(fecha: string) {
  const lunes = lunesDe(fecha);
  const dias = semanaDe(fecha);

  const [detalle, cuentaEsta, cuentaAnterior] = await Promise.all([
    Promise.all(dias.map(resumenDia)),
    consultarUna<{ cuenta_efectivo: number | null; nota: string | null }>(
      `SELECT cuenta_efectivo, nota FROM semana WHERE lunes = $1`,
      [lunes],
    ),
    consultarUna<{ cuenta_efectivo: number | null }>(
      `SELECT cuenta_efectivo FROM semana WHERE lunes = $1`,
      [sumarDias(lunes, -7)],
    ),
  ]);

  const totales = detalle.reduce(
    (a, d) => ({
      salidas: a.salidas + d.salidas,
      salidasTransferencia: a.salidasTransferencia + d.salidasTransferencia,
      entradas: a.entradas + d.entradas,
      ventaEfectivo: a.ventaEfectivo + d.ventaEfectivo,
      ventaTransferencia: a.ventaTransferencia + d.ventaTransferencia,
      ingresoBruto: a.ingresoBruto + d.ingresoBruto,
      totalVendido: a.totalVendido + d.totalVendido,
    }),
    {
      salidas: 0,
      salidasTransferencia: 0,
      entradas: 0,
      ventaEfectivo: 0,
      ventaTransferencia: 0,
      ingresoBruto: 0,
      totalVendido: 0,
    },
  );

  return {
    lunes,
    dias,
    detalle,
    totales,
    cuentaEfectivo: cuentaEsta?.cuenta_efectivo ?? null,
    notaSemana: cuentaEsta?.nota ?? null,
    cuentaAnterior: cuentaAnterior?.cuenta_efectivo ?? null,
  };
}

export async function movimientosDelDia(fecha: string): Promise<Movimiento[]> {
  return consultar<Movimiento>(
    `SELECT * FROM movimiento WHERE fecha = $1 ORDER BY creado_en ASC`,
    [fecha],
  );
}

/**
 * Conceptos usados antes, para autocompletar. Se priorizan los que suelen
 * pagarse ese mismo día de la semana: en la práctica, cada proveedor tiene su
 * día, así que arriba queda casi siempre el que se está por registrar.
 */
export async function conceptosSugeridos(fecha: string) {
  const dia = diaSemana(fecha);

  const [delDia, todos] = await Promise.all([
    consultar<{ concepto: string }>(
      `SELECT (array_agg(concepto ORDER BY fecha DESC))[1] AS concepto
         FROM movimiento
        WHERE tipo = 'SALIDA'
          AND EXTRACT(ISODOW FROM fecha) = $1
          AND fecha < $2
        GROUP BY ${CLAVE_CONCEPTO}
        ORDER BY COUNT(*) DESC, MAX(fecha) DESC
        LIMIT 12`,
      [dia, fecha],
    ),
    consultar<{ concepto: string }>(
      `SELECT (array_agg(concepto ORDER BY fecha DESC))[1] AS concepto
         FROM movimiento
        GROUP BY ${CLAVE_CONCEPTO}
        ORDER BY COUNT(*) DESC
        LIMIT 200`,
    ),
  ]);

  return {
    frecuentesDelDia: delDia.map((c) => c.concepto),
    todos: todos.map((c) => c.concepto),
  };
}

/**
 * Clave para agrupar conceptos escritos distinto: "Mac pollo", "Macpollo" y
 * "Mac Pollo" son el mismo proveedor. La misma normalización que se usa con
 * los nombres de los deudores (ver src/lib/texto.ts).
 */
export const CLAVE_CONCEPTO = claveSql("concepto");

/**
 * Los conceptos en los que más se gastó en un rango, agrupando las variantes de
 * escritura y mostrando la forma que más se usó.
 */
export async function mayoresConceptos(desde: string, hasta: string, tope = 12) {
  return consultar<{ concepto: string; total: number; veces: number }>(
    `SELECT (array_agg(concepto ORDER BY length(concepto)))[1] AS concepto,
            SUM(monto)::int AS total,
            COUNT(*)::int   AS veces
       FROM movimiento
      WHERE tipo = 'SALIDA' AND fecha BETWEEN $1 AND $2
      GROUP BY ${CLAVE_CONCEPTO}
      ORDER BY total DESC
      LIMIT $3`,
    [desde, hasta, tope],
  );
}
