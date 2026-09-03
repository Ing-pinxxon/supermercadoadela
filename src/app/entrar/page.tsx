import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Campo, Texto } from "@/components/ui";
import { Boton } from "@/components/boton";

export const dynamic = "force-dynamic";

async function entrar(datos: FormData) {
  "use server";

  const pin = process.env.APP_PIN;
  if (!pin) redirect("/");

  if (String(datos.get("pin") ?? "") !== pin) {
    redirect("/entrar?error=1");
  }

  const galletas = await cookies();
  galletas.set("adela_pin", pin, {
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
      <h1 className="text-2xl font-bold">Supermercado Adela</h1>
      <p className="mt-1 text-sm text-gray-500">Escribe la clave del negocio.</p>

      <form action={entrar} className="mt-6 space-y-3">
        <Campo etiqueta="Clave">
          <Texto name="pin" type="password" autoFocus required />
        </Campo>
        {error && (
          <p className="text-sm text-red-600">Clave incorrecta.</p>
        )}
        <Boton type="submit" className="w-full">
          Entrar
        </Boton>
      </form>
    </main>
  );
}
