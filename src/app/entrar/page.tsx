import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Campo, Texto } from "@/components/ui";
import { Boton } from "@/components/boton";
import { COOKIE, puedeEntrar, rolDe, rutaSegura } from "@/lib/sesion";

export const dynamic = "force-dynamic";

async function entrar(datos: FormData) {
  "use server";

  const pin = process.env.APP_PIN;
  if (!pin) redirect("/");

  const volver = rutaSegura(String(datos.get("volver") ?? "")) ?? "/";
  const pideAdmin = String(datos.get("admin") ?? "") === "1";
  const deVuelta = (error: string) =>
    `/entrar?error=${error}${pideAdmin ? "&admin=1" : ""}&volver=${encodeURIComponent(volver)}`;

  // Sirve cualquiera de las dos claves; la que se usó decide lo que se ve.
  const escrita = String(datos.get("pin") ?? "");
  if (!puedeEntrar(escrita)) redirect(deVuelta("1"));

  // Si venía a una pantalla de administrador, la clave de la tienda no basta:
  // se lo dice en vez de dejarlo entrar y rebotarlo otra vez.
  if (pideAdmin && rolDe(escrita) !== "admin") redirect(deVuelta("admin"));

  const galletas = await cookies();
  galletas.set(COOKIE, escrita, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // un mes
  });

  redirect(volver);
}

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; admin?: string; volver?: string }>;
}) {
  const { error, admin, volver } = await searchParams;
  const pideAdmin = admin === "1";
  const destino = rutaSegura(volver) ?? "/";

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <div className="aparecer">
        <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-crema-200 text-2xl shadow-lg shadow-verde-950/30">
          🛒
        </div>
        <h1 className="display text-3xl font-black">
          Supermercado Adela
        </h1>
        {pideAdmin ? (
          <p className="mt-1 text-sm text-tinta-suave">
            Esa pantalla es del administrador. Escribe su clave para seguir.
          </p>
        ) : (
          <p className="mt-1 text-sm text-tinta-suave">Escribe la clave.</p>
        )}

        <form action={entrar} className="mt-6 space-y-3">
          <input type="hidden" name="volver" value={destino} />
          {pideAdmin && <input type="hidden" name="admin" value="1" />}
          <Campo etiqueta={pideAdmin ? "Clave de administrador" : "Clave"}>
            <Texto
              name="pin"
              type="password"
              inputMode="numeric"
              autoFocus
              required
            />
          </Campo>
          {error === "1" && (
            <p className="pop rounded-xl bg-rojo/15 px-3 py-2 text-sm text-rojo">
              Clave incorrecta.
            </p>
          )}
          {error === "admin" && (
            <p className="pop rounded-xl bg-rojo/15 px-3 py-2 text-sm text-rojo">
              Esa es la clave de la tienda. Para esta pantalla hace falta la
              del administrador.
            </p>
          )}
          <Boton type="submit" className="w-full">
            Entrar
          </Boton>
        </form>

        {pideAdmin && (
          <p className="mt-4 text-center text-xs text-tinta-tenue">
            <a href="/caja" className="hover:underline">
              Volver a la caja sin cambiar de clave
            </a>
          </p>
        )}
      </div>
    </main>
  );
}
