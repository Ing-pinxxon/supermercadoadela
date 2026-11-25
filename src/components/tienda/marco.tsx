import Link from "next/link";
import type { CatalogoVista, TiendaVista } from "@/lib/api-catalogo";
import { Carrito } from "@/components/tienda/carrito";
import { Cabecera } from "@/components/tienda/cabecera";
import { EstadoAhora } from "@/components/tienda/letrero-puerta";
import type { Indice } from "@/components/tienda/buscador";
import { EnlaceEquipo } from "@/components/tienda/enlace-equipo";
import { Chat, IconoWhatsApp, Pin, Reloj } from "@/components/tienda/iconos-neon";
import { horaLegible } from "@/lib/horas";
import {
  LEYENDAS_LICOR,
  direccionCompleta,
  enlaceMapa,
  enlaceWhatsApp,
  telefonoLegible,
} from "@/lib/tienda-publica";

/** Encabezado, pie y carrito: lo que rodea todas las páginas de la tienda. */
export function MarcoTienda({
  tienda,
  catalogo,
  children,
}: {
  tienda: TiendaVista;
  catalogo: CatalogoVista;
  children: React.ReactNode;
}) {
  const indice: Indice = catalogo.categorias.flatMap((c) =>
    c.productos.map((p) => ({
      id: p.id,
      slug: p.slug,
      nombre: p.nombre,
      presentacion: p.presentacion,
      categoria: c.nombre,
      precio: p.precio,
      esLicor: p.esLicor,
      agotado: p.disponibilidad === "AGOTADO",
      icono: p.icono,
    })),
  );
  const estantes = catalogo.categorias.map((c) => ({ href: `/c/${c.slug}`, texto: c.nombre }));
  const extra = [
    ...(catalogo.combos.length > 0 ? [{ href: "/#combos", texto: "Combos" }] : []),
    { href: "#visitanos", texto: "Visítanos" },
  ];
  const secciones = [{ href: "/", texto: "Inicio" }, ...estantes, ...extra];
  const menu = [{ href: "/", texto: "Inicio" }, ...estantes.slice(0, 6), ...extra];

  return (
    <Carrito
      tienda={{
        aceptaTransferencia: tienda.aceptaTransferencia,
        valorDomicilio: tienda.valorDomicilio,
        direccion: tienda.direccion,
      }}
    >
      <EnlaceEquipo />
      <Cabecera
        indice={indice}
        secciones={secciones}
        menu={menu}
        whatsapp={tienda.whatsapp}
        telefono={telefonoLegible(tienda.whatsapp)}
      />

      <main>{children}</main>

      <Pie tienda={tienda} />
    </Carrito>
  );
}

function Pie({ tienda }: { tienda: TiendaVista }) {
  const lugar = [tienda.barrio, tienda.ciudad].filter(Boolean).join(", ");
  return (
    <footer className="ne-pie" id="visitanos">
      {tienda.temporada && (
        <div className="ne-colgante">
          <div className="ne-placa ne-felices tubo">
            <i />
            <i />
            <i />
            <i />
            <b className="neon-r">¡Felices fiestas!</b>
            <span className="neon-b">les desea Adela</span>
          </div>
        </div>
      )}
      <div className="ne-pie-grid">
        <section className="ne-tarjeta">
          <h3>
            <Pin />
            Visítanos
          </h3>
          <div className="gran">{tienda.direccion}</div>
          {lugar && <p>{lugar}</p>}
          <iframe
            title={`Mapa: ${tienda.nombre}`}
            src={`https://www.google.com/maps?q=${encodeURIComponent(`${tienda.nombre}, ${direccionCompleta(tienda)}`)}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <a className="ne-enlace" href={enlaceMapa(tienda)} target="_blank" rel="noopener">
            <Pin />
            Cómo llegar
          </a>
        </section>
        <section className="ne-tarjeta">
          <h3>
            <Reloj />
            Horario
          </h3>
          <div className="gran">Todos los días</div>
          <p>
            {horaLegible(tienda.abre)} a {horaLegible(tienda.cierra)}
          </p>
          <EstadoAhora abre={tienda.abre} cierra={tienda.cierra} />
          {tienda.notaHorario && <p style={{ marginTop: 10 }}>{tienda.notaHorario}</p>}
        </section>
        <section className="ne-tarjeta">
          <h3>
            <Chat />
            Pide por WhatsApp
          </h3>
          <div className="gran">{telefonoLegible(tienda.whatsapp)}</div>
          <p>{tienda.aceptaTransferencia ? "Efectivo, Nequi o transferencia." : "Pago en efectivo."}</p>
          <a className="ne-enlace wa" href={enlaceWhatsApp(tienda, `Hola, ${tienda.nombre}.`)} target="_blank" rel="noopener">
            <IconoWhatsApp />
            Escríbenos
          </a>
        </section>
      </div>
      <div className="ne-legal">
        {LEYENDAS_LICOR.map((l) => (
          <p key={l}>{l}</p>
        ))}
        <span>
          © {new Date().getFullYear()} {tienda.nombre} · {tienda.ciudad}
        </span>
      </div>
    </footer>
  );
}

/** Lo que se ve si la API todavía no está conectada. */
export function TiendaEnPreparacion() {
  return (
    <main className="ne-prep">
      <div>
        <span className="nombre neon-a encender">Adela</span>
        <span className="lema neon-b">Tu tienda y licorera de confianza</span>
        <p>Estamos preparando la tienda en línea. Vuelve en un ratico.</p>
        <Link href="/admin">Administración</Link>
      </div>
    </main>
  );
}
