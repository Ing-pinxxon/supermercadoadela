import type { MetadataRoute } from "next";
import { SITIO } from "@/components/tienda/json-ld";

/** Google lee la tienda; la administración no le interesa a nadie más. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/caja", "/fiado", "/tareas", "/instalar", "/entrar", "/salir", "/api/"],
    },
    sitemap: `${SITIO}/sitemap.xml`,
    host: SITIO,
  };
}
