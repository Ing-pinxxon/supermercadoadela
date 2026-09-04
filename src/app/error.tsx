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
      <h1 className="display text-2xl font-black">No se pudo cargar la información</h1>
      <p className="mt-2 text-sm text-tinta-suave">
        Casi siempre es la base de datos: falta la variable de conexión, las
        tablas no están creadas, o la app se actualizó y a la base le falta
        algo nuevo. Todo eso se arregla desde «Revisar la base de datos», con la
        clave de administrador.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/instalar"
          className="rounded-full bg-crema-200 px-5 py-2.5 text-sm font-semibold text-sobre-crema shadow-md shadow-verde-950/30"
        >
          Revisar la base de datos
        </Link>
        <button
          onClick={reset}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-tinta ring-1 ring-crema-200/60"
        >
          Reintentar
        </button>
        {/* Siempre tiene que haber una salida: si la sesión guardada es la de
            la tienda, /instalar pide la de administrador y sin esto no habría
            cómo cambiarla. */}
        <a
          href="/salir"
          className="rounded-full px-4 py-2.5 text-sm font-semibold text-tinta-suave underline-offset-2 hover:underline"
        >
          Entrar con otra clave
        </a>
      </div>

      {(error.message || error.digest) && (
        <p className="mt-6 break-words font-mono text-xs text-tinta-tenue">
          {error.message}
          {error.digest && ` (${error.digest})`}
        </p>
      )}
    </main>
  );
}
