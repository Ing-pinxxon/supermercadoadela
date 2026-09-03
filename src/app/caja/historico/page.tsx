import {
  semanasArchivo,
  semanasActuales,
  resumenArchivo,
  porDiaSemana,
  conceptosArchivo,
  compararPromedios,
} from "@/lib/historico";
import { DIAS, etiquetaCorta } from "@/lib/fechas";
import { pesos } from "@/lib/dinero";
import { Tarjeta, Vacio } from "@/components/ui";
import { GraficaLineas, GraficaBarras } from "@/components/graficas";

export const dynamic = "force-dynamic";

export default async function Historico() {
  const [archivo, actuales, resumen, porDia, conceptos] = await Promise.all([
    semanasArchivo(),
    semanasActuales(),
    resumenArchivo(),
    porDiaSemana(),
    conceptosArchivo(12),
  ]);

  if (!resumen || resumen.dias === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold">Histórico</h1>
        <Tarjeta>
          <Vacio>
            No hay archivo cargado. Se importa con{" "}
            <code>node import/importar.mjs --escribir</code>.
          </Vacio>
        </Tarjeta>
      </div>
    );
  }

  const comparacion = compararPromedios(archivo, actuales);
  const semanasCompletas = archivo.filter((s) => s.dias >= 5);
  const mejor = [...semanasCompletas].sort(
    (a, b) => b.ingreso_bruto - a.ingreso_bruto,
  )[0];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Histórico</h1>
        <p className="text-sm text-gray-500">
          Lo que traía la hoja de cálculo: {resumen.dias} días entre{" "}
          {etiquetaCorta(resumen.desde)} y {etiquetaCorta(resumen.hasta)}.
        </p>
      </div>

      <Tarjeta titulo="En total">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="tabular text-2xl font-bold">
              {pesos(resumen.ingreso)}
            </div>
            <p className="text-xs text-gray-500">ingreso bruto acumulado</p>
          </div>
          <div>
            <div className="tabular text-2xl font-bold">
              {comparacion.archivo ? pesos(comparacion.archivo) : "—"}
            </div>
            <p className="text-xs text-gray-500">
              promedio por semana ({comparacion.semanasArchivo} semanas)
            </p>
          </div>
        </div>
        {mejor && (
          <p className="mt-3 border-t border-dashed border-gray-200 pt-2 text-xs text-gray-500">
            La mejor semana fue la del {etiquetaCorta(mejor.lunes)} con{" "}
            {pesos(mejor.ingreso_bruto)}.
          </p>
        )}
      </Tarjeta>

      {/* Comparación con lo que va del año */}
      <Tarjeta titulo="Contra lo que va ahora">
        {comparacion.actual === null ? (
          <p className="text-sm text-gray-600">
            Todavía no hay semanas completas registradas en la app. Cuando
            registres cinco días o más de una semana, aquí aparece la
            comparación contra el promedio de{" "}
            {comparacion.archivo ? pesos(comparacion.archivo) : "el archivo"}.
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="tabular text-2xl font-bold">
                  {pesos(comparacion.actual)}
                </div>
                <p className="text-xs text-gray-500">
                  promedio ahora ({comparacion.semanasActuales} semanas)
                </p>
              </div>
              <div>
                <div
                  className={`tabular text-2xl font-bold ${
                    (comparacion.variacion ?? 0) >= 0
                      ? "text-marca-600"
                      : "text-red-600"
                  }`}
                >
                  {(comparacion.variacion ?? 0) >= 0 ? "+" : ""}
                  {comparacion.variacion}%
                </div>
                <p className="text-xs text-gray-500">contra el archivo</p>
              </div>
            </div>
            <div className="mt-4">
              <GraficaLineas
                series={[
                  {
                    nombre: "Archivo",
                    puntos: semanasCompletas.map((s) => ({
                      etiqueta: etiquetaCorta(s.lunes),
                      valor: s.ingreso_bruto,
                    })),
                  },
                  {
                    nombre: "Ahora",
                    puntos: actuales
                      .filter((s) => s.dias >= 5)
                      .map((s) => ({
                        etiqueta: etiquetaCorta(s.lunes),
                        valor: s.ingreso_bruto,
                      })),
                  },
                ]}
              />
            </div>
          </>
        )}
      </Tarjeta>

      <Tarjeta titulo="Ingreso bruto por semana">
        <GraficaLineas
          series={[
            {
              nombre: "Ingreso bruto",
              puntos: semanasCompletas.map((s) => ({
                etiqueta: etiquetaCorta(s.lunes).replace(/^\w+ /, ""),
                valor: s.ingreso_bruto,
              })),
            },
          ]}
        />
      </Tarjeta>

      <Tarjeta titulo="Qué día vendía más">
        <GraficaBarras
          datos={porDia.map((d) => ({
            etiqueta: DIAS[d.dia - 1],
            valor: d.promedio,
            detalle: `${d.dias} días`,
          }))}
        />
        <p className="mt-3 text-xs text-gray-500">
          Promedio de ingreso bruto por día de la semana.
        </p>
      </Tarjeta>

      <Tarjeta titulo="En qué se iba la plata">
        {conceptos.length === 0 ? (
          <Vacio>No hay detalle importado.</Vacio>
        ) : (
          <>
            <GraficaBarras
              datos={conceptos.map((c) => ({
                etiqueta: c.concepto,
                valor: c.total,
                detalle: `×${c.veces}`,
              }))}
              color="#eb6834"
            />
            {resumen.dudosos > 0 && (
              <p className="mt-3 text-xs text-gray-500">
                En {resumen.dudosos} de {resumen.dias} días el detalle no suma
                exactamente el total que traía la hoja, porque así estaba escrito
                allá. Los totales de arriba usan los números de la hoja, no la
                suma del detalle.
              </p>
            )}
          </>
        )}
      </Tarjeta>
    </div>
  );
}
