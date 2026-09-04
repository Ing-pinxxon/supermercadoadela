import { Esqueleto } from "@/components/ui";

/** Lo que se ve mientras la base responde. Del tamaño del contenido real. */
export default function Cargando() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-2">
        <Esqueleto className="h-8 w-56" />
        <Esqueleto className="h-11 w-28" />
      </div>
      <Esqueleto className="h-64 w-full rounded-2xl" />
      <Esqueleto className="h-32 w-full rounded-2xl" />
      <Esqueleto className="h-32 w-full rounded-2xl" />
    </div>
  );
}
