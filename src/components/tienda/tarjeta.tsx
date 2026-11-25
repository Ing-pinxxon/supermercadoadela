import Link from "next/link";
import type { ProductoVista } from "@/lib/api-catalogo";
import { BotonAgregar } from "@/components/tienda/carrito";
import { Vitrina } from "@/components/tienda/vitrina";
import { BolaColgante, Copo, HEX_NEON } from "@/components/tienda/iconos-neon";

/** El color de neón de un producto: el mismo siempre (sale de su id). */
export function colorDe(id: number) {
  return HEX_NEON[id % HEX_NEON.length];
}

/** El letrero de neón pegado en la vitrina. */
export function Estado({ p }: { p: Pick<ProductoVista, "disponibilidad" | "precioAntes" | "icono"> }) {
  if (p.disponibilidad === "AGOTADO") return <span className="ne-marca ag tubo">Agotado</span>;
  if (p.precioAntes) return <span className="ne-marca of tubo">Oferta</span>;
  if (p.disponibilidad === "ULTIMAS") return <span className="ne-marca ul tubo">Últimas</span>;
  if (p.icono === "lata")
    return (
      <span className="ne-marca ul tubo">
        <Copo />
        Bien fría
      </span>
    );
  return null;
}

/** «$ 52.000» con el signo pequeño, como en las vitrinas. */
export function Precio({ valor }: { valor: number }) {
  return (
    <div className="ne-precio">
      <span className="mon">$</span>
      {valor.toLocaleString("es-CO")}
    </div>
  );
}

/**
 * La tarjeta de un producto: la vitrina con el foco de luz, la bola de neón que
 * cuelga, nombre, presentación, precio y el botón amarillo «Agregar».
 */
export function Tarjeta({ p, i = 0, prioridad = false }: { p: ProductoVista; i?: number; prioridad?: boolean }) {
  const agotado = p.disponibilidad === "AGOTADO";
  const color = colorDe(p.id);
  const conMarca = agotado || Boolean(p.precioAntes) || p.disponibilidad === "ULTIMAS" || p.icono === "lata";
  return (
    <article className={`ne-prod${agotado ? " agotado" : ""}`} style={{ ["--acento" as string]: color }}>
      <BolaColgante color={color} derecha={!conMarca && i % 2 === 1} />
      <Link href={`/p/${p.slug}`} className="ne-foto" aria-label={`Ver ${p.nombre}`} prefetch={false}>
        <Estado p={p} />
        <Vitrina p={p} id={`t${p.id}`} sizes="(max-width: 900px) 50vw, 270px" prioridad={prioridad} />
        <span className="ne-ver-mas">Ver detalle</span>
      </Link>
      <div className="ne-datos">
        <h3 className="ne-nom">
          <Link href={`/p/${p.slug}`} prefetch={false}>
            {p.nombre}
          </Link>
        </h3>
        {p.presentacion && <span className="ne-pres">{p.presentacion}</span>}
        <Precio valor={p.precio} />
        {p.precioAntes && (
          <div className="ne-antes">
            Antes <s>$ {p.precioAntes.toLocaleString("es-CO")}</s> · <b>Ahorras $ {(p.precioAntes - p.precio).toLocaleString("es-CO")}</b>
          </div>
        )}
        <div className="ne-control">
          <BotonAgregar
            agotado={agotado}
            articulo={{
              tipo: "PRODUCTO",
              id: p.id,
              nombre: p.nombre,
              presentacion: p.presentacion,
              precio: p.precio,
              esLicor: p.esLicor,
              icono: p.icono,
            }}
          />
        </div>
      </div>
    </article>
  );
}
