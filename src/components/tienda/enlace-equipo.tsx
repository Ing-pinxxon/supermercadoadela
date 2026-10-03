"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** «Administración», solo para quien ya entró con una de las claves. */
export function EnlaceEquipo() {
  const [equipo, setEquipo] = useState(false);
  useEffect(() => setEquipo(document.cookie.split("; ").some((c) => c === "adela_equipo=1")), []);
  if (!equipo) return null;
  return (
    <Link
      href="/admin"
      className="fixed left-3 top-[calc(0.5rem+env(safe-area-inset-top))] z-50 rounded-full bg-cafe/85 px-3 py-1 text-xs font-semibold text-papel shadow"
    >
      ← Administración
    </Link>
  );
}
