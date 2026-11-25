"use client";

import { useEffect, useState } from "react";

type Cuenta = { n: number | null; texto: string };

/** Cuántos días faltan para la novena (16 de diciembre) o para Nochebuena, en Bogotá. */
function calcular(): Cuenta {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .split("-")
    .map(Number);
  const hoy = Date.UTC(y, m - 1, d);
  const dia = 864e5;
  const novena = Date.UTC(y, 11, 16);
  const noche = Date.UTC(y, 11, 24);
  if (hoy < novena) return { n: Math.round((novena - hoy) / dia), texto: "la novena" };
  if (hoy < noche) return { n: Math.round((noche - hoy) / dia), texto: "Nochebuena" };
  if (hoy === noche) return { n: null, texto: "¡Hoy es Nochebuena!" };
  return { n: null, texto: "¡Feliz Navidad, vecino!" };
}

/**
 * El contador de la portada: «21 días para la novena». Se calcula en el
 * celular (la página está en caché y el día cambia).
 */
export function CuentaNovena() {
  const [c, setC] = useState<Cuenta | null>(null);
  useEffect(() => setC(calcular()), []);
  if (!c) return <div className="ne-cuenta sola" aria-hidden style={{ visibility: "hidden" }} />;
  if (c.n === null)
    return (
      <div className="ne-cuenta sola">
        <span>{c.texto}</span>
      </div>
    );
  return (
    <div className="ne-cuenta">
      <b className="tubo neon-r">{c.n}</b>
      <span>
        {c.n === 1 ? "día" : "días"} para
        <br />
        {c.texto}
      </span>
    </div>
  );
}
