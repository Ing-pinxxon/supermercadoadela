"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Resultado } from "@/lib/resultado";
import { Aviso, useAviso } from "@/components/aviso";

/**
 * Formulario del catálogo: muestra el error de la API tal cual («Ponle precio
 * antes de publicarlo») o el «Guardado ✓», y refresca la pantalla al guardar.

 */
export function FormResultado({
  action,
  children,
  className,
}: {
  action: (anterior: Resultado, datos: FormData) => Promise<Resultado>;
  children: React.ReactNode;
  className?: string;
}) {
  const [estado, enviar] = useActionState(action, { ok: true } as Resultado);
  const [aviso, setAviso] = useAviso();
  const router = useRouter();

  useEffect(() => {
    if (!estado.ok) return;
    if (estado.aviso) setAviso(estado.aviso);
    if (estado.aviso) router.refresh();
    // Solo cuando llega un resultado nuevo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  return (
    <form action={enviar} className={className}>
      {children}
      {!estado.ok && <MensajeError texto={estado.error} errores={estado.errores} />}
      <Aviso texto={aviso} />
    </form>
  );
}

/** El error de la API, con la lista de campos si vino de la validación. */
export function MensajeError({
  texto,
  errores,
}: {
  texto: string;
  errores?: Record<string, string>;
}) {
  const lista = Object.values(errores ?? {});
  return (
    <div role="alert" className="aparecer rounded-xl bg-rojo/15 px-3 py-2.5 text-sm text-rojo">
      <p className="font-medium">{texto}</p>
      {lista.length > 0 && (
        <ul className="mt-1 list-disc pl-5">
          {lista.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
