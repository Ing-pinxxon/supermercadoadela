/**
 * Carga el archivo histórico de la hoja "TIENDA" en la base.
 *
 *   node import/importar.mjs           # muestra qué haría, sin escribir
 *   node import/importar.mjs --escribir
 *
 * Se guardan DOS cosas por día:
 *  - `historico_dia`: los totales tal como los traía la hoja. Son la verdad
 *    para las gráficas, porque son los números que Daniel usó en su momento.
 *  - `historico_detalle`: la lista de pagos concepto por concepto, para poder
 *    ver en qué se iba la plata. En 19 de 182 días la suma del detalle no da
 *    el total de la hoja (así estaba escrito allá), y esos días quedan
 *    marcados con detalle_cuadra = false.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { leerHoja, ANCLA } from "./parser.mjs";

const ESCRIBIR = process.argv.includes("--escribir");

const cadena = process.env.DATABASE_URL;
if (!cadena) {
  console.error("Falta DATABASE_URL.");
  process.exit(1);
}

/** "YYYY-MM-DD" + n días, sin líos de zona horaria. */
function sumarDias(fecha, dias) {
  const [a, m, d] = fecha.split("-").map(Number);
  const t = new Date(Date.UTC(a, m - 1, d));
  t.setUTCDate(t.getUTCDate() + dias);
  return t.toISOString().slice(0, 10);
}

function main() {
  const contenido = JSON.parse(
    readFileSync(new URL("./hoja.json", import.meta.url), "utf8"),
  ).fileContent;

  const bloques = leerHoja(contenido);

  // El primer bloque de la hoja arranca en domingo (3 de septiembre) y va hasta
  // el sábado; los demás son semanas normales de lunes a domingo, corridas a
  // partir del lunes siguiente.
  const primerLunes = sumarDias(ANCLA.fecha, 8); // lunes después de ese sábado

  const dias = [];
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
        // hoja: así el archivo y la app usan exactamente la misma aritmética.
        ingreso: venta + totalSalidas - entradas,
        ingresoHoja: d.ingresoHoja,
        cuadra: d.totalGastosHoja === null || salidasDetalle === totalSalidas,
        detalle: [
          ...d.salidas.map((x) => ({ ...x, tipo: "SALIDA" })),
          ...d.entradas.map((x) => ({ ...x, tipo: "ENTRADA" })),
        ],
      });
    }
  });

  return dias;
}

const dias = main();
const desde = dias[0]?.fecha;
const hasta = dias.at(-1)?.fecha;
const conDetalle = dias.reduce((s, d) => s + d.detalle.length, 0);
const noCuadran = dias.filter((d) => !d.cuadra).length;
const contraHoja = dias.filter(
  (d) => d.ingresoHoja !== null && d.ingresoHoja !== d.ingreso,
).length;

console.log(`Semanas leídas:      ${Math.ceil(dias.length / 7)}`);
console.log(`Días con datos:      ${dias.length}  (${desde} → ${hasta})`);
console.log(`Movimientos:         ${conDetalle}`);
console.log(`Detalle que no suma: ${noCuadran} día(s), quedan marcados`);
console.log(
  `Ingreso recalculado distinto al de la hoja: ${contraHoja} día(s)`,
);
console.log(
  `Ingreso bruto total:  ${dias.reduce((s, d) => s + d.ingreso, 0).toLocaleString("es-CO")}`,
);

if (!ESCRIBIR) {
  console.log("\nEsto fue una simulación. Corre con --escribir para guardar.");
  process.exit(0);
}

const local = cadena.includes("localhost") || cadena.includes("127.0.0.1");
const pool = new Pool({
  connectionString: cadena,
  // Railway, Neon y Supabase usan certificados que Node no trae de fábrica.
  ssl: local ? undefined : { rejectUnauthorized: false },
});

const cliente = await pool.connect();
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
  console.log("\nGuardado.");
} catch (e) {
  await cliente.query("ROLLBACK");
  console.error(e);
  process.exitCode = 1;
} finally {
  cliente.release();
  await pool.end();
}
