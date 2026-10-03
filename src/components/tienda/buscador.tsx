"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { pesos } from "@/lib/dinero";
import { sinTildes } from "@/lib/texto";
import { BotonAgregar } from "@/components/tienda/carrito";

export type Indice = {
  id: number;
  slug: string;
  nombre: string;
  presentacion: string | null;
  categoria: string;
  precio: number;
  esLicor: boolean;
  agotado: boolean;
}[];

/**
 * La barra «Busca aguardiente, hielo, buñuelos…». Busca en el celular, sin ir
 * al servidor, sobre la lista de todo lo publicado (es corta).
 */
export function Buscador({ indice }: { indice: Indice }) {
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState("");
  const entrada = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!abierto) return;
    entrada.current?.focus();
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [abierto]);

  const resultados = useMemo(() => {
    const palabras = sinTildes(q.toLowerCase()).split(/\s+/).filter(Boolean);
    if (palabras.length === 0) return [];
    return indice
      .filter((p) => {
        const texto = sinTildes(`${p.nombre} ${p.presentacion ?? ""} ${p.categoria}`.toLowerCase());
        return palabras.every((w) => texto.includes(w));
      })
      .slice(0, 30);
  }, [q, indice]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="mt-2.5 flex w-full items-center gap-2 rounded-md bg-carton px-3 py-2.5 text-left text-sm text-cafe-suave shadow-[inset_0_0_0_1.5px_var(--color-sombra)]"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
        Busca aguardiente, hielo, buñuelos…
      </button>

      {abierto && (
        <div className="fixed inset-0 z-40 flex flex-col bg-papel" role="dialog" aria-modal aria-label="Buscar">
          <div className="flex items-center gap-2 border-b-2 border-dashed border-sombra p-3">
            <input
              ref={entrada}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="¿Qué buscas?"
              aria-label="Buscar productos"
              className="min-w-0 flex-1 rounded-md border-[1.5px] border-sombra bg-white px-3 py-2.5 text-cafe"
            />
            <button type="button" onClick={() => setAbierto(false)} className="font-mano text-lg text-navidad">
              Cerrar
            </button>
          </div>
          <ul className="flex-1 overflow-y-auto px-3 pb-24">
            {q && resultados.length === 0 && (
              <li className="py-8 text-center font-mano text-lg text-cafe-suave">
                No lo encontramos. Pregúntanos por WhatsApp: a lo mejor lo tenemos.
              </li>
            )}
            {resultados.map((p) => (
              <li key={p.id} className="flex items-center gap-3 border-b border-dashed border-raya py-3">
                <Link href={`/p/${p.slug}`} onClick={() => setAbierto(false)} className="min-w-0 flex-1">
                  <span className="block font-bold leading-tight">{p.nombre}</span>
                  <span className="text-xs text-cafe-suave">
                    {[p.presentacion, p.categoria].filter(Boolean).join(" · ")}
                  </span>
                </Link>
                <span className="etiqueta-precio shrink-0 text-lg">{pesos(p.precio)}</span>
                <BotonAgregar
                  agotado={p.agotado}
                  articulo={{ tipo: "PRODUCTO", id: p.id, nombre: p.nombre, presentacion: p.presentacion, precio: p.precio, esLicor: p.esLicor }}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
