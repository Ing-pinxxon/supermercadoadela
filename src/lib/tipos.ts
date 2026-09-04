export const TIPOS = ["SALIDA", "ENTRADA"] as const;
export type TipoMovimiento = (typeof TIPOS)[number];

export function esTipo(valor: string): valor is TipoMovimiento {
  return (TIPOS as readonly string[]).includes(valor);
}

/**
 * Cómo se movió la plata. Es una etiqueta: para la aritmética de caja una
 * transferencia cuenta igual que el efectivo. Sirve para saber después por
 * dónde salió o entró.
 */
export const MEDIOS = ["EFECTIVO", "TRANSFERENCIA"] as const;
export type Medio = (typeof MEDIOS)[number];

export const ETIQUETA_MEDIO: Record<Medio, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
};

export function esMedio(valor: string): valor is Medio {
  return (MEDIOS as readonly string[]).includes(valor);
}

export type Movimiento = {
  id: string;
  fecha: string;
  tipo: TipoMovimiento;
  concepto: string;
  monto: number;
  medio: Medio;
  nota: string | null;
};

export type CierreDia = {
  fecha: string;
  venta_efectivo: number;
  venta_transferencia: number;
  observaciones: string | null;
  cerrado: boolean;
};

// --- Fiados ----------------------------------------------------------

export const TIPOS_FIADO = ["FIADO", "ABONO"] as const;
export type TipoFiado = (typeof TIPOS_FIADO)[number];

export function esTipoFiado(valor: string): valor is TipoFiado {
  return (TIPOS_FIADO as readonly string[]).includes(valor);
}

export type Deudor = {
  id: string;
  nombre: string;
  clave: string;
  telefono: string | null;
  nota: string | null;
};

export type MovimientoFiado = {
  id: string;
  deudor_id: string;
  fecha: string;
  tipo: TipoFiado;
  monto: number;
  medio: Medio;
  nota: string | null;
  movimiento_id: string | null;
};

export const FRANJAS = ["MANANA", "TARDE", "NOCHE"] as const;
export type Franja = (typeof FRANJAS)[number];

export const ETIQUETA_FRANJA: Record<Franja, string> = {
  MANANA: "Mañana",
  TARDE: "Tarde",
  NOCHE: "Noche",
};

export function esFranja(valor: string): valor is Franja {
  return (FRANJAS as readonly string[]).includes(valor);
}

export type TareaPlantilla = {
  id: string;
  titulo: string;
  detalle: string | null;
  dia_semana: number;
  franja: Franja;
  orden: number;
  activa: boolean;
};
