import { deudores, totalCartera } from "@/lib/fiados";
import { etiquetaCorta } from "@/lib/fechas";
import { pesos } from "@/lib/dinero";
import { Tarjeta, Campo, Texto, Vacio, Cifra, Insignia } from "@/components/ui";
import { Boton } from "@/components/boton";
import { TarjetaEnlace } from "@/components/nav";
import { crearDeudor } from "./actions";

export const dynamic = "force-dynamic";

export default async function Fiados() {
  const [lista, cartera] = await Promise.all([deudores(), totalCartera()]);

  const deben = lista.filter((d) => d.saldo > 0);
  const alDia = lista.filter((d) => d.saldo <= 0);

  return (
    <div className="escalonado space-y-5">
      <Cifra
        titulo="Fiado por cobrar"
        valor={pesos(cartera.total)}
        pie={
          cartera.cuantos === 1
            ? "1 persona debe"
            : `${cartera.cuantos} personas deben`
        }
        tono="acento"
      />

      <Tarjeta titulo="Anotar a alguien nuevo">
        <form action={crearDeudor} className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Campo etiqueta="Nombre">
            <Texto name="nombre" required placeholder="Doña Rosa" />
          </Campo>
          <div className="flex items-end">
            <Boton type="submit" className="w-full sm:w-auto">
              Crear
            </Boton>
          </div>
        </form>
      </Tarjeta>

      <Tarjeta titulo={`Deben (${deben.length})`}>
        {deben.length === 0 ? (
          <Vacio>Nadie debe nada. Así da gusto.</Vacio>
        ) : (
          <ul className="divide-y divide-gray-100">
            {deben.map((d) => (
              <li key={d.id}>
                <TarjetaEnlace href={`/fiado/${d.id}`} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{d.nombre}</div>
                      {d.ultima && (
                        <div className="text-xs text-gray-500">
                          último movimiento: {etiquetaCorta(d.ultima)}
                        </div>
                      )}
                    </div>
                    <span className="tabular shrink-0 font-bold text-acento-700">
                      {pesos(d.saldo)}
                    </span>
                  </div>
                </TarjetaEnlace>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      {alDia.length > 0 && (
        <Tarjeta titulo={`Al día (${alDia.length})`}>
          <ul className="divide-y divide-gray-100">
            {alDia.map((d) => (
              <li key={d.id}>
                <TarjetaEnlace href={`/fiado/${d.id}`} className="py-2.5">
                  <div className="flex items-center justify-between gap-3 text-gray-500">
                    <span className="truncate">{d.nombre}</span>
                    {d.saldo < 0 ? (
                      <Insignia tono="marca">
                        {pesos(-d.saldo)} a favor
                      </Insignia>
                    ) : (
                      <Insignia>en cero</Insignia>
                    )}
                  </div>
                </TarjetaEnlace>
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}
    </div>
  );
}
