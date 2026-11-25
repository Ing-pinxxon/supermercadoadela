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
          background: "#07070a",
          backgroundImage:
            "radial-gradient(circle at 78% 18%, rgba(62,199,255,.28), transparent 46%), radial-gradient(circle at 12% 92%, rgba(255,59,92,.26), transparent 44%), radial-gradient(circle at 90% 90%, rgba(255,225,77,.18), transparent 40%)",
          color: "#f5f5f7",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 160,
            fontWeight: 900,
            color: "#fff8d6",
            letterSpacing: -2,
            lineHeight: 1,
            textShadow: "0 0 10px #ffe14d, 0 0 28px #ffcc00, 0 0 60px rgba(255,170,0,.6)",
          }}
        >
          ADELA
        </div>
        <div style={{ fontSize: 34, color: "#bfeeff", marginTop: 12, letterSpacing: 6, textShadow: "0 0 14px #3ec7ff" }}>
          TU TIENDA Y LICORERA DE CONFIANZA
        </div>
        <div style={{ fontSize: 50, fontWeight: 800, marginTop: 54 }}>Licores y mercado a domicilio</div>
        <div style={{ fontSize: 36, marginTop: 8, color: "#babdc7" }}>San Inés Sur · Bogotá</div>
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            marginTop: 44,
            padding: "12px 30px",
            border: "3px solid #8dffc0",
            borderRadius: 18,
            color: "#e3ffef",
            fontSize: 40,
            fontWeight: 800,
            boxShadow: "0 0 18px #39ff88",
            textShadow: "0 0 12px #39ff88",
          }}
        >
          Pide por WhatsApp
        </div>
      </div>
    ),
    size,
  );
}
