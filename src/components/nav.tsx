"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

/**
 * Los botones de navegación.
 *
 * Todas las pantallas son `force-dynamic`: cada toque es un viaje al servidor,
 * y con la base en la nube eso puede tardar más de un segundo. Antes, durante
 * esa espera no cambiaba nada en pantalla y el botón parecía roto — la gente lo
 * volvía a tocar.
 *
 * `useLinkStatus` (Next 15.3+) dice si la navegación de ese enlace está en
 * curso. Se usa desde dentro del `<Link>` para apagar el botón y mostrar un
 * puntico girando: el toque responde al instante aunque la respuesta tarde.
 */
function Cargando() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      aria-hidden
      className="girar ml-1.5 inline-block h-3 w-3 rounded-full border-2 border-current border-t-transparent opacity-60"
    />
  );
}

/** Se apaga mientras se está yendo, para que se note que sí pasó algo. */
function Contenido({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return (
    <span
      className={`inline-flex items-center transition-opacity ${
        pending ? "opacity-60" : ""
      }`}
    >
      {children}
      <Cargando />
    </span>
  );
}

const BASE =
  "inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-medium transition active:scale-95";

/** Enlace del encabezado. Se pinta distinto cuando es la pantalla actual. */
export function EnlaceNav({
  href,
  children,
  exacto = false,
}: {
  href: string;
  children: React.ReactNode;
  exacto?: boolean;
}) {
  const ruta = usePathname();
  const actual = exacto ? ruta === href : ruta.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={actual ? "page" : undefined}
      className={`${BASE} ${
        actual
          ? "bg-white text-marca-700 shadow-sm ring-1 ring-marca-200"
          : "text-white/80 hover:bg-white/15 hover:text-white"
      }`}
    >
      <Contenido>{children}</Contenido>
    </Link>
  );
}

/** Las flechas de días y semanas, y el botón «Hoy». */
export function BotonFecha({
  href,
  children,
  etiqueta,
  resaltado = false,
}: {
  href: string;
  children: React.ReactNode;
  etiqueta: string;
  resaltado?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={etiqueta}
      className={`${BASE} min-w-11 shadow-sm ${
        resaltado
          ? "bg-marca-500 text-white hover:bg-marca-600"
          : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 hover:ring-gray-300"
      }`}
    >
      <Contenido>{children}</Contenido>
    </Link>
  );
}

/**
 * Una fila de días o semanas: ← Hoy →. Se repite en cuatro pantallas, así que
 * vive aquí una sola vez.
 */
export function Flechas({
  atras,
  adelante,
  hoy,
}: {
  atras: string;
  adelante: string;
  hoy?: string;
}) {
  return (
    <div className="no-print flex shrink-0 gap-2">
      <BotonFecha href={atras} etiqueta="Anterior">
        ←
      </BotonFecha>
      {hoy && (
        <BotonFecha href={hoy} etiqueta="Ir a hoy" resaltado>
          Hoy
        </BotonFecha>
      )}
      <BotonFecha href={adelante} etiqueta="Siguiente">
        →
      </BotonFecha>
    </div>
  );
}

/**
 * Enlace de tarjeta: los días de la semana, la lista de deudores. Mismo aviso
 * de carga que los demás, pero ocupando todo el ancho.
 */
export function TarjetaEnlace({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`block transition active:scale-[.99] ${className}`}>
      <Bloque>{children}</Bloque>
    </Link>
  );
}

/** Como `Contenido`, pero sin volver el contenido una línea. */
function Bloque({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return (
    <div className={`transition-opacity ${pending ? "opacity-60" : ""}`}>
      {children}
    </div>
  );
}
