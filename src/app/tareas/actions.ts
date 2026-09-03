"use server";

import { revalidatePath } from "next/cache";
import { consultar, consultarUna, nuevoId } from "@/lib/db";
import { esFechaValida } from "@/lib/fechas";
import { leerTexto } from "@/lib/dinero";
import { esFranja } from "@/lib/tipos";

/** Marca o desmarca una tarea en una fecha concreta. */
export async function alternarTarea(datos: FormData) {
  const fecha = String(datos.get("fecha") ?? "");
  const plantillaId = String(datos.get("plantillaId") ?? "");
  if (!esFechaValida(fecha) || !plantillaId) return;

  await consultar(
    `INSERT INTO tarea_hecha (id, plantilla_id, fecha, hecha)
     VALUES ($1, $2, $3, TRUE)
     ON CONFLICT (plantilla_id, fecha) DO UPDATE SET
       hecha = NOT tarea_hecha.hecha,
       marcada_en = now()`,
    [nuevoId(), plantillaId, fecha],
  );

  revalidatePath("/tareas");
  revalidatePath("/tareas/semana");
}

export async function crearTarea(datos: FormData) {
  const titulo = leerTexto(datos.get("titulo"));
  if (!titulo) throw new Error("Falta el título");

  const dias = datos
    .getAll("diaSemana")
    .map((d) => Number(d))
    .filter((d) => d >= 1 && d <= 7);
  if (dias.length === 0) throw new Error("Elige al menos un día");

  const cruda = String(datos.get("franja") ?? "MANANA");
  const franja = esFranja(cruda) ? cruda : "MANANA";
  const detalle = leerTexto(datos.get("detalle"));

  const ultimo = await consultarUna<{ orden: number }>(
    `SELECT COALESCE(MAX(orden), 0) AS orden FROM tarea_plantilla`,
  );
  const orden = (ultimo?.orden ?? 0) + 10;

  for (const dia of dias) {
    await consultar(
      `INSERT INTO tarea_plantilla (id, titulo, detalle, dia_semana, franja, orden)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [nuevoId(), titulo, detalle, dia, franja, orden],
    );
  }

  revalidatePath("/tareas");
  revalidatePath("/tareas/rutina");
  revalidatePath("/tareas/semana");
}

/**
 * Se desactiva en vez de borrarse, para no perder el historial de los días en
 * que sí se hizo.
 */
export async function alternarActiva(datos: FormData) {
  const id = String(datos.get("id") ?? "");
  if (!id) return;

  await consultar(
    `UPDATE tarea_plantilla SET activa = NOT activa WHERE id = $1`,
    [id],
  );

  revalidatePath("/tareas");
  revalidatePath("/tareas/rutina");
  revalidatePath("/tareas/semana");
}
