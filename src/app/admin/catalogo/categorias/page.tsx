import { apiAdmin, cargar, type CategoriaAdmin } from "@/lib/api-catalogo";
import { borrarCategoria, guardarCategoria } from "../actions";
import { ICONOS } from "@/lib/iconos";
import { Campo, Seleccion, Tarjeta, Texto } from "@/components/ui";
import { Boton } from "@/components/boton";
import { FormResultado } from "@/components/catalogo/form-resultado";
import { BotonBorrar } from "@/components/catalogo/borrar";
import { SinCatalogo } from "@/components/catalogo/sin-catalogo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categorías" };

function Campos({ c }: { c?: CategoriaAdmin }) {
  return (
    <>
      <input type="hidden" name="id" value={c?.id ?? ""} readOnly />
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Campo etiqueta="Nombre">
          <Texto name="nombre" required defaultValue={c?.nombre} maxLength={60} />
        </Campo>
        <Campo etiqueta="Orden" ayuda="Menor sale primero.">
          <Texto name="orden" inputMode="numeric" defaultValue={c?.orden ?? ""} className="sm:w-24" />
        </Campo>
      </div>
      <Campo etiqueta="Dibujo del estante">
        <Seleccion name="icono" defaultValue={c?.icono ?? "todo"}>
          {ICONOS.map((i) => (
            <option key={i.clave} value={i.clave}>
              {i.nombre}
            </option>
          ))}
        </Seleccion>
      </Campo>
      <Campo etiqueta="Descripción" ayuda="Una frase para Google: qué hay y que llevan a domicilio.">
        <Texto name="descripcion" defaultValue={c?.descripcion ?? ""} maxLength={300} />
      </Campo>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="visible" defaultChecked={c?.visible ?? true} className="h-5 w-5 accent-crema-200" />
          Se ve en la tienda
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="esLicor" defaultChecked={c?.esLicor ?? false} className="h-5 w-5 accent-crema-200" />
          Es licor (pide mayoría de edad)
        </label>
      </div>
    </>
  );
}

export default async function Categorias() {
  const { datos: categorias, error } = await cargar(() => apiAdmin.categorias());
  if (!categorias) return <SinCatalogo error={error} />;

  return (
    <div className="escalonado space-y-5">
      <div>
        <h1 className="display text-2xl font-black">Categorías</h1>
        <p className="text-sm text-tinta-suave">Los estantes de la tienda, en el orden en que salen.</p>
      </div>

      <Tarjeta titulo="Nueva categoría">
        <FormResultado action={guardarCategoria} className="space-y-3">
          <Campos />
          <Boton type="submit">Crear categoría</Boton>
        </FormResultado>
      </Tarjeta>

      <Tarjeta titulo={`Categorías (${categorias.length})`}>
        <ul className="divide-y divide-borde">
          {categorias.map((c) => (
            <li key={c.id} className={`py-2 ${c.visible ? "" : "opacity-60"}`}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-1">
                  <span>
                    <span className="font-medium">{c.nombre}</span>{" "}
                    <span className="text-xs text-tinta-suave">
                      · {c.productos} producto{c.productos === 1 ? "" : "s"}
                      {c.esLicor && " · licor"}
                      {!c.visible && " · oculta"}
                    </span>
                  </span>
                  <span className="text-xs text-crema-200 transition group-open:rotate-90">›</span>
                </summary>
                <FormResultado action={guardarCategoria} className="mt-2 space-y-3 rounded-xl bg-superficie-2 p-3">
                  <Campos c={c} />
                  <div className="flex flex-wrap items-start gap-3">
                    <Boton type="submit">Guardar</Boton>
                  </div>
                </FormResultado>
                {c.productos === 0 && (
                  <div className="mt-2">
                    <BotonBorrar
                      accion={borrarCategoria.bind(null, c.id)}
                      volverA="/admin/catalogo/categorias"
                      texto="Borrar categoría"
                    />
                  </div>
                )}
              </details>
            </li>
          ))}
        </ul>
      </Tarjeta>
    </div>
  );
}
