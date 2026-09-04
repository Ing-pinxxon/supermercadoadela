import type { MetadataRoute } from "next";

/**
 * Para poder instalarla en el celular («Agregar a pantalla de inicio») y que
 * abra sin la barra del navegador. Arranca en /caja, que es el día de hoy.
 *
 * No hay service worker: sin conexión la app no sirve de todos modos, porque
 * todo sale de la base.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Supermercado Adela",
    short_name: "Adela",
    description: "Caja, fiados y rutina diaria del negocio.",
    start_url: "/caja",
    display: "standalone",
    background_color: "#f6f7f9",
    theme_color: "#15803d",
    lang: "es-CO",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
