/**
 * Candado de las pruebas: solo corren contra una base en este computador.
 *
 * `db/verificar.ts` y `e2e.mjs` insertan y BORRAN filas para dejar todo como
 * estaba (verificar borra los movimientos de la semana en curso). Contra la
 * base del negocio eso borraría la caja de verdad, así que antes de conectarse
 * revisan a dónde apuntan y, si no es este computador, no hacen nada.
 */
const LOCALES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function esLocal(cadena) {
  try {
    return LOCALES.has(new URL(cadena).hostname);
  } catch {
    return false;
  }
}

/** Sale con error si alguna de las direcciones no es de este computador. */
export function exigirLocal(direcciones) {
  for (const [nombre, valor] of Object.entries(direcciones)) {
    if (!valor) continue;
    if (!esLocal(valor)) {
      let host = "(no se pudo leer)";
      try {
        host = new URL(valor).hostname;
      } catch {}
      console.error(
        `\nNo se corren las pruebas: ${nombre} apunta a ${host}, no a este computador.\n` +
          "Las pruebas borran datos para limpiar; contra la base del negocio borrarían cuentas reales.\n" +
          "Usa una base local (localhost o 127.0.0.1).\n",
      );
      process.exit(1);
    }
  }
}
