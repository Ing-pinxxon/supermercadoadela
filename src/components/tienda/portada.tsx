import type { ComboVista, TiendaVista } from "@/lib/api-catalogo";
import { bokeh } from "@/lib/calle";
import { LetreroPuerta } from "@/components/tienda/letrero-puerta";
import { CuentaNovena } from "@/components/tienda/cuenta-novena";
import { Billete, Chat, Flecha, Moto, Reloj } from "@/components/tienda/iconos-neon";
import { horaLegible } from "@/lib/horas";

/**
 * La portada: la calle de diciembre (una imagen SVG que el navegador guarda),
 * lucecitas flotando, el letrero «Abierto» y la placa de neón con el anuncio
 * de temporada que se edita en «Datos de la tienda».
 */
export function Portada({ tienda, combo }: { tienda: TiendaVista; combo?: ComboVista }) {
  const temporada = tienda.temporada;
  return (
    <section className="ne-portada" aria-label="Portada">
      {/* eslint-disable-next-line @next/next/no-img-element -- es un SVG propio, no hace falta optimizarlo */}
      <img className="ne-calle" src="/portada/calle.svg" alt="" width={1000} height={460} fetchPriority="high" decoding="async" />
      <div className="ne-bokeh" aria-hidden dangerouslySetInnerHTML={{ __html: bokeh() }} />
      <LetreroPuerta abre={tienda.abre} cierra={tienda.cierra} />
      <div className="ne-hero">
        <div className="ne-placa">
          <i />
          <i />
          <i />
          <i />
          <span className="ceja">{temporada ? (tienda.bannerTitulo ?? "Temporada de diciembre") : "Licores y mercado a domicilio"}</span>
          <h2>
            {temporada ? (
              <>
                <span className="g neon-b encender">¡Noches de</span>
                <span className="f neon-a encender tarde">fiesta!</span>
              </>
            ) : (
              <>
                <span className="g neon-b encender">Tu tienda</span>
                <span className="f neon-a encender tarde">Adela</span>
              </>
            )}
          </h2>
          <p>{(temporada && tienda.bannerTexto) || "Pide por WhatsApp y te lo llevamos a la casa"}</p>
        </div>
        {temporada && <CuentaNovena />}
        <div className="ne-ctas">
          <a className="ne-btn-prim" href="#mas-vendido">
            Pedir ahora <Flecha />
          </a>
          {combo ? (
            <a className="ne-btn-neon tubo" href="#combos">
              {combo.nombre}
            </a>
          ) : (
            <a className="ne-btn-neon tubo" href="#visitanos">
              Visítanos
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

/** La franja de confianza bajo la portada. */
export function Confianza({ tienda }: { tienda: TiendaVista }) {
  const lugar = tienda.barrio ? `${tienda.barrio} y barrios cercanos` : `En ${tienda.ciudad}`;
  const items = [
    { c: "var(--amarillo)", icono: <Moto />, titulo: "Domicilio", texto: lugar },
    { c: "var(--menta)", icono: <Chat />, titulo: "Por WhatsApp", texto: "Sin registrarte, en un minuto" },
    {
      c: "var(--azul)",
      icono: <Reloj />,
      titulo: "Todos los días",
      texto: `${horaLegible(tienda.abre)} a ${horaLegible(tienda.cierra)}`,
    },
    {
      c: "var(--rojo)",
      icono: <Billete />,
      titulo: "Paga como quieras",
      texto: tienda.aceptaTransferencia ? "Efectivo, Nequi o transferencia" : "En efectivo al recibir",
    },
  ];
  return (
    <div className="ne-confianza">
      {items.map((it) => (
        <div key={it.titulo} style={{ ["--c" as string]: it.c }}>
          {it.icono}
          <span>
            <b>{it.titulo}</b>
            <small>{it.texto}</small>
          </span>
        </div>
      ))}
    </div>
  );
}
