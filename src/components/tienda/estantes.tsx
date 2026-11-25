import Link from "next/link";
import type { CategoriaVista } from "@/lib/api-catalogo";
import { COLORES_NEON, Estrella, Flecha, HEX_NEON, IconoNeon } from "@/components/tienda/iconos-neon";

/**
 * Los estantes de la tienda como tarjetas de neón: cada uno con su color, su
 * ícono de tubo y «Ver todo». En el celular se deslizan; en el computador van
 * en filas de cuatro.
 */
export function Categorias({ categorias, activa }: { categorias: CategoriaVista[]; activa?: string }) {
  return (
    <nav aria-label="Categorías" className="ne-cats">
      {categorias.map((c, i) => (
        <Link
          key={c.slug}
          href={`/c/${c.slug}`}
          className="ne-cat tubo"
          aria-current={activa === c.slug ? "page" : undefined}
          style={{ ["--c" as string]: COLORES_NEON[i % COLORES_NEON.length] }}
          prefetch={false}
        >
          <b>{c.nombre}</b>
          <small>
            Ver todo <Flecha />
          </small>
          <IconoNeon icono={c.icono} color={HEX_NEON[i % HEX_NEON.length]} />
        </Link>
      ))}
    </nav>
  );
}

/** Título de sección: antetítulo dorado, el título y la línea con la estrella. */
export function TituloSeccion({
  ceja,
  titulo,
  texto,
  nivel = 2,
}: {
  ceja?: string;
  titulo: string;
  texto?: string | null;
  nivel?: 1 | 2;
}) {
  const H = nivel === 1 ? "h1" : "h2";
  return (
    <div className="ne-titulo">
      {ceja && <span className="ceja">{ceja}</span>}
      <H>{titulo}</H>
      <div className="ne-adorno">
        <Estrella />
      </div>
      {texto && <p>{texto}</p>}
    </div>
  );
}
