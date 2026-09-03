/**
 * Prueba de humo contra una base real: escribe un día completo, verifica que el
 * ingreso bruto dé lo esperado y limpia lo que insertó.
 *   npm run db:verificar
 */
import "dotenv/config";
import { consultar, consultarUna, nuevoId, pool } from "../src/lib/db";
import {
  resumenDia,
  resumenSemana,
  movimientosDelDia,
  conceptosSugeridos,
  mayoresConceptos,
} from "../src/lib/caja";
import { tareasDelDia, avanceSemana } from "../src/lib/tareas";
import {
  semanasActuales,
  compararPromedios,
  semanasArchivo,
} from "../src/lib/historico";
import { diaSemana, lunesDe, sumarDias } from "../src/lib/fechas";

const FECHA = "2026-09-02"; // miércoles
let fallos = 0;

function revisar(nombre: string, real: unknown, esperado: unknown) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) fallos++;
  console.log(
    `${ok ? "ok  " : "FALLA"} ${nombre}${ok ? "" : ` → ${real} (esperado ${esperado})`}`,
  );
}

async function limpiar() {
  const semana = Array.from({ length: 7 }, (_, i) =>
    sumarDias(lunesDe(FECHA), i),
  );
  await consultar(`DELETE FROM movimiento WHERE fecha = ANY($1)`, [semana]);
  await consultar(`DELETE FROM cierre_dia WHERE fecha = ANY($1)`, [semana]);
  await consultar(`DELETE FROM tarea_hecha WHERE fecha = ANY($1)`, [semana]);
  await consultar(`DELETE FROM semana WHERE lunes = $1`, [lunesDe(FECHA)]);
}

async function movimiento(tipo: string, concepto: string, monto: number) {
  await consultar(
    `INSERT INTO movimiento (id, fecha, tipo, concepto, monto)
     VALUES ($1, $2, $3, $4, $5)`,
    [nuevoId(), FECHA, tipo, concepto, monto],
  );
}

async function main() {
  await limpiar();

  const vacio = await resumenDia(FECHA);
  revisar("día en blanco", vacio.hayDatos, false);
  revisar("ingreso de un día en blanco", vacio.ingresoBruto, 0);

  // Un día como los de la hoja.
  await consultar(
    `INSERT INTO cierre_dia (fecha, venta_efectivo) VALUES ($1, 1000000)
     ON CONFLICT (fecha) DO UPDATE SET venta_efectivo = EXCLUDED.venta_efectivo`,
    [FECHA],
  );
  await movimiento("SALIDA", "Postobon", 500000);
  await movimiento("SALIDA", "Trabajador", 50000);
  await movimiento("SALIDA", "Pasteles", -20000); // devolución
  await movimiento("ENTRADA", "Prestados ayer", 300000);

  const r = await resumenDia(FECHA);
  revisar("la fecha vuelve como texto", r.fecha, FECHA);
  revisar("suma de salidas, con la devolución restando", r.salidas, 530000);
  revisar("suma de entradas", r.entradas, 300000);
  revisar("venta en efectivo", r.ventaEfectivo, 1000000);
  // 1.000.000 + 530.000 − 300.000 = 1.230.000 (la fórmula de la hoja)
  revisar("ingreso bruto", r.ingresoBruto, 1230000);
  revisar("hay datos", r.hayDatos, true);

  revisar("lista del día", (await movimientosDelDia(FECHA)).length, 4);

  // --- Semana ----------------------------------------------------
  const semana = await resumenSemana(FECHA);
  revisar("la semana empieza en lunes", semana.dias[0], lunesDe(FECHA));
  revisar("son 7 días", semana.dias.length, 7);
  revisar("ingreso de la semana", semana.totales.ingresoBruto, 1230000);
  revisar("salidas de la semana", semana.totales.salidas, 530000);

  await consultar(
    `INSERT INTO semana (lunes, cuenta_efectivo) VALUES ($1, 2000000)
     ON CONFLICT (lunes) DO UPDATE SET cuenta_efectivo = EXCLUDED.cuenta_efectivo`,
    [lunesDe(FECHA)],
  );
  revisar(
    "cuenta de efectivo de la semana",
    (await resumenSemana(FECHA)).cuentaEfectivo,
    2000000,
  );

  // --- Sugerencias y ranking -------------------------------------
  const conceptos = await mayoresConceptos(
    semana.dias[0],
    semana.dias[6],
    5,
  );
  revisar("el mayor gasto es el proveedor", conceptos[0]?.concepto, "Postobon");

  const siguiente = sumarDias(FECHA, 7); // el miércoles siguiente
  const sug = await conceptosSugeridos(siguiente);
  revisar(
    "sugiere lo que se pagó ese día de la semana",
    sug.frecuentesDelDia.includes("Postobon"),
    true,
  );

  // --- Comparación con el archivo --------------------------------
  const [arch, act] = await Promise.all([semanasArchivo(), semanasActuales()]);
  const comp = compararPromedios(arch, act);
  revisar("el archivo tiene semanas", arch.length > 0, true);
  revisar(
    "una semana con un solo día no cuenta como completa",
    comp.semanasActuales,
    0,
  );

  // --- Tareas ----------------------------------------------------
  const tareas = await tareasDelDia(FECHA);
  revisar("hay tareas ese día", tareas.length > 0, true);

  const primera = tareas[0];
  const marcar = async () =>
    consultar(
      `INSERT INTO tarea_hecha (id, plantilla_id, fecha, hecha)
       VALUES ($1, $2, $3, TRUE)
       ON CONFLICT (plantilla_id, fecha) DO UPDATE SET hecha = NOT tarea_hecha.hecha`,
      [nuevoId(), primera.id, FECHA],
    );

  await marcar();
  revisar(
    "marcar una tarea",
    (await tareasDelDia(FECHA)).find((t) => t.id === primera.id)?.hecha,
    true,
  );
  await marcar();
  revisar(
    "desmarcar la misma tarea",
    (await tareasDelDia(FECHA)).find((t) => t.id === primera.id)?.hecha,
    false,
  );

  revisar("avance cubre 7 días", (await avanceSemana(FECHA)).detalle.length, 7);
  revisar("día de semana correcto", diaSemana(FECHA), 3);

  // --- El archivo no se toca -------------------------------------
  const antes = await consultarUna<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM historico_dia`,
  );
  await limpiar();
  const despues = await consultarUna<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM historico_dia`,
  );
  revisar("borrar lo del día no toca el archivo", despues?.total, antes?.total);
  revisar("día vacío tras limpiar", (await resumenDia(FECHA)).hayDatos, false);

  console.log(fallos === 0 ? "\nTodo bien." : `\n${fallos} falla(s).`);
  if (fallos > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
