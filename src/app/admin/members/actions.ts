"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

/** Supprime un membre et tout ce qui va avec (fiche, sessions, appels) — admin seulement. */
export async function deleteMember(userId: string): Promise<void> {
  // Une Server Action est un point d'entrée public : on revérifie la session admin.
  await requireAdmin();

  await prisma.user.delete({ where: { id: userId } }).catch(() => {
    // Déjà supprimé ? On continue simplement vers la liste.
  });

  redirect("/admin/members");
}
