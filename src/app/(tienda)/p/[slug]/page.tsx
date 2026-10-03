import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ErrorCatalogo } from "@/lib/api-catalogo";
import { pesos } from "@/lib/dinero";
import { LEYENDAS_LICOR, leerPublico } from "@/lib/tienda-publica";
import { Estado, Foto, Tarjeta } from "@/components/tienda/tarjeta";
import { TituloSeccion } from "@/components/tienda/estantes";
import { BarraAgregar } from "@/components/tienda/barra-agregar";
import { JsonLd, datosProducto } from "@/components/tienda/json-ld";

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
    return await leerPublico(() => Promise.all([api.producto(slug), api.tienda()]));
  } catch (e) {
    if (e instanceof ErrorCatalogo && e.estado === 404) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const datos = await traer(slug);
  if (!datos) return {};
  const [{ producto: p, descripcion }, t] = datos;
  const nombre = p.presentacion ? `${p.nombre} ${p.presentacion}` : p.nombre;
  const lugar = [t.barrio, t.ciudad].filter(Boolean).join(", ");
  return {
    title: `${nombre} · ${pesos(p.precio)}`,
    description: descripcion ?? `${nombre} a ${pesos(p.precio)} con domicilio en ${lugar}. Pide por WhatsApp a ${t.nombre}.`,
    alternates: { canonical: `/p/${p.slug}` },
    openGraph: {
      title: nombre,
      description: `${pesos(p.precio)} · ${t.nombre}`,
      ...(p.fotoUrl ? { images: [{ url: p.fotoUrl }] } : {}),
    },
  };
}

export default async function Producto({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const datos = await traer(slug);
  if (!datos) return null;
  const [detalle, tienda] = datos;
  const p = detalle.producto;
  const agotado = p.disponibilidad === "AGOTADO";
  const pastillas = [
    detalle.grados !== null ? `${String(detalle.grados).replace(".", ",")} % alcohol` : null,
    detalle.origen,
    agotado ? "Agotado" : p.disponibilidad === "ULTIMAS" ? "Últimas unidades" : "Disponible",
  ].filter(Boolean) as string[];

  return (
    <>
      <JsonLd datos={datosProducto(detalle, tienda)} />
      <nav className="px-4 py-2.5 text-[13px] font-bold">
        <Link href={`/c/${p.categoriaSlug}`}>← {p.categoria}</Link>
      </nav>

      <div className={`carton relative mx-4 grid aspect-square max-w-full place-items-center rounded-md ${agotado ? "opacity-60 grayscale" : ""}`}>
        <Foto p={p} sizes="(max-width: 640px) 100vw, 560px" prioridad />
        <Estado p={p} />
      </div>

      <div className="px-4 pt-4">
        <h1 className="text-[22px] font-black uppercase leading-[1.05] [text-wrap:balance]">{p.nombre}</h1>
        {p.presentacion && <p className="mt-0.5 text-sm text-cafe-suave">{p.presentacion}</p>}
        <div className="mt-3 flex items-baseline gap-3">
          <span className="etiqueta-precio text-3xl">{pesos(p.precio)}</span>
          {p.precioAntes && <span className="text-sm text-cafe-suave line-through">Antes {pesos(p.precioAntes)}</span>}
        </div>
        {detalle.descripcion && <p className="mt-3 leading-relaxed text-[#4d4033]">{detalle.descripcion}</p>}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {pastillas.map((t) => (
            <span key={t} className="rounded bg-carton px-2.5 py-1 text-xs font-semibold shadow-[inset_0_0_0_1.5px_var(--color-sombra)]">
              {t}
            </span>
          ))}
        </div>
      </div>

      {detalle.relacionados.length > 0 && (
        <>
          <div className="pt-4">
            <TituloSeccion titulo="Va bien con…" />
          </div>
          <div className="tira px-4 pb-4 pt-2.5">
            {detalle.relacionados.map((r) => (
              <Tarjeta key={r.id} p={r} ancho="tira" />
            ))}
          </div>
        </>
      )}

      {p.esLicor && (
        <div className="px-4 pb-2 pt-2 text-[11px] text-cafe-suave">
          {LEYENDAS_LICOR.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
      )}

      <BarraAgregar
        agotado={agotado}
        articulo={{ tipo: "PRODUCTO", id: p.id, nombre: p.nombre, presentacion: p.presentacion, precio: p.precio, esLicor: p.esLicor }}
      />
    </>
  );
}
