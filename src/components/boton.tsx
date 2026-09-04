"use client";

import { useFormStatus } from "react-dom";

export function Boton({
  children,
  variante = "principal",
  confirmar,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "principal" | "secundario" | "peligro" | "acento";
  confirmar?: string;
}) {
  const { pending } = useFormStatus();

  const base =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold shadow-sm transition active:scale-[.97] disabled:opacity-50 disabled:active:scale-100";
  const estilos = {
    principal:
      "bg-marca-500 text-white hover:bg-marca-600 shadow-marca-500/20 hover:shadow-md",
    secundario:
      "bg-white text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 hover:ring-gray-400",
    acento:
      "bg-acento-500 text-white hover:bg-acento-600 shadow-acento-500/20 hover:shadow-md",
    peligro: "bg-white text-red-600 ring-1 ring-red-200 hover:bg-red-50",
  }[variante];

  return (
    <button
      {...props}
      disabled={pending || props.disabled}
      onClick={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
        props.onClick?.(e);
      }}
      className={`${base} ${estilos} ${props.className ?? ""}`}
    >
      {pending && (
        <span
          aria-hidden
          className="girar h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent opacity-70"
        />
      )}
      {pending ? "Guardando…" : children}
    </button>
  );
}
