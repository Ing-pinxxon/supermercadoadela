/**
 * Prueba de navegador de los formularios.
 *   npm start -- -p 3100     (en otra terminal, con la base de pruebas)
 *   npm run test:e2e
 *
 * Antes de empezar borra sus propios días de prueba, para que corra las veces
 * que sea y siempre dé lo mismo. Necesita DATABASE_URL, la misma de la app.
 */
import "dotenv/config";
import { chromium } from "playwright";
import { readdirSync } from "node:fs";
import { Pool } from "pg";

const BASE = process.env.BASE ?? "http://localhost:3100";

/**
 * El Chromium de Playwright. La carpeta trae el número de build en el nombre,
 * así que se busca en vez de escribirlo a mano.
 */
function buscarChromium() {
  if (process.env.CHROMIUM) return process.env.CHROMIUM;
  const raiz = "/opt/pw-browsers";
  try {
    const carpeta = readdirSync(raiz).find((c) => /^chromium-\d+$/.test(c));
    if (carpeta) return `${raiz}/${carpeta}/chrome-linux/chrome`;
  } catch {
    // Sin esa carpeta, que Playwright use el que tenga instalado.
  }
  return undefined;
}
let fallos = 0;
function revisar(nombre, ok, extra = "") {
  if (!ok) fallos++;
  console.log(`${ok ? "ok  " : "FALLA"} ${nombre} ${extra}`);
}

const browser = await chromium.launch({ executablePath: buscarChromium() });
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
const errores = [];
page.on("pageerror", (e) => errores.push(String(e)));

const DIA = "2026-09-16"; // miércoles
const OTRO = "2026-09-23"; // el miércoles siguiente

// --- Deja la base como estaba antes de la última corrida ---------------
const cadena = process.env.DATABASE_URL;
if (!cadena) {
  console.error("Falta DATABASE_URL: es la base de pruebas contra la que corre la app.");
  process.exit(1);
}
const local = cadena.includes("localhost") || cadena.includes("127.0.0.1");
const pool = new Pool({
  connectionString: cadena,
  ssl: local ? undefined : { rejectUnauthorized: false },
});
await pool.query(`DELETE FROM movimiento WHERE fecha = ANY($1)`, [[DIA, OTRO]]);
await pool.query(`DELETE FROM cierre_dia WHERE fecha = ANY($1)`, [[DIA, OTRO]]);
await pool.query(`DELETE FROM tarea_hecha WHERE fecha = ANY($1)`, [[DIA, OTRO]]);
await pool.query(`DELETE FROM semana WHERE lunes IN ('2026-09-14','2026-09-07')`);
await pool.query(`DELETE FROM deudor WHERE clave LIKE 'e2e%'`);
await pool.query(`DELETE FROM semana WHERE lunes IN ('2026-09-14','2026-09-07')`);
// La prueba 8 renombra una tarea de la rutina; se le devuelve su nombre.
await pool.query(
  `UPDATE tarea_plantilla SET titulo = 'Abrir y contar base de caja'
    WHERE titulo = 'Tarea editada e2e'`,
);
await pool.end();

// Si la base de pruebas tiene clave, se entra con la de administrador: es la
// única que ve la semana y el histórico.
if (process.env.APP_PIN_ADMIN || process.env.APP_PIN) {
  await page.goto(`${BASE}/entrar`, { waitUntil: "networkidle" });
  await listo();
  await page.fill('input[name="pin"]', process.env.APP_PIN_ADMIN ?? process.env.APP_PIN);
  // Esperar la navegación, no «que la página esté quieta»: como ya lo estaba
  // antes del clic, esperar eso devolvía de una y se seguía sin haber entrado.
  await Promise.all([
    page.waitForURL((u) => !u.pathname.startsWith("/entrar"), { timeout: 15000 }),
    page.click('button:has-text("Entrar")'),
  ]);
}

/**
 * Espera a que React haya tomado la página.
 *
 * Antes de hidratar, los formularios se envían al modo antiguo (recarga
 * completa) y el clic puede perderse; después van por la acción del servidor y
 * refrescan solo la parte que cambió. React marca los nodos del DOM con sus
 * propias propiedades al hidratar, y eso es lo que se mira aquí.
 */
async function listo(selector = "button") {
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      return !!el && Object.keys(el).some((k) => k.startsWith("__react"));
    },
    selector,
    { timeout: 15000 },
  );
}

/** Cuántos movimientos muestra una de las dos listas del día. */
async function contar(lista) {
  const texto = await page.textContent("body");
  return Number(new RegExp(`${lista} \\((\\d+)\\)`, "i").exec(texto)?.[1] ?? -1);
}

/**
 * Espera a que la lista llegue a `n`.
 *
 * El aviso «Guardado ✓» sale en cuanto responde el servidor, pero la lista se
 * vuelve a dibujar un instante después: esperar el aviso (o un tiempo fijo)
 * dejaba leer la página con el movimiento anterior y las fallas salían
 * intermitentes.
 */
async function esperarLista(lista, n) {
  await page.waitForFunction(
    ({ lista, n }) =>
      // textContent y no innerText: el título va en mayúsculas por CSS, y
      // innerText devuelve esa transformación.
      Number(
        new RegExp(`${lista} \\((\\d+)\\)`, "i").exec(document.body.textContent ?? "")?.[1] ?? -1,
      ) === n,
    { lista, n },
    { timeout: 15000 },
  );
}

/** El aviso «Guardado ✓» se va solo a los 2,5 s: hay que leerlo al vuelo. */
async function leerAviso(fragmento) {
  try {
    await page.waitForFunction(
      (f) => (document.querySelector('[role="status"]')?.textContent ?? "").includes(f),
      fragmento,
      { timeout: 15000 },
    );
    return (await page.locator('[role="status"]').textContent()) ?? "";
  } catch {
    return "";
  }
}

/** Registra un movimiento y devuelve el aviso que mostró. */
async function registrar(concepto, monto, boton = "Pagué", medio) {
  const lista = boton === "Pagué" ? "Salidas" : "Entradas";
  const antes = await contar(lista);
  await page.fill("#concepto", concepto);
  await page.fill('input[name="monto"]', monto);
  if (medio) await page.click(`button:has-text("${medio}")`);
  await page.click(`button:has-text("${boton}")`);
  const aviso = await leerAviso(concepto);
  await esperarLista(lista, antes + 1);
  return aviso;
}

/** Espera a que un texto aparezca en la página, sin tumbar la corrida. */
async function esperarTexto(fragmento) {
  await page
    .waitForFunction(
      (f) => (document.body.textContent ?? "").includes(f),
      fragmento,
      { timeout: 15000 },
    )
    .catch(() => {});
}

// 1. Registro rápido de salidas
await page.goto(`${BASE}/caja/dia/${DIA}`, { waitUntil: "networkidle" });
await listo();
await registrar("Postobon", "500.000");
let texto = await page.textContent("body");
revisar("registra el pago", texto.includes("Postobon"));
revisar("el campo se limpia para el siguiente", (await page.inputValue("#concepto")) === "");

await registrar("Trabajador", "50000");
await registrar("Pasteles", "-20000"); // devolución
texto = await page.textContent("body");
revisar("acepta una devolución en negativo", texto.includes("Pasteles"));

// 2. Entrada de plata
const avisoEntrada = await registrar("Prestados ayer", "300000", "Entró plata");
texto = await page.textContent("body");
revisar("separa las entradas de las salidas", texto.includes("Entradas (1)"));
revisar("avisa que quedó guardado", avisoEntrada.includes("Entró $"));

// 3. Venta y fórmula: 1.000.000 + 530.000 − 300.000 = 1.230.000
await page.fill('input[name="ventaEfectivo"]', "1000000");
await page.click('button:has-text("Guardar venta")');
await esperarTexto("1.230.000");
await page.reload({ waitUntil: "networkidle" });
await listo();
texto = await page.textContent("body");
revisar("calcula el ingreso bruto", texto.includes("1.230.000"));
revisar("muestra el total de salidas", texto.includes("530.000"));

// 3b. Un pago por transferencia cuenta igual, pero queda marcado
await registrar("Colanta", "100000", "Pagué", "Transferencia");
await page.reload({ waitUntil: "networkidle" });
await listo();
texto = await page.textContent("body");
revisar("marca el pago por transferencia", texto.includes("Transferencia"));
revisar("y lo suma al ingreso igual que el efectivo", texto.includes("1.330.000"));

// 4. Los chips aprenden del histórico
await page.goto(`${BASE}/caja/dia/${OTRO}`, { waitUntil: "networkidle" });
await listo();
texto = await page.textContent("body");
revisar(
  "sugiere lo que se paga ese día de la semana",
  texto.includes("Postobon") && texto.includes("Trabajador"),
);
await page.click('button:has-text("Postobon")');
revisar("el chip llena el concepto", (await page.inputValue("#concepto")) === "Postobon");

// 5. La semana
await page.goto(`${BASE}/caja/semana?semana=${DIA}`, { waitUntil: "networkidle" });
await listo();
texto = await page.textContent("body");
revisar("la semana suma el ingreso", texto.includes("1.330.000"));
revisar("lista en qué se fue la plata", texto.includes("Postobon"));

await page.fill('input[name="cuentaEfectivo"]', "2000000");
await page.click('button:has-text("Guardar")');
await esperarTexto("Semana anterior");
revisar(
  "guarda la cuenta de efectivo",
  (await page.inputValue('input[name="cuentaEfectivo"]')) === "2000000",
);

// 6. Histórico
await page.goto(`${BASE}/caja/historico`, { waitUntil: "networkidle" });
texto = await page.textContent("body");
revisar("el archivo está cargado", texto.includes("ingreso bruto acumulado"));
revisar("dibuja la gráfica semanal", (await page.locator("svg path").count()) > 0);
revisar("compara por día de la semana", texto.includes("Qué día vendía más"));

// 6b. Fiados: fiar no mueve la caja, abonar sí
await page.goto(`${BASE}/fiado`, { waitUntil: "networkidle" });
await listo();
await page.fill('input[name="nombre"]', "e2e Doña Prueba");
await Promise.all([
  page.waitForURL(/\/fiado\/[^/]+$/, { timeout: 15000 }),
  page.click('button:has-text("Crear")'),
]);

await page.fill('input[name="monto"]', "80000");
await page.click('button:has-text("Se llevó fiado")');
await page.waitForTimeout(1500);
texto = await page.textContent("body");
revisar("fiar deja la deuda", texto.includes("80.000"));

await page.fill('input[name="monto"]', "30000");
await page.click('button:has-text("Abonó")');
await page.waitForTimeout(1500);
texto = await page.textContent("body");
revisar("abonar baja el saldo", texto.includes("50.000"));

await page.goto(`${BASE}/fiado`, { waitUntil: "networkidle" });
await listo();
texto = await page.textContent("body");
revisar("el saldo aparece en la lista", texto.includes("Fiado por cobrar"));

// 7. Tareas siguen funcionando
await page.goto(`${BASE}/tareas?dia=${DIA}`, { waitUntil: "networkidle" });
await listo();
const contador = page.getByText(/\d+ de \d+ hechas/);
const antes = await contador.textContent();
revisar("muestra el avance del día", /\d+ de \d+ hechas/.test(antes ?? ""));

await page.locator("form button[type=submit]").first().click();
// Se recarga antes de mirar: lo que se comprueba aquí es que la marca quedó
// guardada. Que la pantalla se refresque sola es otra cosa — ver el README.
await page.waitForTimeout(1500);
await page.reload({ waitUntil: "networkidle" });
await listo();
const cambio = !(await page.textContent("body")).includes(antes ?? "");
revisar("marcar una tarea cambia el contador", cambio, `(era "${antes}")`);

// 7b. Sacar de la caja de días anteriores
await page.goto(`${BASE}/caja/dia/${DIA}`, { waitUntil: "networkidle" });
await listo();
let enCaja = await contar("Entradas");
await page.fill('input[name="monto"]', "300000");
await page.click('button:has-text("Saqué de la caja")');
revisar("avisa que sacó de la caja", (await leerAviso("Sacaste")).includes("Sacaste"));
await esperarLista("Entradas", enCaja + 1);

enCaja = await contar("Salidas");
await page.fill('input[name="monto"]', "100000");
await page.click('button:has-text("Metí a la caja")');
revisar("avisa que guardó en la caja", (await leerAviso("Guardaste")).includes("Guardaste"));
await esperarLista("Salidas", enCaja + 1);

await page.reload({ waitUntil: "networkidle" });
await listo();
texto = await page.textContent("body");
revisar("el retiro queda marcado en las entradas", texto.includes("De la caja"));
revisar("y lo guardado, en las salidas", texto.includes("A la caja"));
// Antes del retiro el ingreso iba en 1.330.000; los 300.000 sacados de la
// caja no son venta de hoy (−300.000) y los 100.000 guardados salieron del
// cajón (+100.000): 1.130.000.
revisar("el retiro no cuenta como venta de hoy", texto.includes("1.130.000"));

// 7c. La caja de la semana: base + venta − sacado + metido
await page.goto(`${BASE}/caja/semana?semana=${DIA}`, { waitUntil: "networkidle" });
await listo();
await page.fill('input[name="cajaInicial"]', "1000000");
await page.locator('form:has(input[name="cajaInicial"]) button[type=submit]').click();
// El día de la prueba es futuro y no está cerrado, así que su venta todavía
// no entra: 1.000.000 de base + 100.000 metidos − 300.000 sacados = 800.000.
await esperarTexto("Queda en la caja");
await page.reload({ waitUntil: "networkidle" });
await listo();
texto = await page.textContent("body");
const queda = /Queda en la caja\s*\$\s*([\d.]+)/.exec(texto)?.[1];
revisar(
  "la caja suma lo metido y resta lo sacado, sin tocar los pagos",
  queda === "800.000",
  `(dio ${queda})`,
);
revisar("y no resta los pagos del día", !texto.includes("Dejaron los días"));

// 8. Editar una tarea de la rutina
await page.goto(`${BASE}/tareas/rutina`, { waitUntil: "networkidle" });
await listo();
// La primera tarea de la mañana: se le cambia el nombre y se le agrega el miércoles
await page.locator('details summary:has-text("Editar")').first().click();
const formulario = page.locator("details[open] form").first();
const antesTitulo = await formulario.locator('input[name="titulo"]').inputValue();
await formulario.locator('input[name="titulo"]').fill("Tarea editada e2e");
// Marca todos los días, para que salga seguro en el día de la prueba
for (const casilla of await formulario.locator('input[name="diaSemana"]').all()) {
  await casilla.check();
}
await formulario.locator('button[type=submit]').click();
// Esperar a que la lista se vuelva a pintar, no un tiempo fijo.
await page.waitForFunction(
  () => document.body.innerText.includes("Tarea editada e2e"),
  null,
  { timeout: 15000 },
).catch(() => {});
await page.reload({ waitUntil: "networkidle" });
await listo();
texto = await page.textContent("body");
revisar("editar cambia el nombre en la lista", texto.includes("Tarea editada e2e"), `(era "${antesTitulo}")`);
revisar("y deja de estar el nombre viejo", !texto.includes(antesTitulo));

await page.goto(`${BASE}/tareas?dia=${DIA}`, { waitUntil: "networkidle" });
await listo();
texto = await page.textContent("body");
revisar("aparece en el día de la semana que se le agregó", texto.includes("Tarea editada e2e"));

revisar("sin errores de JavaScript", errores.length === 0, errores.join(" | "));

await browser.close();
console.log(fallos === 0 ? "\nTodo bien." : `\n${fallos} falla(s).`);
process.exit(fallos === 0 ? 0 : 1);
