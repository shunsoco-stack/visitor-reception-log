import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "来客受付・入退館記録",
    short_name: "来客受付",
    description: "あおぞらシステムズの来訪受付デモ",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7f9",
    theme_color: "#147d72",
    lang: "ja",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
