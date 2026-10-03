import type { MetadataRoute } from "next";

/**
 * Para poder instalarla en el celular («Agregar a pantalla de inicio») y que
 * abra sin la barra del navegador. Arranca en la tienda; el equipo entra a la
 * administración con el botón de arriba (y las instalaciones viejas siguen
 * abriendo en /caja, que es lo que guardaron al instalar).
 *
 * No hay service worker: sin conexión la app no sirve de todos modos.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Supermercado Adela",
    short_name: "Adela",
    description: "Licores y mercado a domicilio en San Inés Sur, Bogotá. Pide por WhatsApp.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3e9d6",
    theme_color: "#c0392b",
    lang: "es-CO",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
