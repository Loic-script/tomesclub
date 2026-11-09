import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

// Session administrateur, séparée des comptes membres (Better Auth).
// Le cookie contient une date de fin + une signature : impossible à fabriquer sans la clé secrète.

const COOKIE_NAME = "tomes_admin";
const SESSION_SECONDS = 60 * 60 * 24 * 30; // 30 jours

function secretKey(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET est absent du fichier .env");
  return secret;
}

function signature(expiresAt: number): string {
  return createHmac("sha256", secretKey()).update(`admin:${expiresAt}`).digest("base64url");
}

/** Compare deux textes sans donner d'indice sur leur longueur (anti-espionnage du temps). */
function sameText(a: string, b: string): boolean {
  const hash = (value: string) => createHmac("sha256", secretKey()).update(value).digest();
  return timingSafeEqual(hash(a), hash(b));
}

/** Les identifiants tapés sont-ils les bons (ceux du .env) ? */
export function checkAdminCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPassword) return false;
  return sameText(username, expectedUser) && sameText(password, expectedPassword);
}

/** Ouvre la session admin (pose le cookie signé). */
export async function createAdminSession(): Promise<void> {
  const expiresAt = Date.now() + SESSION_SECONDS * 1000;
  (await cookies()).set(COOKIE_NAME, `${expiresAt}.${signature(expiresAt)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_SECONDS,
    path: "/",
  });
}

/** Ferme la session admin. */
export async function destroyAdminSession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

/** La personne est-elle connectée comme admin ? */
export async function isAdmin(): Promise<boolean> {
  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!raw) return false;
  // On compare avec l'heure actuelle : c'est une donnée "au moment de la requête",
  // on le déclare à Next.js pour qu'il ne tente pas de pré-calculer cette page.
  await connection();
  const [expiresRaw, sig] = raw.split(".");
  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now() || !sig) return false;
  const expected = Buffer.from(signature(expiresAt));
  const received = Buffer.from(sig);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/**
 * À appeler en haut des pages admin. Sans session valide, on va droit au
 * formulaire admin (la carte déjà retournée), avec un message d'explication.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/login?admin=1&expired=1");
}
