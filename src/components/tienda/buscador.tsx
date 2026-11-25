"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { sinTildes } from "@/lib/texto";
import { BotonAgregar } from "@/components/tienda/carrito";
import { Lupa } from "@/components/tienda/iconos-neon";

export type Indice = {
  id: number;
  slug: string;
  nombre: string;
  presentacion: string | null;
  categoria: string;
  precio: number;
  esLicor: boolean;
  agotado: boolean;
  icono: string;
}[];

/**
 * La barra «Busca aguardiente, ron, hielo…». Busca en el celular, sin ir al
 * servidor, sobre la lista de todo lo publicado (es corta).
 *
 * `abrirDesde` lo usa la lupa del encabezado para abrirlo desde afuera.
 */
export function Buscador({ indice, abrirDesde = 0 }: { indice: Indice; abrirDesde?: number }) {
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState("");
  const entrada = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (abrirDesde > 0) setAbierto(true);
  }, [abrirDesde]);

  useEffect(() => {
    if (!abierto) return;
    entrada.current?.focus();
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("keydown", tecla);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = antes;
    };
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
      <button type="button" onClick={() => setAbierto(true)} className="ne-buscar">
        <Lupa />
        <span>Busca aguardiente, ron, hielo…</span>
      </button>

      {abierto && (
        <div className="ne-busqueda" role="dialog" aria-modal aria-label="Buscar">
          <div className="arriba">
            <label className="ne-buscar">
              <Lupa />
              <input
                ref={entrada}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="¿Qué buscas?"
                aria-label="Buscar productos"
              />
            </label>
            <button type="button" onClick={() => setAbierto(false)} className="ne-cerrar" aria-label="Cerrar la búsqueda">
              ✕
            </button>
          </div>
          <ul>
            {q && resultados.length === 0 && (
              <li className="nada">No lo encontramos. Pregúntanos por WhatsApp: a lo mejor lo tenemos en la tienda.</li>
            )}
            {resultados.map((p) => (
              <li key={p.id}>
                <Link href={`/p/${p.slug}`} onClick={() => setAbierto(false)}>
                  <b>{p.nombre}</b>
                  <small>{[p.presentacion, p.categoria].filter(Boolean).join(" · ")}</small>
                </Link>
                <div className="ne-precio">
                  <span className="mon">$</span>
                  {p.precio.toLocaleString("es-CO")}
                </div>
                <div className="ne-control">
                  <BotonAgregar
                    agotado={p.agotado}
                    articulo={{ tipo: "PRODUCTO", id: p.id, nombre: p.nombre, presentacion: p.presentacion, precio: p.precio, esLicor: p.esLicor, icono: p.icono }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

