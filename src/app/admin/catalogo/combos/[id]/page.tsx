import { notFound } from "next/navigation";
import { apiAdmin, cargar } from "@/lib/api-catalogo";
import { borrarCombo, guardarCombo } from "../../actions";
import { Campo, Monto, Tarjeta, Texto, Volver } from "@/components/ui";
import { Boton } from "@/components/boton";
import { FormResultado } from "@/components/catalogo/form-resultado";
import { ItemsCombo } from "@/components/catalogo/items-combo";
import { SubirFoto } from "@/components/catalogo/subir-foto";
import { BotonBorrar } from "@/components/catalogo/borrar";
import { SinCatalogo } from "@/components/catalogo/sin-catalogo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Combo" };

export default async function FichaCombo({ params }: { params: Promise<{ id: string }> }) {
  const { id: crudo } = await params;
  const nuevo = crudo === "nuevo";
  const id = Number(crudo);
  if (!nuevo && !Number.isInteger(id)) notFound();

  const r = await cargar(() =>
    Promise.all([apiAdmin.productos(), nuevo ? Promise.resolve(null) : apiAdmin.combo(id)]),
  );
  if (!r.datos) {
    if (r.error.includes("no existe")) notFound();
    return <SinCatalogo error={r.error} />;
  }
  const [productos, combo] = r.datos;

  return (
    <div className="escalonado space-y-5">
      <div>
        <Volver href="/admin/catalogo/combos" texto="Combos" />
        <h1 className="display mt-2 text-2xl font-black">{combo?.nombre ?? "Combo nuevo"}</h1>
      </div>

      {combo && (
        <Tarjeta titulo="Foto">
          <SubirFoto id={combo.id} tipo="combo" actual={combo.fotoUrl} />
        </Tarjeta>
      )}

      <Tarjeta titulo="Datos del combo">
        <FormResultado
          action={guardarCombo}
          className="space-y-3"
        >
          <input type="hidden" name="id" value={combo?.id ?? ""} readOnly />
          <input type="hidden" name="version" value={combo?.version ?? ""} readOnly />
          <input type="hidden" name="fotoUrl" value={combo?.fotoUrl ?? ""} readOnly />
          <Campo etiqueta="Nombre">
            <Texto name="nombre" required defaultValue={combo?.nombre} placeholder="Combo novena" maxLength={80} />
          </Campo>
          <Campo etiqueta="Descripción">
            <Texto name="descripcion" defaultValue={combo?.descripcion ?? ""} maxLength={300} />
          </Campo>
          <Campo etiqueta="Productos">
            <ItemsCombo
              opciones={productos.map((p) => ({
                id: p.id,
                nombre: p.nombre,
                presentacion: p.presentacion,
                precio: p.precio,
              }))}
              iniciales={combo?.items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })) ?? []}
            />
          </Campo>
          <Campo etiqueta="Precio del combo" ayuda="Tiene que ser menor o igual a lo que cuesta por separado.">
            <Monto name="precio" defaultValue={combo?.precio || ""} />
          </Campo>
          <div className="space-y-2 rounded-xl bg-superficie-2 p-3 text-sm">
            <label className="flex items-center gap-3">
              <input type="checkbox" name="publicado" defaultChecked={combo?.publicado} className="h-5 w-5 accent-crema-200" />
              En la tienda
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" name="deLaSemana" defaultChecked={combo?.deLaSemana} className="h-5 w-5 accent-crema-200" />
              Combo de la semana (sale en el inicio)
            </label>
          </div>
          <Boton type="submit">{nuevo ? "Crear combo" : "Guardar cambios"}</Boton>
        </FormResultado>
      </Tarjeta>

      {combo && (
        <BotonBorrar accion={borrarCombo.bind(null, combo.id)} volverA="/admin/catalogo/combos" texto="Borrar combo" />
      )}
    </div>
  );
}
