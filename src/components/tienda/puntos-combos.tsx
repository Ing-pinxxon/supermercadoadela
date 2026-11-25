"use client";

import { useEffect, useRef, useState } from "react";

/** Los puntitos bajo la fila de combos del celular: cuál se está viendo. */
export function PuntosCombos({ cantidad }: { cantidad: number }) {
  const [activo, setActivo] = useState(0);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fila = caja.current?.previousElementSibling as HTMLElement | null;
    if (!fila) return;
    const mirar = () => {
      const [a, b] = [fila.children[0] as HTMLElement | undefined, fila.children[1] as HTMLElement | undefined];
      if (!a || !b) return;
      setActivo(Math.round(fila.scrollLeft / (b.offsetLeft - a.offsetLeft)));
    };
    fila.addEventListener("scroll", mirar, { passive: true });
    return () => fila.removeEventListener("scroll", mirar);
  }, []);

  return (
    <div ref={caja} className="ne-puntos" aria-hidden>
      {Array.from({ length: cantidad }, (_, i) => (
        <i key={i} className={i === activo ? "activo" : undefined} />
      ))}
    </div>
  );
}
