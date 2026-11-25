import Image from "next/image";
import type { ComboVista, ProductoVista } from "@/lib/api-catalogo";
import { svgVitrina } from "@/lib/vitrina";
import { BotonAgregar } from "@/components/tienda/carrito";
import { Check } from "@/components/tienda/iconos-neon";
import { Precio } from "@/components/tienda/tarjeta";

const COLOR = ["var(--rojo)", "var(--amarillo)", "var(--dorado)", "var(--azul)", "var(--menta)"];
const HEX = ["#ff3b5c", "#ffe14d", "#f5c451", "#3ec7ff", "#39ff88"];
const NEON = ["neon-r", "neon-a", "neon-d", "neon-b", "neon-v"];

type Pieza = { icono: string; nombre: string; presentacion: string | null };

/** Dónde va cada producto delante del regalo de neón (cajas de 360 × 270). */
function posiciones(n: number): [number, number, number, number][] {
  if (n === 1) return [[120, 56, 120, 240]];
  if (n === 2) return [[60, 71, 110, 220], [180, 86, 100, 200]];
  return [[58, 60, 118, 236], [170, 86, 100, 200], [112, 118, 88, 176]];
}

/** El regalo de neón con los productos del combo adelante. */
function escena(piezas: Pieza[], hex: string, id: string) {
  // Lo que está en bolsa (hielo) va adelante, en el centro.
  const orden = [...piezas].sort((a, b) => Number(a.icono === "hielo") - Number(b.icono === "hielo")).slice(0, 3);
  const pos = posiciones(orden.length);
  const dibujos = orden
    .map((p, k) => {
      let [x, y, w, h] = pos[k];
      if (p.icono === "lata") {
        // Las latas son bajitas: se agrandan para que se vean.
        const [nw, nh] = [w * 1.3, h * 1.3];
        x -= (nw - w) / 2;
        y = 236 - nh * 0.75;
        [w, h] = [nw, nh];
      }
      return svgVitrina(p, `${id}${k}`, `x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}"`) ?? "";
    })
    .join("");
  const regalo = [
    [hex, 9, 0.2],
    [hex, 3.2, 1],
    ["#fff", 1.1, 0.8],
  ]
    .map(
      ([c, w, o]) =>
        `<g stroke="${c}" stroke-width="${w}" opacity="${o}"><rect x="58" y="128" width="244" height="108" rx="6"/><rect x="48" y="104" width="264" height="26" rx="5"/><path d="M180 104v132"/><path d="M180 104c-16-30-52-32-48-12 4 14 32 14 48 12zm0 0c16-30 52-32 48-12-4 14-32 14-48 12z"/></g>`,
    )
    .join("");
  const brillos = [[40, 70, 9], [318, 60, 12], [300, 150, 7], [70, 160, 6]]
    .map(
      ([x, y, s]) =>
        `<path d="M${x} ${y - s}C${x + s * 0.2} ${y - s * 0.2} ${x + s * 0.2} ${y - s * 0.2} ${x + s} ${y}C${x + s * 0.2} ${y + s * 0.2} ${x + s * 0.2} ${y + s * 0.2} ${x} ${y + s}C${x - s * 0.2} ${y + s * 0.2} ${x - s * 0.2} ${y + s * 0.2} ${x - s} ${y}C${x - s * 0.2} ${y - s * 0.2} ${x - s * 0.2} ${y - s * 0.2} ${x} ${y - s}Z" fill="#fff6d0"/>`,
    )
    .join("");
  return `<svg viewBox="0 0 360 270" aria-hidden="true" focusable="false"><defs><radialGradient id="${id}luz"><stop offset="0" stop-color="${hex}" stop-opacity=".5"/><stop offset="1" stop-color="${hex}" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="180" cy="238" rx="175" ry="44" fill="url(#${id}luz)"/><g fill="none" stroke-linejoin="round" stroke-linecap="round">${regalo}</g>${dibujos}${brillos}</svg>`;
}

/**
 * Un combo: el regalo de neón con lo que trae, qué incluye con chulitos, el
 * precio, cuánto se ahorra y «Agregar combo».
 */
export function TarjetaCombo({ c, i = 0, productos }: { c: ComboVista; i?: number; productos: ProductoVista[] }) {
  const k = i % COLOR.length;
  const ahorro = c.precioPorSeparado - c.precio;
  const buscar = (nombre: string, presentacion: string | null) =>
    productos.find((p) => p.nombre === nombre && p.presentacion === presentacion) ?? productos.find((p) => p.nombre === nombre);
  const piezas: Pieza[] = c.items.flatMap((it) => {
    const p = buscar(it.nombre, it.presentacion);
    const pieza = { icono: p?.icono ?? "todo", nombre: it.nombre, presentacion: it.presentacion };
    return Array.from({ length: Math.min(it.cantidad, 2) }, () => pieza);
  });
  const contenido = c.items.map((it) => `${it.cantidad > 1 ? `${it.cantidad} × ` : ""}${it.nombre}`).join(" + ");
  const [primera, ...resto] = c.nombre.split(" ");
  const conGuion = primera.toLowerCase() === "combo" && resto.length > 0;

  return (
    <article className="ne-combo tubo" style={{ ["--c" as string]: COLOR[k] }}>
      <div className="escena">
        {c.fotoUrl ? (
          <Image src={c.fotoUrl} alt={c.nombre} fill sizes="(max-width: 900px) 86vw, 360px" />
        ) : (
          <span style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: escena(piezas, HEX[k], `c${c.id}`) }} />
        )}
      </div>
      <div className="info">
        <h3>
          {conGuion ? (
            <>
              <span className={`g ${NEON[k]}`}>{primera}</span>
              <span className="f">{resto.join(" ")}</span>
            </>
          ) : (
            <span className="f">{c.nombre}</span>
          )}
        </h3>
        <ul className="ne-lista">
          {c.items.map((it) => (
            <li key={`${it.nombre}-${it.presentacion}`}>
              <Check />
              {it.cantidad > 1 ? `${it.cantidad} × ` : ""}
              {it.nombre}
              {it.presentacion ? ` ${it.presentacion}` : ""}
            </li>
          ))}
        </ul>
        <div className="fila">
          <Precio valor={c.precio} />
          {ahorro > 0 && (
            <div className="ne-antes">
              Por separado <s>$ {c.precioPorSeparado.toLocaleString("es-CO")}</s>
            </div>
          )}
        </div>
        {ahorro > 0 && (
          <span className="ne-ahorro tubo" style={{ ["--c" as string]: COLOR[k] }}>
            Ahorras $ {ahorro.toLocaleString("es-CO")}
          </span>
        )}
        <div className="ne-control">
          <BotonAgregar
            agotado={c.disponibilidad === "AGOTADO"}
            articulo={{
              tipo: "COMBO",
              id: c.id,
              nombre: c.nombre,
              presentacion: contenido,
              precio: c.precio,
              esLicor: c.esLicor,
              icono: piezas[0]?.icono,
            }}
          />
        </div>
      </div>
    </article>
  );
}
