import { Esqueleto } from "@/components/ui";

/** Lo que se ve mientras la base responde. Del tamaño del contenido real. */
export default function Cargando() {
  return (
    <div className="space-y-5">
      <Esqueleto className="h-8 w-40" />
      <Esqueleto className="h-40 w-full rounded-2xl" />
      <Esqueleto className="h-64 w-full rounded-2xl" />
      <Esqueleto className="h-64 w-full rounded-2xl" />
    </div>
  );
}
