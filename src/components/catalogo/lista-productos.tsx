"use client";

import Link from "next/link";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ProductoAdmin } from "@/lib/api-catalogo";
import { cambiarPrecio, cambiarPublicado, cambiarStock } from "@/app/admin/catalogo/actions";
import { pesos } from "@/lib/dinero";
import { MensajeError } from "@/components/catalogo/form-resultado";
import { Aviso, useAviso } from "@/components/aviso";
import { sinTildes } from "@/lib/texto";

type Filtro = "todos" | "publicados" | "ocultos" | "agotados" | "sinPrecio";

const FILTROS: { id: Filtro; texto: string }[] = [
  { id: "todos", texto: "Todos" },
  { id: "publicados", texto: "En la tienda" },
  { id: "ocultos", texto: "Ocultos" },
  { id: "sinPrecio", texto: "Sin precio" },
  { id: "agotados", texto: "Agotados" },
];

/**
 * La lista del catálogo, para usar parado en la tienda con el celular: buscar,
 * sumar o restar stock, cambiar el precio y publicar sin abrir cada producto.
 *
 * Los cambios se ven al instante (optimista) y se mandan a la API por detrás;
 * si la API dice que no, el número vuelve a lo de antes y sale el mensaje.
 */
export function ListaProductos({ productos }: { productos: ProductoAdmin[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const visibles = useMemo(() => {
    const q = sinTildes(busqueda.trim().toLowerCase());
    return productos.filter((p) => {
      if (q && !sinTildes(`${p.nombre} ${p.presentacion ?? ""} ${p.categoria}`.toLowerCase()).includes(q)) return false;
      if (filtro === "publicados") return p.publicado;
      if (filtro === "ocultos") return !p.publicado;
      if (filtro === "agotados") return p.disponibilidad === "AGOTADO";
      if (filtro === "sinPrecio") return p.precio <= 0;
      return true;
    });
  }, [productos, busqueda, filtro]);

  const porCategoria = useMemo(() => {
    const grupos = new Map<string, ProductoAdmin[]>();
    for (const p of visibles) grupos.set(p.categoria, [...(grupos.get(p.categoria) ?? []), p]);
    return [...grupos.entries()];
  }, [visibles]);

  return (
    <div className="space-y-4">
      <div className="sticky top-[6.5rem] z-[5] -mx-1 space-y-2 bg-fondo/90 px-1 pb-2 pt-1 backdrop-blur">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar: aguardiente, hielo…"
          aria-label="Buscar producto"
          className="w-full rounded-xl border border-transparent bg-crema-50 px-3 py-2.5 text-verde-900 outline-none focus:ring-2 focus:ring-crema-200/50"
        />
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              aria-pressed={filtro === f.id}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                filtro === f.id ? "bg-crema-200 text-sobre-crema" : "text-tinta-suave ring-1 ring-borde"
              }`}
            >
              {f.texto}
            </button>
          ))}
        </div>
      </div>

      {porCategoria.length === 0 && (
        <p className="rounded-xl bg-superficie-2 px-3 py-6 text-center text-sm text-tinta-suave">
          Nada con ese filtro.
        </p>
      )}

      {porCategoria.map(([categoria, lista]) => (
        <section key={categoria} className="rounded-2xl bg-superficie p-3 ring-1 ring-borde">
          <h2 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wider text-tinta-suave">
            {categoria} <span className="text-tinta-tenue">· {lista.length}</span>
          </h2>
          <ul className="divide-y divide-borde">
            {lista.map((p) => (
              <FilaProducto key={p.id} producto={p} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function FilaProducto({ producto }: { producto: ProductoAdmin }) {
  const router = useRouter();
  const [pendiente, empezar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useAviso();
  const [editandoPrecio, setEditandoPrecio] = useState(false);
  const [p, cambiarLocal] = useOptimistic(producto, (actual, cambio: Partial<ProductoAdmin>) => ({
    ...actual,
    ...cambio,
  }));

  function correr(cambio: Partial<ProductoAdmin>, accion: () => Promise<{ ok: boolean; error?: string; aviso?: string }>) {
    setError(null);
    empezar(async () => {
      cambiarLocal(cambio);
      const r = await accion();
      if (!r.ok) setError(r.error ?? "No se pudo guardar.");
      else if (r.aviso) setAviso(r.aviso);
      router.refresh();
    });
  }

  const sumar = (delta: number) =>
    correr({ stock: Math.max(0, (p.stock ?? 0) + delta) }, () => cambiarStock(p.id, { delta }));

  return (
    <li className={`py-3 ${pendiente ? "opacity-80" : ""}`}>
      <div className="flex items-start gap-3">
        <Link
          href={`/admin/catalogo/${p.id}`}
          className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-crema-50"
          aria-label={`Editar ${p.nombre}`}
        >
          {p.fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.fotoUrl} alt="" className="h-full w-full object-contain" loading="lazy" />
          ) : (
            <span className="text-lg text-verde-700">{p.nombre.slice(0, 1)}</span>
          )}
        </Link>

        <Link href={`/admin/catalogo/${p.id}`} className="min-w-0 flex-1 hover:underline">
          <span className="block font-medium leading-snug">{p.nombre}</span>
          {p.presentacion && <span className="block text-xs text-tinta-suave">{p.presentacion}</span>}
        </Link>

        <button
          type="button"
          role="switch"
          aria-checked={p.publicado}
          onClick={() => correr({ publicado: !p.publicado }, () => cambiarPublicado(p.id, !p.publicado))}
          className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition ${p.publicado ? "bg-crema-200" : "bg-superficie-2 ring-1 ring-borde"}`}
          title={p.publicado ? "En la tienda: tocar para ocultar" : "Oculto: tocar para publicar"}
          aria-label={`${p.nombre} en la tienda`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full transition-all ${
              p.publicado ? "left-6 bg-verde-800" : "left-1 bg-tinta-suave"
            }`}
          />
        </button>
      </div>

      {/* Segunda línea: precio a la izquierda, stock a la derecha. */}
      <div className="mt-2 flex items-center justify-between gap-3 pl-[3.75rem]">
        {editandoPrecio ? (
          <form
            className="flex items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              const nuevo = Number(String(new FormData(e.currentTarget).get("precio")).replace(/\D/g, ""));
              setEditandoPrecio(false);
              if (nuevo !== p.precio) correr({ precio: nuevo }, () => cambiarPrecio(p.id, nuevo, p.precioAntes));
            }}
          >
            <input
              name="precio"
              inputMode="numeric"
              defaultValue={p.precio || ""}
              autoFocus
              onBlur={(e) => e.currentTarget.form?.requestSubmit()}
              aria-label="Precio"
              className="monto w-28 rounded-lg bg-crema-50 px-2 py-1.5 text-verde-900"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setEditandoPrecio(true)}
            className={`tabular rounded-md py-1 text-sm font-semibold underline decoration-dotted underline-offset-4 ${
              p.precio > 0 ? "text-tinta" : "text-rojo"
            }`}
            title="Cambiar precio"
          >
            {p.precio > 0 ? pesos(p.precio) : "Ponle precio"}
          </button>
        )}

        <div className="flex shrink-0 items-center gap-1" aria-label="Stock">
          <button
            type="button"
            onClick={() => sumar(-1)}
            disabled={p.stock === null || p.stock <= 0}
            className="h-9 w-9 rounded-lg text-lg font-bold ring-1 ring-borde transition active:scale-90 disabled:opacity-30"
            aria-label={`Restar uno al stock de ${p.nombre}`}
          >
            −
          </button>
          <span
            className={`tabular min-w-10 text-center text-sm font-bold ${
              p.stock === 0 ? "text-rojo" : p.stock !== null && p.stock <= 5 ? "text-crema-300" : ""
            }`}
            title={p.stock === null ? "No se lleva la cuenta" : "Unidades"}
          >
            {p.stock === null ? "∞" : p.stock}
          </span>
          <button
            type="button"
            onClick={() => sumar(1)}
            className="h-9 w-9 rounded-lg text-lg font-bold ring-1 ring-borde transition active:scale-90"
            aria-label={`Sumar uno al stock de ${p.nombre}`}
          >
            +
          </button>
        </div>
      </div>
      {error && (
        <div className="mt-2">
          <MensajeError texto={error} />
        </div>
      )}
      <Aviso texto={aviso} />
    </li>
  );
}
