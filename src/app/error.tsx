"use client";

import Link from "next/link";

/**
 * Antes, cualquier fallo de base (tablas sin crear, variable sin poner) salía
 * como la pantalla en blanco de Next: "Application error". Esta pantalla dice
 * qué revisar y lleva al diagnóstico.
 *
 * En producción Next no manda el texto del error al navegador, solo el
 * `digest`; el detalle está en /instalar y en los logs de Vercel.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-xl font-bold">No se pudo cargar la información</h1>
      <p className="mt-2 text-sm text-gray-600">
        Casi siempre es la base de datos: falta la variable de conexión, o las
        tablas todavía no están creadas.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/instalar"
          className="rounded-xl bg-marca-500 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Revisar la base de datos
        </Link>
        <button
          onClick={reset}
          className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-gray-300"
        >
          Reintentar
        </button>
      </div>

      {(error.message || error.digest) && (
        <p className="mt-6 break-words font-mono text-xs text-gray-400">
          {error.message}
          {error.digest && ` (${error.digest})`}
        </p>
      )}
    </main>
  );
}
