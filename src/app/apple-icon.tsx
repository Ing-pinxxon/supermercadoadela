import { ImageResponse } from "next/og";

/** El icono para iOS, que lo pide aparte y más pequeño. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function IconoApple() {
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
          fontSize: 110,
          fontWeight: 700,
        }}
      >
        A
      </div>
    ),
    size,
  );
}
