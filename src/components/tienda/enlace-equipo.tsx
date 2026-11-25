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
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-3 z-50 rounded-full border border-white/15 bg-black/75 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur"
    >
      ← Administración
    </Link>
  );
}
