/**
 * Crea las tablas y carga datos de arranque.
 *   npm run db:setup
 * Es seguro correrlo varias veces: no borra ni duplica nada.
 *
 * Hace exactamente lo mismo que la pantalla /instalar de la app; esta es la
 * versión de consola, para local o para Railway (`railway run npm run db:setup`).
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { ESQUEMA_SQL } from "../src/lib/esquema";
import { TAREAS_INICIALES } from "../src/lib/rutina";
import { cadenaConexion, opcionesPool } from "../src/lib/db";

const cadena = cadenaConexion();
if (!cadena) {
  console.error("Falta DATABASE_URL. Copia .env.example a .env y llénalo.");
  process.exit(1);
}

const pool = new Pool(opcionesPool(cadena));

async function main() {
  await pool.query(ESQUEMA_SQL);
  console.log("Tablas listas.");

  const { rows } = await pool.query<{ total: string }>(
    `SELECT COUNT(*) AS total FROM tarea_plantilla`,
  );

  if (Number(rows[0].total) === 0) {
    let orden = 0;
    for (const t of TAREAS_INICIALES) {
      for (const dia of t.dias) {
        await pool.query(
          `INSERT INTO tarea_plantilla (id, titulo, detalle, dia_semana, franja, orden)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [randomUUID(), t.titulo, t.detalle ?? null, dia, t.franja, orden],
        );
      }
      orden += 10;
    }
    console.log("Rutina semanal cargada.");
  } else {
    console.log("Ya había rutina cargada; no se tocó.");
  }

  const conteo = await pool.query<{ t: string }>(
    `SELECT COUNT(*) AS t FROM tarea_plantilla`,
  );
  console.log(`Listo: ${conteo.rows[0].t} tareas de rutina.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
