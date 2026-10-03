"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { guardarRelacionados } from "@/app/admin/catalogo/actions";
import { MensajeError } from "@/components/catalogo/form-resultado";
import { Aviso, useAviso } from "@/components/aviso";

type Opcion = { id: number; nombre: string; presentacion: string | null };

/** «Va bien con…»: hasta tres productos que se muestran en la ficha de este. */
export function ElegirRelacionados({
  id,
  elegidos,
  opciones,
}: {
  id: number;
  elegidos: number[];
  opciones: Opcion[];
}) {
  const [lista, setLista] = useState<(number | "")[]>(
    ([...elegidos, "", "", ""] as (number | "")[]).slice(0, 3),
  );
  const [guardando, empezar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useAviso();
  const router = useRouter();

  return (
    <div className="space-y-2">
      {lista.map((valor, i) => (
        <select
          key={i}
          value={valor}
          aria-label={`Sugerido ${i + 1}`}
          onChange={(e) => {
            const nueva = [...lista];
            nueva[i] = e.target.value === "" ? "" : Number(e.target.value);
            setLista(nueva);
          }}
          className="w-full rounded-xl bg-crema-50 px-3 py-2.5 text-verde-900"
        >
          <option value="">— Ninguno —</option>
          {opciones.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nombre}
              {o.presentacion ? ` · ${o.presentacion}` : ""}
            </option>
          ))}
        </select>
      ))}
      <button
        type="button"
        disabled={guardando}
        onClick={() =>
          empezar(async () => {
            setError(null);
            const ids = lista.filter((v): v is number => v !== "");
            const r = await guardarRelacionados(id, ids);
            if (r.ok) {
              setAviso("Guardado");
              router.refresh();
            } else setError(r.error);
          })
        }
        className="inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold ring-1 ring-crema-200/60 transition active:scale-95 disabled:opacity-60"
      >
        {guardando ? "Guardando…" : "Guardar sugeridos"}
      </button>
      {error && <MensajeError texto={error} />}
      <Aviso texto={aviso} />
    </div>
  );
}
