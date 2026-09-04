/**
 * Los fiados: quién se llevó mercancía y todavía debe.
 *
 * Dos reglas que sostienen todo lo demás:
 *
 *  - **Fiar no toca la caja.** No entró ni salió plata del cajón; solo nace
 *    una deuda. Por eso no aparece en la fórmula del día.
 *  - **Abonar sí.** La plata del abono queda en el cajón sin ser venta de hoy,
 *    que es exactamente el papel de las «entradas» en la fórmula de la hoja
 *    (como «Prestados ayer»). Por eso cada abono crea también un movimiento
 *    de ENTRADA, enlazado, y borrarlo borra los dos.
 *
 * El saldo se calcula siempre en SQL (`SUM(FIADO) − SUM(ABONO)`), nunca
 * sumando en JavaScript: es la misma disciplina de src/lib/caja.ts.
 */
import { consultar, consultarUna } from "@/lib/db";
import type { Deudor, MovimientoFiado } from "@/lib/tipos";

export type DeudorConSaldo = {
  id: string;
  nombre: string;
  telefono: string | null;
  saldo: number;
  /** Fecha del último movimiento, para saber quién lleva rato sin aparecer. */
  ultima: string | null;
};

const SALDO = `
  COALESCE(SUM(f.monto) FILTER (WHERE f.tipo = 'FIADO'), 0)::int
  - COALESCE(SUM(f.monto) FILTER (WHERE f.tipo = 'ABONO'), 0)::int`;

/** Todos los deudores con su saldo. Primero los que más deben. */
export async function deudores(): Promise<DeudorConSaldo[]> {
  return consultar<DeudorConSaldo>(
    `SELECT d.id, d.nombre, d.telefono,
            ${SALDO} AS saldo,
            MAX(f.fecha) AS ultima
       FROM deudor d
       LEFT JOIN fiado f ON f.deudor_id = d.id
      GROUP BY d.id, d.nombre, d.telefono
      ORDER BY saldo DESC, d.nombre ASC`,
  );
}

/** Lo que debe la tienda entera y cuánta gente debe. */
export async function totalCartera(): Promise<{
  total: number;
  cuantos: number;
}> {
  const fila = await consultarUna<{ total: number; cuantos: number }>(
    `SELECT COALESCE(SUM(saldo), 0)::int AS total,
            COUNT(*) FILTER (WHERE saldo > 0)::int AS cuantos
       FROM (
         SELECT ${SALDO} AS saldo
           FROM deudor d
           LEFT JOIN fiado f ON f.deudor_id = d.id
          GROUP BY d.id
       ) AS saldos`,
  );
  return { total: fila?.total ?? 0, cuantos: fila?.cuantos ?? 0 };
}

export async function deudor(id: string): Promise<Deudor | null> {
  return consultarUna<Deudor>(`SELECT * FROM deudor WHERE id = $1`, [id]);
}

export async function saldoDe(id: string): Promise<number> {
  const fila = await consultarUna<{ saldo: number }>(
    `SELECT ${SALDO} AS saldo FROM fiado f WHERE f.deudor_id = $1`,
    [id],
  );
  return fila?.saldo ?? 0;
}

/** El historial de una persona, lo más reciente primero. */
export async function movimientosDe(id: string): Promise<MovimientoFiado[]> {
  return consultar<MovimientoFiado>(
    `SELECT * FROM fiado WHERE deudor_id = $1
      ORDER BY fecha DESC, creado_en DESC`,
    [id],
  );
}
