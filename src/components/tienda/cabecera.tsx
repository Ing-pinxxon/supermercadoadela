"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Buscador, type Indice } from "@/components/tienda/buscador";
import { IconoCarrito } from "@/components/tienda/carrito";
import { Gorro, IconoWhatsApp, Lupa } from "@/components/tienda/iconos-neon";

type Seccion = { href: string; texto: string };

/**
 * El encabezado de la tienda: logo de neón, buscador, las secciones y el
 * carrito. Va fijo arriba; en el celular, al bajar se esconden el buscador y
 * las secciones (queda una barra delgada con la lupa) y al subir vuelven.
 *
 * También mueve las capas de la portada al bajar y el foco de luz de las
 * vitrinas con el mouse: son detalles de toda la tienda.
 */
export function Cabecera({
  indice,
  secciones,
  menu,
  whatsapp,
  telefono,
}: {
  indice: Indice;
  /** Las secciones del celular (todas) y las del menú del computador (las principales). */
  secciones: Seccion[];
  menu: Seccion[];
  whatsapp: string;
  telefono: string;
}) {
  const ruta = usePathname();
  const cab = useRef<HTMLElement>(null);
  const [compacto, setCompacto] = useState(false);
  const [escondido, setEscondido] = useState(false);
  const [abrirBusca, setAbrirBusca] = useState(0);

  // El alto del encabezado completo, para dejarle su espacio a la página.
  useEffect(() => {
    const medir = () => {
      if (!cab.current || window.scrollY > 4) return;
      document.documentElement.style.setProperty("--alto-cab", `${cab.current.offsetHeight}px`);
    };
    medir();
    const obs = new ResizeObserver(medir);
    if (cab.current) obs.observe(cab.current);
    document.fonts?.ready.then(medir);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    let ultimo = window.scrollY;
    let pendiente = false;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const alBajar = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        pendiente = false;
        const y = window.scrollY;
        setCompacto(y > 70);
        const buscando = document.activeElement?.matches?.("input");
        if (y < 140) setEscondido(false);
        else if (y > ultimo + 8 && !buscando) setEscondido(true);
        else if (y < ultimo - 8) setEscondido(false);
        if (Math.abs(y - ultimo) > 8 || y < 140) ultimo = y;
        if (!quieto) document.querySelector<HTMLElement>(".ne-portada")?.style.setProperty("--py", String(Math.min(y, 700)));
      });
    };
    window.addEventListener("scroll", alBajar, { passive: true });

    // El foco de luz de la vitrina sigue al mouse (solo con mouse).
    const mover = (ev: PointerEvent) => {
      if (ev.pointerType !== "mouse") return;
      const f = (ev.target as Element | null)?.closest?.<HTMLElement>(".ne-foto");
      if (!f) return;
      const r = f.getBoundingClientRect();
      f.style.setProperty("--mx", `${(((ev.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      f.style.setProperty("--my", `${Math.max(-10, ((ev.clientY - r.top) / r.height) * 100 - 35).toFixed(1)}%`);
    };
    const salir = (ev: PointerEvent) => {
      const f = (ev.target as Element | null)?.closest?.<HTMLElement>(".ne-foto");
      if (f && !f.contains(ev.relatedTarget as Node | null)) {
        f.style.removeProperty("--mx");
        f.style.removeProperty("--my");
      }
    };
    document.addEventListener("pointermove", mover, { passive: true });
    document.addEventListener("pointerout", salir);
    return () => {
      window.removeEventListener("scroll", alBajar);
      document.removeEventListener("pointermove", mover);
      document.removeEventListener("pointerout", salir);
    };
  }, []);

  const activa = (href: string) => (href === "/" ? ruta === "/" : ruta.startsWith(href));
  const enlace = (s: Seccion, clase?: string) => (
    <Link key={s.href} href={s.href} className={clase} aria-current={activa(s.href) ? "page" : undefined} prefetch={false}>
      {s.texto}
    </Link>
  );

  return (
    <>
      <header ref={cab} className={`ne-cab${compacto ? " compacto" : ""}${escondido ? " escondido" : ""}`}>
        <div className="ne-fila">
          <Link href="/" className="ne-logo" aria-label="Supermercado Adela, inicio">
            <Gorro />
            <span className="nombre neon-a encender">Adela</span>
            <span className="lema neon-b">Tu tienda y licorera de confianza</span>
          </Link>
          <div className="ne-busca-caja">
            <Buscador indice={indice} abrirDesde={abrirBusca} />
          </div>
          <div className="ne-acciones">
            <button type="button" className="ne-boton-ico ne-lupa" aria-label="Buscar productos" onClick={() => {
                setEscondido(false);
                setAbrirBusca((n) => n + 1);
              }}>
              <Lupa />
            </button>
            <a className="ne-tel" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener">
              <IconoWhatsApp />
              {telefono}
            </a>
            <IconoCarrito />
          </div>
        </div>
        <div className="ne-plegable">
          <div>
            <nav className="ne-chips" aria-label="Secciones">
              {secciones.map((s) => enlace(s, "ne-chip"))}
            </nav>
          </div>
        </div>
        <nav className="ne-menu" aria-label="Secciones">
          {menu.map((s) => enlace(s))}
        </nav>
      </header>
      <div className="ne-espacio" aria-hidden />
    </>
  );
}
