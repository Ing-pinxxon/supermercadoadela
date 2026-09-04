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
import { deudores, movimientosDe, saldoDe, totalCartera } from "../src/lib/fiados";
import { clave } from "../src/lib/texto";

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
  // Los deudores de prueba, con sus movimientos (van en cascada).
  await consultar(`DELETE FROM deudor WHERE clave LIKE 'prueba%'`);
}

async function movimiento(
  tipo: string,
  concepto: string,
  monto: number,
  medio = "EFECTIVO",
) {
  await consultar(
    `INSERT INTO movimiento (id, fecha, tipo, concepto, monto, medio)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [nuevoId(), FECHA, tipo, concepto, monto, medio],
  );
}

/** Crea (o encuentra) un deudor de prueba y devuelve su id. */
async function crearDeudor(nombre: string): Promise<string> {
  const fila = await consultarUna<{ id: string }>(
    `INSERT INTO deudor (id, nombre, clave) VALUES ($1, $2, $3)
     ON CONFLICT (clave) DO UPDATE SET nombre = deudor.nombre
     RETURNING id`,
    [nuevoId(), nombre, `prueba${clave(nombre)}`],
  );
  return fila!.id;
}

/** Anota un fiado o un abono; el abono también entra a la caja del día. */
async function fiar(deudorId: string, tipo: "FIADO" | "ABONO", monto: number) {
  let movimientoId: string | null = null;
  if (tipo === "ABONO") {
    movimientoId = nuevoId();
    await consultar(
      `INSERT INTO movimiento (id, fecha, tipo, concepto, monto)
       VALUES ($1, $2, 'ENTRADA', 'Abono prueba', $3)`,
      [movimientoId, FECHA, monto],
    );
  }
  await consultar(
    `INSERT INTO fiado (id, deudor_id, fecha, tipo, monto, movimiento_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [nuevoId(), deudorId, FECHA, tipo, monto, movimientoId],
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

  // --- Cómo se pagó ----------------------------------------------
  // Una transferencia cuenta igual que el efectivo: la fórmula no cambia.
  await movimiento("SALIDA", "Colanta", 100000, "TRANSFERENCIA");
  const conTransf = await resumenDia(FECHA);
  revisar("la transferencia suma a las salidas", conTransf.salidas, 630000);
  revisar(
    "y por lo tanto al ingreso bruto",
    conTransf.ingresoBruto,
    1330000, // 1.000.000 + 630.000 − 300.000
  );
  revisar(
    "queda contado aparte cuánto fue por transferencia",
    conTransf.salidasTransferencia,
    100000,
  );

  // La venta por transferencia va aparte: no toca el bruto, sí el total.
  await consultar(
    `UPDATE cierre_dia SET venta_transferencia = 200000 WHERE fecha = $1`,
    [FECHA],
  );
  const conVenta = await resumenDia(FECHA);
  revisar("la venta por transferencia no toca el bruto", conVenta.ingresoBruto, 1330000);
  revisar("pero sí el total vendido", conVenta.totalVendido, 1530000);
  revisar(
    "la semana también lo lleva aparte",
    (await resumenSemana(FECHA)).totales.totalVendido,
    1530000,
  );

  // --- Fiados ----------------------------------------------------
  const rosa = await crearDeudor("Doña Rosa");
  revisar(
    "el mismo nombre escrito distinto es la misma persona",
    await crearDeudor("dona rosa"),
    rosa,
  );

  await fiar(rosa, "FIADO", 80000);
  revisar("fiar deja la deuda", await saldoDe(rosa), 80000);
  revisar(
    "pero no mueve la caja",
    (await resumenDia(FECHA)).ingresoBruto,
    1330000,
  );

  await fiar(rosa, "ABONO", 30000);
  revisar("abonar baja el saldo", await saldoDe(rosa), 50000);
  const conAbono = await resumenDia(FECHA);
  revisar("el abono entra a la caja", conAbono.entradas, 330000);
  revisar(
    "y por eso baja el ingreso bruto",
    conAbono.ingresoBruto,
    1300000, // la plata del abono no es venta de hoy
  );

  // El total de la cartera es la suma de los saldos: se compara contra la
  // lista, no contra un número fijo, porque en la base puede haber más gente.
  const lista = await deudores();
  revisar(
    "la cartera suma los saldos de todos",
    (await totalCartera()).total,
    lista.reduce((s, d) => s + d.saldo, 0),
  );
  revisar(
    "y aparece en la lista de deudores",
    lista.find((d) => d.id === rosa)?.saldo,
    50000,
  );

  // Borrar el abono se lleva también su entrada de caja.
  const delAbono = (await movimientosDe(rosa)).find((m) => m.tipo === "ABONO");
  await consultar(`DELETE FROM movimiento WHERE id = $1`, [
    delAbono?.movimiento_id,
  ]);
  await consultar(`DELETE FROM fiado WHERE id = $1`, [delAbono?.id]);
  revisar("borrado el abono, vuelve a deber todo", await saldoDe(rosa), 80000);
  revisar(
    "y la caja queda como estaba",
    (await resumenDia(FECHA)).ingresoBruto,
    1330000,
  );

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
