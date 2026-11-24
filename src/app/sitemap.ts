import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

// Les pages publiques seulement (le reste demande d'être connecté).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await siteUrl();
  return [
    { url: `${base}/login`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/register`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/install`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
