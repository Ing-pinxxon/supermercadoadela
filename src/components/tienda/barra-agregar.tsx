"use client";

import { useEffect, useState } from "react";
import { pesos } from "@/lib/dinero";
import { useCarrito, type Articulo } from "@/components/tienda/carrito";
import { Mas, Menos } from "@/components/tienda/iconos-neon";

/**
 * La barra fija de abajo en la página del producto: − n + y «Agregar · $».
 * Al agregar un producto que no es licor se abre el pedido para que se vea que
 * quedó (al licor primero se le pregunta la edad).
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
    <div className="ne-barra-agregar">
      <div className="dentro">
        {agotado ? (
          <p className="ne-agotado">Agotado por ahora</p>
        ) : (
          <>
            <div className="ne-paso">
              <button type="button" onClick={() => setN(Math.max(1, n - 1))} aria-label="Uno menos">
                <Menos />
              </button>
              <span>{n}</span>
              <button type="button" onClick={() => setN(Math.min(99, n + 1))} aria-label="Uno más">
                <Mas />
              </button>
            </div>
            <button
              type="button"
              onClick={(e) => {
                agregar(articulo, n, e.currentTarget);
                setN(1);
                if (!articulo.esLicor) abrir();
              }}
              className="ne-agregar"
            >
              Agregar · {pesos(articulo.precio * n)}
              {yaTiene > 0 && <small>Ya tienes {yaTiene} en el pedido</small>}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
