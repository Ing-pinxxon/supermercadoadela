import Link from "next/link";
import { apiAdmin, cargar } from "@/lib/api-catalogo";
import { pesos } from "@/lib/dinero";
import { Insignia, Vacio } from "@/components/ui";
import { SinCatalogo } from "@/components/catalogo/sin-catalogo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Combos" };

export default async function Combos() {
  const { datos: combos, error } = await cargar(() => apiAdmin.combos());
  if (!combos) return <SinCatalogo error={error} />;

  return (
    <div className="escalonado space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="display text-2xl font-black">Combos</h1>
          <p className="text-sm text-tinta-suave">Varios productos a un solo precio. El «de la semana» sale en el inicio.</p>
        </div>
        <Link
          href="/admin/catalogo/combos/nuevo"
          className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-crema-200 px-4 text-sm font-semibold text-sobre-crema shadow-md shadow-verde-950/30 transition active:scale-95"
        >
          + Combo
        </Link>
      </div>

      {combos.length === 0 ? (
        <Vacio>Todavía no hay combos.</Vacio>
      ) : (
        <ul className="space-y-3">
          {combos.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/catalogo/combos/${c.id}`}
                className="block rounded-2xl bg-superficie p-4 ring-1 ring-borde transition hover:ring-borde-fuerte active:scale-[.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">{c.nombre}</div>
                    <div className="mt-0.5 text-sm text-tinta-suave">
                      {c.items.map((i) => `${i.cantidad > 1 ? `${i.cantidad} × ` : ""}${i.nombre}`).join(" + ")}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Insignia tono={c.publicado ? "marca" : "gris"}>{c.publicado ? "En la tienda" : "Oculto"}</Insignia>
                      {c.deLaSemana && <Insignia>De la semana</Insignia>}
                      {c.disponibilidad === "AGOTADO" && <Insignia tono="rojo">Agotado</Insignia>}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="tabular font-bold">{c.precio > 0 ? pesos(c.precio) : "Sin precio"}</div>
                    <div className="tabular text-xs text-tinta-suave">por separado {pesos(c.precioPorSeparado)}</div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
