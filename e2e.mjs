/**
 * Prueba de navegador de los formularios.
 *   npm start -- -p 3100     (en otra terminal, con la base de pruebas)
 *   npm run test:e2e
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3100";
let fallos = 0;
function revisar(nombre, ok, extra = "") {
  if (!ok) fallos++;
  console.log(`${ok ? "ok  " : "FALLA"} ${nombre} ${extra}`);
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium",
});
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
const errores = [];
page.on("pageerror", (e) => errores.push(String(e)));

const DIA = "2026-09-16"; // miércoles
const OTRO = "2026-09-23"; // el miércoles siguiente

async function registrar(concepto, monto, boton = "Pagué") {
  await page.fill("#concepto", concepto);
  await page.fill('input[name="monto"]', monto);
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

// 3. Venta y fórmula: 1.000.000 + 530.000 − 300.000 = 1.230.000
await page.fill('input[name="ventaEfectivo"]', "1000000");
await page.click('button:has-text("Guardar venta")');
await page.waitForTimeout(1500);
texto = await page.textContent("body");
revisar("calcula el ingreso bruto", texto.includes("1.230.000"));
revisar("muestra el total de salidas", texto.includes("530.000"));

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
await page.goto(`${BASE}/caja?semana=${DIA}`);
texto = await page.textContent("body");
revisar("la semana suma el ingreso", texto.includes("1.230.000"));
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

// 7. Tareas siguen funcionando
await page.goto(`${BASE}/tareas?dia=${DIA}`);
const antes = await page.textContent("body");
revisar("muestra el avance del día", /\d+ de \d+ hechas/.test(antes));
await page.locator("form button[type=submit]").first().click();
await page.waitForTimeout(1200);
revisar("marcar una tarea cambia el contador", antes !== (await page.textContent("body")));

revisar("sin errores de JavaScript", errores.length === 0, errores.join(" | "));

await browser.close();
console.log(fallos === 0 ? "\nTodo bien." : `\n${fallos} falla(s).`);
process.exit(fallos === 0 ? 0 : 1);
