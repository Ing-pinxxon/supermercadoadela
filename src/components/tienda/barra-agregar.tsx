"use client";

import { useEffect, useState } from "react";
import { pesos } from "@/lib/dinero";
import { useCarrito, type Articulo } from "@/components/tienda/carrito";

/**
 * La barra fija de abajo en la página del producto: − n + y «Agregar · $».
 * Al agregar, se abre el pedido para que se vea que quedó.
 */
export function BarraAgregar({ articulo, agotado }: { articulo: Articulo; agotado: boolean }) {
  const { agregar, cantidad, abrir, usarBarraPropia } = useCarrito();
  const [n, setN] = useState(1);
  const yaTiene = cantidad(articulo.tipo, articulo.id);

  useEffect(() => {
    usarBarraPropia(true);
    return () => usarBarraPropia(false);
  }, [usarBarraPropia]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-papel via-papel/95 to-transparent px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-6">
      <div className="mx-auto grid max-w-xl grid-cols-[auto_minmax(0,1fr)] gap-2">
        {agotado ? (
          <p className="col-span-2 rounded-lg bg-[#6b6156] py-3.5 text-center font-bold text-white">
            Agotado por ahora
          </p>
        ) : (
          <>
            <div className="carton flex items-center rounded-lg">
              <button type="button" onClick={() => setN(Math.max(1, n - 1))} aria-label="Uno menos" className="h-12 w-11 text-xl font-extrabold">
                −
              </button>
              <span className="tabular min-w-6 text-center font-extrabold">{n}</span>
              <button type="button" onClick={() => setN(Math.min(99, n + 1))} aria-label="Uno más" className="h-12 w-11 text-xl font-extrabold">
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                agregar(articulo, n);
                setN(1);
                if (!articulo.esLicor) abrir();
              }}
              className="rounded-lg bg-pino font-extrabold text-maiz shadow-[3px_3px_0_var(--color-pino-osc)] transition active:translate-y-px active:shadow-none"
            >
              Agregar · {pesos(articulo.precio * n)}
              {yaTiene > 0 && (
                <span className="block text-xs font-semibold opacity-80">Ya tienes {yaTiene} en el pedido</span>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
