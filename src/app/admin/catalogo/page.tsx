import Link from "next/link";
import { apiAdmin, cargar } from "@/lib/api-catalogo";
import { ListaProductos } from "@/components/catalogo/lista-productos";
import { SinCatalogo } from "@/components/catalogo/sin-catalogo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Catálogo" };

export default async function Catalogo() {
  const { datos: productos, error } = await cargar(() => apiAdmin.productos());

  const publicados = productos?.filter((p) => p.publicado).length ?? 0;
  const sinPrecio = productos?.filter((p) => p.precio <= 0).length ?? 0;

  return (
    <div className="escalonado space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="display text-2xl font-black">Catálogo de la tienda</h1>
          {productos && (
            <p className="text-sm text-tinta-suave">
              {publicados} de {productos.length} en la tienda
              {sinPrecio > 0 && <> · {sinPrecio} sin precio</>}
            </p>
          )}
        </div>
        <Link
          href="/admin/catalogo/nuevo"
          className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-crema-200 px-4 text-sm font-semibold text-sobre-crema shadow-md shadow-verde-950/30 transition active:scale-95"
        >
          + Producto
        </Link>
      </div>

      {!productos ? (
        <SinCatalogo error={error} />
      ) : (
        <>
          <p className="text-xs text-tinta-suave">
            Toca el precio para cambiarlo. Con − y + ajustas el stock (∞ = no se lleva la cuenta). El
            interruptor lo muestra u oculta en la tienda. Lo demás, tocando el nombre.
          </p>
          <ListaProductos productos={productos} />
        </>
      )}
    </div>
  );
}
