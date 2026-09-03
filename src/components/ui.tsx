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
      className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 ${className}`}
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
