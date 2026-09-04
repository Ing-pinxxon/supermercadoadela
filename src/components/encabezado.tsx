import Link from "next/link";
import { EnlaceNav } from "@/components/nav";
import { rolActual } from "@/lib/sesion";
import { hoy } from "@/lib/fechas";

/**
 * La barra de arriba, igual en caja, fiados y tareas.
 *
 * Los enlaces dependen del rol: quien entra con la clave de la tienda no ve
 * Semana ni Histórico — para él esas pantallas no existen. El middleware
 * bloquea la ruta; esto es lo que hace que ni siquiera se ofrezca.
 */
export async function Encabezado({ seccion }: { seccion: "caja" | "tareas" }) {
  const rol = await rolActual();
  const admin = rol === "admin" || rol === "abierto";

  return (
    <header className="no-print sticky top-0 z-10 bg-gradient-to-r from-marca-600 to-marca-700 shadow-sm">
      <div className="mx-auto max-w-3xl px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            className="rounded-lg px-2 py-1 text-sm font-bold text-white transition active:scale-95 hover:bg-white/15"
          >
            Adela
          </Link>

          {rol !== "abierto" && (
            <a
              href="/salir"
              className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white transition active:scale-95 hover:bg-white/25"
              title="Cerrar sesión"
            >
              {rol === "admin" ? "Admin" : "Tienda"} ·{" "}
              <span className="opacity-80">salir</span>
            </a>
          )}
        </div>

        {/* En una fila aparte: en el celular no caben al lado del nombre. */}
        <nav className="-mx-1 mt-1 flex items-center gap-1 overflow-x-auto px-1">
          {seccion === "caja" ? (
            <>
              <EnlaceNav href={`/caja/dia/${hoy()}`}>Hoy</EnlaceNav>
              <EnlaceNav href="/fiado">Fiados</EnlaceNav>
              {admin && (
                <>
                  <EnlaceNav href="/caja/semana">Semana</EnlaceNav>
                  <EnlaceNav href="/caja/historico">Histórico</EnlaceNav>
                </>
              )}
            </>
          ) : (
            <>
              <EnlaceNav href="/tareas" exacto>
                Hoy
              </EnlaceNav>
              <EnlaceNav href="/tareas/semana">Semana</EnlaceNav>
              <EnlaceNav href="/tareas/rutina">Rutina</EnlaceNav>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
