/**
 * Las botellas «de vitrina»: el dibujo que reemplaza la foto de un producto
 * que todavía no la tiene. Vidrio con brillos, el líquido de su color,
 * etiqueta, tapa metálica, sombra y reflejo en la repisa.
 *
 * Devuelven el SVG como texto (lo arma el código, nunca lo que escribe un
 * cliente). Los `id` internos llevan un prefijo que pasa quien lo usa, para que
 * dos dibujos en la misma página no se mezclen y el servidor y el navegador
 * pinten lo mismo.
 */

type Forma = "alto" | "cuadrado" | "chato" | "espumoso" | "vino" | "pet";

type Botella = {
  forma: Forma;
  vidrio: string;
  vidrioOp: number;
  liquido: string;
  liqOp?: number;
  nivel: number;
  tapa?: string;
  aro?: string;
  foil?: string;
  et: { y: number; h: number; fondo: string; banda?: string; raya?: string; tinta: string; ola?: boolean; sello?: string };
};

const FORMAS: Record<Forma, string> = {
  alto: "M53 20H67V58C67 70 83 74 83 92V172Q83 180 75 180H45Q37 180 37 172V92C37 74 53 70 53 58Z",
  cuadrado: "M54 22H66V56Q66 65 75 69L80 72Q83 74 83 80V172Q83 180 75 180H45Q37 180 37 172V80Q37 74 40 72L45 69Q54 65 54 56Z",
  chato: "M52 46H68V70C68 80 91 81 91 98V171Q91 180 82 180H38Q29 180 29 171V98C29 81 52 80 52 70Z",
  espumoso: "M54 12H66V48C66 72 83 78 83 102V172Q83 180 75 180H45Q37 180 37 172V102C37 78 54 72 54 48Z",
  vino: "M54 10H66V52C66 66 81 70 81 86V172Q81 180 73 180H47Q39 180 39 172V86C39 70 54 66 54 52Z",
  pet: "M53 30H67V42C67 52 79 56 79 70C79 82 72 86 72 96C72 106 81 110 81 124V170Q81 180 71 180H49Q39 180 39 170V124C39 110 48 106 48 96C48 86 41 82 41 70C41 56 53 52 53 42Z",
};
const CUELLO: Record<Forma, [number, number, number]> = {
  alto: [53, 67, 20], cuadrado: [54, 66, 22], chato: [52, 68, 46], espumoso: [54, 66, 12], vino: [54, 66, 10], pet: [53, 67, 30],
};
const CUERPO: Record<Forma, [number, number, number]> = {
  alto: [37, 83, 92], cuadrado: [37, 83, 80], chato: [29, 91, 98], espumoso: [37, 83, 102], vino: [39, 81, 86], pet: [39, 81, 124],
};

/** «#abc» o «#aabbcc» → [r, g, b]. */
const hex = (h: string) => {
  const largo = h.length === 4 ? `#${[...h.slice(1)].map((c) => c + c).join("")}` : h;
  return [1, 3, 5].map((i) => parseInt(largo.slice(i, i + 2), 16));
};
export function mezclar(a: string, b: string, t: number) {
  const [pa, pb] = [hex(a), hex(b)];
  return "#" + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("");
}
const metal = (id: string, c: string) =>
  `<linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${mezclar(c, "#000000", 0.5)}"/><stop offset=".3" stop-color="${mezclar(c, "#ffffff", 0.45)}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${mezclar(c, "#000000", 0.55)}"/></linearGradient>`;
const cilindro = (id: string, c: string) =>
  `<linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${mezclar(c, "#000000", 0.45)}"/><stop offset=".22" stop-color="${c}"/><stop offset=".48" stop-color="${mezclar(c, "#ffffff", 0.3)}"/><stop offset=".74" stop-color="${c}"/><stop offset="1" stop-color="${mezclar(c, "#000000", 0.6)}"/></linearGradient>`;
const brillo = (id: string) =>
  `<linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".1" stop-color="#fff" stop-opacity=".06"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset=".86" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#fff" stop-opacity=".3"/></linearGradient>`;
const repisa = (u: string) =>
  `<radialGradient id="${u}s"><stop offset="0" stop-color="#000" stop-opacity=".8"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
  `<linearGradient id="${u}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".75" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
  `<mask id="${u}m" maskUnits="userSpaceOnUse" x="0" y="180" width="120" height="60"><rect x="0" y="180" width="120" height="60" fill="url(#${u}g)"/></mask>`;
const conRepisa = (u: string, ancho: number, cuerpo: string) =>
  `<ellipse cx="60" cy="181" rx="${ancho}" ry="5" fill="url(#${u}s)"/>${cuerpo}<g mask="url(#${u}m)"><use href="#${u}b" transform="translate(0 360) scale(1 -1)"/></g>`;
const envolver = (u: string, defs: string, cuerpo: string, attrs: string) =>
  `<svg viewBox="0 0 120 240" ${attrs} aria-hidden="true" focusable="false"><defs>${defs}${repisa(u)}</defs>${cuerpo}</svg>`;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function etiqueta(c: Botella, u: string, texto: string, sub: string) {
  const e = c.et;
  const [x, x2] = CUERPO[c.forma];
  const w = x2 - x;
  const { y, h } = e;
  const fs = Math.min(10.5, (w * 0.76) / (Math.max(texto.length, 3) * 0.58));
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${u}e)"/>`;
  if (e.banda) s += `<rect x="${x}" y="${y}" width="${w}" height="${h * 0.2}" fill="${e.banda}"/>`;
  if (e.raya) s += `<rect x="${x}" y="${y + h * 0.82}" width="${w}" height="${h * 0.06}" fill="${e.raya}"/>`;
  if (e.ola) s += `<path d="M${x} ${y + h * 0.62} C${x + w * 0.3} ${y + h * 0.2} ${x + w * 0.6} ${y + h * 1.05} ${x2} ${y + h * 0.45}" fill="none" stroke="#fff" stroke-width="2.2"/>`;
  if (e.sello) s += `<circle cx="60" cy="${y + h * 0.2}" r="${h * 0.12}" fill="none" stroke="${e.sello}" stroke-width="1.2"/>`;
  const ty = e.ola ? y + h * 0.5 : y + h * (e.banda ? 0.55 : e.sello ? 0.6 : 0.46);
  const fuente = `font-family="Barlow Condensed, Arial Narrow, sans-serif"`;
  s += `<text x="60" y="${ty.toFixed(1)}" text-anchor="middle" ${fuente} font-weight="800" font-size="${fs.toFixed(1)}" letter-spacing=".2" fill="${e.tinta}">${esc(texto)}</text>`;
  if (sub && !e.ola)
    s += `<text x="60" y="${(ty + fs * 0.95).toFixed(1)}" text-anchor="middle" ${fuente} font-weight="600" font-size="${(fs * 0.55).toFixed(1)}" letter-spacing=".6" fill="${e.tinta}" fill-opacity=".8">${esc(sub)}</text>`;
  if (!e.ola) s += `<rect x="${60 - w * 0.18}" y="${y + h * 0.9 - 3}" width="${w * 0.36}" height="1.6" rx=".8" fill="${e.tinta}" fill-opacity=".35"/>`;
  return s;
}

function botella(c: Botella, u: string, texto: string, sub: string, attrs: string) {
  const f = FORMAS[c.forma];
  const [nl, nr, nt] = CUELLO[c.forma];
  const [bl, br, hombro] = CUERPO[c.forma];
  const fe = c.et.fondo;
  let tapa = "";
  if (c.foil) {
    tapa = `<path d="M52.5 7H67.5V48C67.5 55 71 57 73 60H47C49 57 52.5 55 52.5 48Z" fill="url(#${u}t)"/><path d="M52.5 28H67.5" stroke="#000" stroke-opacity=".25"/>`;
    if (c.forma === "espumoso") tapa += `<circle cx="60" cy="66" r="6.5" fill="url(#${u}t)" stroke="#000" stroke-opacity=".2"/>`;
  } else {
    const ancho = nr - nl + 4, alto = c.forma === "chato" ? 16 : 18, ty = nt - alto + 4;
    tapa = `<rect x="${nl - 2}" y="${ty}" width="${ancho}" height="${alto}" rx="2.5" fill="url(#${u}t)"/>`;
    for (let i = nl + 1; i < nr; i += 2.6)
      tapa += `<line x1="${i.toFixed(1)}" y1="${ty + 2}" x2="${i.toFixed(1)}" y2="${ty + alto - 2}" stroke="#000" stroke-opacity=".18" stroke-width=".8"/>`;
    if (c.aro) tapa += `<rect x="${nl - 2}" y="${ty + alto - 5}" width="${ancho}" height="3" fill="${c.aro}"/>`;
  }
  const defs =
    cilindro(`${u}l`, c.liquido) + brillo(`${u}v`) + metal(`${u}t`, c.foil ?? c.tapa ?? "#888888") +
    `<linearGradient id="${u}e" x1="0" x2="1"><stop offset="0" stop-color="${mezclar(fe, "#000000", 0.4)}"/><stop offset=".25" stop-color="${fe}"/><stop offset=".5" stop-color="${mezclar(fe, "#ffffff", 0.12)}"/><stop offset=".78" stop-color="${fe}"/><stop offset="1" stop-color="${mezclar(fe, "#000000", 0.5)}"/></linearGradient>` +
    `<clipPath id="${u}c"><path d="${f}"/></clipPath>`;
  const cuerpo = `<g id="${u}b"><g clip-path="url(#${u}c)">
    <rect width="120" height="200" fill="${c.vidrio}" fill-opacity="${c.vidrioOp}"/>
    <rect y="${c.nivel}" width="120" height="${200 - c.nivel}" fill="url(#${u}l)" fill-opacity="${c.liqOp ?? 1}"/>
    ${c.nivel < 200 ? `<rect y="${c.nivel}" width="120" height="1.4" fill="#fff" fill-opacity=".4"/>` : ""}
    ${etiqueta(c, u, texto, sub)}
    <rect width="120" height="200" fill="url(#${u}v)"/>
    <rect x="${nl + 2.5}" y="${nt + 4}" width="2.4" height="${hombro - nt - 18}" rx="1.2" fill="#fff" fill-opacity=".45"/>
    <rect x="${bl + 5}" y="${hombro + 2}" width="4.5" height="${172 - hombro}" rx="2.2" fill="#fff" fill-opacity=".3"/>
    <rect x="${br - 8}" y="${hombro + 6}" width="2" height="${160 - hombro}" rx="1" fill="#fff" fill-opacity=".16"/>
  </g><path d="${f}" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="1"/>${tapa}</g>`;
  return envolver(u, defs, conRepisa(u, (br - bl) / 2 + 12, cuerpo), attrs);
}

function latas(u: string, attrs: string) {
  const lata = (x: number, base: number, w: number, h: number, atras: boolean) => `<g>
    <rect x="${x}" y="${base - h}" width="${w}" height="${h}" rx="4" fill="url(#${u}a)"/>
    <rect x="${x}" y="${base - h * 0.6}" width="${w}" height="${h * 0.27}" fill="url(#${u}r)"/>
    <text x="${x + w / 2}" y="${base - h * 0.41}" text-anchor="middle" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="800" font-size="${(w * 0.25).toFixed(1)}" letter-spacing=".4" fill="#fff">CERVEZA</text>
    <path d="M${x + w / 2 - 6} ${base - h * 0.78} l6 -6 6 6 -6 6z" fill="none" stroke="#a0181e" stroke-width="1.2"/>
    <ellipse cx="${x + w / 2}" cy="${base - h + 1.5}" rx="${w / 2}" ry="3.4" fill="url(#${u}t)"/>
    <ellipse cx="${x + w / 2}" cy="${base - h + 1.5}" rx="${w / 2 - 3.5}" ry="1.9" fill="none" stroke="#7d7d86" stroke-width=".8"/>
    <rect x="${x + 5}" y="${base - h + 7}" width="3" height="${h - 12}" rx="1.5" fill="#fff" fill-opacity=".38"/>
    ${atras ? `<rect x="${x}" y="${base - h - 2}" width="${w}" height="${h + 2}" rx="4" fill="#000" fill-opacity=".32"/>` : ""}
  </g>`;
  const defs =
    `<linearGradient id="${u}a" x1="0" x2="1"><stop offset="0" stop-color="#8f6a00"/><stop offset=".2" stop-color="#e6b71a"/><stop offset=".42" stop-color="#fff2a6"/><stop offset=".64" stop-color="#f3c832"/><stop offset="1" stop-color="#6f5200"/></linearGradient>` +
    `<linearGradient id="${u}r" x1="0" x2="1"><stop offset="0" stop-color="#6d0b10"/><stop offset=".4" stop-color="#de252e"/><stop offset=".6" stop-color="#ff5c61"/><stop offset="1" stop-color="#5c090d"/></linearGradient>` +
    `<linearGradient id="${u}t" x1="0" x2="1"><stop offset="0" stop-color="#8e8e97"/><stop offset=".45" stop-color="#f4f4f7"/><stop offset="1" stop-color="#7b7b84"/></linearGradient>`;
  const cuerpo = `<g id="${u}b">${lata(25, 171, 34, 66, true)}${lata(61, 171, 34, 66, true)}${lata(7, 180, 35, 72, false)}${lata(43, 180, 35, 72, false)}${lata(79, 180, 35, 72, false)}</g>`;
  return envolver(u, defs, conRepisa(u, 58, cuerpo), attrs);
}

function hielo(u: string, attrs: string, kilos: string) {
  const cubos = [[36, 126, -8], [56, 118, 6], [74, 128, -4], [42, 148, 10], [64, 146, -10], [52, 162, 4], [76, 158, 8], [34, 164, -6]]
    .map(([x, y, r]) => `<rect x="${x}" y="${y}" width="17" height="17" rx="3.5" transform="rotate(${r} ${x + 8.5} ${y + 8.5})" fill="url(#${u}c)" stroke="#fff" stroke-opacity=".6" stroke-width=".8"/>`)
    .join("");
  const defs =
    `<linearGradient id="${u}h" x1="0" x2="1"><stop offset="0" stop-color="#9fc9e2" stop-opacity=".55"/><stop offset=".35" stop-color="#e6f4fc" stop-opacity=".35"/><stop offset=".7" stop-color="#d4ebf8" stop-opacity=".3"/><stop offset="1" stop-color="#8ab9d6" stop-opacity=".6"/></linearGradient>` +
    `<linearGradient id="${u}c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#b9def3"/></linearGradient>`;
  const cuerpo = `<g id="${u}b">
    <path d="M28 74Q60 66 92 74L96 170Q60 184 24 170Z" fill="#cfe9f8" fill-opacity=".14"/>${cubos}
    <path d="M28 74Q60 66 92 74L96 170Q60 184 24 170Z" fill="url(#${u}h)" stroke="#e1f2fc" stroke-opacity=".75" stroke-width="1.2"/>
    <path d="M27 96Q60 90 93 96L94 119Q60 113 26 119Z" fill="#1d6fd1"/>
    <text x="60" y="112" text-anchor="middle" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="800" font-size="15" letter-spacing="1.5" fill="#fff">HIELO</text>
    ${kilos ? `<rect x="44" y="123" width="32" height="12" rx="6" fill="#fff" fill-opacity=".92"/><text x="60" y="132" text-anchor="middle" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="800" font-size="9" fill="#1d6fd1">${esc(kilos)}</text>` : ""}
    <path d="M28 74L33 62 39 72 45 62 51 72 57 62 63 72 69 62 75 72 81 62 87 72 92 74" fill="#e8f4fb" fill-opacity=".75" stroke="#cfe9f8" stroke-opacity=".8" stroke-width="1"/>
    <rect x="34" y="80" width="3.5" height="84" rx="1.7" fill="#fff" fill-opacity=".45"/><rect x="85" y="124" width="2" height="40" rx="1" fill="#fff" fill-opacity=".3"/>
  </g>`;
  return envolver(u, defs, conRepisa(u, 44, cuerpo), attrs);
}

/** Cómo se ve la botella de cada estante, con algunos ajustes por el nombre. */
function estilo(icono: string, nombre: string): Botella | null {
  const n = nombre.toLowerCase();
  switch (icono) {
    case "botella-azul":
      return { forma: "alto", vidrio: "#d8eef6", vidrioOp: 0.2, liquido: "#cfe8f3", liqOp: 0.3, nivel: 66, tapa: "#c8102e",
        et: { y: 100, h: 60, fondo: "#f3f5f7", banda: "#1f5ea8", raya: "#c8102e", tinta: "#1d3c6a" } };
    case "botella-ambar":
      return { forma: "cuadrado", vidrio: "#eadfc8", vidrioOp: 0.16, liquido: "#a5520f", nivel: 74, tapa: "#c9a24a",
        et: { y: 104, h: 56, fondo: "#efe2c2", banda: "#7a1f14", tinta: "#5a1a10" } };
    case "botella-whisky":
      return { forma: "chato", vidrio: "#5a3412", vidrioOp: 0.55, liquido: "#a35a16", liqOp: 0.85, nivel: 86, tapa: "#2a1a0c", aro: "#d2a64a",
        et: { y: 112, h: 46, fondo: "#141414", raya: "#d2a64a", tinta: "#e2b75a" } };
    case "vino":
      return n.includes("espumos")
        ? { forma: "espumoso", vidrio: "#163a22", vidrioOp: 1, liquido: "#1d4a2c", nivel: 200, foil: "#d6b25a",
            et: { y: 114, h: 44, fondo: "#f1e8d0", tinta: "#7c5e1c", sello: "#b8902f" } }
        : { forma: "vino", vidrio: "#1c0d12", vidrioOp: 1, liquido: "#3a0d18", nivel: 200, foil: "#7b1e2b",
            et: { y: 106, h: 50, fondo: "#f0e8dc", raya: "#7b1e2b", tinta: "#5a1420" } };
    case "licor-crema":
      if (n.includes("vodka"))
        return { forma: "alto", vidrio: "#e6f0f5", vidrioOp: 0.18, liquido: "#e9f2f7", liqOp: 0.25, nivel: 64, tapa: "#b51f2a",
          et: { y: 100, h: 58, fondo: "#f7f7f7", banda: "#b51f2a", tinta: "#7a1219" } };
      if (n.includes("tequila"))
        return { forma: "cuadrado", vidrio: "#f2e6c8", vidrioOp: 0.15, liquido: "#e3b863", liqOp: 0.8, nivel: 70, tapa: "#1d1d1d",
          et: { y: 104, h: 56, fondo: "#1a1a1a", raya: "#d2a64a", tinta: "#e2b75a" } };
      return { forma: "alto", vidrio: "#f0e6cf", vidrioOp: 0.15, liquido: "#efdfb8", nivel: 68, tapa: "#5a341a",
        et: { y: 102, h: 58, fondo: "#6b3f1f", raya: "#d9b77a", tinta: "#f6e7c4" } };
    case "gaseosa":
      if (n.includes("agua"))
        return { forma: "pet", vidrio: "#d6ecf7", vidrioOp: 0.16, liquido: "#cfe8f6", liqOp: 0.35, nivel: 46, tapa: "#1d6fd1",
          et: { y: 96, h: 30, fondo: "#1d6fd1", tinta: "#ffffff", ola: true } };
      if (n.includes("soda") || n.includes("ginger"))
        return { forma: "pet", vidrio: "#d9eadf", vidrioOp: 0.15, liquido: n.includes("ginger") ? "#e8c46a" : "#e3f1e8", liqOp: 0.45, nivel: 46, tapa: "#1f7a3a",
          et: { y: 96, h: 30, fondo: "#1f7a3a", tinta: "#ffffff", ola: true } };
      return { forma: "pet", vidrio: "#dfe8ea", vidrioOp: 0.12, liquido: "#3a1a10", nivel: 44, tapa: "#d21f26",
        et: { y: 96, h: 30, fondo: "#d21f26", tinta: "#ffffff", ola: true } };
    default:
      return null;
  }
}

/** «Botella 750 ml» → «750 ML»; «Bolsa 2 kg» → «2 KG». */
function tamano(presentacion: string | null) {
  const m = presentacion?.match(/\d+(?:[.,]\d+)?\s*(?:ml|l|kg|g)\b/i);
  return m ? m[0].toUpperCase() : "";
}

/** La primera palabra del nombre, para la etiqueta: «Ron Viejo de Caldas» → «RON». */
function palabra(nombre: string) {
  const w = nombre.split(/\s+/)[0] ?? "";
  return w.length > 12 ? w.slice(0, 12) : w.toUpperCase();
}

/**
 * El SVG de vitrina de un producto, o null si su estante no tiene botella (los
 * buñuelos, el mecato…): ahí se usa el dibujo plano de siempre.
 */
export function svgVitrina(
  p: { icono: string; nombre: string; presentacion: string | null },
  id: string,
  attrs = "",
): string | null {
  const u = `v${id.replace(/[^a-zA-Z0-9]/g, "")}`;
  if (p.icono === "lata") return latas(u, attrs);
  if (p.icono === "hielo") return hielo(u, attrs, tamano(p.presentacion));
  const c = estilo(p.icono, p.nombre);
  if (!c) return null;
  return botella(c, u, palabra(p.nombre), tamano(p.presentacion), attrs);
}

/** Si el estante tiene dibujo de vitrina (botella, lata o hielo). */
export function tieneVitrina(icono: string) {
  return ["botella-azul", "botella-ambar", "botella-whisky", "vino", "licor-crema", "gaseosa", "lata", "hielo"].includes(icono);
}
