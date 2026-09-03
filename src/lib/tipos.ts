export const TIPOS = ["SALIDA", "ENTRADA"] as const;
export type TipoMovimiento = (typeof TIPOS)[number];

export function esTipo(valor: string): valor is TipoMovimiento {
  return (TIPOS as readonly string[]).includes(valor);
}

export type Movimiento = {
  id: string;
  fecha: string;
  tipo: TipoMovimiento;
  concepto: string;
  monto: number;
  nota: string | null;
};

export type CierreDia = {
  fecha: string;
  venta_efectivo: number;
  observaciones: string | null;
  cerrado: boolean;
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
