/**
 * Íconos de la tienda neón: los de línea (flechas, reloj, moto…), los de neón
 * de cada estante, el gorro de Navidad del logo y las bolas que cuelgan.
 */
type P = { className?: string };
const linea = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const Flecha = ({ className }: P) => (
  <svg viewBox="0 0 24 24" {...linea} strokeWidth={2.4} className={className} aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const Mas = ({ className }: P) => (
  <svg viewBox="0 0 24 24" {...linea} strokeWidth={2.8} className={className} aria-hidden><path d="M12 5v14M5 12h14" /></svg>
);
export const Menos = ({ className }: P) => (
  <svg viewBox="0 0 24 24" {...linea} strokeWidth={2.8} className={className} aria-hidden><path d="M5 12h14" /></svg>
);
export const Check = ({ className }: P) => (
  <svg viewBox="0 0 24 24" {...linea} strokeWidth={2.6} className={className} aria-hidden><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
export const Cerrar = ({ className }: P) => (
  <svg viewBox="0 0 24 24" {...linea} strokeWidth={2.4} className={className} aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const Copo = ({ className }: P) => (
  <svg viewBox="0 0 24 24" {...linea} strokeWidth={2.2} className={className} aria-hidden><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 2 3-2M9 20l3-2 3 2" /></svg>
);
export const Estrella = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M12 1.5c.6 5.6 4.9 9.9 10.5 10.5-5.6.6-9.9 4.9-10.5 10.5C11.4 16.9 7.1 12.6 1.5 12 7.1 11.4 11.4 7.1 12 1.5Z" />
  </svg>
);
export const Moto = ({ className }: P) => (
  <svg viewBox="0 0 24 24" {...linea} strokeWidth={1.9} className={className} aria-hidden>
    <circle cx="5.5" cy="17" r="2.6" /><circle cx="18.5" cy="17" r="2.6" /><path d="M8.1 17h7.3l2.2-5.2H12.5L10.6 9H7.5" /><path d="M14.4 6.5h2.8l1.6 5.3" /><path d="M3 12.5h5.5" />
  </svg>
);
export const Chat = ({ className }: P) => (
  <svg viewBox="0 0 24 24" {...linea} strokeWidth={1.9} className={className} aria-hidden>
    <path d="M20.5 11.6a8.4 8.4 0 0 1-12.4 7.4L3.5 20.4l1.4-4.3a8.4 8.4 0 1 1 15.6-4.5Z" /><path d="M8.8 9.4c.3 2.3 2.3 4.4 4.9 5.1l1.2-1.3 2 .9" />
  </svg>
);
export const Reloj = ({ className }: P) => (
  <svg viewBox="0 0 24 24" {...linea} strokeWidth={1.9} className={className} aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 2" /></svg>
);
export const Billete = ({ className }: P) => (
  <svg viewBox="0 0 24 24" {...linea} strokeWidth={1.9} className={className} aria-hidden>
    <rect x="2.5" y="6" width="19" height="12" rx="2.5" /><circle cx="12" cy="12" r="2.6" /><path d="M6 9.5v.01M18 14.5v.01" />
  </svg>
);
export const Pin = ({ className }: P) => (
  <svg viewBox="0 0 24 24" {...linea} strokeWidth={2} className={className} aria-hidden>
    <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" />
  </svg>
);
export const Casa = ({ className }: P) => (
  <svg viewBox="0 0 24 24" {...linea} strokeWidth={2} className={className} aria-hidden><path d="M3 11 12 4l9 7" /><path d="M5.5 9.5V20h13V9.5" /><path d="M10 20v-5h4v5" /></svg>
);
export const Candado = ({ className }: P) => (
  <svg viewBox="0 0 24 24" {...linea} strokeWidth={2} className={className} aria-hidden><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>
);
export const Lupa = ({ className }: P) => (
  <svg viewBox="0 0 24 24" {...linea} strokeWidth={2.2} className={className} aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
);
export const Carro = ({ className }: P) => (
  <svg viewBox="0 0 24 24" {...linea} strokeWidth={2} className={className} aria-hidden>
    <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" /><circle cx="10" cy="20.5" r="1" /><circle cx="17" cy="20.5" r="1" />
  </svg>
);

/** El gorro de Navidad sobre la «A» del logo. */
export function Gorro() {
  return (
    <svg className="gorro" viewBox="0 0 44 36" aria-hidden>
      <defs>
        <linearGradient id="gorro-rojo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff5d78" /><stop offset="1" stopColor="#a50f29" />
        </linearGradient>
        <radialGradient id="gorro-piel" cx=".4" cy=".35">
          <stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#cfd2da" />
        </radialGradient>
      </defs>
      <path d="M5 27C8 12 18 4 30 5c8 1 11 7 10 14-4-5-9-6-13-4-5 3-6 9-6 12Z" fill="url(#gorro-rojo)" />
      <rect x="2" y="23.5" width="25" height="8.5" rx="4.25" fill="url(#gorro-piel)" />
      <circle cx="40" cy="20" r="4.4" fill="url(#gorro-piel)" />
    </svg>
  );
}

/** La bola de neón que cuelga en cada tarjeta. */
export function BolaColgante({ color, derecha }: { color: string; derecha?: boolean }) {
  return (
    <svg className={`ne-bola${derecha ? " der" : ""}`} viewBox="0 0 30 58" aria-hidden style={{ ["--c" as string]: color }}>
      <line x1="15" y1="0" x2="15" y2="19" stroke="#6a6a75" strokeWidth="1" />
      <rect x="11" y="18" width="8" height="5" rx="1.2" fill="#c9c9d1" />
      <g fill="none" stroke={color}>
        <circle cx="15" cy="37" r="12" strokeWidth="4.5" opacity=".3" />
        <circle cx="15" cy="37" r="12" strokeWidth="2" />
        <path d="M4.4 34c6 4 15.2 4 21.2 0" strokeWidth="1.4" />
      </g>
      <circle cx="15" cy="37" r="12" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth=".7" />
    </svg>
  );
}

/** Los íconos de neón de cada estante (trazos de 64 × 64). */
const TRAZOS: Record<string, string> = {
  lata: "M16 22h24v28a5 5 0 0 1-5 5H21a5 5 0 0 1-5-5zM40 28h5a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5h-5M14 22c-1-5 3-9 8-8 2-5 10-5 12 0 5-2 10 2 8 8M23 31v16M29 31v16M35 31v16",
  "botella-ambar": "M20 6h6v8c0 3 5 5 5 11v28a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3V25c0-6 5-8 5-11zM15 32h16v12H15M37 34h16l-2 19a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3zM41 44l4-3 4 3-4 3z",
  "botella-whisky": "M22 18h10v8c0 3 9 4 9 12v18a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3V38c0-8 9-9 9-12zM13 40h28v10H13M45 36h12l-1.5 16a2.5 2.5 0 0 1-2.5 2.5h-4a2.5 2.5 0 0 1-2.5-2.5z",
  "botella-azul": "M27 4h10v12c0 4 8 7 8 15v27a3 3 0 0 1-3 3H22a3 3 0 0 1-3-3V31c0-8 8-11 8-15zM19 34h26v14H19M28 41h8",
  vino: "M16 9h12l-1 15a5 5 0 0 1-10 0zM22 29v20M17 49h10M36 9h12l-1 15a5 5 0 0 1-10 0zM42 29v20M37 49h10M32 4v6M29 7h6",
  "licor-crema": "M26 4h12v10c0 4 9 6 9 14v28a3 3 0 0 1-3 3H20a3 3 0 0 1-3-3V28c0-8 9-10 9-14zM17 32h30v14H17M24 39c3-3 5 3 8 0s5 3 8 0",
  gaseosa: "M27 6h10v6c0 4 6 5 6 11 0 4-3 5-3 9 0 3 4 5 4 10v14a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V42c0-5 4-7 4-10 0-4-3-5-3-9 0-6 6-7 6-11zM20 36h24M22 44c6-4 14 4 20 0",
  hielo: "M14 24 30 16l16 8v18l-16 8-16-8zM14 24l16 8 16-8M30 32v18M40 10l6-4M48 16l6-2M8 14l6 2",
  bunuelo: "M22 30a10 10 0 1 0 0.1 0zM42 30a10 10 0 1 0 0.1 0zM32 14a10 10 0 1 0 0.1 0zM18 38l2-2M40 36l2 2M30 20l2-1",
  bolsa: "M18 12h28l-2 6 2 6v30a3 3 0 0 1-3 3H21a3 3 0 0 1-3-3V24l2-6zM20 18h24M26 34c2-4 10-4 12 0M24 44h16",
  vaso: "M18 12h28l-4 42a3 3 0 0 1-3 3H25a3 3 0 0 1-3-3zM19 24h26M22 40h20",
  todo: "M10 10h18v18H10zM36 10h18v18H36zM10 36h18v18H10zM36 36h18v18H36z",
};

export function IconoNeon({ icono, color }: { icono: string; color: string }) {
  const d = TRAZOS[icono] ?? TRAZOS.todo;
  return (
    <svg className="ico" viewBox="0 0 64 64" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} stroke={color} strokeWidth="5.5" opacity=".25" />
      <path d={d} stroke={color} strokeWidth="2.6" />
      <path d={d} stroke="#fff" strokeOpacity=".85" strokeWidth=".9" />
    </svg>
  );
}

/** El color de neón de cada estante, en orden. */
export const COLORES_NEON = ["var(--amarillo)", "var(--azul)", "var(--dorado)", "var(--rojo)", "var(--menta)"];
export const HEX_NEON = ["#ffe14d", "#3ec7ff", "#f5c451", "#ff3b5c", "#39ff88"];

export function IconoWhatsApp({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.3.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3Z" />
    </svg>
  );
}
