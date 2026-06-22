import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "피카타워 — 무한 등정 로그라이크",
    short_name: "피카타워",
    description: "PokeAPI 기반 게임보이 스타일 무한 타워 로그라이크",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#182014",
    theme_color: "#182014",
    lang: "ko",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
