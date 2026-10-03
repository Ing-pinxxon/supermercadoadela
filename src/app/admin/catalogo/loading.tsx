import { Esqueleto } from "@/components/ui";

/** Mientras la API contesta (si estaba dormida, puede tardar un minuto). */
export default function Cargando() {
  return (
    <div className="space-y-4">
      <Esqueleto className="h-8 w-56" />
      <p className="text-sm text-tinta-suave">Trayendo el catálogo…</p>
      <Esqueleto className="h-11 w-full" />
      <Esqueleto className="h-64 w-full" />
      <Esqueleto className="h-40 w-full" />
    </div>
  );
}
