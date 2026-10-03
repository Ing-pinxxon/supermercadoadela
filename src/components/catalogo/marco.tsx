import { Encabezado } from "@/components/encabezado";

/** El marco de las pantallas del catálogo: el encabezado de la administración. */
export function MarcoCatalogo({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Encabezado seccion="catalogo" />
      <main className="mx-auto max-w-3xl px-4 py-5">{children}</main>
    </div>
  );
}
