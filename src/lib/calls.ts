import "server-only";
import { connection } from "next/server";
import { createRoomServiceClient } from "@/lib/livekit";
import { notifyAdmin } from "@/lib/admin-notifications";
import { notifyMembers } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

// Tout ce qui concerne les appels vidéo dans la base de données + LiveKit.

/** Nombre maximum de personnes qu'on peut inviter dans un appel. */
export const MAX_INVITED = 20;

/** La salle LiveKit se ferme 5 minutes après le départ de la dernière personne. */
const EMPTY_TIMEOUT_SECONDS = 5 * 60;

/** On regarde seulement les appels créés pendant les 12 dernières heures. */
const RECENT_CALL_MS = 12 * 60 * 60 * 1000;

/** Un membre qu'on peut appeler. (Pas d'email : on ne montre pas les emails aux autres membres.) */
export type CallableMember = {
  id: string;
  firstName: string;
  lastName: string;
  englishLevel: string | null;
  city: string | null;
  country: string | null;
  hasPhoto: boolean;
};

export type ActiveCall = {
  id: string;
  startedByMe: boolean;
  startedByName: string;
  otherNames: string[];
};

/** Tous les membres (fiche terminée) sauf moi, triés par prénom. */
export async function listCallableMembers(currentUserId: string): Promise<CallableMember[]> {
  const rows = await prisma.user.findMany({
    where: { id: { not: currentUserId }, profile: { completedAt: { not: null } } },
    select: {
      id: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          englishLevel: true,
          city: true,
          country: true,
          photoType: true,
        },
      },
    },
  });

  return rows
    .flatMap((row) =>
      row.profile
        ? [
            {
              id: row.id,
              firstName: row.profile.firstName,
              lastName: row.profile.lastName,
              englishLevel: row.profile.englishLevel,
              city: row.profile.city,
              country: row.profile.country,
              hasPhoto: Boolean(row.profile.photoType),
            },
          ]
        : [],
    )
    .sort((a, b) => a.firstName.localeCompare(b.firstName));
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

  const creator = await prisma.user.findUnique({
    where: { id: creatorId },
    select: { name: true },
  });

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

  // On prévient les personnes invitées (sauf celles qui ont coupé ces notifications).
  await notifyMembers(
    invited.map((user) => user.id),
    {
      kind: "call",
      title: `${creator?.name ?? "A member"} invited you to a video call`,
      body: "Tap to join the room.",
      link: `/call/${call.id}`,
    },
  );

  const names = await prisma.user.findMany({
    where: { id: { in: invited.map((user) => user.id) } },
    select: { name: true },
  });
  await notifyAdmin({
    kind: "call",
    title: `${creator?.name ?? "A member"} started a video call`,
    body: `With ${names.map((user) => user.name).join(", ")}`,
    link: "/admin",
  });

  return call;
}

/** Un appel, seulement si l'utilisateur fait partie des invités. Sinon null. */
export function getCallForMember(callId: string, userId: string) {
  return prisma.call.findFirst({
    where: { id: callId, participants: { some: { userId } } },
    select: { id: true },
  });
}

/** Termine un appel : LiveKit fait sortir les deux personnes. */
export async function endCallRoom(callId: string): Promise<void> {
  try {
    await createRoomServiceClient().deleteRoom(callId);
  } catch (error) {
    // Déjà fermé (l'autre personne l'a peut-être fait juste avant).
    console.warn("[endCallRoom]", error);
  }
}

/** Les appels en cours où je suis invité (la salle LiveKit est encore ouverte). */
export async function listActiveCalls(userId: string): Promise<ActiveCall[]> {
  // "Récent" dépend de l'heure actuelle : donnée de requête, on le déclare à Next.js.
  await connection();
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
