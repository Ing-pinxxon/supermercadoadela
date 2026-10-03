import { notFound } from "next/navigation";
import { apiAdmin, cargar, type ProductoAdmin } from "@/lib/api-catalogo";
import { borrarProducto, guardarProducto } from "../actions";
import { Campo, Insignia, Monto, Seleccion, Tarjeta, Texto, Volver } from "@/components/ui";
import { Boton } from "@/components/boton";
import { FormResultado } from "@/components/catalogo/form-resultado";
import { SubirFoto } from "@/components/catalogo/subir-foto";
import { ElegirRelacionados } from "@/components/catalogo/elegir-relacionados";
import { BotonBorrar } from "@/components/catalogo/borrar";
import { SinCatalogo } from "@/components/catalogo/sin-catalogo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Producto" };

const claseArea =
  "w-full rounded-xl border border-transparent bg-crema-50 px-3 py-2.5 text-verde-900 outline-none transition focus:border-crema-300 focus:ring-2 focus:ring-crema-200/50";

export default async function FichaProducto({ params }: { params: Promise<{ id: string }> }) {
  const { id: crudo } = await params;
  const nuevo = crudo === "nuevo";
  const id = Number(crudo);
  if (!nuevo && !Number.isInteger(id)) notFound();

  const r = await cargar(() =>
    Promise.all([
      apiAdmin.categorias(),
      apiAdmin.productos(),
      nuevo ? Promise.resolve(null) : apiAdmin.producto(id),
      nuevo ? Promise.resolve([]) : apiAdmin.historial(id),
    ]),
  );
  if (!r.datos) {
    if (r.error.includes("no existe")) notFound();
    return <SinCatalogo error={r.error} />;
  }
  const [categorias, todos, producto, historial] = r.datos;
  const p: Partial<ProductoAdmin> = producto ?? { publicado: false, destacado: false };

  return (
    <div className="escalonado space-y-5">
      <div>
        <Volver href="/admin/catalogo" texto="Catálogo" />
        <h1 className="display mt-2 text-2xl font-black">{nuevo ? "Producto nuevo" : p.nombre}</h1>
        {producto && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Insignia tono={producto.publicado ? "marca" : "gris"}>
              {producto.publicado ? "En la tienda" : "Oculto"}
            </Insignia>
            {producto.disponibilidad === "AGOTADO" && <Insignia tono="rojo">Agotado</Insignia>}
            {producto.disponibilidad === "ULTIMAS" && <Insignia>Últimas unidades</Insignia>}
            {producto.publicado && (
              <a href={`/p/${producto.slug}`} className="text-xs text-tinta-suave underline">
                Ver en la tienda ↗
              </a>
            )}
          </div>
        )}
      </div>

      {producto && (
        <Tarjeta titulo="Foto">
          <SubirFoto id={producto.id} tipo="producto" actual={producto.fotoUrl} />
        </Tarjeta>
      )}

      <Tarjeta titulo={nuevo ? "Datos" : "Datos del producto"}>
        <FormResultado
          action={guardarProducto}
          className="space-y-3"
        >
          <input type="hidden" name="id" value={producto?.id ?? ""} readOnly />
          <input type="hidden" name="version" value={producto?.version ?? ""} readOnly />
          <input type="hidden" name="fotoUrl" value={producto?.fotoUrl ?? ""} readOnly />

          <Campo etiqueta="Nombre" ayuda="Como lo busca la gente: «Aguardiente Antioqueño sin azúcar».">
            <Texto name="nombre" required defaultValue={p.nombre} maxLength={120} />
          </Campo>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo etiqueta="Presentación" ayuda="«Botella 750 ml», «Six pack · lata 330 ml».">
              <Texto name="presentacion" defaultValue={p.presentacion ?? ""} maxLength={60} />
            </Campo>
            <Campo etiqueta="Categoría">
              <Seleccion name="categoriaId" required defaultValue={p.categoriaId ?? ""}>
                <option value="" disabled>
                  Elige…
                </option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </Seleccion>
            </Campo>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Precio">
              <Monto name="precio" defaultValue={p.precio || ""} />
            </Campo>
            <Campo etiqueta="Precio de antes" ayuda="Solo para ofertas: sale tachado.">
              <Monto name="precioAntes" defaultValue={p.precioAntes ?? ""} />
            </Campo>
          </div>
          <Campo
            etiqueta="Stock"
            ayuda="Unidades que hay. Vacío = no se lleva la cuenta (siempre disponible). Con 5 o menos dice «Últimas unidades»."
          >
            <Texto name="stock" inputMode="numeric" pattern="\d*" defaultValue={p.stock ?? ""} />
          </Campo>
          <Campo etiqueta="Descripción" ayuda="Lo que diría un vendedor. También lo lee Google.">
            <textarea name="descripcion" rows={3} defaultValue={p.descripcion ?? ""} maxLength={2000} className={claseArea} />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Grados de alcohol" ayuda="Opcional: «29».">
              <Texto name="grados" inputMode="decimal" defaultValue={p.grados ?? ""} />
            </Campo>
            <Campo etiqueta="Origen" ayuda="Opcional: «Antioquia».">
              <Texto name="origen" defaultValue={p.origen ?? ""} maxLength={60} />
            </Campo>
          </div>
          <div className="space-y-2 rounded-xl bg-superficie-2 p-3">
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" name="publicado" defaultChecked={p.publicado} className="h-5 w-5 accent-crema-200" />
              En la tienda (si no, queda oculto)
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" name="destacado" defaultChecked={p.destacado} className="h-5 w-5 accent-crema-200" />
              Destacado en «Lo más pedido»
            </label>
          </div>
          <Boton type="submit">{nuevo ? "Crear producto" : "Guardar cambios"}</Boton>
          {nuevo && <p className="text-xs text-tinta-suave">La foto se agrega después de crearlo.</p>}
        </FormResultado>
      </Tarjeta>

      {producto && (
        <Tarjeta titulo="Va bien con…">
          <p className="mb-2 text-xs text-tinta-suave">
            Hasta tres productos que se sugieren en la ficha de este (hielo, gaseosa, vasos…).
          </p>
          <ElegirRelacionados
            id={producto.id}
            elegidos={producto.relacionados}
            opciones={todos
              .filter((o) => o.id !== producto.id)
              .map((o) => ({ id: o.id, nombre: o.nombre, presentacion: o.presentacion }))}
          />
        </Tarjeta>
      )}

      {historial.length > 0 && (
        <Tarjeta titulo="Historial">
          <ul className="divide-y divide-borde text-sm">
            {historial.map((c, i) => (
              <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-3 py-2">
                <span>
                  <span className="font-medium">{c.campo}</span>
                  {c.antes !== null && c.campo !== "creado" ? (
                    <>
                      : {c.antes} → <span className="font-medium">{c.despues}</span>
                    </>
                  ) : null}
                </span>
                <span className="text-xs text-tinta-suave">
                  {c.quien} ·{" "}
                  {new Date(c.cuando).toLocaleString("es-CO", {
                    timeZone: "America/Bogota",
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}

      {producto && (
        <BotonBorrar
          accion={borrarProducto.bind(null, producto.id)}
          volverA="/admin/catalogo"
          texto="Borrar producto"
        />
      )}
    </div>
  );
}
