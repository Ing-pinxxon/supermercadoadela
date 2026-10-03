import Link from "next/link";
import type { CatalogoVista, TiendaVista } from "@/lib/api-catalogo";
import { Carrito, IconoCarrito, IconoWhatsApp } from "@/components/tienda/carrito";
import { LetreroPuerta } from "@/components/tienda/letrero-puerta";
import { horaLegible } from "@/lib/horas";
import { Buscador, type Indice } from "@/components/tienda/buscador";
import { EnlaceEquipo } from "@/components/tienda/enlace-equipo";
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
    })),
  );

  return (
    <Carrito
      tienda={{
        aceptaTransferencia: tienda.aceptaTransferencia,
        valorDomicilio: tienda.valorDomicilio,
        direccion: tienda.direccion,
      }}
    >
      <EnlaceEquipo />
      <header className="sticky top-0 z-20 border-b-2 border-dashed border-sombra bg-papel/95 px-4 pb-2.5 pt-3 backdrop-blur-sm">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="shrink-0 whitespace-nowrap leading-none" aria-label={`${tienda.nombre}, inicio`}>
              <b className="block text-[22px] font-black uppercase tracking-tight text-navidad">Adela</b>
              <small className="font-mano text-[14px] text-cafe-suave">su tienda de siempre</small>
            </Link>
            <LetreroPuerta abre={tienda.abre} cierra={tienda.cierra} />
            <IconoCarrito />
          </div>
          <Buscador indice={indice} />
        </div>
      </header>

      <main className="mx-auto max-w-xl pb-28">{children}</main>

      <footer className="bg-cafe px-4 pb-32 pt-6 text-[#efe3cc]">
        <div className="mx-auto max-w-xl space-y-3 text-sm">
          <h2 className="font-black uppercase text-maiz">{tienda.nombre}</h2>
          <p className="flex gap-2.5">
            <Pin /> <span>{direccionCompleta(tienda)}</span>
          </p>
          <p className="flex gap-2.5">
            <Reloj />
            <span>
              Todos los días, {horaLegible(tienda.abre)} a {horaLegible(tienda.cierra)}
              {tienda.notaHorario && <span className="block opacity-80">{tienda.notaHorario}</span>}
            </span>
          </p>
          <p className="flex items-center gap-2.5">
            <IconoWhatsApp className="h-[18px] w-[18px] shrink-0 text-maiz" />
            <a href={enlaceWhatsApp(tienda, "Hola, Supermercado Adela.")} className="underline underline-offset-2">
              {telefonoLegible(tienda.whatsapp)}
            </a>
          </p>
          <iframe
            title={`Mapa: ${tienda.nombre}`}
            src={`https://www.google.com/maps?q=${encodeURIComponent(`${tienda.nombre}, ${direccionCompleta(tienda)}`)}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-44 w-full rounded-md border-0 bg-[#e8dcc2]"
          />
          <a
            href={enlaceMapa(tienda)}
            className="inline-flex items-center gap-1 rounded-md bg-maiz px-3 py-2 text-sm font-bold text-cafe shadow-[2px_2px_0_#c9a94a]"
          >
            Cómo llegar →
          </a>
          <div className="space-y-1 pt-2 text-[11px] leading-snug text-[#b9ab93]">
            {LEYENDAS_LICOR.map((l) => (
              <p key={l}>{l}</p>
            ))}
          </div>
        </div>
      </footer>
    </Carrito>
  );
}

function Pin() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 text-maiz" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function Reloj() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 text-maiz" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

/** Lo que se ve si la API todavía no está conectada. */
export function TiendaEnPreparacion() {
  return (
    <main className="mx-auto grid min-h-screen max-w-md place-items-center px-6 text-center">
      <div>
        <b className="block text-3xl font-black uppercase text-navidad">Adela</b>
        <p className="font-mano text-xl text-cafe-suave">su tienda de siempre</p>
        <p className="mt-6 text-cafe">Estamos preparando la tienda en línea. Vuelve en un ratico.</p>
        <Link href="/admin" className="mt-8 inline-block text-xs text-cafe-suave underline">
          Administración
        </Link>
      </div>
    </main>
  );
}
