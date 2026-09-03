/**
 * Lee la exportación de la hoja "TIENDA" y la convierte en movimientos y
 * cierres diarios.
 *
 * La hoja son ~27 bloques, uno por semana, con la misma forma: una fila de
 * encabezado con LUNES…DOMINGO (cada día ocupa dos columnas: concepto y monto)
 * y debajo una lista de pagos. Al final de cada bloque hay filas con etiqueta
 * conocida (Total Gastos, VENTA EFECTIVO, Prestados Ayer, Ingreso BRUTO…).
 *
 * Solo el primer bloque trae fechas ("Semana del: septiembre 3", 03/09 domingo).
 * El 3 de septiembre cayó domingo en 2023, así que ese es el ancla; los bloques
 * siguientes son semanas consecutivas. Si el año está mal, se cambia AQUÍ.
 */
export const ANCLA = { fecha: "2023-09-03", bloque: 0 }; // domingo

const DIAS = [
  "LUNES",
  "MARTES",
  "MIERCOLES",
  "MIÉRCOLES",
  "JUEVES",
  "VIERNES",
  "SABADO",
  "SÁBADO",
  "DOMINGO",
];

const NORMAL = {
  LUNES: 1,
  MARTES: 2,
  MIERCOLES: 3,
  MIÉRCOLES: 3,
  JUEVES: 4,
  VIERNES: 5,
  SABADO: 6,
  SÁBADO: 6,
  DOMINGO: 7,
};

/** Etiquetas de las filas de resumen, en minúsculas y sin tildes. */
const ETIQUETAS = {
  "total gastos": "TOTAL_GASTOS",
  "venta efectivo": "VENTA",
  "venta en efectivo": "VENTA",
  "ingreso bruto": "INGRESO",
  ingreso: "INGRESO",
  "ingresos bruto": "INGRESO",
  "prestados ayer": "ENTRADA",
  prestados: "ENTRADA",
  "venta ayer": "ENTRADA",
  "se agrega": "ENTRADA",
  anadido: "ENTRADA",
  "cuenta efectivo": "CUENTA",
  "cuenta semana anterior": "CUENTA_ANTERIOR",
  notas: "IGNORAR",
  calculo: "IGNORAR",
  total: "IGNORAR",
  "gastos total": "IGNORAR",
  "entrada total": "IGNORAR",
  "precio total": "IGNORAR",
  unidades: "IGNORAR",
  "valor c/u": "IGNORAR",
  "valor mas 20%": "IGNORAR",
};

export function limpiar(texto) {
  return (texto ?? "")
    .replace(/\\\[merged\\\]/g, "")
    .replace(/\[merged\]/g, "")
    .replace(/￼/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sinTildes(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** "$1.250.000,00" → 1250000 ; "-$20.000" → -20000 ; "23000" → 23000 */
export function leerMonto(texto) {
  const t = limpiar(texto);
  if (!t) return null;
  const negativo = /^[-–—\\]/.test(t) || /\(-/.test(t);
  // Quita el símbolo, los puntos de miles y los decimales ",00".
  const solo = t.replace(/[^\d,.-]/g, "");
  if (!/\d/.test(solo)) return null;
  const sinDecimales = solo.replace(/,\d{1,2}$/, "");
  const digitos = sinDecimales.replace(/[^\d]/g, "");
  if (!digitos) return null;
  const n = Number.parseInt(digitos, 10);
  if (!Number.isFinite(n)) return null;
  return negativo ? -n : n;
}

/**
 * Descarta lo que no es un pago: las notas que Daniel escribía a lo ancho de la
 * fila ("DANIEL HACE UNA INVERSIÓN DE …", que por el merge cae en la columna de
 * cada día) y las columnas auxiliares de cálculo, cuyo "concepto" es un número.
 */
function esPagoReal(concepto) {
  if (/inversi[oó]n/i.test(concepto)) return false;
  if (/^[\d.,$\s]+$/.test(concepto)) return false;
  if (concepto.length < 2) return false;
  return true;
}

function celdas(linea) {
  // "|  a  |  b  |" → ["a", "b"]  (conserva las posiciones vacías)
  const partes = linea.split("|");
  return partes.slice(1, partes.length - 1).map((c) => limpiar(c));
}

/**
 * Encuentra la fila de encabezado con los días y devuelve, para cada día,
 * el índice de su columna de concepto.
 */
function columnasDeDias(filas) {
  for (const fila of filas) {
    const c = celdas(fila);
    const encontrados = [];
    for (let i = 0; i < c.length; i++) {
      const v = sinTildes(c[i]).toUpperCase();
      if (DIAS.includes(v) || DIAS.includes(c[i].toUpperCase())) {
        const dia = NORMAL[c[i].toUpperCase()] ?? NORMAL[v];
        // Cada día ocupa dos columnas iguales por el merge; nos quedamos con la primera.
        if (encontrados.length && encontrados.at(-1).dia === dia) continue;
        encontrados.push({ dia, col: i });
      }
    }
    if (encontrados.length >= 5) return encontrados;
  }
  return null;
}

/** Parte un bloque (una semana) en datos por día. */
export function leerBloque(texto) {
  const filas = texto.split("\n").filter((l) => l.trim().startsWith("|"));
  const columnas = columnasDeDias(filas);
  if (!columnas) return null;

  const porDia = new Map(
    columnas.map((c) => [
      c.dia,
      {
        dia: c.dia,
        salidas: [],
        entradas: [],
        venta: null,
        totalGastosHoja: null,
        ingresoHoja: null,
        cuenta: null,
      },
    ]),
  );

  for (const fila of filas) {
    const c = celdas(fila);
    for (const { dia, col } of columnas) {
      const concepto = c[col] ?? "";
      const montoTexto = c[col + 1] ?? "";
      if (!concepto) continue;

      const clave = sinTildes(concepto).toLowerCase().replace(/[:.]/g, "").trim();
      const etiqueta = ETIQUETAS[clave];
      const monto = leerMonto(montoTexto);
      const d = porDia.get(dia);

      if (etiqueta === "IGNORAR") continue;
      if (etiqueta === "TOTAL_GASTOS") {
        d.totalGastosHoja = monto;
      } else if (etiqueta === "VENTA") {
        d.venta = monto;
      } else if (etiqueta === "INGRESO") {
        d.ingresoHoja = monto;
      } else if (etiqueta === "ENTRADA") {
        if (monto) d.entradas.push({ concepto, monto });
      } else if (etiqueta === "CUENTA" || etiqueta === "CUENTA_ANTERIOR") {
        if (monto) d.cuenta = monto;
      } else if (monto !== null && monto !== 0 && esPagoReal(concepto)) {
        // Cualquier otra cosa con nombre y plata es un pago del día.
        d.salidas.push({ concepto, monto });
      }
    }
  }

  return [...porDia.values()].sort((a, b) => a.dia - b.dia);
}

export function leerHoja(contenido) {
  return contenido
    .split("\n\n")
    .map((b, i) => ({ i, semana: leerBloque(b) }))
    .filter((b) => b.semana !== null);
}
