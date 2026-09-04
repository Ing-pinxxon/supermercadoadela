"use client";

import { useFormStatus } from "react-dom";

/**
 * Los botones, como en la marca: píldoras crema sobre el verde. El principal
 * es crema sólido; el secundario, solo el contorno.
 */
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
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition active:scale-[.97] disabled:opacity-50 disabled:active:scale-100";
  const estilos = {
    principal:
      "bg-crema-200 text-sobre-crema shadow-md shadow-verde-950/30 hover:bg-crema-100",
    acento:
      "bg-crema-200 text-sobre-crema shadow-md shadow-verde-950/30 hover:bg-crema-100",
    secundario:
      "bg-transparent text-tinta ring-1 ring-crema-200/60 hover:bg-crema-200/10 hover:ring-crema-200",
    peligro:
      "bg-transparent text-rojo ring-1 ring-rojo/40 hover:bg-rojo/10 hover:ring-rojo",
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
