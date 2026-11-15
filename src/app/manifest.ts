import type { MetadataRoute } from "next";

// L'application installable (PWA) : nom, icônes, couleurs, et ouverture dans sa propre fenêtre
// (sans la barre du navigateur), sur téléphone comme sur ordinateur.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Tomes Club",
    short_name: "Tomes Club",
    description: "Live English classes, calls and rooms — Motivate, Activate, Develop",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#1a1150",
    theme_color: "#7a082e",
    categories: ["education", "social"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
