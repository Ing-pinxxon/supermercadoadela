"use client";

import { useEffect, useState } from "react";

/**
 * El «Guardado ✓» de después de registrar algo.
 *
 * Sin esto, guardar un pago deja la pantalla casi igual (el formulario se
 * limpia y el movimiento aparece más abajo, fuera de la vista en el celular) y
 * queda la duda de si quedó o no. Se va solo a los dos segundos y medio.
 */
export function useAviso() {
  const [texto, setTexto] = useState<string | null>(null);

  useEffect(() => {
    if (!texto) return;
    const t = setTimeout(() => setTexto(null), 2500);
    return () => clearTimeout(t);
  }, [texto]);

  return [texto, setTexto] as const;
}

export function Aviso({
  texto,
  tono = "marca",
}: {
  texto: string | null;
  tono?: "marca" | "acento";
}) {
  const color =
    tono === "marca"
      ? "bg-marca-50 text-marca-700 ring-marca-200"
      : "bg-acento-50 text-acento-700 ring-acento-200";

  // Siempre en el árbol, para que los lectores de pantalla lo anuncien.
  return (
    <div role="status" aria-live="polite">
      {texto && (
        <p
          className={`pop flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ring-1 ${color}`}
        >
          <span aria-hidden>✓</span>
          {texto}
        </p>
      )}
    </div>
  );
}
