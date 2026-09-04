import { notFound } from "next/navigation";
import { deudor, movimientosDe, saldoDe } from "@/lib/fiados";
import { etiquetaCorta, hoy } from "@/lib/fechas";
import { pesos } from "@/lib/dinero";
import { Tarjeta, Vacio, Cifra, Insignia, Volver } from "@/components/ui";
import { Boton } from "@/components/boton";
import { RegistroFiado } from "@/components/registro-fiado";
import { borrarFiado } from "../actions";

export const dynamic = "force-dynamic";

export default async function FichaDeudor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const persona = await deudor(id);
  if (!persona) notFound();

  const [saldo, movimientos] = await Promise.all([
    saldoDe(id),
    movimientosDe(id),
  ]);

  return (
    <div className="escalonado space-y-5">
      <div>
        <Volver href="/fiado" texto="Fiados" />
        <h1 className="mt-2 text-xl font-bold">{persona.nombre}</h1>
        {persona.telefono && (
          <a
            href={`tel:${persona.telefono}`}
            className="text-sm text-marca-600 underline-offset-2 hover:underline"
          >
            {persona.telefono}
          </a>
        )}
      </div>

      <Cifra
        titulo={saldo > 0 ? "Debe" : "Saldo"}
        valor={pesos(Math.abs(saldo))}
        pie={
          saldo > 0
            ? "pendiente por cobrar"
            : saldo < 0
              ? "a favor de la persona"
              : "está al día"
        }
        tono={saldo > 0 ? "acento" : "marca"}
      />

      <Tarjeta titulo="Anotar">
        <RegistroFiado deudorId={id} fecha={hoy()} />
      </Tarjeta>

      <Tarjeta titulo={`Movimientos (${movimientos.length})`}>
        {movimientos.length === 0 ? (
          <Vacio>Todavía no hay nada anotado.</Vacio>
        ) : (
          <ul className="divide-y divide-gray-100">
            {movimientos.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {m.tipo === "FIADO" ? "Se llevó" : "Abonó"}
                    </span>
                    {m.medio === "TRANSFERENCIA" && (
                      <Insignia>Transf.</Insignia>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {etiquetaCorta(m.fecha)}
                    {m.nota && ` · ${m.nota}`}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`tabular font-semibold ${
                      m.tipo === "FIADO" ? "text-acento-700" : "text-marca-600"
                    }`}
                  >
                    {m.tipo === "FIADO" ? "+" : "−"}
                    {pesos(m.monto)}
                  </span>
                  <form action={borrarFiado}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="deudorId" value={id} />
                    <Boton
                      type="submit"
                      variante="peligro"
                      className="px-2"
                      confirmar={
                        m.tipo === "ABONO"
                          ? "Se borra el abono y también su entrada en la caja de ese día. ¿Seguir?"
                          : "¿Borrar este fiado?"
                      }
                    >
                      ✕
                    </Boton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  );
}
