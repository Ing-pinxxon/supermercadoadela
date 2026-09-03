/**
 * Crea las tablas y carga datos de arranque.
 *   npm run db:setup
 * Es seguro correrlo varias veces: no borra ni duplica nada.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";

const cadena = process.env.DATABASE_URL;
if (!cadena) {
  console.error("Falta DATABASE_URL. Copia .env.example a .env y llénalo.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: cadena,
  ssl: cadena.includes("localhost") ? undefined : { rejectUnauthorized: false },
});

// Rutina semanal de arranque. 1 = lunes ... 7 = domingo.
const TODOS = [1, 2, 3, 4, 5, 6, 7];
const SEMANA = [1, 2, 3, 4, 5, 6];

const TAREAS: {
  titulo: string;
  detalle?: string;
  dias: number[];
  franja: "MANANA" | "TARDE" | "NOCHE";
}[] = [
  {
    titulo: "Abrir y contar base de caja",
    detalle: "Confirmar que la base coincide con el cierre de ayer.",
    dias: TODOS,
    franja: "MANANA",
  },
  { titulo: "Revisar neveras y temperatura", dias: TODOS, franja: "MANANA" },
  {
    titulo: "Surtir góndolas y rotar producto",
    detalle: "Lo próximo a vencer va adelante.",
    dias: SEMANA,
    franja: "MANANA",
  },
  {
    titulo: "Recibir proveedores del día",
    detalle: "Verificar la factura contra lo que llega antes de firmar.",
    dias: SEMANA,
    franja: "MANANA",
  },
  { titulo: "Revisar faltantes y armar pedidos", dias: [1, 4], franja: "TARDE" },
  { titulo: "Barrer y trapear el local", dias: TODOS, franja: "TARDE" },
  {
    titulo: "Conteo de productos de alto valor",
    detalle: "Cigarrillos, licores, pilas, cuchillas.",
    dias: [7],
    franja: "TARDE",
  },
  { titulo: "Sacar basura y reciclaje", dias: [2, 5, 7], franja: "NOCHE" },
  {
    titulo: "Cerrar caja y registrar el día",
    detalle: "Contar el efectivo y registrarlo en la app antes de cerrar.",
    dias: TODOS,
    franja: "NOCHE",
  },
  {
    titulo: "Revisar el cuadre de la semana",
    detalle: "Mirar el reporte semanal y anotar lo que se salió de lo normal.",
    dias: [7],
    franja: "NOCHE",
  },
];

async function main() {
  const sql = readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8");
  await pool.query(sql);
  console.log("Tablas listas.");

  const { rows } = await pool.query<{ total: string }>(
    `SELECT COUNT(*) AS total FROM tarea_plantilla`,
  );

  if (Number(rows[0].total) === 0) {
    let orden = 0;
    for (const t of TAREAS) {
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
