import Link from "next/link";

export default function NoEncontrado() {
  return (
    <section className="ne-seccion" style={{ textAlign: "center", paddingBottom: 40 }}>
      <p className="neon-r" style={{ font: "400 44px/1 var(--guion)", margin: 0 }}>
        ¡Uy, vecino!
      </p>
      <h1 style={{ font: "800 30px/1.05 var(--cond)", textTransform: "uppercase", margin: "10px 0 0" }}>
        Eso ya no está en la tienda
      </h1>
      <p style={{ color: "var(--suave)", margin: "8px 0 22px" }}>Puede que se haya acabado o que cambiara de nombre.</p>
      <Link href="/" className="ne-btn-prim" style={{ display: "inline-flex", padding: "0 24px" }}>
        Ver todo lo que hay
      </Link>
    </section>
  );
}
