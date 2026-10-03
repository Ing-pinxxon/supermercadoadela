import Link from "next/link";
import type { CategoriaVista } from "@/lib/api-catalogo";
import { Dibujo } from "@/components/tienda/dibujos";

/** Las categorías como estantes con dibujo, en una fila que se desliza. */
export function Estantes({ categorias, activa }: { categorias: CategoriaVista[]; activa?: string }) {
  const todos = [{ slug: "", nombre: "Todo", icono: "todo" }, ...categorias];
  return (
    <nav aria-label="Categorías" className="tira px-4 pb-3 pt-1">
      {todos.map((c) => {
        const on = (activa ?? "") === c.slug;
        return (
          <Link
            key={c.slug || "todo"}
            href={c.slug ? `/c/${c.slug}` : "/"}
            aria-current={on ? "page" : undefined}
            className="flex w-[4.25rem] flex-col items-center gap-1 text-center text-[11px] font-bold leading-tight transition active:scale-95"
          >
            <span
              className={`grid h-14 w-14 place-items-center rounded-lg ${
                on ? "bg-maiz shadow-[2px_2px_0_var(--color-maiz-osc)]" : "carton-chico"
              }`}
            >
              <Dibujo icono={c.icono} className="h-9 w-auto" />
            </span>
            {c.nombre}
          </Link>
        );
      })}
    </nav>
  );
}

export function TituloSeccion({ titulo, href }: { titulo: string; href?: string }) {
  return (
    <div className="flex items-baseline justify-between px-4 pt-2">
      <h2 className="text-[15px] font-black uppercase">{titulo}</h2>
      {href && (
        <Link href={href} className="font-mano text-[15px] text-navidad">
          Ver todo
        </Link>
      )}
    </div>
  );
}
