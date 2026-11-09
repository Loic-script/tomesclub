import "server-only";
import { prisma } from "@/lib/prisma";

// Lire la fiche d'un membre (côté serveur).

/** Le strict nécessaire pour savoir si le formulaire d'accueil est terminé. */
export function getProfileSummary(userId: string) {
  return prisma.profile.findUnique({
    where: { userId },
    select: { firstName: true, completedAt: true },
  });
}
