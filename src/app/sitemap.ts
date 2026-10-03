import type { MetadataRoute } from "next";
import { api } from "@/lib/api-catalogo";
import { leerPublico } from "@/lib/tienda-publica";
import { SITIO } from "@/components/tienda/json-ld";

export const revalidate = 3600;

/** Las páginas que Google debería conocer: el inicio, cada estante y cada producto. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const inicio = { url: SITIO, changeFrequency: "daily" as const, priority: 1 };
  const catalogo = await leerPublico(() => api.catalogo()).catch(() => null);
  if (!catalogo) return [inicio];
  return [
    inicio,
    ...catalogo.categorias.map((c) => ({
      url: `${SITIO}/c/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...catalogo.categorias.flatMap((c) =>
      c.productos.map((p) => ({
        url: `${SITIO}/p/${p.slug}`,
        changeFrequency: "weekly" as const,
        priority: p.destacado ? 0.7 : 0.6,
      })),
    ),
  ];
}
