import type { MetadataRoute } from "next";
import { SITIO } from "@/components/tienda/json-ld";
import { sitio } from "@/lib/sitio";

/** Google lee la tienda; la administración no le interesa a nadie más. */
export default function robots(): MetadataRoute.Robots {
  // La app de todos los días no tiene nada que Google deba ver.
  if (sitio() === "app") return { rules: { userAgent: "*", disallow: "/" } };
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
