"use server";

import { revalidatePath } from "next/cache";
import { cargarHistorico, crearTablas, sembrarRutina } from "@/lib/instalacion";

function texto(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

/** Crea las tablas y siembra la rutina. Se puede repetir sin miedo. */
export async function prepararBase(): Promise<void> {
  try {
    await crearTablas();
    const tareas = await sembrarRutina();
    console.log(`Base preparada. Rutina: ${tareas} tareas.`);
  } catch (e) {
    console.error("No se pudo preparar la base:", e);
    throw new Error(`No se pudo preparar la base: ${texto(e)}`);
  }
  revalidatePath("/instalar");
}

/** Vuelve a cargar el archivo histórico desde `import/hoja.json`. */
export async function importarHistorico(): Promise<void> {
  try {
    const dias = await cargarHistorico();
    console.log(`Histórico cargado: ${dias} días.`);
  } catch (e) {
    console.error("No se pudo cargar el histórico:", e);
    throw new Error(`No se pudo cargar el histórico: ${texto(e)}`);
  }
  revalidatePath("/instalar");
  revalidatePath("/caja/historico");
}
