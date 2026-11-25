import Image from "next/image";
import { svgVitrina } from "@/lib/vitrina";
import { Dibujo } from "@/components/tienda/dibujos";

type ConFoto = { fotoUrl: string | null; nombre: string; icono: string; presentacion: string | null };

/**
 * Lo que va en la vitrina de un producto: su foto si la tiene; si no, la
 * botella dibujada de su estante; y si el estante no tiene botella (buñuelos,
 * mecato…), el dibujo plano de siempre.
 *
 * `id` tiene que ser distinto en cada lugar de la página donde aparece.
 */
export function Vitrina({ p, id, sizes, prioridad = false }: { p: ConFoto; id: string; sizes: string; prioridad?: boolean }) {
  if (p.fotoUrl) {
    return (
      <span className="ne-vit foto">
        <Image src={p.fotoUrl} alt={p.nombre} fill sizes={sizes} priority={prioridad} />
      </span>
    );
  }
  const svg = svgVitrina(p, id);
  if (svg) return <span className="ne-vit" dangerouslySetInnerHTML={{ __html: svg }} />;
  return (
    <span className="ne-vit plano">
      <Dibujo icono={p.icono} />
    </span>
  );
}

/** El dibujo solo, en pequeño (el pedido, el buscador). */
export function Miniatura({ p, id }: { p: Pick<ConFoto, "nombre" | "icono" | "presentacion">; id: string }) {
  const svg = svgVitrina(p, id);
  if (svg) return <span className="ne-mini" dangerouslySetInnerHTML={{ __html: svg }} />;
  return (
    <span className="ne-mini plano">
      <Dibujo icono={p.icono} />
    </span>
  );
}
