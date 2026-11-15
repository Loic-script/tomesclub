import { headers } from "next/headers";

/**
 * L'adresse du site (ex : https://tomesclub.com), lue dans la requête :
 * elle reste juste même si on change de nom de domaine.
 */
export async function siteUrl(): Promise<string> {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost:3000";
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  const proto = list.get("x-forwarded-proto") ?? (local ? "http" : "https");
  return `${proto}://${host}`;
}
