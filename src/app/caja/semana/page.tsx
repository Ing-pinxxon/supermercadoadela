import Link from "next/link";
import { resumenSemana, mayoresConceptos } from "@/lib/caja";
import { exigirAdmin } from "@/lib/sesion";
import {
  DIAS,
  esFechaValida,
  etiquetaCorta,
  hoy,
  lunesDe,
  sumarDias,
} from "@/lib/fechas";
import { pesos } from "@/lib/dinero";
import {
  Tarjeta,
  Campo,
  Monto,
  Texto,
  Vacio,
  Cifra,
  FilaClara,
} from "@/components/ui";
import { Boton } from "@/components/boton";
import { Flechas } from "@/components/nav";
import { guardarCuentaSemana } from "../actions";

export const dynamic = "force-dynamic";

export default async function SemanaCaja({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>;
}) {
  await exigirAdmin();

  const { semana } = await searchParams;
  const referencia = esFechaValida(semana) ? semana : hoy();
  const lunes = lunesDe(referencia);
  const domingo = sumarDias(lunes, 6);

  const [r, conceptos] = await Promise.all([
    resumenSemana(lunes),
    mayoresConceptos(lunes, domingo, 8),
  ]);

  const hoyStr = hoy();
  const diferencia =
    r.cuentaEfectivo !== null && r.cuentaAnterior !== null
      ? r.cuentaEfectivo - r.cuentaAnterior
      : null;

  return (
    <div className="escalonado space-y-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Semana</h1>
          <p className="text-sm text-gray-500">
            {etiquetaCorta(lunes)} — {etiquetaCorta(domingo)}
          </p>
        </div>
        <Flechas
          atras={`/caja/semana?semana=${sumarDias(lunes, -7)}`}
          hoy="/caja/semana"
          adelante={`/caja/semana?semana=${sumarDias(lunes, 7)}`}
        />
      </div>

      <Cifra
        titulo="Ingreso bruto de la semana"
        valor={pesos(r.totales.ingresoBruto)}
        pie="venta en efectivo + salidas − entradas"
      >
        <FilaClara
          etiqueta="Venta en efectivo"
          valor={pesos(r.totales.ventaEfectivo)}
        />
        <FilaClara etiqueta="Salidas" valor={pesos(r.totales.salidas)} />
        <FilaClara etiqueta="Entradas" valor={`−${pesos(r.totales.entradas)}`} />
        {r.totales.ventaTransferencia > 0 && (
          <FilaClara
            etiqueta="Venta por transferencia (aparte)"
            valor={pesos(r.totales.ventaTransferencia)}
          />
        )}
      </Cifra>

      {r.totales.ventaTransferencia > 0 && (
        <Tarjeta titulo="Todo lo que se vendió">
          <div className="tabular text-2xl font-bold">
            {pesos(r.totales.totalVendido)}
          </div>
          <p className="text-xs text-gray-500">
            el ingreso bruto más la venta que entró por transferencia
          </p>
        </Tarjeta>
      )}

      {/* La misma tabla de la hoja, día por día. */}
      <Tarjeta titulo="Día por día">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <th className="py-2 pr-2 text-left font-medium">Día</th>
                <th className="py-2 px-2 text-right font-medium">Salidas</th>
                <th className="py-2 px-2 text-right font-medium">Entradas</th>
                <th className="py-2 px-2 text-right font-medium">Venta</th>
                <th className="py-2 pl-2 text-right font-medium">Ingreso</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {r.dias.map((fecha, i) => {
                const d = r.detalle[i];
                return (
                  <tr
                    key={fecha}
                    className={`border-b border-gray-100 last:border-0 ${
                      fecha === hoyStr ? "bg-marca-50" : ""
                    }`}
                  >
                    <td className="py-2.5 pr-2">
                      <Link
                        href={`/caja/dia/${fecha}`}
                        className="font-medium hover:underline"
                      >
                        {DIAS[i].slice(0, 3)}
                      </Link>
                    </td>
                    <td className="py-2.5 px-2 text-right text-gray-500">
                      {d.salidas ? pesos(d.salidas) : "—"}
                    </td>
                    <td className="py-2.5 px-2 text-right text-gray-500">
                      {d.entradas ? pesos(d.entradas) : "—"}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      {d.ventaEfectivo ? pesos(d.ventaEfectivo) : "—"}
                    </td>
                    <td className="py-2.5 pl-2 text-right font-semibold">
                      {d.hayDatos ? pesos(d.ingresoBruto) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 font-semibold tabular">
                <td className="py-2.5 pr-2">Total</td>
                <td className="py-2.5 px-2 text-right">
                  {pesos(r.totales.salidas)}
                </td>
                <td className="py-2.5 px-2 text-right">
                  {pesos(r.totales.entradas)}
                </td>
                <td className="py-2.5 px-2 text-right">
                  {pesos(r.totales.ventaEfectivo)}
                </td>
                <td className="py-2.5 pl-2 text-right">
                  {pesos(r.totales.ingresoBruto)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Tarjeta>

      <Tarjeta titulo="En qué se fue la plata">
        {conceptos.length === 0 ? (
          <Vacio>Sin pagos registrados esta semana.</Vacio>
        ) : (
          <ul className="divide-y divide-gray-100">
            {conceptos.map((c) => (
              <li
                key={c.concepto}
                className="flex items-center justify-between gap-3 py-2"
              >
                <span className="truncate">
                  {c.concepto}
                  {c.veces > 1 && (
                    <span className="ml-1 text-xs text-gray-400">
                      ×{c.veces}
                    </span>
                  )}
                </span>
                <span className="tabular shrink-0 font-medium">
                  {pesos(c.total)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      <Tarjeta titulo="Cuenta de efectivo">
        <form action={guardarCuentaSemana} className="space-y-3">
          <input type="hidden" name="fecha" value={lunes} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo
              etiqueta="Efectivo contado al cerrar la semana"
              ayuda={
                r.cuentaAnterior !== null
                  ? `Semana anterior: ${pesos(r.cuentaAnterior)}`
                  : "Aún no hay conteo de la semana anterior."
              }
            >
              <Monto
                name="cuentaEfectivo"
                defaultValue={r.cuentaEfectivo ?? ""}
              />
            </Campo>
            <Campo etiqueta="Nota">
              <Texto name="notaSemana" defaultValue={r.notaSemana ?? ""} />
            </Campo>
          </div>
          {diferencia !== null && (
            <p
              className={`text-sm ${
                diferencia >= 0 ? "text-marca-600" : "text-red-600"
              }`}
            >
              {diferencia >= 0 ? "Subió " : "Bajó "}
              {pesos(Math.abs(diferencia))} contra la semana anterior.
            </p>
          )}
          <Boton type="submit">Guardar</Boton>
        </form>
      </Tarjeta>
    </div>
  );
}
