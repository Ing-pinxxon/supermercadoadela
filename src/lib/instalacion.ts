/**
 * Puesta en marcha de la base desde la app misma (`/instalar`).
 *
 * En Railway esto se hacía por consola (`railway run npm run db:setup`). En
 * Vercel no hay consola: el despliegue es solo la app, así que las tablas se
 * crean desde una pantalla protegida por la clave del negocio.
 *
 * Todo lo de aquí es idempotente y no borra nada de la operación diaria:
 *  - crear tablas usa `CREATE TABLE IF NOT EXISTS`;
 *  - la rutina solo se siembra si no hay ninguna;
 *  - el histórico sí se reemplaza entero, pero vive en sus propias tablas
 *    (`historico_dia`, `historico_detalle`) y sale siempre de `import/hoja.json`.
 */
import { randomUUID } from "node:crypto";
import { consultar, consultarUna, obtenerPool, origenCadena } from "./db";
import { ESQUEMA_SQL } from "./esquema";
import { TAREAS_INICIALES } from "./rutina";
import { leerHoja, ANCLA } from "../../import/parser.mjs";
import hoja from "../../import/hoja.json";

/** Las tablas que tiene que haber para que la app funcione. */
export const TABLAS = [
  "movimiento",
  "cierre_dia",
  "semana",
  "historico_dia",
  "historico_detalle",
  "tarea_plantilla",
  "tarea_hecha",
  "deudor",
  "fiado",
] as const;

// --- Diagnóstico -------------------------------------------------------

export type EstadoBase = {
  /** Nombre de la variable de entorno que se está usando, si hay alguna. */
  variable: string | null;
  /** Host de la base, sin usuario ni clave. Para confirmar a ojo cuál es. */
  host: string | null;
  conectada: boolean;
  /** Mensaje de error de la conexión, ya en cristiano. */
  error: string | null;
  faltan: string[];
  tareasRutina: number;
  diasHistorico: number;
  diasRegistrados: number;
  /** Servidor de la base, para dejar constancia de contra qué se habló. */
  version: string | null;
};

/** Le quita usuario y clave a la cadena: solo host y nombre de la base. */
function hostDe(cadena: string): string | null {
  try {
    const u = new URL(cadena);
    return `${u.hostname}${u.pathname}`;
  } catch {
    return null;
  }
}

function mensaje(e: unknown): string {
  const texto = e instanceof Error ? e.message : String(e);
  if (/ENOTFOUND|EAI_AGAIN/.test(texto)) {
    return `No se encontró el servidor de la base (${texto}). Revisa que la cadena de conexión esté completa.`;
  }
  if (/password authentication|SASL|no pg_hba/.test(texto)) {
    return `La base rechazó el usuario o la clave (${texto}). Vuelve a copiar la cadena desde Neon.`;
  }
  if (/timeout|ETIMEDOUT/i.test(texto)) {
    return `La base no respondió a tiempo (${texto}). Si el proyecto de Neon estaba dormido, vuelve a intentar.`;
  }
  return texto;
}

export async function estadoBase(): Promise<EstadoBase> {
  const origen = origenCadena();
  const base: EstadoBase = {
    variable: origen?.nombre ?? null,
    host: origen ? hostDe(origen.cadena) : null,
    conectada: false,
    error: origen
      ? null
      : "No hay ninguna variable de conexión. En Vercel: Storage → conectar Neon, o Settings → Environment Variables → DATABASE_URL. Después hay que volver a desplegar.",
    faltan: [...TABLAS],
    tareasRutina: 0,
    diasHistorico: 0,
    diasRegistrados: 0,
    version: null,
  };
  if (!origen) return base;

  try {
    const v = await consultarUna<{ version: string }>(
      `SELECT version() AS version`,
    );
    base.conectada = true;
    base.version = v?.version.split(",")[0] ?? null;
  } catch (e) {
    base.error = mensaje(e);
    return base;
  }

  const existentes = await consultar<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ANY($1)`,
    [[...TABLAS]],
  );
  const hay = new Set(existentes.map((f) => f.table_name));
  base.faltan = TABLAS.filter((t) => !hay.has(t));

  const contar = async (tabla: string) => {
    if (!hay.has(tabla)) return 0;
    const f = await consultarUna<{ t: number }>(
      `SELECT COUNT(*)::int AS t FROM ${tabla}`,
    );
    return f?.t ?? 0;
  };
  base.tareasRutina = await contar("tarea_plantilla");
  base.diasHistorico = await contar("historico_dia");
  base.diasRegistrados = await contar("cierre_dia");

  return base;
}

// --- Acciones ----------------------------------------------------------

/** Crea las tablas que falten. No toca las que ya están. */
export async function crearTablas(): Promise<void> {
  await obtenerPool().query(ESQUEMA_SQL);
}

/** Siembra la rutina semanal, solo si no hay ninguna. Devuelve cuántas quedaron. */
export async function sembrarRutina(): Promise<number> {
  const actual = await consultarUna<{ t: number }>(
    `SELECT COUNT(*)::int AS t FROM tarea_plantilla`,
  );
  if ((actual?.t ?? 0) > 0) return actual?.t ?? 0;

  let orden = 0;
  for (const t of TAREAS_INICIALES) {
    for (const dia of t.dias) {
      await consultar(
        `INSERT INTO tarea_plantilla (id, titulo, detalle, dia_semana, franja, orden)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [randomUUID(), t.titulo, t.detalle ?? null, dia, t.franja, orden],
      );
    }
    orden += 10;
  }
  const fin = await consultarUna<{ t: number }>(
    `SELECT COUNT(*)::int AS t FROM tarea_plantilla`,
  );
  return fin?.t ?? 0;
}

// --- Histórico de la hoja ---------------------------------------------

/** "YYYY-MM-DD" + n días, sin líos de zona horaria. */
function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split("-").map(Number);
  const t = new Date(Date.UTC(a, m - 1, d));
  t.setUTCDate(t.getUTCDate() + dias);
  return t.toISOString().slice(0, 10);
}

type DiaArchivo = {
  fecha: string;
  totalSalidas: number;
  entradas: number;
  venta: number;
  ingreso: number;
  cuadra: boolean;
  detalle: { tipo: "SALIDA" | "ENTRADA"; concepto: string; monto: number }[];
};

/**
 * Lee `import/hoja.json` y arma los días del archivo. Es la misma lógica de
 * `import/importar.mjs`; si se cambia una, hay que cambiar la otra.
 */
export function diasDeLaHoja(): DiaArchivo[] {
  const bloques = leerHoja((hoja as { fileContent: string }).fileContent);

  // El primer bloque de la hoja arranca en domingo (3 de septiembre) y va hasta
  // el sábado; los demás son semanas normales de lunes a domingo.
  const primerLunes = sumarDias(ANCLA.fecha, 8);

  const dias: DiaArchivo[] = [];
  bloques.forEach((bloque, indice) => {
    for (const d of bloque.semana) {
      const fecha =
        indice === 0
          ? sumarDias(ANCLA.fecha, d.dia % 7) // domingo=0, lunes=1, … sábado=6
          : sumarDias(sumarDias(primerLunes, (indice - 1) * 7), d.dia - 1);
      const salidasDetalle = d.salidas.reduce((s, x) => s + x.monto, 0);
      const totalSalidas = d.totalGastosHoja ?? salidasDetalle;
      const entradas = d.entradas.reduce((s, x) => s + x.monto, 0);
      const venta = d.venta ?? 0;

      if (
        totalSalidas === 0 &&
        entradas === 0 &&
        venta === 0 &&
        d.salidas.length === 0
      ) {
        continue; // día en blanco en la hoja
      }

      dias.push({
        fecha,
        totalSalidas,
        entradas,
        venta,
        // Se recalcula con la fórmula, no se copia el "Ingreso BRUTO" de la
        // hoja: así el archivo y la app usan la misma aritmética.
        ingreso: venta + totalSalidas - entradas,
        cuadra: d.totalGastosHoja === null || salidasDetalle === totalSalidas,
        detalle: [
          ...d.salidas.map((x) => ({ ...x, tipo: "SALIDA" as const })),
          ...d.entradas.map((x) => ({ ...x, tipo: "ENTRADA" as const })),
        ],
      });
    }
  });

  return dias;
}

/** Reemplaza el archivo histórico con lo que trae la hoja. Devuelve los días. */
export async function cargarHistorico(): Promise<number> {
  const dias = diasDeLaHoja();
  const cliente = await obtenerPool().connect();
  try {
    await cliente.query("BEGIN");
    await cliente.query("DELETE FROM historico_detalle");
    await cliente.query("DELETE FROM historico_dia");

    for (const d of dias) {
      await cliente.query(
        `INSERT INTO historico_dia
           (fecha, total_salidas, total_entradas, venta_efectivo, ingreso_bruto, detalle_cuadra)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [d.fecha, d.totalSalidas, d.entradas, d.venta, d.ingreso, d.cuadra],
      );
      for (const m of d.detalle) {
        await cliente.query(
          `INSERT INTO historico_detalle (id, fecha, tipo, concepto, monto)
           VALUES ($1, $2, $3, $4, $5)`,
          [randomUUID(), d.fecha, m.tipo, m.concepto, m.monto],
        );
      }
    }
    await cliente.query("COMMIT");
  } catch (e) {
    await cliente.query("ROLLBACK");
    throw e;
  } finally {
    cliente.release();
  }
  return dias.length;
}
