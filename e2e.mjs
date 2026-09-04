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
await pool.query(`DELETE FROM semana WHERE lunes = '2026-09-14'`);
await pool.query(`DELETE FROM deudor WHERE clave LIKE 'e2e%'`);
// La prueba 8 renombra una tarea de la rutina; se le devuelve su nombre.
await pool.query(
  `UPDATE tarea_plantilla SET titulo = 'Abrir y contar base de caja'
    WHERE titulo = 'Tarea editada e2e'`,
);
await pool.end();

// Si la base de pruebas tiene clave, se entra con la de administrador: es la
// única que ve la semana y el histórico.
if (process.env.APP_PIN_ADMIN || process.env.APP_PIN) {
  await page.goto(`${BASE}/entrar`);
  await page.fill('input[name="pin"]', process.env.APP_PIN_ADMIN ?? process.env.APP_PIN);
  await page.click('button:has-text("Entrar")');
  await page.waitForLoadState("networkidle");
}

async function registrar(concepto, monto, boton = "Pagué", medio) {
  await page.fill("#concepto", concepto);
  await page.fill('input[name="monto"]', monto);
  if (medio) await page.click(`button:has-text("${medio}")`);
  await page.click(`button:has-text("${boton}")`);
  await page.waitForTimeout(1200);
}

// 1. Registro rápido de salidas
await page.goto(`${BASE}/caja/dia/${DIA}`);
await registrar("Postobon", "500.000");
let texto = await page.textContent("body");
revisar("registra el pago", texto.includes("Postobon"));
revisar("el campo se limpia para el siguiente", (await page.inputValue("#concepto")) === "");

await registrar("Trabajador", "50000");
await registrar("Pasteles", "-20000"); // devolución
texto = await page.textContent("body");
revisar("acepta una devolución en negativo", texto.includes("Pasteles"));

// 2. Entrada de plata
await registrar("Prestados ayer", "300000", "Entró plata");
texto = await page.textContent("body");
revisar("separa las entradas de las salidas", texto.includes("Entradas (1)"));
revisar("avisa que quedó guardado", texto.includes("Entró $"));

// 3. Venta y fórmula: 1.000.000 + 530.000 − 300.000 = 1.230.000
await page.fill('input[name="ventaEfectivo"]', "1000000");
await page.click('button:has-text("Guardar venta")');
await page.waitForTimeout(1500);
texto = await page.textContent("body");
revisar("calcula el ingreso bruto", texto.includes("1.230.000"));
revisar("muestra el total de salidas", texto.includes("530.000"));

// 3b. Un pago por transferencia cuenta igual, pero queda marcado
await registrar("Colanta", "100000", "Pagué", "Transferencia");
await page.reload({ waitUntil: "networkidle" });
texto = await page.textContent("body");
revisar("marca el pago por transferencia", texto.includes("Transferencia"));
revisar("y lo suma al ingreso igual que el efectivo", texto.includes("1.330.000"));

// 4. Los chips aprenden del histórico
await page.goto(`${BASE}/caja/dia/${OTRO}`);
texto = await page.textContent("body");
revisar(
  "sugiere lo que se paga ese día de la semana",
  texto.includes("Postobon") && texto.includes("Trabajador"),
);
await page.click('button:has-text("Postobon")');
revisar("el chip llena el concepto", (await page.inputValue("#concepto")) === "Postobon");

// 5. La semana
await page.goto(`${BASE}/caja/semana?semana=${DIA}`);
texto = await page.textContent("body");
revisar("la semana suma el ingreso", texto.includes("1.330.000"));
revisar("lista en qué se fue la plata", texto.includes("Postobon"));

await page.fill('input[name="cuentaEfectivo"]', "2000000");
await page.click('button:has-text("Guardar")');
await page.waitForTimeout(1500);
revisar(
  "guarda la cuenta de efectivo",
  (await page.inputValue('input[name="cuentaEfectivo"]')) === "2000000",
);

// 6. Histórico
await page.goto(`${BASE}/caja/historico`);
texto = await page.textContent("body");
revisar("el archivo está cargado", texto.includes("ingreso bruto acumulado"));
revisar("dibuja la gráfica semanal", (await page.locator("svg path").count()) > 0);
revisar("compara por día de la semana", texto.includes("Qué día vendía más"));

// 6b. Fiados: fiar no mueve la caja, abonar sí
await page.goto(`${BASE}/fiado`);
await page.fill('input[name="nombre"]', "e2e Doña Prueba");
await page.click('button:has-text("Crear")');
await page.waitForLoadState("networkidle");

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

await page.goto(`${BASE}/fiado`);
texto = await page.textContent("body");
revisar("el saldo aparece en la lista", texto.includes("Fiado por cobrar"));

// 7. Tareas siguen funcionando
await page.goto(`${BASE}/tareas?dia=${DIA}`);
const contador = page.getByText(/\d+ de \d+ hechas/);
const antes = await contador.textContent();
revisar("muestra el avance del día", /\d+ de \d+ hechas/.test(antes ?? ""));

await page.locator("form button[type=submit]").first().click();
// Esperar a que el número cambie, no un tiempo fijo: la base puede tardar.
let cambio = false;
try {
  await page.waitForFunction(
    (previo) => !document.body.innerText.includes(previo),
    antes,
    { timeout: 10000 },
  );
  cambio = true;
} catch {
  cambio = false;
}
revisar("marcar una tarea cambia el contador", cambio, `(era "${antes}")`);

// 8. Editar una tarea de la rutina
await page.goto(`${BASE}/tareas/rutina`);
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
texto = await page.textContent("body");
revisar("editar cambia el nombre en la lista", texto.includes("Tarea editada e2e"), `(era "${antesTitulo}")`);
revisar("y deja de estar el nombre viejo", !texto.includes(antesTitulo));

await page.goto(`${BASE}/tareas?dia=${DIA}`);
texto = await page.textContent("body");
revisar("aparece en el día de la semana que se le agregó", texto.includes("Tarea editada e2e"));

revisar("sin errores de JavaScript", errores.length === 0, errores.join(" | "));

await browser.close();
console.log(fallos === 0 ? "\nTodo bien." : `\n${fallos} falla(s).`);
process.exit(fallos === 0 ? 0 : 1);
