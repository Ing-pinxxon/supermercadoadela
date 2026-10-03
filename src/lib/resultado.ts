/**
 * Lo que devuelve una acción del catálogo.
 *
 * Los errores van como datos y no como excepción: en producción Next esconde
 * el texto de las excepciones de las acciones (solo manda un código), y el
 * mensaje de la API —«Ponle precio antes de publicarlo»— es justo lo que la
 * persona necesita leer.
 */
export type Resultado =
  | { ok: true; aviso?: string; id?: number; url?: string }
  | { ok: false; error: string; errores?: Record<string, string> };

export const SIN_CAMBIOS: Resultado = { ok: true };
