"use server";

import { redirect } from "next/navigation";
import { callLimitMessage, createCall } from "@/lib/calls";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";

// Les actions de la page Calls.

/** Appeler directement un membre choisi dans la liste. */
export async function startDirectCall(targetId: string): Promise<{ error: string } | void> {
  const user = await requireMember();

  // Pas d'appels en boucle : 20 minutes entre deux appels vers la même personne, 5 par jour au plus.
  const limit = await callLimitMessage(user.id, targetId);
  if (limit) return { error: limit };

  let callId: string;
  try {
    const call = await createCall(user.id, [targetId]);
    if (!call) return { error: "This member is not available." };
    callId = call.id;
  } catch (error) {
    console.error("[startDirectCall]", error);
    return { error: "Could not start the call. Is the video server running?" };
  }

  redirect(`/call/${callId}`);
}

/** Les lignes d'attente plus vieilles que ça sont considérées abandonnées. */
const STALE_QUEUE_MS = 5 * 60 * 1000;

/**
 * "Practice with a random partner" : si quelqu'un d'autre attend, on crée
 * l'appel tout de suite ; sinon on se met dans la file et le navigateur
 * demandera régulièrement si un partenaire est arrivé.
 */
export async function startRandomSearch(): Promise<{ callId: string | null; error?: string }> {
  const user = await requireMember();

  // On nettoie les attentes abandonnées.
  await prisma.matchQueue.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - STALE_QUEUE_MS) } },
  });

  // Quelqu'un attend ? On le retire de la file (une seule personne peut le prendre,
  // grâce à FOR UPDATE SKIP LOCKED) et on crée l'appel.
  const rows = await prisma.$queryRaw<{ userId: string }[]>`
    DELETE FROM match_queue WHERE "userId" = (
      SELECT "userId" FROM match_queue WHERE "userId" <> ${user.id}
      ORDER BY "createdAt" ASC LIMIT 1 FOR UPDATE SKIP LOCKED
    ) RETURNING "userId"`;
  const partnerId = rows[0]?.userId;

  if (partnerId) {
    await prisma.matchQueue.deleteMany({ where: { userId: user.id } });
    try {
      const call = await createCall(user.id, [partnerId]);
      if (call) return { callId: call.id };
    } catch (error) {
      console.error("[startRandomSearch]", error);
      return { callId: null, error: "Could not start the call. Is the video server running?" };
    }
  }

  // Personne pour l'instant : on attend dans la file.
  await prisma.matchQueue.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: { createdAt: new Date() },
  });
  return { callId: null };
}

/** Bouton "Cancel" de la recherche. */
export async function cancelRandomSearch(): Promise<void> {
  const user = await requireMember();
  await prisma.matchQueue.deleteMany({ where: { userId: user.id } });
}
