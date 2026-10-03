import type { ProductoDetalle, TiendaVista } from "@/lib/api-catalogo";
import { direccionCompleta, enlaceMapa } from "@/lib/tienda-publica";

/**
 * Datos estructurados para Google (schema.org). No se ven en la página: le
 * dicen a Google que esto es una tienda con dirección, horario y teléfono, y
 * que cada producto tiene precio en pesos y disponibilidad.
 */
export function JsonLd({ datos }: { datos: object }) {
  // «<» escapado para que un texto con «</script>» no pueda cerrar la etiqueta.
  const json = JSON.stringify(datos).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export const SITIO = (process.env.SITIO_URL ?? "https://supermercadoadela.vercel.app").replace(/\/+$/, "");

const DIAS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function datosNegocio(t: TiendaVista) {
  return {
    "@context": "https://schema.org",
    "@type": ["GroceryStore", "LiquorStore"],
    "@id": `${SITIO}/#tienda`,
    name: t.nombre,
    url: SITIO,
    image: `${SITIO}/opengraph-image`,
    telephone: `+${t.whatsapp}`,
    priceRange: "$$",
    currenciesAccepted: "COP",
    paymentAccepted: t.aceptaTransferencia ? "Efectivo, Nequi, transferencia" : "Efectivo",
    address: {
      "@type": "PostalAddress",
      streetAddress: t.direccion,
      addressLocality: t.ciudad,
      addressRegion: "Bogotá D.C.",
      addressCountry: "CO",
      ...(t.barrio ? { description: `Barrio ${t.barrio}` } : {}),
    },
    hasMap: enlaceMapa(t),
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: DIAS, opens: t.abre, closes: t.cierra },
    ],
    areaServed: t.barrio ? `${t.barrio}, ${t.ciudad}` : t.ciudad,
    description: `Licores, cerveza y mercado con domicilio en ${direccionCompleta(t)}. Pedidos por WhatsApp.`,
  };
}

const DISPONIBILIDAD = {
  DISPONIBLE: "https://schema.org/InStock",
  ULTIMAS: "https://schema.org/LimitedAvailability",
  AGOTADO: "https://schema.org/OutOfStock",
} as const;

export function datosProducto(d: ProductoDetalle, t: TiendaVista) {
  const p = d.producto;
  const url = `${SITIO}/p/${p.slug}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.presentacion ? `${p.nombre} ${p.presentacion}` : p.nombre,
      url,
      sku: String(p.id),
      category: p.categoria,
      ...(p.fotoUrl ? { image: [p.fotoUrl] } : {}),
      ...(d.descripcion ? { description: d.descripcion } : {}),
      offers: {
        "@type": "Offer",
        url,
        price: p.precio,
        priceCurrency: "COP",
        availability: DISPONIBILIDAD[p.disponibilidad],
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@id": `${SITIO}/#tienda`, name: t.nombre },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: SITIO },
        { "@type": "ListItem", position: 2, name: p.categoria, item: `${SITIO}/c/${p.categoriaSlug}` },
        { "@type": "ListItem", position: 3, name: p.nombre, item: url },
      ],
    },
  ];
}
