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

  refrescarTareas();
}

/**
 * Refresca lo que se ve después de guardar.
 *
 * Se revalida la app entera («/» como layout) y no rutas sueltas: con rutas
 * sueltas, a veces la acción guardaba bien pero la pantalla seguía mostrando lo
 * de antes — y en la tienda eso hace que uno vuelva a tocar el botón y
 * desmarque lo que acababa de marcar. Todas las pantallas son `force-dynamic`,
 * así que no hay caché que perder: refrescar de más no cuesta nada.
 */
function refrescarTareas() {
  revalidatePath("/", "layout");
}

/** Los días marcados en el formulario, sin repetidos y en orden. */
function diasDe(datos: FormData): number[] {
  const dias = datos
    .getAll("diaSemana")
    .map((d) => Number(d))
    .filter((d) => Number.isInteger(d) && d >= 1 && d <= 7);
  return [...new Set(dias)].sort((a, b) => a - b);
}

export async function crearTarea(datos: FormData) {
  const titulo = leerTexto(datos.get("titulo"));
  if (!titulo) throw new Error("Falta el título");

  const dias = diasDe(datos);
  if (dias.length === 0) throw new Error("Elige al menos un día");

  const cruda = String(datos.get("franja") ?? "MANANA");
  const franja = esFranja(cruda) ? cruda : "MANANA";
  const detalle = leerTexto(datos.get("detalle"));

  const ultimo = await consultarUna<{ orden: number }>(
    `SELECT COALESCE(MAX(orden), 0) AS orden FROM tarea_plantilla`,
  );
  const orden = (ultimo?.orden ?? 0) + 10;
  // Las filas que se crean juntas son la misma tarea en distintos días.
  const grupo = nuevoId();

  for (const dia of dias) {
    await consultar(
      `INSERT INTO tarea_plantilla
         (id, grupo_id, titulo, detalle, dia_semana, franja, orden)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [nuevoId(), grupo, titulo, detalle, dia, franja, orden],
    );
  }

  refrescarTareas();
}

/** Las filas de una tarea, con si esa fila ya se marcó alguna vez. */
async function filasDelGrupo(grupo: string) {
  return consultar<{ id: string; dia_semana: number; usada: boolean }>(
    `SELECT t.id, t.dia_semana,
            EXISTS (SELECT 1 FROM tarea_hecha h WHERE h.plantilla_id = t.id)
              AS usada
       FROM tarea_plantilla t
      WHERE COALESCE(t.grupo_id, t.id) = $1`,
    [grupo],
  );
}

/**
 * Sacar un día de la rutina.
 *
 * Es la regla de toda la pantalla: lo que nunca se marcó se borra y no deja
 * rastro; lo que sí se usó se desactiva, para no perder el historial de los
 * días en que se hizo.
 */
async function sacarDia(id: string, usada: boolean) {
  if (usada) {
    await consultar(`UPDATE tarea_plantilla SET activa = FALSE WHERE id = $1`, [
      id,
    ]);
  } else {
    await consultar(`DELETE FROM tarea_plantilla WHERE id = $1`, [id]);
  }
}

/**
 * Editar una tarea: cambia en todos los días donde está, y los días marcados
 * pasan a ser los suyos.
 */
export async function editarTarea(datos: FormData) {
  const grupo = String(datos.get("grupoId") ?? "");
  if (!grupo) throw new Error("Falta la tarea");

  const titulo = leerTexto(datos.get("titulo"));
  if (!titulo) throw new Error("Falta el título");

  const dias = diasDe(datos);
  if (dias.length === 0) {
    throw new Error("Elige al menos un día, o usa «Quitar» para sacarla");
  }

  const cruda = String(datos.get("franja") ?? "MANANA");
  const franja = esFranja(cruda) ? cruda : "MANANA";
  const detalle = leerTexto(datos.get("detalle"));

  const filas = await filasDelGrupo(grupo);
  if (filas.length === 0) throw new Error("Esa tarea ya no existe");

  await consultar(
    `UPDATE tarea_plantilla
        SET titulo = $2, detalle = $3, franja = $4
      WHERE COALESCE(grupo_id, id) = $1`,
    [grupo, titulo, detalle, franja],
  );

  const orden = await consultarUna<{ orden: number }>(
    `SELECT COALESCE(MIN(orden), 0) AS orden FROM tarea_plantilla
      WHERE COALESCE(grupo_id, id) = $1`,
    [grupo],
  );

  const queridos = new Set(dias);
  for (const fila of filas) {
    if (!queridos.has(fila.dia_semana)) await sacarDia(fila.id, fila.usada);
  }

  const existentes = new Map(filas.map((f) => [f.dia_semana, f]));
  for (const dia of dias) {
    const fila = existentes.get(dia);
    if (fila) {
      await consultar(
        `UPDATE tarea_plantilla SET activa = TRUE WHERE id = $1`,
        [fila.id],
      );
    } else {
      await consultar(
        `INSERT INTO tarea_plantilla
           (id, grupo_id, titulo, detalle, dia_semana, franja, orden)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [nuevoId(), grupo, titulo, detalle, dia, franja, orden?.orden ?? 0],
      );
    }
  }

  refrescarTareas();
}

/**
 * Quitar la tarea entera de la rutina, o volverla a poner.
 *
 * Al quitarla se aplica la misma regla que al sacar un día: se borra lo que
 * nunca se marcó y se guarda desactivado lo que tiene historial. Por eso una
 * tarea que nunca se usó desaparece del todo, y solo se puede «volver a poner»
 * la que dejó rastro.
 */
export async function alternarActiva(datos: FormData) {
  const grupo = String(datos.get("grupoId") ?? "");
  if (!grupo) return;

  const filas = await filasDelGrupo(grupo);
  if (filas.length === 0) return;

  const activas = await consultarUna<{ cuantas: number }>(
    `SELECT COUNT(*)::int AS cuantas FROM tarea_plantilla
      WHERE COALESCE(grupo_id, id) = $1 AND activa`,
    [grupo],
  );

  if ((activas?.cuantas ?? 0) > 0) {
    for (const fila of filas) await sacarDia(fila.id, fila.usada);
  } else {
    await consultar(
      `UPDATE tarea_plantilla SET activa = TRUE
        WHERE COALESCE(grupo_id, id) = $1`,
      [grupo],
    );
  }

  refrescarTareas();
}
