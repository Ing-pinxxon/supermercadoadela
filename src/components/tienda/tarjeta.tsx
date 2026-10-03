import Link from "next/link";
import Image from "next/image";
import type { ProductoVista } from "@/lib/api-catalogo";
import { pesos } from "@/lib/dinero";
import { Dibujo, altoDibujo } from "@/components/tienda/dibujos";
import { BotonAgregar } from "@/components/tienda/carrito";

/** El letrero pegado en la foto. */
export function Estado({ p }: { p: Pick<ProductoVista, "disponibilidad" | "precioAntes"> }) {
  if (p.disponibilidad === "AGOTADO")
    return <span className="letrero absolute left-1.5 top-2 bg-[#6b6b6b] px-2 text-xs text-white">Agotado</span>;
  if (p.precioAntes)
    return <span className="letrero absolute left-1.5 top-2 bg-navidad px-2 text-xs text-white">Oferta</span>;
  if (p.disponibilidad === "ULTIMAS")
    return <span className="letrero absolute left-1.5 top-2 bg-pino px-2 text-xs text-maiz">Últimas unidades</span>;
  return null;
}

/** La foto del producto o, si no tiene, el dibujo de su estante. */
export function Foto({
  p,
  sizes,
  prioridad = false,
}: {
  p: Pick<ProductoVista, "fotoUrl" | "nombre" | "icono">;
  sizes: string;
  prioridad?: boolean;
}) {
  return p.fotoUrl ? (
    <Image
      src={p.fotoUrl}
      alt={p.nombre}
      fill
      sizes={sizes}
      priority={prioridad}
      className="object-contain p-2"
    />
  ) : (
    <Dibujo icono={p.icono} className={`${altoDibujo(p.icono)} w-auto`} />
  );
}

/**
 * La tarjeta de un producto, como en la maqueta: foto 4:5 sobre cartón, nombre,
 * presentación, precio en etiqueta amarilla y el «+» abajo a la derecha.
 */
export function Tarjeta({
  p,
  ancho = "auto",
  prioridad = false,
}: {
  p: ProductoVista;
  ancho?: "auto" | "tira";
  prioridad?: boolean;
}) {
  const agotado = p.disponibilidad === "AGOTADO";
  return (
    <article className={`carton relative flex min-w-0 flex-col rounded-md ${ancho === "tira" ? "w-[9.5rem]" : ""}`}>
      <Link href={`/p/${p.slug}`} className="flex flex-1 flex-col" prefetch>
        <div
          className={`relative grid aspect-[4/5] max-w-full place-items-center border-b-2 border-dashed border-raya ${
            agotado ? "opacity-50 grayscale" : ""
          }`}
        >
          <Foto p={p} sizes="(max-width: 640px) 50vw, 200px" prioridad={prioridad} />
          <Estado p={p} />
        </div>
        <div className="flex flex-1 flex-col gap-px px-2.5 pb-12 pt-2">
          <h3 className="text-[13px] font-bold leading-tight">{p.nombre}</h3>
          {p.presentacion && <span className="text-[11px] text-cafe-suave">{p.presentacion}</span>}
          <span className="etiqueta-precio mt-1.5 self-start text-xl">{pesos(p.precio)}</span>
          {p.precioAntes && (
            <span className="mt-0.5 text-[11px] text-cafe-suave line-through">Antes {pesos(p.precioAntes)}</span>
          )}
        </div>
      </Link>
      <div className="absolute bottom-2 right-2">
        <BotonAgregar
          agotado={agotado}
          articulo={{
            tipo: "PRODUCTO",
            id: p.id,
            nombre: p.nombre,
            presentacion: p.presentacion,
            precio: p.precio,
            esLicor: p.esLicor,
          }}
        />
      </div>
    </article>
  );
}
