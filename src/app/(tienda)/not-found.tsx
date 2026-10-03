import Link from "next/link";

export default function NoEncontrado() {
  return (
    <div className="px-6 py-16 text-center">
      <p className="font-mano text-2xl text-navidad">¡Uy, vecino!</p>
      <h1 className="mt-1 text-xl font-black uppercase">Eso ya no está en la tienda</h1>
      <p className="mt-2 text-cafe-suave">Puede que se haya acabado o que cambiara de nombre.</p>
      <Link href="/" className="mt-6 inline-block rounded-md bg-pino px-5 py-3 font-bold text-maiz shadow-[2px_2px_0_var(--color-pino-osc)]">
        Ver todo lo que hay
      </Link>
    </div>
  );
}
