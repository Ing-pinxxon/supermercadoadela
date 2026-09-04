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
      className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 transition hover:shadow-md ${className}`}
    >
      {(titulo || accion) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          {titulo && (
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
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
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {etiqueta}
      </span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-gray-500">{ayuda}</span>}
    </label>
  );
}

const claseInput =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-100";

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
      ? "text-marca-600"
      : tono === "negativo"
        ? "text-red-600"
        : tono === "suave"
          ? "text-gray-500"
          : "text-gray-900";
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className={`text-sm ${fuerte ? "font-semibold" : "text-gray-600"}`}>
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
    <p className="rounded-xl bg-gray-50 px-3 py-6 text-center text-sm text-gray-500">
      {children}
    </p>
  );
}

export function Volver({ href, texto }: { href: string; texto: string }) {
  return (
    <Link
      href={href}
      className="text-sm text-gray-500 underline-offset-2 hover:underline"
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
    gris: "bg-gray-100 text-gray-600",
    marca: "bg-marca-100 text-marca-700",
    acento: "bg-acento-100 text-acento-700",
    rojo: "bg-red-50 text-red-600",
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
 * su propia tarjeta de color para que se distinga del resto de la información.
 */
export function Cifra({
  titulo,
  valor,
  pie,
  tono = "marca",
  children,
}: {
  titulo: string;
  valor: string;
  pie?: string;
  tono?: "marca" | "acento";
  children?: React.ReactNode;
}) {
  const fondo =
    tono === "marca"
      ? "from-marca-500 to-marca-700 shadow-marca-500/25"
      : "from-acento-500 to-acento-700 shadow-acento-500/25";
  return (
    <section
      className={`rounded-2xl bg-gradient-to-br ${fondo} p-4 text-white shadow-lg`}
    >
      <h2 className="text-xs font-semibold uppercase tracking-wide text-white/70">
        {titulo}
      </h2>
      <div className="tabular mt-1 text-3xl font-bold">{valor}</div>
      {pie && <p className="mt-0.5 text-xs text-white/70">{pie}</p>}
      {children && (
        <div className="mt-3 border-t border-dashed border-white/25 pt-2">
          {children}
        </div>
      )}
    </section>
  );
}

/** Una fila de la tarjeta de cifra, en blanco sobre el color. */
export function FilaClara({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-sm text-white/80">{etiqueta}</span>
      <span className="tabular shrink-0 whitespace-nowrap text-sm font-semibold">
        {valor}
      </span>
    </div>
  );
}

/** Bloque gris que late mientras carga una pantalla (ver los loading.tsx). */
export function Esqueleto({ className = "" }: { className?: string }) {
  return <div className={`esqueleto ${className}`} />;
}
