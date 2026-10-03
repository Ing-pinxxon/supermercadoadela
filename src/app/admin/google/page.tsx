import { exigirAdmin } from "@/lib/sesion";
import { Tarjeta } from "@/components/ui";
import { SITIO } from "@/components/tienda/json-ld";

export const metadata = { title: "Salir en Google" };

/** Un paso de la lista, con su número porque el orden importa. */
function Paso({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-crema-200 text-sm font-bold text-sobre-crema">
        {n}
      </span>
      <div className="min-w-0 space-y-1 text-sm">
        <p className="font-semibold">{titulo}</p>
        <div className="text-tinta-suave">{children}</div>
      </div>
    </li>
  );
}

function Codigo({ children }: { children: React.ReactNode }) {
  return <code className="break-all rounded bg-superficie-2 px-1.5 py-0.5 font-mono text-xs text-tinta">{children}</code>;
}

/**
 * Lo que la página ya hace sola para Google, y lo que el negocio tiene que
 * hacer con su propia cuenta (eso nadie lo puede hacer por él).
 */
export default async function GuiaGoogle() {
  await exigirAdmin("/admin/google");

  return (
    <div className="escalonado space-y-5">
      <div>
        <h1 className="display text-2xl font-black">Salir en Google</h1>
        <p className="text-sm text-tinta-suave">
          Dos cosas distintas: el <b>Perfil de Negocio</b> (la ficha con mapa, fotos y horario que sale al buscar «licores
          San Inés Sur») y <b>Search Console</b> (para que Google lea la tienda en línea). Las dos se hacen con tu cuenta de
          Google y son gratis.
        </p>
      </div>

      <Tarjeta titulo="Lo que la página ya hace sola">
        <ul className="list-disc space-y-1 pl-5 text-sm text-tinta-suave">
          <li>Cada producto y cada categoría tiene su propia dirección, con título y descripción para Google.</li>
          <li>Le dice a Google que es una tienda, con dirección, horario, teléfono y precios en pesos.</li>
          <li>
            Tiene el mapa del sitio en <Codigo>{SITIO}/sitemap.xml</Codigo> y le pide a Google que no muestre la
            administración.
          </li>
          <li>Al compartir el enlace por WhatsApp sale una imagen con el letrero de la tienda (o la foto del producto).</li>
        </ul>
      </Tarjeta>

      <Tarjeta titulo="1. Perfil de Negocio (Google Maps)">
        <ol className="space-y-4">
          <Paso n={1} titulo="Crea el perfil">
            Entra a <Codigo>business.google.com</Codigo> con la cuenta de Google del negocio → «Agregar empresa». Nombre:{" "}
            <b>Supermercado Adela</b>.
          </Paso>
          <Paso n={2} titulo="Categorías">
            Principal: <b>Supermercado</b>. Agrega también <b>Licorería</b> y, si quieres, <b>Tienda de comestibles</b>.
          </Paso>
          <Paso n={3} titulo="Ubicación">
            Sí tiene local que los clientes visitan: pon la dirección exacta (Calle 27A Sur #5-21 Este) y mueve el pin
            hasta la puerta. Marca también que haces entregas y escribe los barrios a los que llevas.
          </Paso>
          <Paso n={4} titulo="Contacto y sitio web">
            Teléfono: el WhatsApp. Sitio web: <Codigo>{SITIO}</Codigo>.
          </Paso>
          <Paso n={5} titulo="Verificación">
            Google pide comprobar que el negocio es tuyo; casi siempre con un video corto donde se vea el letrero de la
            fachada, el interior y algo que demuestre que es tuyo (abrir la caja, la llave del local). Puede tardar unos
            días.
          </Paso>
          <Paso n={6} titulo="Horario y fotos">
            Pon el horario de todos los días y, en diciembre, el horario especial. Sube fotos de buena luz: la fachada
            (para que la reconozcan al llegar), el interior, la nevera y el estante de licores, y los combos. Las fichas
            con fotos reciben muchas más visitas.
          </Paso>
          <Paso n={7} titulo="Pega el enlace en «Datos de la tienda»">
            En Google Maps busca la tienda → Compartir → Copiar enlace, y pégalo en Datos de la tienda → Enlace de Google
            Maps. Así «Cómo llegar» abre la ficha de verdad.
          </Paso>
          <Paso n={8} titulo="Pide reseñas">
            Cuando un cliente quede contento, mándale el enlace para dejar reseña (en el perfil: «Pedir reseñas»). Las
            reseñas son lo que más sube a un negocio en el mapa.
          </Paso>
        </ol>
      </Tarjeta>

      <Tarjeta titulo="2. Search Console (la tienda en línea)">
        <ol className="space-y-4">
          <Paso n={1} titulo="Agrega la página">
            Entra a <Codigo>search.google.com/search-console</Codigo> → Agregar propiedad → «Prefijo de la URL» →{" "}
            <Codigo>{SITIO}</Codigo>.
          </Paso>
          <Paso n={2} titulo="Verifica con la etiqueta HTML">
            Elige «Etiqueta HTML». Google te muestra algo como{" "}
            <Codigo>{'<meta name="google-site-verification" content="AbC123…" />'}</Codigo>. Copia solo lo que va dentro
            de <Codigo>content</Codigo>, pégalo en Datos de la tienda → Google, guarda, espera un minuto y dale «Verificar».
          </Paso>
          <Paso n={3} titulo="Envía el mapa del sitio">
            En el menú «Sitemaps», escribe <Codigo>sitemap.xml</Codigo> y envía. En unos días los productos empiezan a
            salir en Google.
          </Paso>
        </ol>
      </Tarjeta>

      <Tarjeta titulo="Para que suba más">
        <ul className="list-disc space-y-1 pl-5 text-sm text-tinta-suave">
          <li>Ponle foto y descripción a todo lo publicado: Google prefiere páginas completas.</li>
          <li>Mantén precios y stock al día; lo agotado sale como agotado.</li>
          <li>Comparte el enlace de la tienda en tu estado de WhatsApp y en Facebook o Instagram.</li>
          <li>
            Un dominio propio (por ejemplo <Codigo>supermercadoadela.com.co</Codigo>) da más confianza y ayuda, pero no es
            necesario: todo funciona con el enlace de Vercel.
          </li>
        </ul>
      </Tarjeta>
    </div>
  );
}
