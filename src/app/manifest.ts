import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SIVA",
    short_name: "SIVA",
    description: "Tu día de un vistazo: finanzas, entrenamiento y lo que venga.",
    lang: "es-AR",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f2f3f7",
    theme_color: "#f2f3f7",
    icons: [
      { src: "/iconos/siva-192.png", sizes: "192x192", type: "image/png" },
      { src: "/iconos/siva-512.png", sizes: "512x512", type: "image/png" },
      { src: "/iconos/siva-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
