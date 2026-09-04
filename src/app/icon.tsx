import { ImageResponse } from "next/og";

/** El icono de la app. Se genera al construir: no hay imágenes en el repo. */
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icono() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #16a34a 0%, #166534 100%)",
          color: "white",
          fontSize: 300,
          fontWeight: 700,
        }}
      >
        A
      </div>
    ),
    size,
  );
}
