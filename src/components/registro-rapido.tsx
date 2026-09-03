"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { agregarMovimiento } from "@/app/caja/actions";

function Botones() {
  const { pending } = useFormStatus();
  const base =
    "flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition disabled:opacity-50";
  return (
    <div className="flex gap-2">
      <button
        type="submit"
        name="tipo"
        value="SALIDA"
        disabled={pending}
        className={`${base} bg-gray-900 text-white hover:bg-gray-800`}
      >
        {pending ? "Guardando…" : "Pagué"}
      </button>
      <button
        type="submit"
        name="tipo"
        value="ENTRADA"
        disabled={pending}
        className={`${base} bg-white text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50`}
      >
        Entró plata
      </button>
    </div>
  );
}

/**
 * El formulario que se usa veinte veces al día: concepto, monto y un botón.
 * Los chips son los conceptos que suelen pagarse ese día de la semana,
 * calculados a partir de lo ya registrado — no hay lista que mantener.
 */
export function RegistroRapido({
  fecha,
  frecuentes,
  todos,
}: {
  fecha: string;
  frecuentes: string[];
  todos: string[];
}) {
  const [concepto, setConcepto] = useState("");
  const montoRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (datos) => {
        await agregarMovimiento(datos);
        setConcepto("");
        formRef.current?.reset();
        // Deja el foco listo para el siguiente registro.
        formRef.current?.querySelector<HTMLInputElement>("#concepto")?.focus();
      }}
      className="space-y-3"
    >
      <input type="hidden" name="fecha" value={fecha} />

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          id="concepto"
          name="concepto"
          list="conceptos-conocidos"
          required
          autoComplete="off"
          placeholder="A quién / de qué"
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-100"
        />
        <input
          ref={montoRef}
          name="monto"
          inputMode="numeric"
          required
          placeholder="Monto"
          className="monto w-full rounded-xl border border-gray-300 bg-white px-3 py-3 outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-100 sm:w-40"
        />
      </div>

      <datalist id="conceptos-conocidos">
        {todos.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      {frecuentes.length > 0 && (
        <div className="-mx-1 flex flex-wrap gap-1.5">
          {frecuentes.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setConcepto(c);
                montoRef.current?.focus();
              }}
              className={`rounded-full px-3 py-1.5 text-xs ring-1 transition ${
                concepto === c
                  ? "bg-gray-900 text-white ring-gray-900"
                  : "bg-white text-gray-600 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <Botones />
      <p className="text-xs text-gray-500">
        «Pagué» es plata que sale (proveedor, mercado, trabajador). «Entró plata»
        es lo que entra sin ser venta del día: prestados, venta de ayer, aportes.
        Para una devolución, escribe el monto en negativo.
      </p>
    </form>
  );
}
