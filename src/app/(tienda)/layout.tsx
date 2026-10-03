import type { Viewport } from "next";
import { api } from "@/lib/api-catalogo";
import { leerPublico } from "@/lib/tienda-publica";
import { MarcoTienda, TiendaEnPreparacion } from "@/components/tienda/marco";

export const viewport: Viewport = { themeColor: "#f3e9d6" };

/**
 * La tienda en línea: papel claro, y su propio encabezado, pie y carrito. La
 * administración (verde oscuro) no pasa por aquí.
 */
export default async function LayoutTienda({ children }: { children: React.ReactNode }) {
  const datos = await leerPublico(() => Promise.all([api.tienda(), api.catalogo()]));
  return (
    <div className="tienda papel min-h-screen">
      {datos ? (
        <MarcoTienda tienda={datos[0]} catalogo={datos[1]}>
          {children}
        </MarcoTienda>
      ) : (
        <TiendaEnPreparacion />
      )}
    </div>
  );
}
