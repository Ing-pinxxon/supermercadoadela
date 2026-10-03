import Image from "next/image";
import type { ComboVista } from "@/lib/api-catalogo";
import { pesos } from "@/lib/dinero";
import { Dibujo } from "@/components/tienda/dibujos";
import { BotonAgregar } from "@/components/tienda/carrito";

/** «Combo de la semana»: dibujo o foto, qué trae, precio y lo que se ahorra. */
export function TarjetaCombo({ c }: { c: ComboVista }) {
  const contenido = c.items.map((i) => `${i.cantidad > 1 ? `${i.cantidad} × ` : ""}${i.nombre}`).join(" + ");
  const ahorro = c.precioPorSeparado - c.precio;
  return (
    <article className="carton mx-4 my-2 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-md p-3.5">
      <div className="relative grid h-20 w-16 place-items-center">
        {c.fotoUrl ? (
          <Image src={c.fotoUrl} alt={c.nombre} fill sizes="64px" className="object-contain" />
        ) : (
          <Dibujo icono="botella-azul" className="h-full w-auto" />
        )}
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-black uppercase">{c.nombre}</h3>
        <p className="text-xs text-cafe-suave">{contenido}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="etiqueta-precio text-lg">{pesos(c.precio)}</span>
          {ahorro > 0 && <span className="text-[11px] text-cafe-suave">Por separado {pesos(c.precioPorSeparado)}</span>}
        </div>
        <div className="mt-2 flex justify-end">
          <BotonAgregar
            agotado={c.disponibilidad === "AGOTADO"}
            articulo={{ tipo: "COMBO", id: c.id, nombre: c.nombre, presentacion: contenido, precio: c.precio, esLicor: c.esLicor }}
          />
        </div>
      </div>
    </article>
  );
}
