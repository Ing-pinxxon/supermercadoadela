"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { obtenerPool, consultarUna, nuevoId } from "@/lib/db";
import { esFechaValida, hoy } from "@/lib/fechas";
import { leerMonto, leerTexto } from "@/lib/dinero";
import { clave } from "@/lib/texto";
import { esMedio, esTipoFiado, type Medio, type TipoFiado } from "@/lib/tipos";

function refrescar(deudorId?: string) {
  revalidatePath("/fiado");
  if (deudorId) revalidatePath(`/fiado/${deudorId}`);
}

/**
 * Encuentra a la persona por su nombre o la crea. La clave normalizada evita
 * que «Doña Rosa» y «dona rosa» terminen como dos deudores distintos.
 */
async function buscarOCrear(nombre: string): Promise<string> {
  const llave = clave(nombre);
  if (!llave) throw new Error("Falta el nombre");

  const fila = await consultarUna<{ id: string }>(
    `INSERT INTO deudor (id, nombre, clave) VALUES ($1, $2, $3)
     ON CONFLICT (clave) DO UPDATE SET nombre = deudor.nombre
     RETURNING id`,
    [nuevoId(), nombre, llave],
  );
  if (!fila) throw new Error("No se pudo guardar la persona");
  return fila.id;
}

/** Crear la persona desde la lista, sin movimientos todavía. */
export async function crearDeudor(datos: FormData) {
  const nombre = leerTexto(datos.get("nombre"));
  if (!nombre) return;

  const id = await buscarOCrear(nombre);
  const telefono = leerTexto(datos.get("telefono"));
  if (telefono) {
    await obtenerPool().query(
      `UPDATE deudor SET telefono = $2 WHERE id = $1`,
      [id, telefono],
    );
  }
  refrescar(id);
  redirect(`/fiado/${id}`);
}

/**
 * Anota un fiado o un abono.
 *
 * Fiar no toca la caja: no entró ni salió plata del cajón, solo nace la deuda.
 * Abonar sí, así que además crea el movimiento de ENTRADA del día y lo deja
 * enlazado — es la misma plata, contada una sola vez.
 */
export async function anotar(datos: FormData) {
  const deudorId = String(datos.get("deudorId") ?? "");
  if (!deudorId) throw new Error("Falta la persona");

  const crudoTipo = String(datos.get("tipo") ?? "FIADO");
  const tipo: TipoFiado = esTipoFiado(crudoTipo) ? crudoTipo : "FIADO";

  const crudoMedio = String(datos.get("medio") ?? "EFECTIVO");
  const medio: Medio = esMedio(crudoMedio) ? crudoMedio : "EFECTIVO";

  const monto = leerMonto(datos.get("monto"));
  if (monto <= 0) return; // el monto siempre es positivo: el tipo dice para dónde

  const posible = String(datos.get("fecha") ?? "");
  const fecha = esFechaValida(posible) ? posible : hoy();
  const nota = leerTexto(datos.get("nota"));

  const persona = await consultarUna<{ nombre: string }>(
    `SELECT nombre FROM deudor WHERE id = $1`,
    [deudorId],
  );
  if (!persona) throw new Error("Esa persona ya no existe");

  const cliente = await obtenerPool().connect();
  try {
    await cliente.query("BEGIN");

    let movimientoId: string | null = null;
    if (tipo === "ABONO") {
      movimientoId = nuevoId();
      await cliente.query(
        `INSERT INTO movimiento (id, fecha, tipo, concepto, monto, medio, nota)
         VALUES ($1, $2, 'ENTRADA', $3, $4, $5, $6)`,
        [
          movimientoId,
          fecha,
          `Abono ${persona.nombre}`,
          monto,
          medio,
          nota,
        ],
      );
    }

    await cliente.query(
      `INSERT INTO fiado
         (id, deudor_id, fecha, tipo, monto, medio, nota, movimiento_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [nuevoId(), deudorId, fecha, tipo, monto, medio, nota, movimientoId],
    );

    await cliente.query("COMMIT");
  } catch (e) {
    await cliente.query("ROLLBACK");
    throw e;
  } finally {
    cliente.release();
  }

  refrescar(deudorId);
  revalidatePath(`/caja/dia/${fecha}`);
  revalidatePath("/caja/semana");
}

/** Borra un movimiento de fiado y, si era un abono, su entrada de caja. */
export async function borrarFiado(datos: FormData) {
  const id = String(datos.get("id") ?? "");
  const deudorId = String(datos.get("deudorId") ?? "");
  if (!id) return;

  const cliente = await obtenerPool().connect();
  try {
    await cliente.query("BEGIN");
    const { rows } = await cliente.query<{
      movimiento_id: string | null;
      fecha: string;
    }>(`DELETE FROM fiado WHERE id = $1 RETURNING movimiento_id, fecha`, [id]);

    const borrado = rows[0];
    if (borrado?.movimiento_id) {
      await cliente.query(`DELETE FROM movimiento WHERE id = $1`, [
        borrado.movimiento_id,
      ]);
    }
    await cliente.query("COMMIT");

    if (borrado) {
      revalidatePath(`/caja/dia/${borrado.fecha}`);
      revalidatePath("/caja/semana");
    }
  } catch (e) {
    await cliente.query("ROLLBACK");
    throw e;
  } finally {
    cliente.release();
  }

  refrescar(deudorId);
}
