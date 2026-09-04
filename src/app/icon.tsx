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
          background: "#234a21",
          color: "#fbf1cd",
          fontFamily: "Georgia, serif",
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
