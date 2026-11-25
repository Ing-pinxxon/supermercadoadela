import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ErrorCatalogo } from "@/lib/api-catalogo";
import { pesos } from "@/lib/dinero";
import { LEYENDAS_LICOR, leerPublico } from "@/lib/tienda-publica";
import { Estado, Precio, Tarjeta, colorDe } from "@/components/tienda/tarjeta";
import { TituloSeccion } from "@/components/tienda/estantes";
import { BarraAgregar } from "@/components/tienda/barra-agregar";
import { Vitrina } from "@/components/tienda/vitrina";
import { Flecha } from "@/components/tienda/iconos-neon";
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
  ].filter(Boolean) as string[];
  const estado = agotado ? ["ag", "Agotado por ahora"] : p.disponibilidad === "ULTIMAS" ? ["ul", "Quedan pocas"] : ["si", "Disponible"];

  return (
    <>
      <JsonLd datos={datosProducto(detalle, tienda)} />
      <Link href={`/c/${p.categoriaSlug}`} className="ne-miga" prefetch={false}>
        <Flecha /> {p.categoria}
      </Link>

      <article className={`ne-ficha${agotado ? " agotado" : ""}`} style={{ ["--acento" as string]: colorDe(p.id) }}>
        <div className="ne-ficha-foto">
          <Estado p={p} />
          <Vitrina p={p} id={`f${p.id}`} sizes="(max-width: 900px) 100vw, 560px" prioridad />
        </div>
        <div className="ne-info">
          <Link href={`/c/${p.categoriaSlug}`} className="tipo" prefetch={false}>
            {p.categoria}
          </Link>
          <h1>{p.nombre}</h1>
          {p.presentacion && <span className="ne-pres">{p.presentacion}</span>}
          {detalle.descripcion && <p className="desc">{detalle.descripcion}</p>}
          <div className="ne-fila-p">
            <div>
              <Precio valor={p.precio} />
              {p.precioAntes && (
                <div className="ne-antes">
                  Antes <s>{pesos(p.precioAntes)}</s> · <b>Ahorras {pesos(p.precioAntes - p.precio)}</b>
                </div>
              )}
            </div>
            <span className={`ne-estado ${estado[0]}`}>
              <i />
              {estado[1]}
            </span>
          </div>
          {pastillas.length > 0 && (
            <div className="ne-pastillas">
              {pastillas.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          )}
          {p.esLicor && (
            <p className="ne-nota-licor">
              Venta solo a mayores de 18 años. {LEYENDAS_LICOR.join(" ")}
            </p>
          )}
        </div>
      </article>

      {detalle.relacionados.length > 0 && (
        <section className="ne-seccion">
          <div className="ne-ancho">
            <TituloSeccion ceja="Para acompañar" titulo="Va bien con…" />
            <div className="ne-tira">
              {detalle.relacionados.map((r, i) => (
                <Tarjeta key={r.id} p={r} i={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      <BarraAgregar
        agotado={agotado}
        articulo={{ tipo: "PRODUCTO", id: p.id, nombre: p.nombre, presentacion: p.presentacion, precio: p.precio, esLicor: p.esLicor, icono: p.icono }}
      />
    </>
  );
}
