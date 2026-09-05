"use server";

import { revalidatePath } from "next/cache";
import { consultar, nuevoId } from "@/lib/db";
import { esFechaValida, lunesDe } from "@/lib/fechas";
import { leerMonto, leerTexto } from "@/lib/dinero";
import { esMedio, esTipo } from "@/lib/tipos";
import { exigirAdmin } from "@/lib/sesion";

function fechaDe(datos: FormData): string {
  const f = String(datos.get("fecha") ?? "");
  if (!esFechaValida(f)) throw new Error("Fecha inválida");
  return f;
}

function refrescar(fecha: string) {
  revalidatePath(`/caja/dia/${fecha}`);
  revalidatePath("/caja/semana");
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
  const comoPago = String(datos.get("medio") ?? "EFECTIVO");
  const medio = esMedio(comoPago) ? comoPago : "EFECTIVO";
  const monto = leerMonto(datos.get("monto"));
  if (monto === 0) return;

  await consultar(
    `INSERT INTO movimiento (id, fecha, tipo, concepto, monto, medio, nota)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      nuevoId(),
      fecha,
      tipo,
      concepto,
      monto,
      medio,
      leerTexto(datos.get("nota")),
    ],
  );

  refrescar(fecha);
}

export async function borrarMovimiento(datos: FormData) {
  const fecha = fechaDe(datos);
  const id = String(datos.get("id") ?? "");
  if (id) await consultar(`DELETE FROM movimiento WHERE id = $1`, [id]);
  refrescar(fecha);
}

/** La venta del día (efectivo y transferencia aparte) y la observación. */
export async function guardarVenta(datos: FormData) {
  const fecha = fechaDe(datos);

  await consultar(
    `INSERT INTO cierre_dia
       (fecha, venta_efectivo, venta_transferencia, observaciones)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (fecha) DO UPDATE SET
       venta_efectivo      = EXCLUDED.venta_efectivo,
       venta_transferencia = EXCLUDED.venta_transferencia,
       observaciones       = EXCLUDED.observaciones,
       actualizado_en      = now()`,
    [
      fecha,
      leerMonto(datos.get("ventaEfectivo")),
      leerMonto(datos.get("ventaTransferencia")),
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

/**
 * Sacar plata de la caja de días anteriores para pagar algo hoy.
 *
 * Se guarda como una ENTRADA marcada con `de_caja`: para la cuenta del día es
 * plata que entró al cajón sin ser venta (por eso no infla el ingreso), y para
 * la caja es lo que la baja. El pago se sigue registrando aparte con «Pagué».
 */
export async function sacarDeCaja(datos: FormData) {
  const fecha = fechaDe(datos);
  const monto = leerMonto(datos.get("monto"));
  if (monto <= 0) return;

  await consultar(
    `INSERT INTO movimiento
       (id, fecha, tipo, concepto, monto, medio, de_caja, nota)
     VALUES ($1, $2, 'ENTRADA', 'De la caja', $3, 'EFECTIVO', TRUE, $4)`,
    [nuevoId(), fecha, monto, leerTexto(datos.get("nota"))],
  );

  refrescar(fecha);
}

/** Con cuánta plata arranca la semana. Es cosa del administrador. */
export async function guardarCajaInicial(datos: FormData) {
  await exigirAdmin("/caja/semana");
  const fecha = fechaDe(datos);
  const lunes = lunesDe(fecha);
  const crudo = datos.get("cajaInicial");
  const base = leerTexto(crudo) === null ? null : leerMonto(crudo);

  await consultar(
    `INSERT INTO semana (lunes, caja_inicial) VALUES ($1, $2)
     ON CONFLICT (lunes) DO UPDATE SET
       caja_inicial = EXCLUDED.caja_inicial, actualizado_en = now()`,
    [lunes, base],
  );

  revalidatePath("/caja/semana");
  revalidatePath(`/caja/dia/${fecha}`);
}

/** Conteo de efectivo al cerrar la semana. Es cosa del administrador. */
export async function guardarCuentaSemana(datos: FormData) {
  await exigirAdmin("/caja/semana");
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

  revalidatePath("/caja/semana");
}
