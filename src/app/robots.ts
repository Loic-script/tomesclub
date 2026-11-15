import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

// Les moteurs de recherche voient les pages publiques, pas l'espace des membres ni l'admin.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: ["/$", "/login", "/register"],
      disallow: [
        "/admin",
        "/api/",
        "/onboarding",
        "/home",
        "/calls",
        "/call",
        "/rooms",
        "/room/",
        "/events",
        "/live/",
        "/members",
        "/notifications",
        "/profile",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
