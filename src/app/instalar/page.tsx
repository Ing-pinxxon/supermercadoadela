import Link from "next/link";
import { estadoBase, TABLAS } from "@/lib/instalacion";
import { Tarjeta, Vacio, Volver } from "@/components/ui";
import { Boton } from "@/components/boton";
import { prepararBase, importarHistorico } from "./actions";

export const dynamic = "force-dynamic";

function Punto({
  ok,
  titulo,
  children,
}: {
  ok: boolean;
  titulo: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${
          ok ? "bg-marca-500" : "bg-red-500"
        }`}
      >
        {ok ? "✓" : "!"}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-medium">{titulo}</div>
        {children && (
          <div className="mt-0.5 break-words text-sm text-gray-500">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

export default async function Instalar() {
  const e = await estadoBase();
  const tablasListas = e.conectada && e.faltan.length === 0;
  const todoListo = tablasListas && e.tareasRutina > 0;

  return (
    <main className="mx-auto max-w-xl space-y-5 px-4 py-8">
      <div>
        <Volver href="/" texto="Inicio" />
        <h1 className="mt-2 text-xl font-bold">Estado de la base de datos</h1>
        <p className="text-sm text-gray-500">
          Esta pantalla revisa la conexión y crea lo que falte. Se puede volver
          a usar cuando sea: no borra lo que ya esté registrado.
        </p>
      </div>

      <Tarjeta titulo="Conexión">
        <Punto ok={Boolean(e.variable)} titulo="Variable de conexión">
          {e.variable ? (
            <>
              Se está usando <code className="font-mono">{e.variable}</code>
              {e.host && <> → {e.host}</>}
            </>
          ) : (
            "No hay ninguna. En Vercel: Storage → Neon → Connect Project, o Settings → Environment Variables → DATABASE_URL. Después toca volver a desplegar (Deployments → Redeploy)."
          )}
        </Punto>
        <Punto ok={e.conectada} titulo="La base responde">
          {e.conectada ? e.version : e.error}
        </Punto>
      </Tarjeta>

      {e.conectada && (
        <>
          <Tarjeta titulo="Tablas">
            <Punto
              ok={tablasListas}
              titulo={`${TABLAS.length - e.faltan.length} de ${TABLAS.length} tablas creadas`}
            >
              {e.faltan.length > 0 && <>Faltan: {e.faltan.join(", ")}.</>}
            </Punto>
            <Punto
              ok={e.tareasRutina > 0}
              titulo={`Rutina de tareas: ${e.tareasRutina}`}
            >
              {e.tareasRutina === 0 &&
                "Sin la rutina, la pantalla de tareas se ve vacía."}
            </Punto>
            <form action={prepararBase} className="mt-3">
              <Boton type="submit" variante={todoListo ? "secundario" : "principal"}>
                {todoListo ? "Volver a revisar" : "Crear tablas y rutina"}
              </Boton>
            </form>
          </Tarjeta>

          <Tarjeta titulo="Archivo histórico">
            <Punto
              ok={e.diasHistorico > 0}
              titulo={`${e.diasHistorico} días de la hoja cargados`}
            >
              {e.diasHistorico === 0
                ? "Es opcional: son las 26 semanas de la hoja vieja, para /caja/histórico."
                : "Cargar de nuevo reemplaza el archivo; no toca lo que registres en la app."}
            </Punto>
            <form action={importarHistorico} className="mt-3">
              <Boton
                type="submit"
                variante="secundario"
                disabled={!tablasListas}
                confirmar={
                  e.diasHistorico > 0
                    ? "Se va a reemplazar el archivo histórico con lo que trae la hoja. ¿Seguir?"
                    : undefined
                }
              >
                {e.diasHistorico > 0 ? "Volver a cargar" : "Cargar histórico"}
              </Boton>
            </form>
          </Tarjeta>

          <Tarjeta titulo="Lo registrado en la app">
            <p className="text-sm text-gray-600">
              {e.diasRegistrados} día(s) cerrados desde la app.
            </p>
          </Tarjeta>
        </>
      )}

      {todoListo ? (
        <div className="flex gap-3">
          <Link
            href="/caja"
            className="rounded-xl bg-marca-500 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Ir a caja
          </Link>
          <Link
            href="/tareas"
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-gray-300"
          >
            Ir a tareas
          </Link>
        </div>
      ) : (
        <Vacio>
          Cuando los puntos estén en verde, la app carga sin errores.
        </Vacio>
      )}
    </main>
  );
}
