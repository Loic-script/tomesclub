import type { NextConfig } from "next";

// Adresses autorisées en plus de localhost (ex : ouvrir le site depuis un autre PC du réseau).
// On réutilise la liste BETTER_AUTH_TRUSTED_ORIGINS du fichier .env.
const extraHosts = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => URL.canParse(origin))
  .map((origin) => new URL(origin).hostname);

const nextConfig: NextConfig = {
  // En développement, Next.js bloque les autres adresses par sécurité : on autorise celles du .env.
  allowedDevOrigins: extraHosts,
  // La photo du formulaire d'accueil passe par une Server Action : on monte la limite à 4 Mo.
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  // En-têtes de sécurité : pas d'affichage dans un cadre d'un autre site, pas de "devinette" de type,
  // caméra / micro / partage d'écran seulement pour notre site, HTTPS retenu par le navigateur.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), display-capture=(self), geolocation=(), payment=()",
          },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
        ],
      },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
