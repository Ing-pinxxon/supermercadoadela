import type { Metadata } from "next";
import { api } from "@/lib/api-catalogo";
import { enlaceWhatsApp, leerPublico } from "@/lib/tienda-publica";
import { Categorias, TituloSeccion } from "@/components/tienda/estantes";
import { Tarjeta } from "@/components/tienda/tarjeta";
import { TarjetaCombo } from "@/components/tienda/combo";
import { Confianza, Portada } from "@/components/tienda/portada";
import { IconoWhatsApp } from "@/components/tienda/iconos-neon";
import { PuntosCombos } from "@/components/tienda/puntos-combos";
import { JsonLd, datosNegocio } from "@/components/tienda/json-ld";

// Cada cinco minutos se vuelve a leer la API; editar algo la refresca al instante.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const tienda = await leerPublico(() => api.tienda()).catch(() => null);
  if (!tienda) return {};
  const lugar = [tienda.barrio, tienda.ciudad].filter(Boolean).join(", ");
  return {
    title: { absolute: `${tienda.nombre} · Licores y mercado a domicilio en ${lugar}` },
    description: `Aguardiente, ron, whisky, cerveza, hielo y todo para la novena con domicilio en ${lugar}. Mira precios y pide por WhatsApp.`,
    alternates: { canonical: "/" },
    // La meta etiqueta que pide Google Search Console para verificar la página.
    ...(tienda.googleVerificacion ? { verification: { google: tienda.googleVerificacion } } : {}),
  };
}

export default async function Inicio() {
  const datos = await leerPublico(() => Promise.all([api.tienda(), api.catalogo()]));
  if (!datos) return null; // el layout ya muestra «estamos preparando la tienda»
  const [tienda, { categorias, combos }] = datos;

  const todos = categorias.flatMap((c) => c.productos);
  const disponibles = todos.filter((p) => p.disponibilidad !== "AGOTADO");
  const destacados = disponibles.filter((p) => p.destacado);
  const masPedido = (destacados.length >= 4 ? destacados : [...destacados, ...disponibles.filter((p) => !p.destacado)]).slice(0, 8);
  const ofertas = disponibles.filter((p) => p.precioAntes);
  const ordenCombos = [...combos].sort((a, b) => Number(b.deLaSemana) - Number(a.deLaSemana));
  const lugar = [tienda.barrio, tienda.ciudad].filter(Boolean).join(", ");

  return (
    <>
      <JsonLd datos={datosNegocio(tienda)} />
      <h1 className="sr-only">
        {tienda.nombre}: licores y mercado a domicilio en {lugar}
      </h1>

      <Portada tienda={tienda} combo={ordenCombos[0]} />
      <Confianza tienda={tienda} />

      {categorias.length > 0 && (
        <section className="ne-seccion">
          <div className="ne-ancho">
            <TituloSeccion ceja={tienda.temporada ? "Para la temporada" : "Todo lo que hay"} titulo="Categorías" />
            <Categorias categorias={categorias} />
          </div>
        </section>
      )}

      {todos.length === 0 && (
        <section className="ne-seccion">
          <div className="ne-ancho ne-vacio">
            <b>Estamos surtiendo los estantes</b>
            Mientras tanto, pídenos lo que necesites por WhatsApp.
          </div>
        </section>
      )}

      {masPedido.length > 0 && (
        <section className="ne-seccion" id="mas-vendido">
          <div className="ne-ancho">
            <TituloSeccion ceja="Lo que más piden los vecinos" titulo="Lo más vendido" />
            <div className="ne-grid">
              {masPedido.map((p, i) => (
                <Tarjeta key={p.id} p={p} i={i} prioridad={i < 2} />
              ))}
            </div>
          </div>
        </section>
      )}

      {ordenCombos.length > 0 && (
        <section className="ne-seccion" id="combos">
          <div className="ne-ancho">
            <TituloSeccion ceja="Ahorra en diciembre" titulo={ordenCombos.length > 1 ? "Combos de temporada" : "Combo de temporada"} />
            <div className="ne-combos" data-combos>
              {ordenCombos.map((c, i) => (
                <TarjetaCombo key={c.id} c={c} i={i} productos={todos} />
              ))}
            </div>
            {ordenCombos.length > 1 && <PuntosCombos cantidad={ordenCombos.length} />}
            <small className="ne-vale">Hasta agotar existencias.</small>
          </div>
        </section>
      )}

      {ofertas.length > 0 && (
        <section className="ne-seccion">
          <div className="ne-ancho">
            <TituloSeccion ceja="Mientras duren" titulo="Ofertas" />
            <div className="ne-tira">
              {ofertas.map((p, i) => (
                <Tarjeta key={p.id} p={p} i={i} />
              ))}
            </div>
          </div>
        </section>
      )}


      <section className="ne-grande tubo">
        <h2 className="neon-v">¿Pedido grande o para fiesta?</h2>
        <p>Escríbenos: despachamos fuera de horario y armamos el pedido completo.</p>
        <a
          href={enlaceWhatsApp(tienda, `Hola, ${tienda.nombre}. Quiero hacer un pedido grande para una reunión.`)}
          className="ne-wa"
          style={{ maxWidth: 380, margin: "0 auto" }}
        >
          <IconoWhatsApp /> Escribir por WhatsApp
        </a>
      </section>
    </>
  );
}
