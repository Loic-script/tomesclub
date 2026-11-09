import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

/**
 * Pour les pages de l'application : il faut être connecté ET avoir fini
 * le formulaire d'accueil. Sinon → /login ou /onboarding.
 */
export async function requireMember(): Promise<CurrentUser & { firstName: string }> {
  const user = await requireUser();
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { firstName: true, completedAt: true },
  });
  if (!profile?.completedAt) redirect("/onboarding");
  return { ...user, firstName: profile.firstName };
}
