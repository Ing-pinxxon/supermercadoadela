"use client";

import { useFormStatus } from "react-dom";

export function Boton({
  children,
  variante = "principal",
  confirmar,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "principal" | "secundario" | "peligro";
  confirmar?: string;
}) {
  const { pending } = useFormStatus();

  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50";
  const estilos = {
    principal: "bg-marca-500 text-white hover:bg-marca-600",
    secundario:
      "bg-white text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50",
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
      {pending ? "Guardando…" : children}
    </button>
  );
}
