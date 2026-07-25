import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0E0E0E",
        color: "#F4F2ED",
        fontSize: 22,
        fontWeight: 600,
      }}
    >
      A
    </div>,
    size,
  );
}
