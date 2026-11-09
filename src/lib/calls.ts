import "server-only";
import { createRoomServiceClient } from "@/lib/livekit";
import { prisma } from "@/lib/prisma";

// Tout ce qui concerne les appels vidéo dans la base de données + LiveKit.

/** Nombre maximum de personnes qu'on peut inviter dans un appel. */
export const MAX_INVITED = 20;

/** La salle LiveKit se ferme 5 minutes après le départ de la dernière personne. */
const EMPTY_TIMEOUT_SECONDS = 5 * 60;

/** On regarde seulement les appels créés pendant les 12 dernières heures. */
const RECENT_CALL_MS = 12 * 60 * 60 * 1000;

/** Un membre qu'on peut appeler. (Pas d'email : on ne montre pas les emails aux autres membres.) */
export type Member = { id: string; name: string };

export type ActiveCall = {
  id: string;
  startedByMe: boolean;
  startedByName: string;
  otherNames: string[];
};

/** Tous les membres sauf moi, triés par nom. */
export function listOtherMembers(currentUserId: string): Promise<Member[]> {
  return prisma.user.findMany({
    where: { id: { not: currentUserId } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Crée un appel : on l'enregistre dans la base, puis on ouvre la salle dans LiveKit.
 * Renvoie null si aucune personne invitée n'est valide.
 */
export async function createCall(
  creatorId: string,
  invitedIds: string[],
): Promise<{ id: string } | null> {
  const uniqueIds = [...new Set(invitedIds)].filter((id) => id !== creatorId).slice(0, MAX_INVITED);

  // On garde seulement les vrais utilisateurs (on ne fait pas confiance au formulaire).
  const invited = await prisma.user.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true },
  });
  if (invited.length === 0) return null;

  const call = await prisma.call.create({
    data: {
      createdById: creatorId,
      participants: {
        create: [{ userId: creatorId }, ...invited.map((user) => ({ userId: user.id }))],
      },
    },
    select: { id: true },
  });

  try {
    await createRoomServiceClient().createRoom({
      name: call.id,
      emptyTimeout: EMPTY_TIMEOUT_SECONDS,
      maxParticipants: invited.length + 1,
    });
  } catch (error) {
    // Le serveur vidéo ne répond pas : on annule l'appel.
    await prisma.call.delete({ where: { id: call.id } });
    throw error;
  }

  return call;
}

/** Un appel, seulement si l'utilisateur fait partie des invités. Sinon null. */
export function getCallForMember(callId: string, userId: string) {
  return prisma.call.findFirst({
    where: { id: callId, participants: { some: { userId } } },
    select: { id: true },
  });
}

/** Les appels en cours où je suis invité (la salle LiveKit est encore ouverte). */
export async function listActiveCalls(userId: string): Promise<ActiveCall[]> {
  const calls = await prisma.call.findMany({
    where: {
      participants: { some: { userId } },
      createdAt: { gte: new Date(Date.now() - RECENT_CALL_MS) },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      createdBy: { select: { id: true, name: true } },
      participants: { select: { user: { select: { id: true, name: true } } } },
    },
  });
  if (calls.length === 0) return [];

  let openRooms: Set<string>;
  try {
    const rooms = await createRoomServiceClient().listRooms(calls.map((call) => call.id));
    openRooms = new Set(rooms.map((room) => room.name));
  } catch (error) {
    console.error("[listActiveCalls] serveur LiveKit indisponible", error);
    return [];
  }

  return calls
    .filter((call) => openRooms.has(call.id))
    .map((call) => ({
      id: call.id,
      startedByMe: call.createdBy.id === userId,
      startedByName: call.createdBy.name,
      otherNames: call.participants
        .map((participant) => participant.user)
        .filter((user) => user.id !== userId)
        .map((user) => user.name),
    }));
}
