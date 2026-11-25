"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { PedidoRespuesta } from "@/lib/api-catalogo";
import { pesos } from "@/lib/dinero";
import { Miniatura } from "@/components/tienda/vitrina";
import {
  Billete,
  Candado,
  Carro,
  Casa,
  Chat,
  Check,
  Cerrar,
  Flecha,
  IconoWhatsApp,
  Mas,
  Menos,
  Moto,
} from "@/components/tienda/iconos-neon";

export { IconoWhatsApp };

/**
 * El carrito de la tienda: vive en el navegador (sobrevive a cerrar la
 * pestaña), y antes de mandar el pedido se revisa contra la API para que el
 * mensaje salga con los precios y el stock reales.
 *
 * También guarda la confirmación de mayoría de edad: se pregunta una sola vez,
 * al agregar el primer licor.
 */

export type Articulo = {
  tipo: "PRODUCTO" | "COMBO";
  id: number;
  nombre: string;
  presentacion: string | null;
  precio: number;
  esLicor: boolean;
  /** El estante, para dibujar la miniatura en el pedido. */
  icono?: string;
};

type Linea = Articulo & { cantidad: number };

type DatosTienda = {
  aceptaTransferencia: boolean;
  valorDomicilio: number | null;
  direccion: string;
};

type Contexto = {
  lineas: Linea[];
  cuenta: number;
  total: number;
  cantidad: (tipo: Articulo["tipo"], id: number) => number;
  /** `desde` es el botón que se tocó: de ahí sale volando el «+1» al carrito. */
  agregar: (a: Articulo, n?: number, desde?: Element | null) => void;
  cambiar: (tipo: Articulo["tipo"], id: number, delta: number) => void;
  /** Deja el carrito como lo revisó la API: precios de hoy, sin lo que se acabó. */
  sincronizar: (r: PedidoRespuesta) => void;
  abrir: () => void;
  /** La página del producto tiene su propia barra abajo: la del pedido se esconde. */
  usarBarraPropia: (si: boolean) => void;
};

const CarritoCtx = createContext<Contexto | null>(null);

export function useCarrito() {
  const c = useContext(CarritoCtx);
  if (!c) throw new Error("useCarrito va dentro de <Carrito>");
  return c;
}

const LLAVE = "adela_carrito_v1";
const LLAVE_EDAD = "adela_mayor_de_edad";
const LLAVE_DATOS = "adela_datos_pedido";

function leer<T>(llave: string, porDefecto: T): T {
  try {
    const v = localStorage.getItem(llave);
    return v ? (JSON.parse(v) as T) : porDefecto;
  } catch {
    return porDefecto;
  }
}

function guardar(llave: string, valor: unknown) {
  try {
    localStorage.setItem(llave, JSON.stringify(valor));
  } catch {
    // Navegación privada o almacenamiento lleno: el carrito sigue en memoria.
  }
}

const quieto = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** El «+1» que vuela desde el botón hasta el carrito del encabezado. */
function volar(desde: Element | null | undefined) {
  const carro = document.querySelector("[data-carro]");
  if (!desde || !carro || quieto()) return;
  const a = desde.getBoundingClientRect();
  const b = carro.getBoundingClientRect();
  if (a.width === 0 || b.width === 0) return;
  const [x0, y0, x1, y1] = [a.left + a.width / 2, a.top + a.height / 2, b.left + b.width / 2, b.top + b.height / 2];
  const v = document.createElement("div");
  v.className = "ne-volador";
  v.textContent = "+1";
  document.body.appendChild(v);
  const pico = Math.min(y0, y1) - 70;
  v.animate(
    [
      { transform: `translate(${x0}px,${y0}px) scale(1)`, opacity: 1 },
      { transform: `translate(${(x0 + x1) / 2}px,${pico}px) scale(.9)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${x1}px,${y1}px) scale(.35)`, opacity: 0.2 },
    ],
    { duration: 720, easing: "cubic-bezier(.45,0,.55,1)" },
  ).onfinish = () => v.remove();
}

export function Carrito({ tienda, children }: { tienda: DatosTienda; children: React.ReactNode }) {
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [listo, setListo] = useState(false);
  const [abierta, setAbierta] = useState(false);
  const [barraPropia, setBarraPropia] = useState(false);
  const [preguntaEdad, setPreguntaEdad] = useState<{ a: Articulo; n: number; desde?: Element | null } | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; n: number } | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLineas(leer<Linea[]>(LLAVE, []));
    setListo(true);
  }, []);
  useEffect(() => {
    if (listo) guardar(LLAVE, lineas);
  }, [lineas, listo]);

  const avisar = useCallback((texto: string) => {
    setAviso((a) => ({ texto, n: (a?.n ?? 0) + 1 }));
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setAviso(null), 1900);
  }, []);

  const poner = useCallback((a: Articulo, n: number) => {
    setLineas((actual) => {
      const i = actual.findIndex((l) => l.tipo === a.tipo && l.id === a.id);
      if (i === -1) return n > 0 ? [...actual, { ...a, cantidad: Math.min(n, 99) }] : actual;
      const nueva = Math.min(actual[i].cantidad + n, 99);
      if (nueva <= 0) return actual.filter((_, j) => j !== i);
      return actual.map((l, j) => (j === i ? { ...l, ...a, cantidad: nueva } : l));
    });
  }, []);

  /** Agrega y lo celebra: vuela al carrito y, si es nuevo, sale el aviso. */
  const agregarYa = useCallback(
    (a: Articulo, n: number, desde?: Element | null) => {
      const nuevo = !lineas.some((l) => l.tipo === a.tipo && l.id === a.id);
      poner(a, n);
      volar(desde);
      if (nuevo) avisar(`Agregado: ${a.nombre}`);
    },
    [lineas, poner, avisar],
  );

  const valor = useMemo<Contexto>(
    () => ({
      lineas,
      cuenta: lineas.reduce((s, l) => s + l.cantidad, 0),
      total: lineas.reduce((s, l) => s + l.cantidad * l.precio, 0),
      cantidad: (tipo, id) => lineas.find((l) => l.tipo === tipo && l.id === id)?.cantidad ?? 0,
      agregar: (a, n = 1, desde) => {
        if (a.esLicor && !leer(LLAVE_EDAD, false)) return setPreguntaEdad({ a, n, desde });
        agregarYa(a, n, desde);
      },
      cambiar: (tipo, id, delta) => {
        const l = lineas.find((x) => x.tipo === tipo && x.id === id);
        if (l) poner(l, delta);
      },
      sincronizar: (r) =>
        setLineas((actual) =>
          actual.flatMap((l) => {
            const nueva = r.lineas.find((x) => x.tipo === l.tipo && x.id === l.id);
            return nueva ? [{ ...l, precio: nueva.precio, cantidad: nueva.cantidad, nombre: nueva.nombre }] : [];
          }),
        ),
      abrir: () => setAbierta(true),
      usarBarraPropia: setBarraPropia,
    }),
    [lineas, poner, agregarYa],
  );

  return (
    <CarritoCtx.Provider value={valor}>
      {children}
      <BarraPedido oculta={abierta || barraPropia} />
      {abierta && <HojaPedido tienda={tienda} cerrar={() => setAbierta(false)} />}
      {preguntaEdad && (
        <PreguntaEdad
          responder={(mayor) => {
            if (mayor) {
              guardar(LLAVE_EDAD, true);
              agregarYa(preguntaEdad.a, preguntaEdad.n, preguntaEdad.desde);
            } else {
              avisar("Listo. Puedes pedir hielo, gaseosas y mecato.");
            }
            setPreguntaEdad(null);
          }}
        />
      )}
      <div className={`ne-aviso${aviso ? " ver" : ""}`} role="status" aria-live="polite">
        <Check />
        <span>{aviso?.texto}</span>
      </div>
    </CarritoCtx.Provider>
  );
}

// --- La barra de abajo ------------------------------------------------------

function BarraPedido({ oculta }: { oculta: boolean }) {
  const { cuenta, total, abrir } = useCarrito();
  const visible = cuenta > 0 && !oculta;
  return (
    <button
      type="button"
      onClick={abrir}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`ne-barra${visible ? " ver" : ""}`}
    >
      <span key={cuenta} className="n ne-salta">
        {cuenta}
      </span>
      <span className="txt">
        <b>Ver pedido</b>
        <small>
          {cuenta} {cuenta === 1 ? "producto" : "productos"}
        </small>
      </span>
      <span className="ir tabular">
        {pesos(total)}
        <Flecha />
      </span>
    </button>
  );
}

/** El carrito del encabezado, con el número que salta al agregar. */
export function IconoCarrito() {
  const { cuenta, total, abrir } = useCarrito();
  return (
    <button
      type="button"
      onClick={abrir}
      data-carro
      aria-label={cuenta ? `Ver pedido: ${cuenta} productos` : "Ver pedido"}
      className="ne-boton-ico ne-carro"
    >
      <Carro />
      <span className="etq">
        <small>Tu pedido</small>
        <b>{pesos(total)}</b>
      </span>
      {cuenta > 0 && (
        <span key={cuenta} className="num ne-salta">
          {cuenta}
        </span>
      )}
    </button>
  );
}

// --- El botón «Agregar» de las tarjetas ---------------------------------------

export function BotonAgregar({ articulo, agotado }: { articulo: Articulo; agotado?: boolean }) {
  const { cantidad, agregar, cambiar } = useCarrito();
  const n = cantidad(articulo.tipo, articulo.id);
  if (agotado) return <span className="ne-agotado">Agotado por ahora</span>;

  if (n === 0) {
    return (
      <button
        type="button"
        onClick={(e) => agregar(articulo, 1, e.currentTarget)}
        aria-label={`Agregar ${articulo.nombre}`}
        className="ne-agregar"
      >
        <Mas />
        {articulo.tipo === "COMBO" ? "Agregar combo" : "Agregar"}
      </button>
    );
  }
  return (
    <div className="ne-paso">
      <button type="button" onClick={() => cambiar(articulo.tipo, articulo.id, -1)} aria-label={`Quitar un ${articulo.nombre}`}>
        <Menos />
      </button>
      <span aria-live="polite">{n}</span>
      <button type="button" onClick={(e) => agregar(articulo, 1, e.currentTarget)} aria-label={`Agregar otro ${articulo.nombre}`}>
        <Mas />
      </button>
    </div>
  );
}

// --- Mayoría de edad --------------------------------------------------------

function PreguntaEdad({ responder }: { responder: (mayor: boolean) => void }) {
  const si = useRef<HTMLButtonElement>(null);
  useEffect(() => si.current?.focus(), []);
  return (
    <div className="ne-modal" role="dialog" aria-modal aria-labelledby="titulo-edad">
      <div className="caja">
        <div className="ne-sello tubo neon-a">+18</div>
        <h2 id="titulo-edad">¿Eres mayor de edad?</h2>
        <p>Para pedir licores tienes que tener 18 años o más.</p>
        <button ref={si} type="button" onClick={() => responder(true)} className="si">
          Sí, tengo 18 o más
        </button>
        <button type="button" onClick={() => responder(false)} className="no">
          No, todavía no
        </button>
        <small>Solo te lo preguntamos una vez.</small>
      </div>
    </div>
  );
}

// --- La hoja del pedido -----------------------------------------------------

type Entrega = "DOMICILIO" | "RECOGER";
type Pago = "EFECTIVO" | "TRANSFERENCIA";

function HojaPedido({ tienda, cerrar }: { tienda: DatosTienda; cerrar: () => void }) {
  const { lineas, total, cuenta, cambiar, sincronizar } = useCarrito();
  const guardados = leer(LLAVE_DATOS, { nombre: "", direccion: "", entrega: "DOMICILIO" as Entrega });
  const [entrega, setEntrega] = useState<Entrega>(guardados.entrega);
  const [pago, setPago] = useState<Pago>("EFECTIVO");
  const [nombre, setNombre] = useState(guardados.nombre);
  const [direccion, setDireccion] = useState(guardados.direccion);
  const [nota, setNota] = useState("");
  const [avisos, setAvisos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const revisado = useRef(false);
  const botonCerrar = useRef<HTMLButtonElement>(null);

  // Cerrar con Escape, y no dejar que la página de atrás se mueva.
  useEffect(() => {
    botonCerrar.current?.focus({ preventScroll: true });
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    document.addEventListener("keydown", tecla);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = antes;
    };
  }, [cerrar]);

  // Al abrir, se revisa con la API: si algo cambió de precio o se acabó, se dice.
  useEffect(() => {
    if (revisado.current || lineas.length === 0) return;
    revisado.current = true;
    pedirApi("revisar", { lineas: paraApi(lineas) })
      .then((r) => {
        setAvisos(r.avisos);
        if (r.avisos.length > 0) sincronizar(r);
      })
      // Sin conexión con la API todavía se puede ver el carrito; el error sale al pedir.
      .catch(() => {});
  }, [lineas, sincronizar]);

  async function pedir() {
    setError(null);
    if (!nombre.trim()) return setError("Escribe tu nombre.");
    if (entrega === "DOMICILIO" && !direccion.trim()) return setError("Escribe la dirección para el domicilio.");
    guardar(LLAVE_DATOS, { nombre, direccion, entrega });
    setEnviando(true);
    try {
      const r = await pedirApi("whatsapp", {
        lineas: paraApi(lineas),
        datos: { entrega, nombre, direccion, nota, pago },
      });
      // Si algo cambió, primero se muestra; el segundo toque ya manda.
      const nuevos = r.avisos.filter((a) => !avisos.includes(a));
      if (nuevos.length > 0) {
        sincronizar(r);
        setAvisos(r.avisos);
        setEnviando(false);
        return;
      }
      if (r.enlace) window.location.href = r.enlace;
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo armar el pedido. Intenta de nuevo.");
    }
    setEnviando(false);
  }

  return (
    <div className="ne-capa" role="dialog" aria-modal aria-labelledby="titulo-pedido">
      <button type="button" aria-label="Cerrar el pedido" onClick={cerrar} className="ne-velo" tabIndex={-1} />
      <section className="ne-hoja">
        <div className="ne-asa" />
        <div className="ne-hoja-cab">
          <h2 id="titulo-pedido" className="neon-a">
            Tu pedido
            {cuenta > 0 && (
              <small>
                · {cuenta} {cuenta === 1 ? "producto" : "productos"}
              </small>
            )}
          </h2>
          <button ref={botonCerrar} type="button" onClick={cerrar} className="ne-cerrar" aria-label="Seguir comprando">
            <Cerrar />
          </button>
        </div>

        <div className="ne-cuerpo">
          {lineas.length === 0 ? (
            <div className="ne-vacio">
              <b>Tu pedido está vacío</b>
              Agrega algo de la tienda y aquí lo verás.
            </div>
          ) : (
            lineas.map((l) => (
              <div key={`${l.tipo}-${l.id}`} className={`ne-linea${l.icono ? " con-mini" : ""}`}>
                {l.icono && <Miniatura p={{ nombre: l.nombre, icono: l.icono, presentacion: l.presentacion }} id={`h${l.tipo[0]}${l.id}`} />}
                <span className="nombre">
                  {l.nombre}
                  <small>
                    {l.presentacion ? `${l.presentacion} · ` : ""}
                    {pesos(l.precio)} c/u
                  </small>
                </span>
                <span className="tot">{pesos(l.precio * l.cantidad)}</span>
                <div className="ne-paso">
                  <button type="button" onClick={() => cambiar(l.tipo, l.id, -1)} aria-label={`Quitar un ${l.nombre}`}>
                    <Menos />
                  </button>
                  <span aria-live="polite">{l.cantidad}</span>
                  <button type="button" onClick={() => cambiar(l.tipo, l.id, 1)} aria-label={`Agregar otro ${l.nombre}`}>
                    <Mas />
                  </button>
                </div>
              </div>
            ))
          )}

          {avisos.length > 0 && (
            <ul className="ne-avisos" role="status">
              {avisos.map((a) => (
                <li key={a}>⚠ {a}</li>
              ))}
              <li>Revisa y vuelve a tocar «Pedir por WhatsApp».</li>
            </ul>
          )}

          <span className="ne-rotulo">¿Cómo lo recibes?</span>
          <Segmentos
            etiqueta="Entrega"
            valor={entrega}
            cambiar={setEntrega}
            opciones={[
              ["DOMICILIO", "Domicilio", <Moto key="m" />],
              ["RECOGER", "Paso a recoger", <Casa key="c" />],
            ]}
          />

          <label className="block">
            <span className="sr-only">Tu nombre</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" autoComplete="name" maxLength={60} className="ne-campo" />
          </label>
          {entrega === "DOMICILIO" ? (
            <>
              <label className="block">
                <span className="sr-only">Dirección y barrio</span>
                <input
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Dirección y barrio"
                  autoComplete="street-address"
                  maxLength={200}
                  className="ne-campo"
                />
              </label>
            </>
          ) : (
            <p className="ne-nota">Te avisamos cuando esté listo. {tienda.direccion}.</p>
          )}
          <label className="block">
            <span className="sr-only">Nota</span>
            <input
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Nota (opcional): «bien fría», «timbre dañado»…"
              maxLength={300}
              className="ne-campo"
            />
          </label>

          {tienda.aceptaTransferencia && (
            <>
              <span className="ne-rotulo">¿Cómo pagas?</span>
              <Segmentos
                etiqueta="Pago"
                valor={pago}
                cambiar={setPago}
                opciones={[
                  ["EFECTIVO", "Efectivo", <Billete key="b" />],
                  ["TRANSFERENCIA", "Nequi o transf.", <Chat key="c" />],
                ]}
              />
            </>
          )}

          <div className="ne-resumen">
            <div>
              <span>Productos</span>
              <span>{pesos(total)}</span>
            </div>
            {entrega === "DOMICILIO" && (
              <div>
                <span>Domicilio</span>
                <span>{tienda.valorDomicilio !== null ? pesos(tienda.valorDomicilio) : "Te lo confirmamos"}</span>
              </div>
            )}
            <div className="total">
              <span>Total</span>
              <span className="neon-a">
                {pesos(total + (entrega === "DOMICILIO" && tienda.valorDomicilio !== null ? tienda.valorDomicilio : 0))}
              </span>
            </div>
          </div>

          {error && (
            <p role="alert" className="ne-error">
              {error}
            </p>
          )}

          <button type="button" onClick={pedir} disabled={enviando || lineas.length === 0} className="ne-wa">
            <IconoWhatsApp />
            {enviando ? "Armando el pedido…" : "Pedir por WhatsApp"}
          </button>
          <p className="ne-seguro">
            <Candado />
            Se abre WhatsApp con tu pedido escrito. Lo mandas tú y te respondemos.
          </p>
        </div>
      </section>
    </div>
  );
}

function Segmentos<T extends string>({
  etiqueta,
  valor,
  cambiar,
  opciones,
}: {
  etiqueta: string;
  valor: T;
  cambiar: (v: T) => void;
  opciones: [T, string, React.ReactNode][];
}) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className="ne-seg">
      {opciones.map(([v, texto, icono]) => (
        <button key={v} type="button" role="radio" aria-checked={valor === v} onClick={() => cambiar(v)}>
          {icono}
          {texto}
        </button>
      ))}
    </div>
  );
}

// --- Hablar con la API (por la ruta /api/carrito de esta misma app) --------

function paraApi(lineas: Linea[]) {
  return lineas.map((l) => ({ tipo: l.tipo, id: l.id, cantidad: l.cantidad, precioVisto: l.precio }));
}

async function pedirApi(accion: "revisar" | "whatsapp", cuerpo: unknown): Promise<PedidoRespuesta> {
  const r = await fetch(`/api/carrito/${accion}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  const datos = await r.json().catch(() => null);
  if (!r.ok) throw new Error(datos?.error ?? "No se pudo armar el pedido. Intenta de nuevo.");
  return datos as PedidoRespuesta;
}
