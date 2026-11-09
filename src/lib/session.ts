import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

// Lire l'utilisateur connecté (côté SERVEUR).
// ⚠️ Avec Cache Components, un composant qui appelle ces fonctions doit être dans un <Suspense>.

export type CurrentUser = { id: string; name: string; email: string };

/** L'utilisateur connecté, ou null. cache() = lu une seule fois par requête. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, email } = session.user;
  return { id, name, email };
});

/** Comme getCurrentUser, mais envoie vers /login si personne n'est connecté. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
