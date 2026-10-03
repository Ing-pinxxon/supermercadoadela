"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/**
 * Lo que se ve cuando la API del catálogo no contesta. En Render gratis eso
 * casi siempre es que estaba dormida: se despierta en un minuto.
 */
export function SinCatalogo({ error }: { error: string }) {
  const router = useRouter();
  const [cargando, empezar] = useTransition();
  return (
    <section className="rounded-2xl bg-superficie p-5 ring-1 ring-borde">
      <h2 className="display text-xl font-black">Conectando con el catálogo…</h2>
      <p className="mt-1 text-sm text-tinta-suave">{error}</p>
      <button
        type="button"
        onClick={() => empezar(() => router.refresh())}
        disabled={cargando}
        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-crema-200 px-5 text-sm font-semibold text-sobre-crema transition active:scale-95 disabled:opacity-60"
      >
        {cargando && <span aria-hidden className="girar h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent" />}
        {cargando ? "Intentando…" : "Intentar de nuevo"}
      </button>
    </section>
  );
}
