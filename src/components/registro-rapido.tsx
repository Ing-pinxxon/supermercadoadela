"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { agregarMovimiento } from "@/app/caja/actions";
import { pesos } from "@/lib/dinero";
import { Aviso, useAviso } from "@/components/aviso";
import type { Medio } from "@/lib/tipos";

function Botones() {
  const { pending } = useFormStatus();
  const base =
    "flex-1 min-h-12 rounded-xl px-4 text-sm font-semibold shadow-sm transition active:scale-[.97] disabled:opacity-50 disabled:active:scale-100";
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
        className={`${base} bg-acento-500 text-white shadow-acento-500/20 hover:bg-acento-600`}
      >
        Entró plata
      </button>
    </div>
  );
}

const claseInput =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-3 outline-none transition focus:border-marca-500 focus:ring-2 focus:ring-marca-100";

/**
 * El formulario que se usa veinte veces al día: concepto, monto, cómo se pagó
 * y un botón. Los chips son los conceptos que suelen pagarse ese día de la
 * semana, calculados a partir de lo ya registrado — no hay lista que mantener.
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
  const [medio, setMedio] = useState<Medio>("EFECTIVO");
  const [aviso, setAviso] = useAviso();
  const montoRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (datos) => {
        const guardado = {
          concepto: String(datos.get("concepto") ?? ""),
          monto: Number(String(datos.get("monto") ?? "").replace(/[^\d-]/g, "")),
          entrada: String(datos.get("tipo") ?? "") === "ENTRADA",
        };

        await agregarMovimiento(datos);

        setConcepto("");
        setMedio("EFECTIVO");
        formRef.current?.reset();
        if (guardado.concepto && guardado.monto) {
          setAviso(
            `${guardado.entrada ? "Entró" : "Pagado"} ${pesos(
              guardado.monto,
            )} · ${guardado.concepto}`,
          );
        }
        // Deja el foco listo para el siguiente registro.
        formRef.current?.querySelector<HTMLInputElement>("#concepto")?.focus();
      }}
      className="space-y-3"
    >
      <input type="hidden" name="fecha" value={fecha} />
      <input type="hidden" name="medio" value={medio} />

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
          className={claseInput}
        />
        <input
          ref={montoRef}
          name="monto"
          inputMode="numeric"
          required
          placeholder="Monto"
          className={`monto sm:w-40 ${claseInput}`}
        />
      </div>

      <datalist id="conceptos-conocidos">
        {todos.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <MedioDePago valor={medio} cambiar={setMedio} />

      {frecuentes.length > 0 && (
        <div className="-mx-1 flex flex-wrap gap-1.5 px-1">
          {frecuentes.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setConcepto(c);
                montoRef.current?.focus();
              }}
              className={`rounded-full px-3 py-1.5 text-xs ring-1 transition active:scale-90 ${
                concepto === c
                  ? "bg-marca-500 text-white ring-marca-500"
                  : "bg-white text-gray-600 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <Botones />
      <Aviso texto={aviso} />

      <p className="text-xs text-gray-500">
        «Pagué» es plata que sale (proveedor, mercado, trabajador). «Entró plata»
        es lo que entra sin ser venta del día: prestados, abonos de fiados,
        aportes. Para una devolución, escribe el monto en negativo.
      </p>
    </form>
  );
}

/**
 * Efectivo o transferencia. Es una etiqueta: la cuenta del día es la misma en
 * los dos casos, pero después sirve para saber por dónde se movió la plata.
 */
export function MedioDePago({
  valor,
  cambiar,
}: {
  valor: Medio;
  cambiar: (m: Medio) => void;
}) {
  const opciones: { medio: Medio; texto: string }[] = [
    { medio: "EFECTIVO", texto: "Efectivo" },
    { medio: "TRANSFERENCIA", texto: "Transferencia" },
  ];

  return (
    <div className="inline-flex rounded-xl bg-gray-100 p-1">
      {opciones.map((o) => (
        <button
          key={o.medio}
          type="button"
          onClick={() => cambiar(o.medio)}
          aria-pressed={valor === o.medio}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition active:scale-95 ${
            valor === o.medio
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {o.texto}
        </button>
      ))}
    </div>
  );
}
