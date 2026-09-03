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

/**
 * De dónde sale la cadena de conexión.
 *
 * En Railway y en local es `DATABASE_URL`. La integración de Neon en Vercel
 * crea varias variables de una vez y no siempre incluye ese nombre, así que
 * aceptamos también las suyas. Se prefiere la versión "pooled" (la que pasa por
 * el pgbouncer de Neon), que es la que aguanta serverless.
 */
const NOMBRES_CADENA = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "DATABASE_POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
] as const;

/** La cadena de conexión y de qué variable salió, o null si no hay ninguna. */
export function origenCadena(): { nombre: string; cadena: string } | null {
  for (const nombre of NOMBRES_CADENA) {
    const cadena = process.env[nombre];
    if (cadena && cadena.trim()) return { nombre, cadena: cadena.trim() };
  }
  return null;
}

export function cadenaConexion(): string | null {
  return origenCadena()?.cadena ?? null;
}

/** Opciones del pool, compartidas por la app y por los scripts de `db/`. */
export function opcionesPool(cadena: string) {
  const local =
    cadena.includes("localhost") || cadena.includes("127.0.0.1");
  return {
    connectionString: cadena,
    // Railway, Neon y Supabase usan certificados que Node no trae de fábrica.
    ssl: local ? undefined : { rejectUnauthorized: false },
    // En serverless cada instancia abre su propio pool y Neon corta las
    // conexiones ociosas: pocas conexiones y que se suelten solas.
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  };
}

const globalParaPool = globalThis as unknown as { pool?: Pool };

function crearPool(): Pool {
  const origen = origenCadena();
  if (!origen) {
    throw new Error(
      "Falta la variable de conexión a la base. En Vercel: Settings → " +
        "Environment Variables → DATABASE_URL (o conecta Neon desde la " +
        "pestaña Storage) y vuelve a desplegar.",
    );
  }
  const p = new Pool(opcionesPool(origen.cadena));
  // Sin este manejador, un corte de Neon en una conexión ociosa tumba el
  // proceso entero en vez de reintentar en la siguiente consulta.
  p.on("error", (e) => console.error("Error en una conexión ociosa:", e));
  return p;
}

/**
 * Se crea a la primera consulta, no al importar el módulo: si la variable no
 * está puesta queremos un error que se pueda mostrar en pantalla, no una página
 * que revienta antes de renderizar nada.
 */
export function obtenerPool(): Pool {
  if (!globalParaPool.pool) globalParaPool.pool = crearPool();
  return globalParaPool.pool;
}

/**
 * Compatibilidad: `pool.query(...)` y `pool.connect()` siguen funcionando, pero
 * la conexión se abre en el momento de usarlos.
 */
export const pool = new Proxy({} as Pool, {
  get(_, propiedad, receptor) {
    const real = obtenerPool() as unknown as Record<string | symbol, unknown>;
    const valor = Reflect.get(real, propiedad, receptor);
    return typeof valor === "function" ? valor.bind(real) : valor;
  },
});

/** Ejecuta una consulta y devuelve las filas ya tipadas. */
export async function consultar<T extends Record<string, unknown>>(
  sql: string,
  valores: unknown[] = [],
): Promise<T[]> {
  const resultado = await obtenerPool().query(sql, valores);
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
