"use server";

import { setEventRegistration } from "@/lib/event-responses";
import { isOwnProof } from "@/lib/payment-proofs";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";

/**
 * Bouton "Register" : s'inscrire (on = true) ou se désinscrire.
 * Événement payant : il faut la référence MVola ou une capture d'écran du paiement.
 * Rend un message d'erreur, ou null si tout va bien.
 */
export async function registerToEvent(
  eventId: string,
  on: boolean,
  payment?: { ref?: string | null; proofId?: string | null },
): Promise<string | null> {
  const user = await requireMember();
  if (on !== true) {
    await setEventRegistration(user.id, eventId, false);
    return null;
  }

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { isPaid: true } });
  if (!event?.isPaid) {
    await setEventRegistration(user.id, eventId, true);
    return null;
  }

  const ref = typeof payment?.ref === "string" ? payment.ref.trim().slice(0, 60) : "";
  const proofId =
    typeof payment?.proofId === "string" && (await isOwnProof(payment.proofId, user.id)) ? payment.proofId : null;
  if (ref.length < 4 && !proofId) {
    return "Please pay with MVola, then give the reference or a screenshot of the payment.";
  }
  await setEventRegistration(user.id, eventId, true, { ref: ref || null, proofId });
  return null;
}
