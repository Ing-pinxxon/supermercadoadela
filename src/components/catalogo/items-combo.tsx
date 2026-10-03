"use client";

import { useState } from "react";
import { pesos } from "@/lib/dinero";

type Opcion = { id: number; nombre: string; presentacion: string | null; precio: number };
type Fila = { productoId: number | ""; cantidad: number };

/**
 * Los productos del combo. Va sumando lo que costaría por separado, para que se
 * vea al momento si el precio del combo tiene sentido.
 */
export function ItemsCombo({ opciones, iniciales }: { opciones: Opcion[]; iniciales: Fila[] }) {
  const [filas, setFilas] = useState<Fila[]>(iniciales.length ? iniciales : [{ productoId: "", cantidad: 1 }]);
  const porId = new Map(opciones.map((o) => [o.id, o]));
  const separado = filas.reduce(
    (s, f) => s + (f.productoId === "" ? 0 : (porId.get(f.productoId)?.precio ?? 0) * f.cantidad),
    0,
  );

  const cambiar = (i: number, cambio: Partial<Fila>) =>
    setFilas(filas.map((f, j) => (j === i ? { ...f, ...cambio } : f)));

  return (
    <div className="space-y-2">
      {filas.map((f, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            name="productoId"
            value={f.productoId}
            onChange={(e) => cambiar(i, { productoId: e.target.value === "" ? "" : Number(e.target.value) })}
            aria-label={`Producto ${i + 1}`}
            className="min-w-0 flex-1 rounded-xl bg-crema-50 px-3 py-2.5 text-verde-900"
          >
            <option value="">Elige un producto…</option>
            {opciones.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}
                {o.presentacion ? ` · ${o.presentacion}` : ""}
                {o.precio > 0 ? ` · ${pesos(o.precio)}` : " · sin precio"}
              </option>
            ))}
          </select>
          <input
            name="cantidad"
            type="number"
            min={1}
            max={24}
            value={f.cantidad}
            onChange={(e) => cambiar(i, { cantidad: Math.max(1, Number(e.target.value) || 1) })}
            aria-label={`Cantidad ${i + 1}`}
            className="w-16 rounded-xl bg-crema-50 px-2 py-2.5 text-center text-verde-900"
          />
          <button
            type="button"
            onClick={() => setFilas(filas.length > 1 ? filas.filter((_, j) => j !== i) : [{ productoId: "", cantidad: 1 }])}
            aria-label={`Quitar producto ${i + 1}`}
            className="h-10 w-10 shrink-0 rounded-xl text-rojo ring-1 ring-rojo/30 active:scale-90"
          >
            ✕
          </button>
        </div>
      ))}
      <div className="flex items-center justify-between gap-3">
        {filas.length < 8 && (
          <button
            type="button"
            onClick={() => setFilas([...filas, { productoId: "", cantidad: 1 }])}
            className="text-sm font-semibold text-crema-200"
          >
            + Otro producto
          </button>
        )}
        <span className="text-sm text-tinta-suave">
          Por separado: <span className="tabular font-semibold text-tinta">{pesos(separado)}</span>
        </span>
      </div>
    </div>
  );
}
