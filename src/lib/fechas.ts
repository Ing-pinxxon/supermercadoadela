/**
 * Manejo de fechas sin dolores de cabeza de zona horaria.
 *
 * Regla del proyecto: una fecha de negocio es siempre un string "YYYY-MM-DD".
 * Al guardarla en Postgres (columna DATE) se convierte a un Date en UTC a las
 * 00:00, que es lo que Prisma espera. Nunca usamos `new Date()` directo para
 * calcular "hoy", porque el servidor corre en UTC y en Bogotá (UTC-5) eso da
 * el día equivocado entre las 7pm y la medianoche.
 */

export const ZONA = "America/Bogota";

export const DIAS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

/** "YYYY-MM-DD" del día de hoy en Bogotá. */
export function hoy(): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return partes; // en-CA ya devuelve YYYY-MM-DD
}

/** Convierte "YYYY-MM-DD" al Date UTC que guarda Postgres. */
export function aDate(fecha: string): Date {
  const [a, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}

/** Convierte el Date que devuelve Prisma a "YYYY-MM-DD". */
export function aTexto(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/** Suma (o resta, con negativos) días a una fecha "YYYY-MM-DD". */
export function sumarDias(fecha: string, dias: number): string {
  const d = aDate(fecha);
  d.setUTCDate(d.getUTCDate() + dias);
  return aTexto(d);
}

/** 1 = lunes ... 7 = domingo */
export function diaSemana(fecha: string): number {
  const dow = aDate(fecha).getUTCDay(); // 0 = domingo
  return dow === 0 ? 7 : dow;
}

/** Lunes de la semana a la que pertenece la fecha. */
export function lunesDe(fecha: string): string {
  return sumarDias(fecha, -(diaSemana(fecha) - 1));
}

/** Los 7 días (lunes a domingo) de la semana de esa fecha. */
export function semanaDe(fecha: string): string[] {
  const lunes = lunesDe(fecha);
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
}

/** "Lun 2 sep" para encabezados compactos. */
export function etiquetaCorta(fecha: string): string {
  const d = aDate(fecha);
  const dia = DIAS[diaSemana(fecha) - 1].slice(0, 3);
  const mes = new Intl.DateTimeFormat("es-CO", {
    month: "short",
    timeZone: "UTC",
  }).format(d);
  return `${dia} ${d.getUTCDate()} ${mes.replace(".", "")}`;
}

/** "Lunes 2 de septiembre de 2026" para títulos. */
export function etiquetaLarga(fecha: string): string {
  const d = aDate(fecha);
  const texto = new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
  return `${DIAS[diaSemana(fecha) - 1]} ${texto}`;
}

/** Valida que un parámetro de URL sea una fecha usable. */
export function esFechaValida(valor: string | undefined): valor is string {
  if (!valor || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const d = aDate(valor);
  return !Number.isNaN(d.getTime()) && aTexto(d) === valor;
}
