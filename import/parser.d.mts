/**
 * Tipos de `parser.mjs`, para que TypeScript pueda usarlo desde la app
 * (la pantalla `/instalar` carga el histórico con el mismo lector que el
 * script de línea de comandos).
 */
export declare const ANCLA: { fecha: string; bloque: number };

export interface MovimientoHoja {
  concepto: string;
  monto: number;
}

export interface DiaHoja {
  dia: number;
  salidas: MovimientoHoja[];
  entradas: MovimientoHoja[];
  venta: number | null;
  totalGastosHoja: number | null;
  ingresoHoja: number | null;
  cuenta: number | null;
}

export declare function limpiar(texto: string): string;
export declare function leerMonto(texto: string): number | null;
export declare function leerBloque(texto: string): DiaHoja[] | null;
export declare function leerHoja(
  contenido: string,
): { i: number; semana: DiaHoja[] }[];
