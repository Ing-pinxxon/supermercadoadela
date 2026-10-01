import {
  semanasArchivo,
  resumenArchivo,
  porDiaSemana,
  conceptosArchivo,
  compararPromedios,
} from "@/lib/historico";
import { DIAS, etiquetaCorta } from "@/lib/fechas";
import { pesos } from "@/lib/dinero";
import { Tarjeta, Vacio } from "@/components/ui";
import { exigirAdmin } from "@/lib/sesion";
import { GraficaLineas, GraficaBarras } from "@/components/graficas";

export const dynamic = "force-dynamic";

export default async function Historico() {
  await exigirAdmin("/caja/historico");

  const [archivo, resumen, porDia, conceptos] = await Promise.all([
    semanasArchivo(),
    resumenArchivo(),
    porDiaSemana(),
    conceptosArchivo(12),
  ]);

  if (!resumen || resumen.dias === 0) {
    return (
      <div className="space-y-5">
        <h1 className="display text-2xl font-black">Archivo de la hoja</h1>
        <Tarjeta>
          <Vacio>
            No hay archivo cargado. Se carga con el botón «Cargar histórico»
            de <code>/instalar</code>.
          </Vacio>
        </Tarjeta>
      </div>
    );
  }

  // Solo el archivo: lo de la app está en el tablero.
  const comparacion = compararPromedios(archivo, []);
  const semanasCompletas = archivo.filter((s) => s.dias >= 5);
  const mejor = [...semanasCompletas].sort(
    (a, b) => b.ingreso_bruto - a.ingreso_bruto,
  )[0];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="display text-2xl font-black">Archivo de la hoja</h1>
        <p className="text-sm text-tinta-suave">
          Lo que traía la hoja de cálculo: {resumen.dias} días entre{" "}
          {etiquetaCorta(resumen.desde)} y {etiquetaCorta(resumen.hasta)}. Es
          de solo lectura; lo registrado en la app está en el{" "}
          <a href="/caja/tablero" className="text-crema-200 underline-offset-2 hover:underline">
            tablero
          </a>
          .
        </p>
      </div>

      <Tarjeta titulo="En total">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="tabular text-2xl font-bold">
              {pesos(resumen.ingreso)}
            </div>
            <p className="text-xs text-tinta-suave">ingreso bruto acumulado</p>
          </div>
          <div>
            <div className="tabular text-2xl font-bold">
              {comparacion.archivo ? pesos(comparacion.archivo) : "—"}
            </div>
            <p className="text-xs text-tinta-suave">
              promedio por semana ({comparacion.semanasArchivo} semanas)
            </p>
          </div>
        </div>
        {mejor && (
          <p className="mt-3 border-t border-dashed border-borde pt-2 text-xs text-tinta-suave">
            La mejor semana fue la del {etiquetaCorta(mejor.lunes)} con{" "}
            {pesos(mejor.ingreso_bruto)}.
          </p>
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
        <p className="mt-3 text-xs text-tinta-suave">
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
              color="#ffb072"
            />
            {resumen.dudosos > 0 && (
              <p className="mt-3 text-xs text-tinta-suave">
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
