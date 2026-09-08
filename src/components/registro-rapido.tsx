"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import {
  agregarMovimiento,
  sacarDeCaja,
  meterEnCaja,
} from "@/app/caja/actions";
import { pesos } from "@/lib/dinero";
import { Aviso, useAviso } from "@/components/aviso";
import type { Medio } from "@/lib/tipos";

function Botones() {
  const { pending } = useFormStatus();
  const base =
    "flex-1 min-h-12 rounded-full px-4 text-sm font-semibold transition active:scale-[.97] disabled:opacity-50 disabled:active:scale-100";
  return (
    <div className="flex gap-2">
      <button
        type="submit"
        name="tipo"
        value="SALIDA"
        disabled={pending}
        className={`${base} bg-crema-200 text-sobre-crema shadow-md shadow-verde-950/30 hover:bg-crema-100`}
      >
        {pending ? "Guardando…" : "Pagué"}
      </button>
      <button
        type="submit"
        name="tipo"
        value="ENTRADA"
        disabled={pending}
        className={`${base} bg-transparent text-tinta ring-1 ring-crema-200/60 hover:bg-crema-200/10`}
      >
        Entró plata
      </button>
    </div>
  );
}

/**
 * «Saqué de la caja»: usa el mismo monto de arriba y no pide concepto, porque
 * el concepto siempre sería el mismo. Por eso lleva `formNoValidate`: el campo
 * de concepto es obligatorio para los otros dos botones, no para este.
 */
function BotonesCaja() {
  const { pending } = useFormStatus();
  const base =
    "min-h-11 flex-1 rounded-full px-3 text-sm font-semibold text-tinta ring-1 ring-crema-200/40 transition active:scale-[.97] hover:bg-crema-200/10 disabled:opacity-50";
  return (
    <div className="flex gap-2">
      <button
        type="submit"
        name="accion"
        value="SACAR"
        formNoValidate
        disabled={pending}
        className={base}
      >
        Saqué de la caja
      </button>
      <button
        type="submit"
        name="accion"
        value="METER"
        formNoValidate
        disabled={pending}
        className={base}
      >
        Metí a la caja
      </button>
    </div>
  );
}

const claseInput =
  "w-full rounded-xl border border-transparent bg-crema-50 px-3 py-3 text-verde-900 outline-none transition focus:border-crema-300 focus:ring-2 focus:ring-crema-200/50";

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
  const router = useRouter();

  return (
    <form
      ref={formRef}
      action={async (datos) => {
        const guardado = {
          concepto: String(datos.get("concepto") ?? ""),
          monto: Number(String(datos.get("monto") ?? "").replace(/[^\d-]/g, "")),
          entrada: String(datos.get("tipo") ?? "") === "ENTRADA",
          caja: String(datos.get("accion") ?? ""),
        };

        if (guardado.caja === "SACAR") {
          await sacarDeCaja(datos);
        } else if (guardado.caja === "METER") {
          await meterEnCaja(datos);
        } else {
          await agregarMovimiento(datos);
        }

        router.refresh(); // sin esto la lista se queda mostrando lo de antes
        setConcepto("");
        setMedio("EFECTIVO");
        formRef.current?.reset();
        if (guardado.caja && guardado.monto > 0) {
          setAviso(
            guardado.caja === "SACAR"
              ? `Sacaste ${pesos(guardado.monto)} de la caja`
              : `Guardaste ${pesos(guardado.monto)} en la caja`,
          );
        } else if (guardado.concepto && guardado.monto) {
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
                  ? "bg-crema-200 text-sobre-crema ring-crema-200"
                  : "bg-transparent text-tinta-suave ring-crema-200/40 hover:bg-crema-200/10"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <Botones />
      <BotonesCaja />
      <Aviso texto={aviso} />

      <p className="text-xs text-tinta-suave">
        «Pagué» es plata que sale (proveedor, mercado, trabajador). «Entró plata»
        es lo que entra sin ser venta del día: prestados, abonos de fiados,
        aportes. Para una devolución, escribe el monto en negativo.
      </p>
      <p className="text-xs text-tinta-suave">
        La caja es la plata guardada: escribe solo el monto. «Saqué» es para
        pagar con plata de días anteriores —no cuenta como venta de hoy y el
        pago se registra aparte con «Pagué»—; «Metí» es guardar plata del cajón.
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
    <div className="inline-flex rounded-full bg-verde-900/50 p-1">
      {opciones.map((o) => (
        <button
          key={o.medio}
          type="button"
          onClick={() => cambiar(o.medio)}
          aria-pressed={valor === o.medio}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition active:scale-95 ${
            valor === o.medio
              ? "bg-crema-200 text-sobre-crema shadow-sm"
              : "text-tinta-suave hover:text-tinta"
          }`}
        >
          {o.texto}
        </button>
      ))}
    </div>
  );
}
