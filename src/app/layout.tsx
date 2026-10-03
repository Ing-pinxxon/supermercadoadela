import type { Metadata, Viewport } from "next";
import { Archivo, Cabin, Fraunces, Kalam } from "next/font/google";
import "./globals.css";

/**
 * Las letras de la marca. Se descargan al construir y viajan con la app: el
 * celular no depende de internet para verlas.
 *  - Fraunces: la serif gruesa y redonda de los títulos y las cifras.
 *  - Cabin: la sans limpia de todo lo demás.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz", "SOFT"],
  variable: "--font-fraunces",
  display: "swap",
});

const cabin = Cabin({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cabin",
  display: "swap",
});

/**
 * Las de la tienda en línea: Archivo para todo, Kalam para lo escrito a mano
 * (precios y letreros).
 */
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});

const kalam = Kalam({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-kalam",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITIO_URL ?? "https://supermercadoadela.vercel.app"),
  title: { default: "Supermercado Adela", template: "%s · Supermercado Adela" },
  description:
    "Licores, cerveza y mercado con domicilio en San Inés Sur, Bogotá. Pide por WhatsApp.",
  appleWebApp: { capable: true, title: "Adela", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#234a21",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es-CO"
      className={`${fraunces.variable} ${cabin.variable} ${archivo.variable} ${kalam.variable}`}
    >
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
