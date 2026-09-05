import { consultar, consultarUna } from "@/lib/db";
import { diaSemana, hoy, lunesDe, semanaDe, sumarDias } from "@/lib/fechas";
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
  /** De esas entradas, cuánta se sacó de la caja de días anteriores. */
  retiros: number;
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
      retiros: number;
      cuantos: number;
    }>(
      `SELECT
         COALESCE(SUM(monto) FILTER (WHERE tipo = 'SALIDA'), 0)::int  AS salidas,
         COALESCE(SUM(monto) FILTER (WHERE tipo = 'SALIDA'
                                       AND medio = 'TRANSFERENCIA'), 0)::int
           AS salidas_transferencia,
         COALESCE(SUM(monto) FILTER (WHERE tipo = 'ENTRADA'), 0)::int AS entradas,
         COALESCE(SUM(monto) FILTER (WHERE tipo = 'ENTRADA'
                                       AND de_caja), 0)::int AS retiros,
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
    retiros: totales?.retiros ?? 0,
    ventaEfectivo,
    ventaTransferencia,
    ingresoBruto,
    totalVendido: ingresoBruto + ventaTransferencia,
    cerrado: cierre?.cerrado ?? false,
    observaciones: cierre?.observaciones ?? null,
    hayDatos: cierre !== null || (totales?.cuantos ?? 0) > 0,
  };
}

/**
 * Un día «terminó» si ya lo marcaron cerrado o si ya pasó. Lo segundo es la
 * red de seguridad: si se olvidan de marcarlo, la cuenta igual cuadra al día
 * siguiente. `$3` es la fecha de hoy.
 */
const TERMINADO = `(COALESCE(c.cerrado, FALSE) OR c.fecha < $3)`;

export type CajaSemana = {
  /** Con cuánto arrancó la semana. Lo escribe el administrador. */
  base: number;
  /** Lo que dejaron los días que ya terminaron. Puede ser negativo. */
  entrado: number;
  /** Lo que se sacó en los días que aún no terminan. */
  sacado: number;
  saldo: number;
  /** True si nadie ha puesto la base de esta semana todavía. */
  sinBase: boolean;
};

/**
 * La plata que queda de días anteriores.
 *
 *   caja = base + lo que dejó cada día ya terminado − lo que se sacó hoy
 *
 * «Lo que dejó un día» es `venta efectivo + entradas − salidas`, pero sin
 * contar los retiros: esa plata ya estaba en la caja, sumarla sería contarla
 * dos veces. Y un día cuenta como terminado si está marcado como cerrado o si
 * ya pasó — así el saldo se actualiza al cerrar, y si se olvidan de marcarlo,
 * igual cuadra al día siguiente.
 */
export async function cajaSemana(fecha: string): Promise<CajaSemana> {
  const lunes = lunesDe(fecha);
  const domingo = sumarDias(lunes, 6);

  const [semana, movidas, ventas] = await Promise.all([
    consultarUna<{ caja_inicial: number | null }>(
      `SELECT caja_inicial FROM semana WHERE lunes = $1`,
      [lunes],
    ),
    consultarUna<{ entrado: number; sacado: number }>(
      `SELECT
         COALESCE(SUM(
           CASE WHEN m.tipo = 'SALIDA' THEN -m.monto
                -- El retiro no suma: esa plata ya estaba en la caja.
                WHEN m.de_caja THEN 0
                ELSE m.monto END
         ) FILTER (WHERE (COALESCE(c.cerrado, FALSE) OR m.fecha < $3)), 0)::int AS entrado,
         COALESCE(SUM(m.monto)
           FILTER (WHERE m.de_caja
                       AND NOT (COALESCE(c.cerrado, FALSE) OR m.fecha < $3)),
           0)::int AS sacado
       FROM movimiento m
       LEFT JOIN cierre_dia c ON c.fecha = m.fecha
      WHERE m.fecha BETWEEN $1 AND $2`,
      [lunes, domingo, hoy()],
    ),
    consultarUna<{ venta: number }>(
      `SELECT COALESCE(SUM(venta_efectivo), 0)::int AS venta
         FROM cierre_dia c
        WHERE c.fecha BETWEEN $1 AND $2 AND ${TERMINADO}`,
      [lunes, domingo, hoy()],
    ),
  ]);

  const base = semana?.caja_inicial ?? 0;
  const entrado = (movidas?.entrado ?? 0) + (ventas?.venta ?? 0);
  const sacado = movidas?.sacado ?? 0;

  return {
    base,
    entrado,
    sacado,
    saldo: base + entrado - sacado,
    sinBase: (semana?.caja_inicial ?? null) === null,
  };
}

export type ResumenSemana = Awaited<ReturnType<typeof resumenSemana>>;

/** Resumen de los 7 días de la semana a la que pertenece `fecha`. */
export async function resumenSemana(fecha: string) {
  const lunes = lunesDe(fecha);
  const dias = semanaDe(fecha);

  const [detalle, caja, cuentaEsta, cuentaAnterior] = await Promise.all([
    Promise.all(dias.map(resumenDia)),
    cajaSemana(lunes),
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
      retiros: a.retiros + d.retiros,
      ventaEfectivo: a.ventaEfectivo + d.ventaEfectivo,
      ventaTransferencia: a.ventaTransferencia + d.ventaTransferencia,
      ingresoBruto: a.ingresoBruto + d.ingresoBruto,
      totalVendido: a.totalVendido + d.totalVendido,
    }),
    {
      salidas: 0,
      salidasTransferencia: 0,
      entradas: 0,
      retiros: 0,
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
    caja,
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
