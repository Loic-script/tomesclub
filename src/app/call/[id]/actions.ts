"use server";

import { endCallRoom, getCallForMember, markCallStarted, stopUnansweredCall } from "@/lib/calls";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

/** Appelée quand les 5 minutes de l appel sont finies : les deux personnes sortent. */
export async function endCallForTime(callId: string): Promise<void> {
  const user = await requireUser();
  // Seule une personne de l appel peut le terminer.
  const call = await getCallForMember(callId, user.id);
  if (!call) return;
  await prisma.call.updateMany({ where: { id: call.id, endedAt: null }, data: { endedAt: new Date() } });
  await endCallRoom(call.id);
}

/** Les deux sont là : le compte à rebours démarre, l'appel compte dans les limites. */
export async function startCallCountdown(callId: string): Promise<void> {
  const user = await requireUser();
  await markCallStarted(callId, user.id);
}

/** On raccroche avant le début du compte à rebours : l'appel se coupe chez l'autre aussi. */
export async function hangUpBeforeStart(callId: string): Promise<void> {
  const user = await requireUser();
  await stopUnansweredCall(callId, user.id);
}
