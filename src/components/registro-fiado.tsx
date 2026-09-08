"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { anotar } from "@/app/fiado/actions";
import { pesos } from "@/lib/dinero";
import { Aviso, useAviso } from "@/components/aviso";
import { MedioDePago } from "@/components/registro-rapido";
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
        value="FIADO"
        disabled={pending}
        className={`${base} bg-transparent text-tinta ring-1 ring-crema-200/60 hover:bg-crema-200/10`}
      >
        {pending ? "Guardando…" : "Se llevó fiado"}
      </button>
      <button
        type="submit"
        name="tipo"
        value="ABONO"
        disabled={pending}
        className={`${base} bg-crema-200 text-sobre-crema shadow-md shadow-verde-950/30 hover:bg-crema-100`}
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
  const router = useRouter();

  return (
    <form
      ref={formRef}
      action={async (datos) => {
        const monto = Number(
          String(datos.get("monto") ?? "").replace(/[^\d]/g, ""),
        );
        const abono = String(datos.get("tipo") ?? "") === "ABONO";

        await anotar(datos);

        router.refresh(); // sin esto la lista se queda mostrando lo de antes
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
          className="monto sm:w-40 w-full rounded-xl border border-transparent bg-crema-50 px-3 py-3 text-verde-900 outline-none transition focus:border-crema-300 focus:ring-2 focus:ring-crema-200/50"
        />
        <input
          name="nota"
          autoComplete="off"
          placeholder="Nota (opcional)"
          className="w-full rounded-xl border border-transparent bg-crema-50 px-3 py-3 text-verde-900 outline-none transition focus:border-crema-300 focus:ring-2 focus:ring-crema-200/50"
        />
      </div>

      <MedioDePago valor={medio} cambiar={setMedio} />
      <Botones />
      <Aviso texto={aviso} />

      <p className="text-xs text-tinta-suave">
        Fiar no mueve la caja: solo queda la deuda. El abono sí entra al día como
        plata que entró sin ser venta.
      </p>
    </form>
  );
}
