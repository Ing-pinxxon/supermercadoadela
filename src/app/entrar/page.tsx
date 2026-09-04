import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Campo, Texto } from "@/components/ui";
import { Boton } from "@/components/boton";
import { COOKIE, puedeEntrar } from "@/lib/sesion";

export const dynamic = "force-dynamic";

async function entrar(datos: FormData) {
  "use server";

  const pin = process.env.APP_PIN;
  if (!pin) redirect("/");

  // Sirve cualquiera de las dos claves; la que se usó decide lo que se ve.
  const escrita = String(datos.get("pin") ?? "");
  if (!puedeEntrar(escrita)) redirect("/entrar?error=1");

  const galletas = await cookies();
  galletas.set(COOKIE, escrita, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // un mes
  });

  redirect("/");
}

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <div className="aparecer">
        <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-marca-400 to-marca-600 text-2xl shadow-lg shadow-marca-500/25">
          🛒
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Supermercado Adela
        </h1>
        <p className="mt-1 text-sm text-gray-500">Escribe la clave.</p>

        <form action={entrar} className="mt-6 space-y-3">
          <Campo etiqueta="Clave">
            <Texto
              name="pin"
              type="password"
              inputMode="numeric"
              autoFocus
              required
            />
          </Campo>
          {error && (
            <p className="pop rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
              Clave incorrecta.
            </p>
          )}
          <Boton type="submit" className="w-full">
            Entrar
          </Boton>
        </form>
      </div>
    </main>
  );
}
