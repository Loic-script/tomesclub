import "server-only";
import { prisma } from "@/lib/prisma";

// Les "appels entrants" : une grande fenêtre qui sonne chez le membre, avec Accept / Decline.
//  - call  : un membre l'appelle ;
//  - room  : une salle privée où il est invité s'ouvre ;
//  - event : le direct d'un événement où il est inscrit commence.

/** Un appel sonne pendant 45 secondes, ensuite il est "manqué". */
export const RING_SECONDS = 45;

export type RingKind = "call" | "room" | "event";

export type ActiveRing = {
  id: string;
  kind: RingKind;
  title: string;
  body: string | null;
  link: string;
  fromUserId: string | null;
  fromHasPhoto: boolean;
  createdAt: string;
};

/** Fait sonner chez ces membres. Ne fait jamais échouer l'action qui l'appelle. */
export async function ringMembers(
  userIds: string[],
  ring: { kind: RingKind; title: string; body?: string; link: string; fromUserId?: string | null },
): Promise<void> {
  const unique = [...new Set(userIds)].filter((id) => id && id !== ring.fromUserId);
  if (unique.length === 0) return;
  try {
    await prisma.ring.createMany({
      data: unique.map((userId) => ({
        userId,
        kind: ring.kind,
        title: ring.title.slice(0, 120),
        body: ring.body?.slice(0, 200) ?? null,
        link: ring.link,
        fromUserId: ring.fromUserId ?? null,
      })),
    });
  } catch (error) {
    console.warn("[rings] not saved:", error);
  }
}

/** Les appels qui sonnent encore chez ce membre (le plus récent d'abord). */
export async function listActiveRings(userId: string): Promise<ActiveRing[]> {
  const since = new Date(Date.now() - RING_SECONDS * 1000);
  const rows = await prisma.ring.findMany({
    where: { userId, answeredAt: null, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 3,
  });
  const callers = await prisma.profile.findMany({
    where: { userId: { in: rows.flatMap((row) => (row.fromUserId ? [row.fromUserId] : [])) } },
    select: { userId: true, photoType: true },
  });
  const withPhoto = new Set(callers.filter((caller) => caller.photoType).map((caller) => caller.userId));
  return rows.map((row) => ({
    id: row.id,
    kind: (["call", "room", "event"].includes(row.kind) ? row.kind : "call") as RingKind,
    title: row.title,
    body: row.body,
    link: row.link,
    fromUserId: row.fromUserId,
    fromHasPhoto: row.fromUserId ? withPhoto.has(row.fromUserId) : false,
    createdAt: row.createdAt.toISOString(),
  }));
}

/** Décroché ou raccroché : l'appel ne sonne plus. */
export async function answerRing(ringId: string, userId: string): Promise<void> {
  await prisma.ring.updateMany({ where: { id: ringId, userId, answeredAt: null }, data: { answeredAt: new Date() } });
  // On garde la table petite : les vieux appels (plus d'un jour) partent.
  await prisma.ring.deleteMany({ where: { userId, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
}
