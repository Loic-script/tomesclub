import "server-only";
import { EVENT_ROOM_PREFIX } from "@/lib/event-live";
import { createRoomServiceClient } from "@/lib/livekit";
import { prisma } from "@/lib/prisma";
import { ROOM_PREFIX } from "@/lib/rooms";

// Retirer ou bannir quelqu'un d'un room ou d'un événement.
// Qui peut le faire : l'admin, ou l'hôte s'il est Leader / Teacher (un simple membre hôte ne peut pas).

export type ModerationKind = "room" | "event";

/** La personne qui agit : l'admin ("coach") ou un membre. */
export type Actor = { id: string; coach: boolean };

function livekitRoomName(kind: ModerationKind, targetId: string): string {
  return kind === "room"
    ? `${ROOM_PREFIX}${targetId}`
    : `${EVENT_ROOM_PREFIX}${targetId}`;
}

/** L'hôte du room ou de l'événement (null = ouvert par l'admin, ou introuvable). */
export async function hostOf(
  kind: ModerationKind,
  targetId: string,
): Promise<string | null> {
  const row =
    kind === "room"
      ? await prisma.room.findUnique({
          where: { id: targetId },
          select: { createdById: true },
        })
      : await prisma.event.findUnique({
          where: { id: targetId },
          select: { createdById: true },
        });
  return row?.createdById ?? null;
}

/** Peut-il retirer des participants ? L'admin, ou l'hôte Leader / Teacher. */
export async function canModerate(
  kind: ModerationKind,
  targetId: string,
  actor: Actor,
): Promise<boolean> {
  if (actor.coach) return true;
  const [host, profile] = await Promise.all([
    hostOf(kind, targetId),
    prisma.profile.findUnique({
      where: { userId: actor.id },
      select: { role: true },
    }),
  ]);
  return (
    host === actor.id &&
    (profile?.role === "leader" || profile?.role === "teacher")
  );
}

/** Banni de ce room / cet événement ? */
export async function isBanned(
  kind: ModerationKind,
  targetId: string,
  userId: string,
): Promise<boolean> {
  const ban = await prisma.roomBan.findUnique({
    where: { kind_targetId_userId: { kind, targetId, userId } },
    select: { id: true },
  });
  return Boolean(ban);
}

/** Retire la personne de l'appel ; ban = elle ne pourra plus revenir. */
export async function removeParticipant(
  kind: ModerationKind,
  targetId: string,
  userId: string,
  ban: boolean,
): Promise<void> {
  if (ban) {
    await prisma.roomBan.upsert({
      where: { kind_targetId_userId: { kind, targetId, userId } },
      create: { kind, targetId, userId },
      update: {},
    });
  }
  // Déjà parti ? Pas grave.
  await createRoomServiceClient()
    .removeParticipant(livekitRoomName(kind, targetId), userId)
    .catch(() => undefined);
}
