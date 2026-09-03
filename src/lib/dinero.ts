/** Formatea pesos colombianos: 1250000 -> "$ 1.250.000" */
export function pesos(monto: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(monto);
}

/** Solo el número con separadores: 1250000 -> "1.250.000" */
export function numero(monto: number): string {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(
    monto,
  );
}

/**
 * Lee un monto escrito por una persona: "1.250.000", "1250000", "1'250.000",
 * "$ 80.000" o "80000" -> 80000. Devuelve 0 si no hay nada usable.
 */
export function leerMonto(valor: FormDataEntryValue | null): number {
  if (valor === null) return 0;
  const limpio = String(valor).replace(/[^\d-]/g, "");
  if (limpio === "" || limpio === "-") return 0;
  const n = Number.parseInt(limpio, 10);
  return Number.isFinite(n) ? n : 0;
}

/** Lee texto de un formulario, devolviendo null si viene vacío. */
export function leerTexto(valor: FormDataEntryValue | null): string | null {
  if (valor === null) return null;
  const t = String(valor).trim();
  return t === "" ? null : t;
}
