"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import type { CreateEventState } from "@/app/admin/events/actions";
import { endEventLive, startEventLive } from "@/lib/event-live";
import { readEventForm } from "@/lib/event-form";
import { setEventRegistration } from "@/lib/event-responses";
import { canProposeEvents, isEventHost, proposeEvent } from "@/lib/member-events";
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

/** "Propose an event" (Leader / Teacher) : gratuit, l'admin doit l'accepter. */
export async function proposeEventAction(_state: CreateEventState, formData: FormData): Promise<CreateEventState> {
  const user = await requireMember();
  if (!(await canProposeEvents(user.id))) return { error: "Only Leaders and Teachers can propose an event." };
  formData.set("kind", "event");
  const input = await readEventForm(formData);
  if (typeof input === "string") return { error: input };
  const eventId = await proposeEvent(user.id, `${user.firstName}`, input);
  refresh();
  return { error: null, eventId };
}

/** L'organisateur lance le direct de son événement (publié). */
export async function startMyEventAction(eventId: string): Promise<void> {
  const user = await requireMember();
  if (!(await isEventHost(eventId, user.id))) return;
  await startEventLive(eventId);
  redirect(`/live/${eventId}`);
}

/** L'organisateur termine le direct (tout le monde sort). */
export async function endMyEventAction(eventId: string): Promise<void> {
  const user = await requireMember();
  if (!(await isEventHost(eventId, user.id))) return;
  await endEventLive(eventId);
  refresh();
}
