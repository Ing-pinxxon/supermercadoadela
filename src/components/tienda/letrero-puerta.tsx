"use client";

import { useEffect, useState } from "react";
import { horaLegible, minutos } from "@/lib/horas";

/**
 * El cartelito de la puerta: «Abierto hasta las 10 p. m.» o «Cerrado · abre a
 * las 7 a. m.». Se calcula en el celular con la hora de Bogotá (no en el
 * servidor, porque la página está guardada en caché y la hora cambia).
 */
export function LetreroPuerta({ abre, cierra }: { abre: string; cierra: string }) {
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

  if (ahora === null) return <span className="h-6 w-28" aria-hidden />;
  const a = minutos(abre);
  const c = minutos(cierra);
  // Si cierra después de medianoche (c < a), está abierto en dos tramos.
  const abierto = c > a ? ahora >= a && ahora < c : ahora >= a || ahora < c;

  return (
    <span
      className={`letrero min-w-0 whitespace-nowrap px-2 py-0.5 text-[12px] ${
        abierto ? "bg-pino text-maiz shadow-[2px_2px_0_var(--color-pino-osc)]" : "bg-[#6b6156] text-white shadow-[2px_2px_0_#463f37]"
      }`}
      style={{ transform: "rotate(3deg)" }}
    >
      {abierto ? `Abierto hasta las ${horaLegible(cierra)}` : `Cerrado · abre a las ${horaLegible(abre)}`}
    </span>
  );
}
