import type { Metadata } from "next";
import { api } from "@/lib/api-catalogo";
import { enlaceWhatsApp, leerPublico } from "@/lib/tienda-publica";
import { Estantes, TituloSeccion } from "@/components/tienda/estantes";
import { Tarjeta } from "@/components/tienda/tarjeta";
import { TarjetaCombo } from "@/components/tienda/combo";
import { IconoWhatsApp } from "@/components/tienda/carrito";
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
  const destacados = todos.filter((p) => p.destacado);
  const masPedido = (destacados.length > 0 ? destacados : todos).slice(0, 10);
  const ofertas = todos.filter((p) => p.precioAntes);
  const combo = combos.find((c) => c.deLaSemana) ?? combos[0];

  return (
    <>
      <JsonLd datos={datosNegocio(tienda)} />

      {tienda.temporada && tienda.bannerTitulo && (
        <section className="rayado relative mx-4 my-3 overflow-hidden rounded-md bg-pino p-4 text-[#f6edd8] shadow-[3px_3px_0_#c9b38a]">
          <h1 className="text-xl font-black uppercase leading-none text-maiz [text-wrap:balance]">{tienda.bannerTitulo}</h1>
          {tienda.bannerTexto && <p className="mt-1 max-w-[78%] font-mano text-base leading-snug">{tienda.bannerTexto}</p>}
          {tienda.bannerSello && (
            <span className="absolute bottom-2.5 right-3 grid h-16 w-16 -rotate-12 place-items-center rounded-full border-2 border-dashed border-maiz p-1 text-center font-mano text-[10.5px] font-bold leading-none text-maiz">
              {tienda.bannerSello}
            </span>
          )}
        </section>
      )}
      {!(tienda.temporada && tienda.bannerTitulo) && (
        <h1 className="sr-only">{tienda.nombre}: licores y mercado a domicilio</h1>
      )}

      <Estantes categorias={categorias} />

      {todos.length === 0 && (
        <p className="mx-4 mt-6 rounded-md bg-carton p-6 text-center font-mano text-lg text-cafe-suave">
          Estamos surtiendo los estantes. Mientras tanto, pídenos lo que necesites por WhatsApp.
        </p>
      )}

      {masPedido.length > 0 && (
        <>
          <TituloSeccion titulo="Lo más pedido" />
          <div className="tira px-4 pb-4 pt-2.5">
            {masPedido.map((p, i) => (
              <Tarjeta key={p.id} p={p} ancho="tira" prioridad={i < 2} />
            ))}
          </div>
        </>
      )}

      {combo && (
        <>
          <TituloSeccion titulo={combo.deLaSemana ? "Combo de la semana" : "Combo"} />
          <TarjetaCombo c={combo} />
          {combos
            .filter((c) => c.id !== combo.id)
            .map((c) => (
              <TarjetaCombo key={c.id} c={c} />
            ))}
        </>
      )}

      {ofertas.length > 0 && (
        <>
          <TituloSeccion titulo="Ofertas" />
          <div className="tira px-4 pb-4 pt-2.5">
            {ofertas.map((p) => (
              <Tarjeta key={p.id} p={p} ancho="tira" />
            ))}
          </div>
        </>
      )}

      {categorias.map((c) => (
        <section key={c.slug}>
          <TituloSeccion titulo={c.nombre} href={c.productos.length > 4 ? `/c/${c.slug}` : undefined} />
          <div className="tira px-4 pb-4 pt-2.5">
            {c.productos.slice(0, 10).map((p) => (
              <Tarjeta key={p.id} p={p} ancho="tira" />
            ))}
          </div>
        </section>
      ))}

      <section className="mx-4 my-4 rounded-lg border-2 border-dashed border-navidad p-4 text-center">
        <h2 className="font-black uppercase text-navidad">¿Pedido grande o para fiesta?</h2>
        <p className="mb-3 mt-1 font-mano text-base leading-snug">
          Escríbenos: despachamos fuera de horario y armamos el pedido completo.
        </p>
        <a
          href={enlaceWhatsApp(tienda, "Hola, Supermercado Adela. Quiero hacer un pedido grande para una reunión.")}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25d366] py-3 font-extrabold text-white shadow-[3px_3px_0_#178a42]"
        >
          <IconoWhatsApp /> Escribir por WhatsApp
        </a>
      </section>
    </>
  );
}
