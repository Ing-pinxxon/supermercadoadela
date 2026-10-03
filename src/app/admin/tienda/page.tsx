import { apiAdmin, cargar } from "@/lib/api-catalogo";
import { exigirAdmin } from "@/lib/sesion";
import { guardarTienda } from "../catalogo/actions";
import { Campo, Monto, Tarjeta, Texto } from "@/components/ui";
import { Boton } from "@/components/boton";
import { FormResultado } from "@/components/catalogo/form-resultado";
import { SinCatalogo } from "@/components/catalogo/sin-catalogo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Datos de la tienda" };

/** «573147167595» → «314 716 7595», como lo escribe la gente. */
function whatsappLegible(digitos: string) {
  const local = digitos.startsWith("57") && digitos.length === 12 ? digitos.slice(2) : digitos;
  return local.length === 10 ? `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}` : digitos;
}

export default async function DatosTienda() {
  await exigirAdmin("/admin/tienda");
  const { datos: t, error } = await cargar(() => apiAdmin.tienda());
  if (!t) return <SinCatalogo error={error} />;

  return (
    <div className="escalonado space-y-5">
      <div>
        <h1 className="display text-2xl font-black">Datos de la tienda</h1>
        <p className="text-sm text-tinta-suave">
          Salen en la tienda, en el mensaje de WhatsApp y en lo que Google muestra del negocio.
        </p>
      </div>

      <FormResultado action={guardarTienda} className="space-y-5">
        <input type="hidden" name="version" value={t.version} readOnly />

        <Tarjeta titulo="El negocio">
          <div className="space-y-3">
            <Campo etiqueta="Nombre">
              <Texto name="nombre" required defaultValue={t.nombre} />
            </Campo>
            <Campo etiqueta="WhatsApp" ayuda="A este número llegan los pedidos.">
              <Texto name="whatsapp" required inputMode="tel" defaultValue={whatsappLegible(t.whatsapp)} />
            </Campo>
            <Campo etiqueta="Dirección">
              <Texto name="direccion" required defaultValue={t.direccion} />
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo etiqueta="Barrio">
                <Texto name="barrio" defaultValue={t.barrio ?? ""} />
              </Campo>
              <Campo etiqueta="Ciudad">
                <Texto name="ciudad" required defaultValue={t.ciudad} />
              </Campo>
            </div>
            <Campo
              etiqueta="Enlace de Google Maps"
              ayuda="En Google Maps: busca la tienda → Compartir → Copiar enlace. Sirve para «Cómo llegar»."
            >
              <Texto name="mapsUrl" inputMode="url" defaultValue={t.mapsUrl ?? ""} placeholder="https://maps.app.goo.gl/…" />
            </Campo>
          </div>
        </Tarjeta>

        <Tarjeta titulo="Horario">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Campo etiqueta="Abre">
                <Texto name="abre" type="time" required defaultValue={t.abre} />
              </Campo>
              <Campo etiqueta="Cierra">
                <Texto name="cierra" type="time" required defaultValue={t.cierra} />
              </Campo>
            </div>
            <Campo etiqueta="Nota del horario">
              <Texto name="notaHorario" defaultValue={t.notaHorario ?? ""} maxLength={300} />
            </Campo>
          </div>
        </Tarjeta>

        <Tarjeta titulo="Pedidos">
          <div className="space-y-3">
            <Campo etiqueta="Valor del domicilio" ayuda="Vacío = se confirma por WhatsApp en cada pedido.">
              <Monto name="valorDomicilio" defaultValue={t.valorDomicilio ?? ""} placeholder="Se confirma por WhatsApp" />
            </Campo>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="aceptaTransferencia"
                defaultChecked={t.aceptaTransferencia}
                className="h-5 w-5 accent-crema-200"
              />
              Recibimos Nequi o transferencia
            </label>
          </div>
        </Tarjeta>

        <Tarjeta titulo="Temporada">
          <div className="space-y-3">
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" name="temporada" defaultChecked={t.temporada} className="h-5 w-5 accent-crema-200" />
              Mostrar el banner de temporada en el inicio
            </label>
            <Campo etiqueta="Título del banner">
              <Texto name="bannerTitulo" defaultValue={t.bannerTitulo ?? ""} maxLength={60} />
            </Campo>
            <Campo etiqueta="Texto del banner">
              <Texto name="bannerTexto" defaultValue={t.bannerTexto ?? ""} maxLength={140} />
            </Campo>
            <Campo etiqueta="Sello" ayuda="El circulito: «hasta el 6 de ene.». Vacío = sin sello.">
              <Texto name="bannerSello" defaultValue={t.bannerSello ?? ""} maxLength={30} />
            </Campo>
          </div>
        </Tarjeta>

        <Tarjeta titulo="Google">
          <Campo
            etiqueta="Código de verificación de Search Console"
            ayuda="Solo el código que va en content=&quot;…&quot;. La guía está en «Google»."
          >
            <Texto name="googleVerificacion" defaultValue={t.googleVerificacion ?? ""} maxLength={100} />
          </Campo>
        </Tarjeta>

        <Boton type="submit">Guardar datos</Boton>
      </FormResultado>
    </div>
  );
}
