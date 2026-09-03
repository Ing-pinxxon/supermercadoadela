import Link from "next/link";
import { hoy } from "@/lib/fechas";

export default function CajaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3">
          <Link href="/" className="text-sm font-bold">
            Adela
          </Link>
          <nav className="flex gap-4 text-sm text-gray-600">
            <Link href="/caja" className="hover:text-gray-900">
              Semana
            </Link>
            <Link href={`/caja/dia/${hoy()}`} className="hover:text-gray-900">
              Hoy
            </Link>
            <Link href="/caja/historico" className="hover:text-gray-900">
              Histórico
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
