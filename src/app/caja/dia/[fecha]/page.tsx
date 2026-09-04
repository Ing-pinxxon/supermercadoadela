import { notFound } from "next/navigation";
import {
  resumenDia,
  movimientosDelDia,
  conceptosSugeridos,
} from "@/lib/caja";
import { esFechaValida, etiquetaLarga, hoy, sumarDias } from "@/lib/fechas";
import { pesos } from "@/lib/dinero";
import {
  Tarjeta,
  Campo,
  Monto,
  Texto,
  Fila,
  Vacio,
  Cifra,
  FilaClara,
  Insignia,
} from "@/components/ui";
import { Boton } from "@/components/boton";
import { Flechas } from "@/components/nav";
import { RegistroRapido } from "@/components/registro-rapido";
import type { Movimiento } from "@/lib/tipos";
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
    <div className="escalonado space-y-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">{etiquetaLarga(fecha)}</h1>
          {resumen.cerrado && (
            <span className="mt-1 inline-block">
              <Insignia tono="marca">Día cerrado</Insignia>
            </span>
          )}
        </div>
        <Flechas
          atras={`/caja/dia/${sumarDias(fecha, -1)}`}
          hoy={fecha === hoy() ? undefined : `/caja/dia/${hoy()}`}
          adelante={`/caja/dia/${sumarDias(fecha, 1)}`}
        />
      </div>

      {/* --- Lo primero: registrar ------------------------------- */}
      <Tarjeta titulo="Registrar">
        <RegistroRapido
          fecha={fecha}
          frecuentes={sugerencias.frecuentesDelDia}
          todos={sugerencias.todos}
        />
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

      {/* --- El cierre del día ----------------------------------- */}
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
            <Campo
              etiqueta="Venta por transferencia"
              ayuda="Nequi, Bancolombia. Se lleva aparte del efectivo."
            >
              <Monto
                name="ventaTransferencia"
                defaultValue={resumen.ventaTransferencia || ""}
              />
            </Campo>
          </div>
          <Campo etiqueta="Observaciones">
            <Texto
              name="observaciones"
              defaultValue={resumen.observaciones ?? ""}
              placeholder="Algo raro que pasó hoy…"
            />
          </Campo>
          <Boton type="submit">Guardar venta</Boton>
        </form>

        <form action={alternarCerrado} className="mt-3">
          <input type="hidden" name="fecha" value={fecha} />
          <Boton type="submit" variante="secundario">
            {resumen.cerrado ? "Reabrir el día" : "Marcar día cerrado"}
          </Boton>
        </form>
      </Tarjeta>

      {/* --- Y de último, la cuenta ------------------------------ */}
      <Cifra
        titulo="Ingreso bruto del día"
        valor={pesos(resumen.ingresoBruto)}
        pie="venta en efectivo + salidas − entradas"
      >
        <FilaClara
          etiqueta="Venta en efectivo"
          valor={pesos(resumen.ventaEfectivo)}
        />
        <FilaClara etiqueta="Salidas del día" valor={pesos(resumen.salidas)} />
        <FilaClara
          etiqueta="Entradas (abonos, prestados)"
          valor={`−${pesos(resumen.entradas)}`}
        />
      </Cifra>

      {(resumen.ventaTransferencia > 0 || resumen.salidasTransferencia > 0) && (
        <Tarjeta titulo="Por transferencia">
          {resumen.ventaTransferencia > 0 && (
            <>
              <Fila
                etiqueta="Venta por transferencia"
                valor={resumen.ventaTransferencia}
              />
              <Fila
                etiqueta="Todo lo que se vendió"
                valor={resumen.totalVendido}
                fuerte
              />
            </>
          )}
          {resumen.salidasTransferencia > 0 && (
            <Fila
              etiqueta="De las salidas, pagado por transferencia"
              valor={resumen.salidasTransferencia}
              tono="suave"
            />
          )}
          <p className="mt-2 text-xs text-gray-500">
            Los pagos por transferencia ya están contados arriba, igual que los
            de efectivo. Esto es solo para saber por dónde se movió la plata.
          </p>
        </Tarjeta>
      )}
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
  items: Movimiento[];
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
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    {m.medio === "TRANSFERENCIA" && (
                      <Insignia>Transferencia</Insignia>
                    )}
                    {m.nota}
                  </div>
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
                      className="px-2"
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
