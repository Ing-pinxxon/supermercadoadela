"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { PedidoRespuesta } from "@/lib/api-catalogo";
import { pesos } from "@/lib/dinero";

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
  agregar: (a: Articulo, n?: number) => void;
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

export function Carrito({ tienda, children }: { tienda: DatosTienda; children: React.ReactNode }) {
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [listo, setListo] = useState(false);
  const [abierta, setAbierta] = useState(false);
  const [barraPropia, setBarraPropia] = useState(false);
  const [preguntaEdad, setPreguntaEdad] = useState<{ a: Articulo; n: number } | null>(null);

  useEffect(() => {
    setLineas(leer<Linea[]>(LLAVE, []));
    setListo(true);
  }, []);
  useEffect(() => {
    if (listo) guardar(LLAVE, lineas);
  }, [lineas, listo]);

  const poner = useCallback((a: Articulo, n: number) => {
    setLineas((actual) => {
      const i = actual.findIndex((l) => l.tipo === a.tipo && l.id === a.id);
      if (i === -1) return n > 0 ? [...actual, { ...a, cantidad: Math.min(n, 99) }] : actual;
      const nueva = Math.min(actual[i].cantidad + n, 99);
      if (nueva <= 0) return actual.filter((_, j) => j !== i);
      return actual.map((l, j) => (j === i ? { ...l, ...a, cantidad: nueva } : l));
    });
  }, []);

  const valor = useMemo<Contexto>(
    () => ({
      lineas,
      cuenta: lineas.reduce((s, l) => s + l.cantidad, 0),
      total: lineas.reduce((s, l) => s + l.cantidad * l.precio, 0),
      cantidad: (tipo, id) => lineas.find((l) => l.tipo === tipo && l.id === id)?.cantidad ?? 0,
      agregar: (a, n = 1) => {
        if (a.esLicor && !leer(LLAVE_EDAD, false)) return setPreguntaEdad({ a, n });
        poner(a, n);
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
    [lineas, poner],
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
              poner(preguntaEdad.a, preguntaEdad.n);
            }
            setPreguntaEdad(null);
          }}
        />
      )}
    </CarritoCtx.Provider>
  );
}

// --- La barra de abajo ------------------------------------------------------

function BarraPedido({ oculta }: { oculta: boolean }) {
  const { cuenta, total, abrir } = useCarrito();
  const visible = cuenta > 0 && !oculta;
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-[130%]"
      }`}
      aria-hidden={!visible}
    >
      <button
        type="button"
        onClick={abrir}
        tabIndex={visible ? 0 : -1}
        className="mx-auto flex w-full max-w-xl items-center justify-between rounded-lg bg-navidad px-4 py-3.5 font-extrabold text-white shadow-[3px_3px_0_var(--color-navidad-osc)] transition active:translate-y-px active:shadow-[1px_1px_0_var(--color-navidad-osc)]"
      >
        <span className="flex items-center gap-2">
          <span key={cuenta} className="saltar inline-grid h-7 min-w-7 place-items-center rounded-full bg-maiz px-1.5 text-sm text-navidad">
            {cuenta}
          </span>
          Ver pedido
        </span>
        <span className="tabular">{pesos(total)}</span>
      </button>
    </div>
  );
}

/** El ícono del carrito del encabezado, con el número que salta al agregar. */
export function IconoCarrito() {
  const { cuenta, abrir } = useCarrito();
  return (
    <button
      type="button"
      onClick={abrir}
      aria-label={cuenta ? `Ver pedido: ${cuenta} productos` : "Ver pedido"}
      className="carton-chico relative grid h-10 w-10 place-items-center rounded-lg text-cafe transition active:scale-90"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" />
        <circle cx="10" cy="20.5" r="1" />
        <circle cx="17" cy="20.5" r="1" />
      </svg>
      {cuenta > 0 && (
        <span key={cuenta} className="saltar absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-navidad px-1 text-[11px] font-bold text-white">
          {cuenta}
        </span>
      )}
    </button>
  );
}

// --- El botón «+» de las tarjetas ------------------------------------------

export function BotonAgregar({
  articulo,
  agotado,
  grande = false,
}: {
  articulo: Articulo;
  agotado?: boolean;
  grande?: boolean;
}) {
  const { cantidad, agregar, cambiar } = useCarrito();
  const n = cantidad(articulo.tipo, articulo.id);
  const alto = grande ? "h-12" : "h-9";
  if (agotado) return null;

  if (n === 0) {
    return (
      <button
        type="button"
        onClick={() => agregar(articulo)}
        aria-label={`Agregar ${articulo.nombre}`}
        className={`${alto} ${grande ? "px-5 text-base" : "w-9 text-xl"} grid place-items-center rounded-md bg-pino font-extrabold text-maiz shadow-[2px_2px_0_var(--color-pino-osc)] transition active:translate-y-px active:shadow-none`}
      >
        {grande ? "Agregar" : "+"}
      </button>
    );
  }
  return (
    <div
      className={`${alto} pop flex items-center rounded-md bg-pino font-extrabold text-maiz shadow-[2px_2px_0_var(--color-pino-osc)]`}
    >
      <button
        type="button"
        onClick={() => cambiar(articulo.tipo, articulo.id, -1)}
        aria-label={`Quitar un ${articulo.nombre}`}
        className="h-full w-9 text-xl active:scale-90"
      >
        −
      </button>
      <span className="tabular min-w-5 text-center text-sm" aria-live="polite">
        {n}
      </span>
      <button
        type="button"
        onClick={() => agregar(articulo)}
        aria-label={`Agregar otro ${articulo.nombre}`}
        className="h-full w-9 text-xl active:scale-90"
      >
        +
      </button>
    </div>
  );
}

// --- Mayoría de edad --------------------------------------------------------

function PreguntaEdad({ responder }: { responder: (mayor: boolean) => void }) {
  const si = useRef<HTMLButtonElement>(null);
  useEffect(() => si.current?.focus(), []);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-cafe/55 p-6" role="dialog" aria-modal aria-labelledby="titulo-edad">
      <div className="pop w-full max-w-xs rounded-lg bg-carton p-5 text-center shadow-[4px_4px_0_#c9b38a]">
        <h2 id="titulo-edad" className="text-lg font-black uppercase">
          ¿Eres mayor de edad?
        </h2>
        <p className="mt-1 text-sm text-cafe-suave">Para pedir licores tienes que tener 18 años o más.</p>
        <button
          ref={si}
          type="button"
          onClick={() => responder(true)}
          className="mt-4 w-full rounded-md bg-navidad py-3 font-bold text-white"
        >
          Sí, tengo 18 o más
        </button>
        <button type="button" onClick={() => responder(false)} className="mt-2 w-full rounded-md bg-papel py-3 font-bold">
          No
        </button>
      </div>
    </div>
  );
}

// --- La hoja del pedido -----------------------------------------------------

type Entrega = "DOMICILIO" | "RECOGER";
type Pago = "EFECTIVO" | "TRANSFERENCIA";

function HojaPedido({ tienda, cerrar }: { tienda: DatosTienda; cerrar: () => void }) {
  const { lineas, total, cambiar, sincronizar } = useCarrito();
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

  // Cerrar con Escape, y no dejar que la página de atrás se mueva.
  useEffect(() => {
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
    <div className="fixed inset-0 z-40" role="dialog" aria-modal aria-labelledby="titulo-pedido">
      <button type="button" aria-label="Cerrar el pedido" onClick={cerrar} className="aparecer absolute inset-0 bg-cafe/45" />
      <section className="subir absolute inset-x-0 bottom-0 mx-auto max-h-[92dvh] max-w-xl overflow-y-auto rounded-t-xl bg-papel px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2 text-cafe">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-cafe/30" />
        <div className="flex items-baseline justify-between">
          <h2 id="titulo-pedido" className="text-xl font-black uppercase">
            Tu pedido
          </h2>
          <button type="button" onClick={cerrar} className="font-mano text-lg text-navidad">
            Seguir comprando
          </button>
        </div>
        <p className="font-mano text-base text-cafe-suave">Revisa y te lo confirmamos por WhatsApp</p>

        {lineas.length === 0 ? (
          <p className="mt-6 rounded-md bg-carton p-6 text-center text-cafe-suave">Todavía no has agregado nada.</p>
        ) : (
          <div className="recibo mt-3 rounded px-3 pb-1 pt-2">
            {lineas.map((l) => (
              <div key={`${l.tipo}-${l.id}`} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 border-b-[1.5px] border-dashed border-raya py-2.5 last:border-0">
                <span className="text-sm leading-tight">
                  {l.nombre}
                  {l.presentacion && <span className="block text-xs text-cafe-suave">{l.presentacion}</span>}
                </span>
                <span className="tabular text-right text-sm font-extrabold">{pesos(l.precio * l.cantidad)}</span>
                <span className="flex items-center gap-1">
                  <button type="button" onClick={() => cambiar(l.tipo, l.id, -1)} aria-label={`Quitar un ${l.nombre}`} className="h-8 w-8 rounded bg-papel font-extrabold active:scale-90">
                    −
                  </button>
                  <span className="tabular min-w-6 text-center font-bold">{l.cantidad}</span>
                  <button type="button" onClick={() => cambiar(l.tipo, l.id, 1)} aria-label={`Agregar otro ${l.nombre}`} className="h-8 w-8 rounded bg-papel font-extrabold active:scale-90">
                    +
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-baseline justify-between px-1 font-black uppercase">
          <span>Total</span>
          <span className="etiqueta-precio text-2xl">{pesos(total)}</span>
        </div>

        {avisos.length > 0 && (
          <ul className="mt-3 space-y-1 rounded-md border-2 border-dashed border-navidad/60 bg-carton p-3 text-sm" role="status">
            {avisos.map((a) => (
              <li key={a}>⚠ {a}</li>
            ))}
            <li className="font-mano text-base text-cafe-suave">Revisa y vuelve a tocar «Pedir por WhatsApp».</li>
          </ul>
        )}

        <Segmentos
          etiqueta="Entrega"
          valor={entrega}
          cambiar={setEntrega}
          opciones={[
            ["DOMICILIO", "Domicilio"],
            ["RECOGER", "Paso a recoger"],
          ]}
        />

        <label className="mt-1 block">
          <span className="sr-only">Tu nombre</span>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
            autoComplete="name"
            maxLength={60}
            className="w-full rounded-md border-[1.5px] border-sombra bg-white px-3 py-3 text-cafe"
          />
        </label>
        {entrega === "DOMICILIO" ? (
          <>
            <label className="mt-2 block">
              <span className="sr-only">Dirección y barrio</span>
              <input
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Dirección y barrio"
                autoComplete="street-address"
                maxLength={200}
                className="w-full rounded-md border-[1.5px] border-sombra bg-white px-3 py-3 text-cafe"
              />
            </label>
            <p className="mt-1 font-mano text-base text-cafe-suave">
              {tienda.valorDomicilio !== null
                ? `Domicilio: ${pesos(tienda.valorDomicilio)}`
                : "El valor del domicilio te lo decimos por WhatsApp."}
            </p>
          </>
        ) : (
          <p className="mt-2 font-mano text-base text-cafe-suave">Te avisamos cuando esté listo. {tienda.direccion}.</p>
        )}
        <label className="mt-2 block">
          <span className="sr-only">Nota</span>
          <input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Nota (opcional): «bien fría», «timbre dañado»…"
            maxLength={300}
            className="w-full rounded-md border-[1.5px] border-sombra bg-white px-3 py-3 text-cafe"
          />
        </label>

        {tienda.aceptaTransferencia && (
          <Segmentos
            etiqueta="Pago"
            valor={pago}
            cambiar={setPago}
            opciones={[
              ["EFECTIVO", "Efectivo"],
              ["TRANSFERENCIA", "Nequi / transferencia"],
            ]}
          />
        )}

        {error && (
          <p role="alert" className="mt-3 rounded-md bg-navidad/10 px-3 py-2 text-sm font-semibold text-navidad-osc">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={pedir}
          disabled={enviando || lineas.length === 0}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#25d366] py-3.5 text-base font-extrabold text-white shadow-[3px_3px_0_#178a42] transition active:translate-y-px active:shadow-none disabled:opacity-50"
        >
          <IconoWhatsApp />
          {enviando ? "Armando el pedido…" : "Pedir por WhatsApp"}
        </button>
        <p className="mt-2 text-center text-xs text-cafe-suave">
          Se abre WhatsApp con tu pedido escrito. Lo mandas tú y te respondemos.
        </p>
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
  opciones: [T, string][];
}) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className="my-3 grid grid-cols-2 gap-1 rounded-md bg-carton p-1 shadow-[inset_0_0_0_1.5px_var(--color-sombra)]">
      {opciones.map(([v, texto]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={valor === v}
          onClick={() => cambiar(v)}
          className={`rounded py-2.5 text-sm font-bold transition ${valor === v ? "bg-pino text-maiz" : "text-cafe"}`}
        >
          {texto}
        </button>
      ))}
    </div>
  );
}

export function IconoWhatsApp({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.3.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3Z" />
    </svg>
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
