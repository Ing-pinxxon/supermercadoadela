import { ImageResponse } from "next/og";

/**
 * La imagen que sale al compartir el enlace por WhatsApp o redes: el letrero
 * de la tienda. Se genera al construir; no hay imágenes en el repo.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Supermercado Adela: licores y mercado a domicilio en San Inés Sur, Bogotá";

export default function ImagenParaCompartir() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "70px 90px",
          background: "#f3e9d6",
          color: "#2b2118",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 150, fontWeight: 900, color: "#c0392b", letterSpacing: -4, lineHeight: 1 }}>ADELA</div>
        <div style={{ fontSize: 46, color: "#6f5f4b", marginTop: 6 }}>su tienda de siempre</div>
        <div style={{ fontSize: 44, fontWeight: 800, marginTop: 50 }}>Licores y mercado a domicilio</div>
        <div style={{ fontSize: 36, marginTop: 8 }}>San Inés Sur · Bogotá</div>
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            marginTop: 44,
            padding: "10px 28px",
            background: "#ffe08a",
            color: "#c0392b",
            fontSize: 40,
            fontWeight: 800,
            transform: "rotate(-3deg)",
          }}
        >
          Pide por WhatsApp
        </div>
      </div>
    ),
    size,
  );
}
