/**
 * La rutina semanal con la que arranca el módulo de tareas.
 *
 * Vive aparte y sin dependencias para que la puedan usar tanto la app
 * (`/instalar`) como el script `npm run db:setup`.
 */
// --- Rutina de arranque ------------------------------------------------
// 1 = lunes ... 7 = domingo.
const TODOS = [1, 2, 3, 4, 5, 6, 7];
const SEMANA = [1, 2, 3, 4, 5, 6];

export const TAREAS_INICIALES: {
  titulo: string;
  detalle?: string;
  dias: number[];
  franja: "MANANA" | "TARDE" | "NOCHE";
}[] = [
  {
    titulo: "Abrir y contar base de caja",
    detalle: "Confirmar que la base coincide con el cierre de ayer.",
    dias: TODOS,
    franja: "MANANA",
  },
  { titulo: "Revisar neveras y temperatura", dias: TODOS, franja: "MANANA" },
  {
    titulo: "Surtir góndolas y rotar producto",
    detalle: "Lo próximo a vencer va adelante.",
    dias: SEMANA,
    franja: "MANANA",
  },
  {
    titulo: "Recibir proveedores del día",
    detalle: "Verificar la factura contra lo que llega antes de firmar.",
    dias: SEMANA,
    franja: "MANANA",
  },
  { titulo: "Revisar faltantes y armar pedidos", dias: [1, 4], franja: "TARDE" },
  { titulo: "Barrer y trapear el local", dias: TODOS, franja: "TARDE" },
  {
    titulo: "Conteo de productos de alto valor",
    detalle: "Cigarrillos, licores, pilas, cuchillas.",
    dias: [7],
    franja: "TARDE",
  },
  { titulo: "Sacar basura y reciclaje", dias: [2, 5, 7], franja: "NOCHE" },
  {
    titulo: "Cerrar caja y registrar el día",
    detalle: "Contar el efectivo y registrarlo en la app antes de cerrar.",
    dias: TODOS,
    franja: "NOCHE",
  },
  {
    titulo: "Revisar el cuadre de la semana",
    detalle: "Mirar el reporte semanal y anotar lo que se salió de lo normal.",
    dias: [7],
    franja: "NOCHE",
  },
];
