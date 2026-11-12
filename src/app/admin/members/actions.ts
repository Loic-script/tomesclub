"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { answerRoleRequest } from "@/lib/user-roles";

/** Supprime un membre et tout ce qui va avec (fiche, sessions, appels) — admin seulement. */
export async function deleteMember(userId: string): Promise<void> {
  // Une Server Action est un point d'entrée public : on revérifie la session admin.
  await requireAdmin();

  await prisma.user.delete({ where: { id: userId } }).catch(() => {
    // Déjà supprimé ? On continue simplement vers la liste.
  });

  redirect("/admin/members");
}

/** Accepte la demande Leader / Teacher d'un membre — admin seulement. */
export async function acceptRoleAction(userId: string): Promise<void> {
  await requireAdmin();
  await answerRoleRequest(userId, true);
  refresh();
}

/** Refuse la demande : le membre reste Member — admin seulement. */
export async function refuseRoleAction(userId: string): Promise<void> {
  await requireAdmin();
  await answerRoleRequest(userId, false);
  refresh();
}

/** Remet un Leader / Teacher comme simple Member — admin seulement. */
export async function resetRoleAction(userId: string): Promise<void> {
  await requireAdmin();
  await prisma.profile.updateMany({ where: { userId }, data: { role: "member", roleRequest: null } });
  refresh();
}
