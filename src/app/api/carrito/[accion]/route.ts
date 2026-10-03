import { NextResponse, type NextRequest } from "next/server";
import { api, ErrorCatalogo, type DatosEntrega, type LineaPedido } from "@/lib/api-catalogo";

/**
 * El carrito del navegador habla con la API del catálogo por aquí: así la
 * dirección de Render queda en el servidor y el navegador solo conoce esta
 * misma página. Nada de esto guarda pedidos: revisa y arma el mensaje.
 */
export async function POST(peticion: NextRequest, { params }: { params: Promise<{ accion: string }> }) {
  const { accion } = await params;
  if (accion !== "revisar" && accion !== "whatsapp") {
    return NextResponse.json({ error: "No existe." }, { status: 404 });
  }

  const cuerpo = (await peticion.json().catch(() => null)) as {
    lineas?: LineaPedido[];
    datos?: DatosEntrega;
  } | null;
  if (!cuerpo || !Array.isArray(cuerpo.lineas) || cuerpo.lineas.length === 0) {
    return NextResponse.json({ error: "El carrito está vacío." }, { status: 400 });
  }
  // Solo lo que la API espera, nada más.
  const lineas = cuerpo.lineas.slice(0, 50).map((l) => ({
    tipo: l.tipo === "COMBO" ? ("COMBO" as const) : ("PRODUCTO" as const),
    id: Number(l.id),
    cantidad: Number(l.cantidad),
    precioVisto: typeof l.precioVisto === "number" ? l.precioVisto : undefined,
  }));

  try {
    const r = accion === "revisar" ? await api.revisar(lineas) : await api.whatsapp(lineas, cuerpo.datos!);
    return NextResponse.json(r, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof ErrorCatalogo) {
      const primero = Object.values(e.errores)[0];
      return NextResponse.json({ error: primero ?? e.message }, { status: e.estado >= 500 ? 503 : e.estado });
    }
    throw e;
  }
}
