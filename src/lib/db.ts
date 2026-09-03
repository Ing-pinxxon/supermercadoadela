import { Pool, types } from "pg";
import { randomUUID } from "node:crypto";

/**
 * Postgres devuelve las columnas DATE como Date de JavaScript aplicando la zona
 * horaria del proceso, lo cual desplaza el día. Aquí le decimos que nos entregue
 * el DATE tal cual viene: el string "YYYY-MM-DD". Es la misma convención que usa
 * todo el proyecto (ver src/lib/fechas.ts).
 */
types.setTypeParser(1082, (valor) => valor);

/**
 * Postgres representa BIGINT y NUMERIC como string para no perder precisión.
 * Como todos nuestros montos caben en un entero, los convertimos a número.
 */
types.setTypeParser(20, (valor) => Number.parseInt(valor, 10));
types.setTypeParser(1700, (valor) => Number.parseFloat(valor));

const globalParaPool = globalThis as unknown as { pool?: Pool };

export const pool =
  globalParaPool.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Railway, Neon y Supabase usan certificados que Node no trae de fábrica.
    ssl: process.env.DATABASE_URL?.includes("localhost")
      ? undefined
      : { rejectUnauthorized: false },
    max: 5,
  });

if (process.env.NODE_ENV !== "production") globalParaPool.pool = pool;

/** Ejecuta una consulta y devuelve las filas ya tipadas. */
export async function consultar<T extends Record<string, unknown>>(
  sql: string,
  valores: unknown[] = [],
): Promise<T[]> {
  const resultado = await pool.query(sql, valores);
  return resultado.rows as T[];
}

/** Igual que `consultar`, pero para cuando se espera una sola fila. */
export async function consultarUna<T extends Record<string, unknown>>(
  sql: string,
  valores: unknown[] = [],
): Promise<T | null> {
  const filas = await consultar<T>(sql, valores);
  return filas[0] ?? null;
}

/** Id corto y legible para las filas nuevas. */
export function nuevoId(): string {
  return randomUUID();
}
