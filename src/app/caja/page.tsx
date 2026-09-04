import { redirect } from "next/navigation";
import { hoy } from "@/lib/fechas";

/**
 * Lo que se hace veinte veces al día es registrar los pagos de hoy, así que
 * /caja entra directo al día. La semana está a un toque, en el encabezado, y
 * solo para el administrador.
 */
export const dynamic = "force-dynamic";

export default function Caja() {
  redirect(`/caja/dia/${hoy()}`);
}
