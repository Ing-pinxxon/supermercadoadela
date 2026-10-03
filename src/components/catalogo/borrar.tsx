"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Resultado } from "@/lib/resultado";
import { MensajeError } from "@/components/catalogo/form-resultado";

/**
 * Borrar con confirmación en dos toques (sin el `confirm()` del navegador, que
 * en algunas vistas del celular no aparece).
 */
export function BotonBorrar({
  accion,
  volverA,
  texto,
}: {
  accion: () => Promise<Resultado>;
  volverA: string;
  texto: string;
}) {
  const [seguro, setSeguro] = useState(false);
  const [borrando, empezar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={borrando}
        onClick={() => {
          if (!seguro) return setSeguro(true);
          empezar(async () => {
            const r = await accion();
            if (r.ok) {
              router.push(volverA);
              router.refresh();
            } else {
              setError(r.error);
              setSeguro(false);
            }
          });
        }}
        className="inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold text-rojo ring-1 ring-rojo/40 transition hover:bg-rojo/10 active:scale-95 disabled:opacity-60"
      >
        {borrando ? "Borrando…" : seguro ? "Toca otra vez para borrar" : texto}
      </button>
      {error && <MensajeError texto={error} />}
    </div>
  );
}
