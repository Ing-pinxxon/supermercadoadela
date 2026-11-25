import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api, ErrorCatalogo } from "@/lib/api-catalogo";
import { LEYENDAS_LICOR, leerPublico } from "@/lib/tienda-publica";
import { Categorias, TituloSeccion } from "@/components/tienda/estantes";
import { Tarjeta } from "@/components/tienda/tarjeta";

export const revalidate = 300;

/**
 * Ninguna se arma al construir (la API puede estar dormida); cada una se arma
 * la primera vez que alguien la abre y queda guardada.
 */
export async function generateStaticParams() {
  return [];
}

async function traer(slug: string) {
  try {
    return await leerPublico(() => Promise.all([api.categoria(slug), api.catalogo(), api.tienda()]));
  } catch (e) {
    if (e instanceof ErrorCatalogo && e.estado === 404) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const datos = await traer(slug);
  if (!datos) return {};
  const [c, , t] = datos;
  const lugar = [t.barrio, t.ciudad].filter(Boolean).join(", ");
  return {
    title: `${c.nombre} a domicilio en ${lugar}`,
    description: c.descripcion ?? `${c.nombre} con domicilio en ${lugar}. Pide por WhatsApp a ${t.nombre}.`,
    alternates: { canonical: `/c/${c.slug}` },
  };
}

export default async function Categoria({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const datos = await traer(slug);
  if (!datos) return null;
  const [c, { categorias }] = datos;

  return (
    <>
      <section className="ne-seccion" style={{ paddingTop: 26 }}>
        <div className="ne-ancho">
          <TituloSeccion nivel={1} ceja="Estante" titulo={c.nombre} texto={c.descripcion} />
          {c.productos.length === 0 ? (
            <div className="ne-vacio">
              <b>Por ahora no hay nada aquí</b>
              Pregúntanos por WhatsApp: a lo mejor lo tenemos en la tienda.
            </div>
          ) : (
            <div className="ne-grid">
              {c.productos.map((p, i) => (
                <Tarjeta key={p.id} p={p} i={i} prioridad={i < 4} />
              ))}
            </div>
          )}
          {c.esLicor && (
            <div className="ne-legal" style={{ borderTop: 0 }}>
              {LEYENDAS_LICOR.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="ne-seccion">
        <div className="ne-ancho">
          <TituloSeccion ceja="Sigue mirando" titulo="Otros estantes" />
          <Categorias categorias={categorias} activa={c.slug} />
        </div>
      </section>
    </>
  );
}
