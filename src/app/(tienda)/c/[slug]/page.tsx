import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api, ErrorCatalogo } from "@/lib/api-catalogo";
import { LEYENDAS_LICOR, leerPublico } from "@/lib/tienda-publica";
import { Estantes } from "@/components/tienda/estantes";
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
      <Estantes categorias={categorias} activa={c.slug} />
      <div className="px-4">
        <h1 className="text-2xl font-black uppercase leading-none">{c.nombre}</h1>
        {c.descripcion && <p className="mt-1 text-sm text-cafe-suave">{c.descripcion}</p>}
      </div>
      {c.productos.length === 0 ? (
        <p className="mx-4 mt-6 rounded-md bg-carton p-6 text-center font-mano text-lg text-cafe-suave">
          Por ahora no hay nada aquí. Pregúntanos por WhatsApp.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 px-4 pb-4 pt-3 sm:grid-cols-3">
          {c.productos.map((p, i) => (
            <Tarjeta key={p.id} p={p} prioridad={i < 4} />
          ))}
        </div>
      )}
      {c.esLicor && (
        <div className="px-4 pb-2 text-center text-[11px] text-cafe-suave">
          {LEYENDAS_LICOR.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
      )}
    </>
  );
}
