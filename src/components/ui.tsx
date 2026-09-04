import Link from "next/link";
import { pesos } from "@/lib/dinero";

export function Tarjeta({
  titulo,
  accion,
  children,
  className = "",
}: {
  titulo?: string;
  accion?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl bg-superficie p-4 shadow-sm ring-1 ring-borde transition hover:ring-borde-fuerte ${className}`}
    >
      {(titulo || accion) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          {titulo && (
            <h2 className="text-xs font-semibold uppercase tracking-wider text-tinta-suave">
              {titulo}
            </h2>
          )}
          {accion}
        </header>
      )}
      {children}
    </section>
  );
}

export function Campo({
  etiqueta,
  ayuda,
  children,
}: {
  etiqueta: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-tinta">
        {etiqueta}
      </span>
      {children}
      {ayuda && (
        <span className="mt-1 block text-xs text-tinta-suave">{ayuda}</span>
      )}
    </label>
  );
}

/** Los campos van en crema clara: sobre el verde, lo escrito se perdería. */
const claseInput =
  "w-full rounded-xl border border-transparent bg-crema-50 px-3 py-2.5 text-verde-900 outline-none transition focus:border-crema-300 focus:ring-2 focus:ring-crema-200/50";

export function Texto(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${claseInput} ${props.className ?? ""}`} />;
}

export function Monto(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      inputMode="numeric"
      autoComplete="off"
      placeholder="0"
      {...props}
      className={`${claseInput} monto ${props.className ?? ""}`}
    />
  );
}

export function Seleccion(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) {
  return (
    <select {...props} className={`${claseInput} ${props.className ?? ""}`}>
      {props.children}
    </select>
  );
}

export function Fila({
  etiqueta,
  valor,
  tono = "normal",
  fuerte = false,
}: {
  etiqueta: string;
  valor: number;
  tono?: "normal" | "positivo" | "negativo" | "suave";
  fuerte?: boolean;
}) {
  const color =
    tono === "positivo"
      ? "text-crema-200"
      : tono === "negativo"
        ? "text-rojo"
        : tono === "suave"
          ? "text-tinta-suave"
          : "text-tinta";
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className={`text-sm ${fuerte ? "font-semibold" : "text-tinta-suave"}`}>
        {etiqueta}
      </span>
      <span
        className={`tabular text-sm ${fuerte ? "text-base font-bold" : ""} ${color}`}
      >
        {pesos(valor)}
      </span>
    </div>
  );
}

export function Vacio({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-superficie-2 px-3 py-6 text-center text-sm text-tinta-suave">
      {children}
    </p>
  );
}

export function Volver({ href, texto }: { href: string; texto: string }) {
  return (
    <Link
      href={href}
      className="text-sm text-tinta-suave underline-offset-2 hover:text-tinta hover:underline"
    >
      ← {texto}
    </Link>
  );
}

/** Una etiqueta pequeña: «Transf.», «Admin», «Día cerrado». */
export function Insignia({
  children,
  tono = "gris",
}: {
  children: React.ReactNode;
  tono?: "gris" | "marca" | "acento" | "rojo";
}) {
  const color = {
    gris: "bg-superficie-2 text-tinta-suave",
    marca: "bg-crema-200 text-sobre-crema",
    acento: "bg-crema-200 text-sobre-crema",
    rojo: "bg-rojo/15 text-rojo",
  }[tono];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
    >
      {children}
    </span>
  );
}

/**
 * El número grande de una pantalla: el ingreso del día, lo que se debe. Va en
 * una tarjeta crema, la única cosa clara de la pantalla, para que se vea de
 * lejos.
 */
export function Cifra({
  titulo,
  valor,
  pie,
  children,
}: {
  titulo: string;
  valor: string;
  pie?: string;
  /** Se acepta por compatibilidad: en este tema todas las cifras van en crema. */
  tono?: "marca" | "acento";
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-crema-100 p-4 text-sobre-crema shadow-lg shadow-verde-950/30">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-verde-700">
        {titulo}
      </h2>
      <div className="display tabular mt-1 text-4xl font-black">{valor}</div>
      {pie && <p className="mt-0.5 text-xs text-verde-700">{pie}</p>}
      {children && (
        <div className="mt-3 border-t border-dashed border-verde-700/30 pt-2">
          {children}
        </div>
      )}
    </section>
  );
}

/** Una fila de la tarjeta de cifra, en verde sobre la crema. */
export function FilaClara({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-sm text-verde-700">{etiqueta}</span>
      <span className="tabular shrink-0 whitespace-nowrap text-sm font-semibold">
        {valor}
      </span>
    </div>
  );
}

/** Bloque que late mientras carga una pantalla (ver los loading.tsx). */
export function Esqueleto({ className = "" }: { className?: string }) {
  return <div className={`esqueleto ${className}`} />;
}
