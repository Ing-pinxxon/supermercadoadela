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
          background: "linear-gradient(135deg, #16a34a 0%, #166534 100%)",
          color: "white",
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
