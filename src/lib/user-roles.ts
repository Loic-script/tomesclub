import "server-only";
import { notifyMembers } from "@/lib/notifications";
import { userTypeLabel } from "@/lib/onboarding-options";
import { prisma } from "@/lib/prisma";

// Le type d'utilisateur (Member / Leader / Teacher).
// Tout le monde commence "member". Une demande Leader / Teacher attend la réponse de l'admin.

/** L'admin accepte ou refuse la demande. Le membre reçoit une notification. */
export async function answerRoleRequest(userId: string, accept: boolean): Promise<void> {
  const profile = await prisma.profile.findUnique({ where: { userId }, select: { roleRequest: true } });
  const request = profile?.roleRequest;
  if (!request) return;

  await prisma.profile.update({
    where: { userId },
    data: accept ? { role: request, roleRequest: null } : { roleRequest: null },
  });

  const label = userTypeLabel(request);
  await notifyMembers([userId], {
    kind: "announcement",
    title: accept ? `You are now a ${label}! 🎉` : `Your ${label} request was not accepted`,
    body: accept
      ? "The admin confirmed your status."
      : "You stay a Member. Write to the admin if you have a question.",
    link: "/profile",
  });
}
