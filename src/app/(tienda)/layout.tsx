import type { Viewport } from "next";
import { Barlow, Barlow_Condensed, Yellowtail } from "next/font/google";
import { api } from "@/lib/api-catalogo";
import { leerPublico } from "@/lib/tienda-publica";
import { MarcoTienda, TiendaEnPreparacion } from "@/components/tienda/marco";
import "./neon.css";

/**
 * Las letras de la tienda neón: Barlow Condensed para los letreros y precios,
 * Barlow para leer, y Yellowtail para lo que va «en tubo de neón» (el logo).
 * Se descargan al construir y viajan con la app.
 */
const barlowCond = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-barlow-cond",
  display: "swap",
});
const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});
const yellowtail = Yellowtail({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-yellowtail",
  display: "swap",
});

export const viewport: Viewport = { themeColor: "#07070a", colorScheme: "dark" };

/**
 * La tienda en línea: de noche, con letreros de neón, y su propio encabezado,
 * pie y carrito. La administración no pasa por aquí.
 */
export default async function LayoutTienda({ children }: { children: React.ReactNode }) {
  const datos = await leerPublico(() => Promise.all([api.tienda(), api.catalogo()]));
  return (
    <div className={`neon ${barlowCond.variable} ${barlow.variable} ${yellowtail.variable}`}>
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
