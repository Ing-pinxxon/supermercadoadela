import { inicioApp, semanasApp, porDiaSemanaApp } from "@/lib/tablero";
import { semanasArchivo, compararPromedios } from "@/lib/historico";
import { mayoresConceptos } from "@/lib/caja";
import { DIAS, etiquetaCorta, etiquetaLarga, hoy } from "@/lib/fechas";
import { pesos } from "@/lib/dinero";
import { exigirAdmin } from "@/lib/sesion";
import { Tarjeta, Vacio } from "@/components/ui";
import { GraficaLineas, GraficaBarras } from "@/components/graficas";

export const dynamic = "force-dynamic";

/** Una de las cuatro cifras de arriba. Más chica que `Cifra`: van de a dos. */
function CifraChica({ titulo, valor, pie }: { titulo: string; valor: string; pie?: string }) {
  return (
    <div className="rounded-2xl bg-superficie p-3 ring-1 ring-borde">
      <div className="text-xs font-semibold uppercase tracking-wider text-tinta-suave">
        {titulo}
      </div>
      <div className="display tabular mt-1 text-xl font-black sm:text-2xl">{valor}</div>
      {pie && <div className="text-xs text-tinta-tenue">{pie}</div>}
    </div>
  );
}

/**
 * Lo que se ha hecho desde que se empezó a usar la app, en gráficas. El archivo
 * de la hoja vieja vive aparte (/caja/historico); aquí solo aparece en una
 * línea al pie, para comparar.
 */
export default async function Tablero() {
  await exigirAdmin("/caja/tablero");

  const inicio = await inicioApp();
  if (!inicio) {
    return (
      <div className="space-y-5">
        <h1 className="display text-2xl font-black">Tablero</h1>
        <Tarjeta>
          <Vacio>
            Todavía no hay nada registrado. En cuanto anotes el primer día, aquí
            aparecen el ingreso por semana, en qué se va la plata y qué día se
            vende más.
          </Vacio>
        </Tarjeta>
      </div>
    );
  }

  const [semanas, porDia, gastos, archivo] = await Promise.all([
    semanasApp(),
    porDiaSemanaApp(),
    mayoresConceptos(inicio, hoy(), 10),
    semanasArchivo(),
  ]);

  const ingreso = semanas.reduce((s, x) => s + x.ingreso_bruto, 0);
  const salidas = semanas.reduce((s, x) => s + x.total_salidas, 0);
  const conTransferencia = semanas.some((s) => s.venta_transferencia > 0);
  const comparacion = compararPromedios(archivo, semanas);
  const etiqueta = (lunes: string) => etiquetaCorta(lunes);

  const series = [
    {
      nombre: "Ingreso bruto",
      puntos: semanas.map((s) => ({ etiqueta: etiqueta(s.lunes), valor: s.ingreso_bruto })),
    },
    {
      nombre: "Venta en efectivo",
      puntos: semanas.map((s) => ({ etiqueta: etiqueta(s.lunes), valor: s.venta_efectivo })),
    },
    ...(conTransferencia
      ? [
          {
            nombre: "Venta por transferencia",
            puntos: semanas.map((s) => ({
              etiqueta: etiqueta(s.lunes),
              valor: s.venta_transferencia,
            })),
          },
        ]
      : []),
  ];

  return (
    <div className="escalonado space-y-5">
      <div>
        <h1 className="display text-2xl font-black">Tablero</h1>
        <p className="text-sm text-tinta-suave">
          Desde el {etiquetaLarga(inicio).toLowerCase()}, cuando empezaste a usar la app.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CifraChica titulo="Ingreso bruto" valor={pesos(ingreso)} pie="desde que empezaste" />
        <CifraChica
          titulo="Por semana"
          valor={comparacion.actual !== null ? pesos(comparacion.actual) : "—"}
          pie={
            comparacion.actual !== null
              ? `promedio de ${comparacion.semanasActuales} semanas completas`
              : "falta una semana completa"
          }
        />
        <CifraChica titulo="Gastos" valor={pesos(salidas)} pie="pagos registrados" />
        <CifraChica titulo="Semanas" valor={String(semanas.length)} pie="con algo anotado" />
      </div>

      <Tarjeta titulo="Ingreso y venta por semana">
        {semanas.length < 2 ? (
          <Vacio>La línea aparece cuando haya dos semanas registradas.</Vacio>
        ) : (
          <GraficaLineas series={series} />
        )}
      </Tarjeta>

      <Tarjeta titulo="En qué se va la plata">
        {gastos.length === 0 ? (
          <Vacio>Todavía no hay pagos registrados.</Vacio>
        ) : (
          <GraficaBarras
            datos={gastos.map((g) => ({
              etiqueta: g.concepto,
              valor: g.total,
              detalle: g.veces > 1 ? `×${g.veces}` : undefined,
            }))}
          />
        )}
      </Tarjeta>

      <Tarjeta titulo="Qué día se vende más">
        {porDia.length === 0 ? (
          <Vacio>Aparece cuando haya días cerrados con la venta anotada.</Vacio>
        ) : (
          <>
            <GraficaBarras
              color="#ffb072"
              datos={porDia.map((d) => ({
                etiqueta: DIAS[d.dia - 1],
                valor: d.promedio,
                detalle: `${d.dias} ${d.dias === 1 ? "día" : "días"}`,
              }))}
            />
            <p className="mt-2 text-xs text-tinta-suave">
              Promedio de ingreso bruto por día de la semana.
            </p>
          </>
        )}
      </Tarjeta>

      {/* La comparación chica con el archivo: una línea, nada más. */}
      {comparacion.archivo !== null && (
        <p className="rounded-xl bg-superficie px-4 py-3 text-sm text-tinta-suave ring-1 ring-borde">
          La hoja de 2023 promediaba{" "}
          <span className="tabular font-semibold text-tinta">{pesos(comparacion.archivo)}</span>{" "}
          por semana
          {comparacion.actual !== null ? (
            <>
              ; ahora vas en{" "}
              <span className="tabular font-semibold text-tinta">
                {pesos(comparacion.actual)}
              </span>{" "}
              ({(comparacion.variacion ?? 0) >= 0 ? "+" : ""}
              {comparacion.variacion} %).
            </>
          ) : (
            ". La comparación aparece cuando tengas una semana completa (5 días o más)."
          )}{" "}
          <a href="/caja/historico" className="text-crema-200 underline-offset-2 hover:underline">
            Ver el archivo
          </a>
        </p>
      )}
    </div>
  );
}
