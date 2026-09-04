"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { anotar } from "@/app/fiado/actions";
import { pesos } from "@/lib/dinero";
import { Aviso, useAviso } from "@/components/aviso";
import { MedioDePago } from "@/components/registro-rapido";
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
        value="FIADO"
        disabled={pending}
        className={`${base} bg-acento-500 text-white shadow-acento-500/20 hover:bg-acento-600`}
      >
        {pending ? "Guardando…" : "Se llevó fiado"}
      </button>
      <button
        type="submit"
        name="tipo"
        value="ABONO"
        disabled={pending}
        className={`${base} bg-marca-500 text-white shadow-marca-500/20 hover:bg-marca-600`}
      >
        Abonó
      </button>
    </div>
  );
}

/**
 * Fiar y abonar, en un solo formulario de dos botones.
 *
 * El monto siempre es positivo: el botón dice para qué lado va. Fiar no toca la
 * caja; abonar sí, y de eso se encarga la acción del servidor.
 */
export function RegistroFiado({
  deudorId,
  fecha,
}: {
  deudorId: string;
  fecha: string;
}) {
  const [medio, setMedio] = useState<Medio>("EFECTIVO");
  const [aviso, setAviso] = useAviso();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (datos) => {
        const monto = Number(
          String(datos.get("monto") ?? "").replace(/[^\d]/g, ""),
        );
        const abono = String(datos.get("tipo") ?? "") === "ABONO";

        await anotar(datos);

        formRef.current?.reset();
        setMedio("EFECTIVO");
        if (monto > 0) {
          setAviso(`${abono ? "Abonó" : "Se llevó"} ${pesos(monto)}`);
        }
      }}
      className="space-y-3"
    >
      <input type="hidden" name="deudorId" value={deudorId} />
      <input type="hidden" name="fecha" value={fecha} />
      <input type="hidden" name="medio" value={medio} />

      <div className="grid gap-2 sm:grid-cols-[auto_1fr]">
        <input
          name="monto"
          inputMode="numeric"
          required
          placeholder="Monto"
          className="monto w-full rounded-xl border border-gray-300 bg-white px-3 py-3 outline-none transition focus:border-marca-500 focus:ring-2 focus:ring-marca-100 sm:w-40"
        />
        <input
          name="nota"
          autoComplete="off"
          placeholder="Nota (opcional)"
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 outline-none transition focus:border-marca-500 focus:ring-2 focus:ring-marca-100"
        />
      </div>

      <MedioDePago valor={medio} cambiar={setMedio} />
      <Botones />
      <Aviso texto={aviso} />

      <p className="text-xs text-gray-500">
        Fiar no mueve la caja: solo queda la deuda. El abono sí entra al día como
        plata que entró sin ser venta.
      </p>
    </form>
  );
}
