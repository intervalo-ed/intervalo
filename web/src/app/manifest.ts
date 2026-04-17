import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Intervalo - Repaso Espaciado",
    short_name: "Intervalo",
    description: "Sistema de repaso adaptativo con repetición espaciada",
    start_url: "/",
    display: "standalone",
    background_color: "#1E1E34",
    theme_color: "#1E1E34",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  }
}
