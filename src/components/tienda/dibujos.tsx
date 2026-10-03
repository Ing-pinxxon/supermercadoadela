/**
 * Los dibujos de la tienda: el de cada estante (categoría) y el que reemplaza
 * la foto de un producto que todavía no la tiene. Son SVG en línea: no pesan
 * nada y se ven nítidos en cualquier pantalla.
 *
 * La clave es la columna `icono` de la categoría (ver src/lib/iconos.ts).
 */

type Colores = { vidrio: string; etiqueta: string; tapa: string };

function Botella({ vidrio, etiqueta, tapa, className }: Colores & { className?: string }) {
  return (
    <svg viewBox="0 0 60 150" aria-hidden className={className}>
      <rect x="23" y="2" width="14" height="14" rx="2" fill={tapa} />
      <path
        d="M24 16h12v22c0 6 14 12 14 26v76a8 8 0 0 1-8 8H18a8 8 0 0 1-8-8V64c0-14 14-20 14-26z"
        fill={vidrio}
      />
      <path d="M14 30 Q16 90 15 140" stroke="#fff" strokeOpacity=".22" strokeWidth="3" fill="none" />
      <rect x="12" y="78" width="36" height="40" rx="3" fill={etiqueta} />
      <rect x="17" y="88" width="26" height="4" rx="2" fill={tapa} opacity=".7" />
      <rect x="20" y="96" width="20" height="3" rx="1.5" fill={tapa} opacity=".45" />
    </svg>
  );
}

function Vino({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 150" aria-hidden className={className}>
      <rect x="25" y="2" width="10" height="20" rx="2" fill="#7b1e2b" />
      <path d="M25 22h10v26c0 4 12 10 12 22v70a8 8 0 0 1-8 8H21a8 8 0 0 1-8-8V70c0-12 12-18 12-22z" fill="#3b0d18" />
      <rect x="15" y="86" width="30" height="34" rx="3" fill="#f0e8dc" />
      <rect x="20" y="96" width="20" height="3" rx="1.5" fill="#7b1e2b" />
    </svg>
  );
}

function Latas({ className }: { className?: string }) {
  const una = (x: number) => (
    <g transform={`translate(${x} 0)`}>
      <rect y="10" width="30" height="60" rx="5" fill="#f2c230" />
      <rect y="30" width="30" height="16" fill="#c8102e" />
      <rect x="3" y="6" width="24" height="6" rx="2" fill="#c9c9c9" />
    </g>
  );
  return (
    <svg viewBox="0 0 100 80" aria-hidden className={className}>
      {una(2)}
      {una(35)}
      {una(68)}
    </svg>
  );
}

function Hielo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 90" aria-hidden className={className}>
      <path d="M14 14h52l-4 70H18z" fill="#dff1fb" stroke="#9cc9e2" strokeWidth="2" />
      <rect x="24" y="40" width="14" height="14" rx="3" fill="#fff" stroke="#9cc9e2" />
      <rect x="42" y="46" width="14" height="14" rx="3" fill="#fff" stroke="#9cc9e2" />
      <rect x="30" y="60" width="14" height="14" rx="3" fill="#fff" stroke="#9cc9e2" />
      <rect x="10" y="8" width="60" height="8" rx="3" fill="#2f6fb0" />
    </svg>
  );
}

function Bunuelos({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={className}>
      <circle cx="15" cy="22" r="10" fill="#d99a3d" />
      <circle cx="27" cy="18" r="9" fill="#e7ac4c" />
      <circle cx="24" cy="15" r="2" fill="#f6d28f" />
      <circle cx="12" cy="19" r="2" fill="#f0c071" />
    </svg>
  );
}

function Paquete({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 46" aria-hidden className={className}>
      <path d="M8 6h24l-2 4 4 30H6l4-30z" fill="#c0392b" />
      <rect x="11" y="18" width="18" height="10" rx="2" fill="#ffe08a" />
    </svg>
  );
}

function Vaso({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 46" aria-hidden className={className}>
      <path d="M8 6h24l-3 36H11z" fill="#fff" stroke="#c0392b" strokeWidth="2" />
      <path d="M10 14h20" stroke="#c0392b" strokeWidth="2" />
    </svg>
  );
}

function Todo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={className}>
      <rect x="6" y="6" width="12" height="12" rx="2" fill="#c0392b" />
      <rect x="22" y="6" width="12" height="12" rx="2" fill="#1f4d2b" />
      <rect x="6" y="22" width="12" height="12" rx="2" fill="#e0a92e" />
      <rect x="22" y="22" width="12" height="12" rx="2" fill="#2f6fb0" />
    </svg>
  );
}

const BOTELLAS: Record<string, Colores> = {
  "botella-azul": { vidrio: "#2f6fb0", etiqueta: "#e9eef5", tapa: "#1d3e66" },
  "botella-ambar": { vidrio: "#7a3b12", etiqueta: "#f3e3c4", tapa: "#3d1d08" },
  "botella-whisky": { vidrio: "#5a3410", etiqueta: "#e8d7a8", tapa: "#2a1a08" },
  "licor-crema": { vidrio: "#efe1bf", etiqueta: "#8a5a2b", tapa: "#c9a46b" },
  gaseosa: { vidrio: "#3a1a12", etiqueta: "#d62828", tapa: "#d62828" },
};

/** El dibujo de una clave de icono. Una clave desconocida cae en «todo». */
export function Dibujo({ icono, className }: { icono: string; className?: string }) {
  if (icono in BOTELLAS) return <Botella {...BOTELLAS[icono]} className={className} />;
  switch (icono) {
    case "vino":
      return <Vino className={className} />;
    case "lata":
      return <Latas className={className} />;
    case "hielo":
      return <Hielo className={className} />;
    case "bunuelo":
      return <Bunuelos className={className} />;
    case "bolsa":
      return <Paquete className={className} />;
    case "vaso":
      return <Vaso className={className} />;
    default:
      return <Todo className={className} />;
  }
}

/** Las botellas son altas; las latas, el hielo y los paquetes, más bajitos. */
export function altoDibujo(icono: string): string {
  return icono in BOTELLAS || icono === "vino" ? "h-[84%]" : "h-[58%]";
}
