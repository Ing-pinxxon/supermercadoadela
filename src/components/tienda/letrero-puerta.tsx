"use client";

import { useEffect, useState } from "react";
import { horaLegible, minutos } from "@/lib/horas";

/** La hora de Bogotá en minutos (0–1439), o null antes de montar. */
function useAhora() {
  const [ahora, setAhora] = useState<number | null>(null);
  useEffect(() => {
    const leer = () => {
      const partes = new Intl.DateTimeFormat("en-GB", {
        timeZone: "America/Bogota",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(new Date());
      setAhora(minutos(partes));
    };
    leer();
    const t = setInterval(leer, 60_000);
    return () => clearInterval(t);
  }, []);
  return ahora;
}

/**
 * Si la tienda está abierta. Se calcula en el celular con la hora de Bogotá
 * (no en el servidor: la página está guardada en caché y la hora cambia).
 */
function useAbierto(abre: string, cierra: string): boolean | null {
  const ahora = useAhora();
  if (ahora === null) return null;
  const a = minutos(abre);
  const c = minutos(cierra);
  // Si cierra después de medianoche (c < a), está abierto en dos tramos.
  return c > a ? ahora >= a && ahora < c : ahora >= a || ahora < c;
}

/** El letrero de neón colgado en la portada: «ABIERTO» en verde o «CERRADO» en rojo. */
export function LetreroPuerta({ abre, cierra }: { abre: string; cierra: string }) {
  const abierto = useAbierto(abre, cierra);
  if (abierto === null) return null;
  return (
    <div className={`ne-abierto tubo encender tarde${abierto ? "" : " no"}`} role="status">
      <b className={abierto ? "neon-v" : "neon-r"}>{abierto ? "Abierto" : "Cerrado"}</b>
      <small>{abierto ? `hasta las ${horaLegible(cierra)}` : `abre a las ${horaLegible(abre)}`}</small>
    </div>
  );
}

/** «Abierto ahora · cierra a las 10 p. m.» con el punto que late, para el pie. */
export function EstadoAhora({ abre, cierra }: { abre: string; cierra: string }) {
  const abierto = useAbierto(abre, cierra);
  if (abierto === null) return <span className="ne-estado" aria-hidden />;
  return (
    <span className={`ne-estado ${abierto ? "si" : "no"}`}>
      <i />
      {abierto ? `Abierto ahora · cierra a las ${horaLegible(cierra)}` : `Cerrado ahora · abre a las ${horaLegible(abre)}`}
    </span>
  );
}
