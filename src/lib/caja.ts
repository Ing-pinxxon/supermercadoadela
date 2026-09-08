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
  /** De las salidas, cuánta fue plata guardada en la caja (no un gasto). */
  metidos: number;
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
      metidos: number;
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
         COALESCE(SUM(monto) FILTER (WHERE tipo = 'SALIDA'
                                       AND de_caja), 0)::int AS metidos,
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
    metidos: totales?.metidos ?? 0,
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
/**
 * Un día «terminó» si ya lo marcaron cerrado o si ya pasó. Lo segundo es la
 * red de seguridad: si se olvidan de marcarlo, la cuenta igual cuadra al día
 * siguiente. `$3` es la fecha de hoy.
 */
const TERMINADO = `(COALESCE(c.cerrado, FALSE) OR c.fecha < $3)`;

export type CajaSemana = {
  /** Con cuánto arrancó la semana. Lo escribe el administrador. */
  base: number;
  /** La venta en efectivo de los días que ya terminaron. */
  venta: number;
  /** Lo que se guardó en la caja. */
  metido: number;
  /** Lo que se sacó de la caja. */
  sacado: number;
  saldo: number;
  /** True si nadie ha puesto la base de esta semana todavía. */
  sinBase: boolean;
  /** Con cuánto cerró la semana anterior, para no tener que ir a buscarlo. */
  sugerida: number | null;
};

/**
 * La plata guardada de la semana.
 *
 *   caja = con cuánto arrancó
 *        + la venta en efectivo de los días que ya terminaron
 *        + lo que se metió a la caja
 *        − lo que se sacó de la caja
 *
 * Las salidas, las entradas y las transferencias NO la tocan. Al cerrar el día
 * se anota en «venta en efectivo» lo que quedó contado en el cajón, y esa plata
 * ya tiene los pagos descontados: restarlos otra vez sería contarlos dos veces.
 *
 * Meter y sacar cuentan de una, sin esperar a que el día termine: es plata que
 * se movió en el momento.
 */
async function calcularCaja(lunes: string): Promise<Omit<CajaSemana, "sugerida">> {
  const domingo = sumarDias(lunes, 6);

  const [semana, caja, ventas] = await Promise.all([
    consultarUna<{ caja_inicial: number | null }>(
      `SELECT caja_inicial FROM semana WHERE lunes = $1`,
      [lunes],
    ),
    consultarUna<{ metido: number; sacado: number }>(
      `SELECT
         COALESCE(SUM(monto) FILTER (WHERE tipo = 'SALIDA'), 0)::int  AS metido,
         COALESCE(SUM(monto) FILTER (WHERE tipo = 'ENTRADA'), 0)::int AS sacado
       FROM movimiento
      WHERE de_caja AND fecha BETWEEN $1 AND $2`,
      [lunes, domingo],
    ),
    consultarUna<{ venta: number }>(
      `SELECT COALESCE(SUM(venta_efectivo), 0)::int AS venta
         FROM cierre_dia c
        WHERE c.fecha BETWEEN $1 AND $2 AND ${TERMINADO}`,
      [lunes, domingo, hoy()],
    ),
  ]);

  const base = semana?.caja_inicial ?? 0;
  const venta = ventas?.venta ?? 0;
  const metido = caja?.metido ?? 0;
  const sacado = caja?.sacado ?? 0;

  return {
    base,
    venta,
    metido,
    sacado,
    saldo: base + venta + metido - sacado,
    sinBase: (semana?.caja_inicial ?? null) === null,
  };
}

/** La caja de la semana de `fecha`, con el cierre de la anterior de referencia. */
export async function cajaSemana(fecha: string): Promise<CajaSemana> {
  const lunes = lunesDe(fecha);
  const [propia, anterior] = await Promise.all([
    calcularCaja(lunes),
    calcularCaja(sumarDias(lunes, -7)),
  ]);

  return {
    ...propia,
    // Solo se sugiere un cierre de verdad: si la semana pasada tampoco tenía
    // valor de arranque, su saldo no significa nada.
    sugerida: anterior.sinBase ? null : anterior.saldo,
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
      metidos: a.metidos + d.metidos,
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
      metidos: 0,
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
      WHERE tipo = 'SALIDA' AND NOT de_caja AND fecha BETWEEN $1 AND $2
      GROUP BY ${CLAVE_CONCEPTO}
      ORDER BY total DESC
      LIMIT $3`,
    [desde, hasta, tope],
  );
}
