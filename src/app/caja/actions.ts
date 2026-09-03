"use server";

import { revalidatePath } from "next/cache";
import { consultar, nuevoId } from "@/lib/db";
import { esFechaValida, lunesDe } from "@/lib/fechas";
import { leerMonto, leerTexto } from "@/lib/dinero";
import { esTipo } from "@/lib/tipos";

function fechaDe(datos: FormData): string {
  const f = String(datos.get("fecha") ?? "");
  if (!esFechaValida(f)) throw new Error("Fecha inválida");
  return f;
}

function refrescar(fecha: string) {
  revalidatePath(`/caja/dia/${fecha}`);
  revalidatePath("/caja");
  revalidatePath("/caja/historico");
}

/**
 * El registro rápido: un concepto y un monto. Es lo que se usa veinte veces al
 * día, así que no pide nada más.
 */
export async function agregarMovimiento(datos: FormData) {
  const fecha = fechaDe(datos);
  const concepto = leerTexto(datos.get("concepto"));
  if (!concepto) return;

  const crudo = String(datos.get("tipo") ?? "SALIDA");
  const tipo = esTipo(crudo) ? crudo : "SALIDA";
  const monto = leerMonto(datos.get("monto"));
  if (monto === 0) return;

  await consultar(
    `INSERT INTO movimiento (id, fecha, tipo, concepto, monto, nota)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [nuevoId(), fecha, tipo, concepto, monto, leerTexto(datos.get("nota"))],
  );

  refrescar(fecha);
}

export async function borrarMovimiento(datos: FormData) {
  const fecha = fechaDe(datos);
  const id = String(datos.get("id") ?? "");
  if (id) await consultar(`DELETE FROM movimiento WHERE id = $1`, [id]);
  refrescar(fecha);
}

/** La venta en efectivo del día y la observación. */
export async function guardarVenta(datos: FormData) {
  const fecha = fechaDe(datos);

  await consultar(
    `INSERT INTO cierre_dia (fecha, venta_efectivo, observaciones)
     VALUES ($1, $2, $3)
     ON CONFLICT (fecha) DO UPDATE SET
       venta_efectivo = EXCLUDED.venta_efectivo,
       observaciones  = EXCLUDED.observaciones,
       actualizado_en = now()`,
    [
      fecha,
      leerMonto(datos.get("ventaEfectivo")),
      leerTexto(datos.get("observaciones")),
    ],
  );

  refrescar(fecha);
}

export async function alternarCerrado(datos: FormData) {
  const fecha = fechaDe(datos);
  await consultar(
    `INSERT INTO cierre_dia (fecha, cerrado) VALUES ($1, TRUE)
     ON CONFLICT (fecha) DO UPDATE SET
       cerrado = NOT cierre_dia.cerrado, actualizado_en = now()`,
    [fecha],
  );
  refrescar(fecha);
}

/** Conteo de efectivo al cerrar la semana. */
export async function guardarCuentaSemana(datos: FormData) {
  const fecha = fechaDe(datos);
  const lunes = lunesDe(fecha);
  const crudo = datos.get("cuentaEfectivo");
  const cuenta = leerTexto(crudo) === null ? null : leerMonto(crudo);

  await consultar(
    `INSERT INTO semana (lunes, cuenta_efectivo, nota)
     VALUES ($1, $2, $3)
     ON CONFLICT (lunes) DO UPDATE SET
       cuenta_efectivo = EXCLUDED.cuenta_efectivo,
       nota            = EXCLUDED.nota,
       actualizado_en  = now()`,
    [lunes, cuenta, leerTexto(datos.get("notaSemana"))],
  );

  revalidatePath("/caja");
}
