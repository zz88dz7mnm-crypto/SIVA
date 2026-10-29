import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SIVA",
    short_name: "SIVA",
    description: "Tu día de un vistazo: hábitos, agenda y lo que venga.",
    lang: "es-AR",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#090b0f",
    theme_color: "#090b0f",
    icons: [
      { src: "/iconos/siva-192.png", sizes: "192x192", type: "image/png" },
      { src: "/iconos/siva-512.png", sizes: "512x512", type: "image/png" },
      { src: "/iconos/siva-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
