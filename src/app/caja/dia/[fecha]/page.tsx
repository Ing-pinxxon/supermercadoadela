import Link from "next/link";
import { notFound } from "next/navigation";
import {
  resumenDia,
  movimientosDelDia,
  conceptosSugeridos,
} from "@/lib/caja";
import { esFechaValida, etiquetaLarga, sumarDias } from "@/lib/fechas";
import { pesos } from "@/lib/dinero";
import { Tarjeta, Campo, Monto, Texto, Fila, Vacio } from "@/components/ui";
import { Boton } from "@/components/boton";
import { RegistroRapido } from "@/components/registro-rapido";
import { guardarVenta, alternarCerrado, borrarMovimiento } from "../../actions";

export const dynamic = "force-dynamic";

export default async function DiaCaja({
  params,
}: {
  params: Promise<{ fecha: string }>;
}) {
  const { fecha } = await params;
  if (!esFechaValida(fecha)) notFound();

  const [resumen, movimientos, sugerencias] = await Promise.all([
    resumenDia(fecha),
    movimientosDelDia(fecha),
    conceptosSugeridos(fecha),
  ]);

  const salidas = movimientos.filter((m) => m.tipo === "SALIDA");
  const entradas = movimientos.filter((m) => m.tipo === "ENTRADA");

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">{etiquetaLarga(fecha)}</h1>
          {resumen.cerrado && (
            <span className="mt-1 inline-block rounded-full bg-marca-100 px-2.5 py-0.5 text-xs font-medium text-marca-700">
              Día cerrado
            </span>
          )}
        </div>
        <div className="flex shrink-0 gap-2 text-sm">
          <Link
            href={`/caja/dia/${sumarDias(fecha, -1)}`}
            className="rounded-lg bg-white px-3 py-2 ring-1 ring-gray-300"
          >
            ←
          </Link>
          <Link
            href={`/caja/dia/${sumarDias(fecha, 1)}`}
            className="rounded-lg bg-white px-3 py-2 ring-1 ring-gray-300"
          >
            →
          </Link>
        </div>
      </div>

      {/* --- Registro rápido: lo primero que se ve --------------- */}
      <Tarjeta titulo="Registrar">
        <RegistroRapido
          fecha={fecha}
          frecuentes={sugerencias.frecuentesDelDia}
          todos={sugerencias.todos}
        />
      </Tarjeta>

      {/* --- Ingreso bruto --------------------------------------- */}
      <Tarjeta titulo="Ingreso bruto del día">
        <div className="tabular text-3xl font-bold">
          {pesos(resumen.ingresoBruto)}
        </div>
        <div className="mt-3 border-t border-dashed border-gray-200 pt-2">
          <Fila etiqueta="Venta en efectivo" valor={resumen.ventaEfectivo} />
          <Fila etiqueta="Salidas del día" valor={resumen.salidas} />
          <Fila etiqueta="Entradas (prestados, aportes)" valor={-resumen.entradas} />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          venta en efectivo + salidas − entradas
        </p>
      </Tarjeta>

      {/* --- Venta del día --------------------------------------- */}
      <Tarjeta titulo="Cierre">
        <form action={guardarVenta} className="space-y-3">
          <input type="hidden" name="fecha" value={fecha} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo etiqueta="Venta en efectivo">
              <Monto
                name="ventaEfectivo"
                defaultValue={resumen.ventaEfectivo || ""}
              />
            </Campo>
            <Campo etiqueta="Observaciones">
              <Texto
                name="observaciones"
                defaultValue={resumen.observaciones ?? ""}
                placeholder="Algo raro que pasó hoy…"
              />
            </Campo>
          </div>
          <Boton type="submit">Guardar venta</Boton>
        </form>

        <form action={alternarCerrado} className="mt-3">
          <input type="hidden" name="fecha" value={fecha} />
          <Boton type="submit" variante="secundario">
            {resumen.cerrado ? "Reabrir el día" : "Marcar día cerrado"}
          </Boton>
        </form>
      </Tarjeta>

      <ListaMovimientos
        titulo={`Salidas (${salidas.length})`}
        fecha={fecha}
        items={salidas}
        vacio="Todavía no se ha registrado ningún pago."
      />

      <ListaMovimientos
        titulo={`Entradas (${entradas.length})`}
        fecha={fecha}
        items={entradas}
        vacio="Sin entradas de plata registradas."
      />
    </div>
  );
}

function ListaMovimientos({
  titulo,
  fecha,
  items,
  vacio,
}: {
  titulo: string;
  fecha: string;
  items: { id: string; concepto: string; monto: number; nota: string | null }[];
  vacio: string;
}) {
  const total = items.reduce((s, m) => s + m.monto, 0);

  return (
    <Tarjeta titulo={titulo}>
      {items.length === 0 ? (
        <Vacio>{vacio}</Vacio>
      ) : (
        <>
          <ul className="divide-y divide-gray-100">
            {items.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{m.concepto}</div>
                  {m.nota && (
                    <div className="text-xs text-gray-500">{m.nota}</div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`tabular font-semibold ${
                      m.monto < 0 ? "text-red-600" : ""
                    }`}
                  >
                    {pesos(m.monto)}
                  </span>
                  <form action={borrarMovimiento}>
                    <input type="hidden" name="fecha" value={fecha} />
                    <input type="hidden" name="id" value={m.id} />
                    <Boton
                      type="submit"
                      variante="peligro"
                      className="px-2 py-1"
                      confirmar={`¿Borrar "${m.concepto}"?`}
                    >
                      ✕
                    </Boton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-2 border-t border-dashed border-gray-200 pt-2">
            <Fila etiqueta="Total" valor={total} fuerte />
          </div>
        </>
      )}
    </Tarjeta>
  );
}
