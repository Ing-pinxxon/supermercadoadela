import { Encabezado } from "@/components/encabezado";

export default function FiadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Encabezado seccion="caja" />
      <main className="mx-auto max-w-3xl px-4 py-5">{children}</main>
    </div>
  );
}
