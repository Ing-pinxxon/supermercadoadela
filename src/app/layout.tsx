import type { Metadata, Viewport } from "next";
import { Cabin, Fraunces } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Supermercado Adela",
  description: "Caja, fiados y rutina diaria del negocio.",
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
    <html lang="es-CO" className={`${fraunces.variable} ${cabin.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
