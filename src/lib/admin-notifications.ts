import "server-only";
import { prisma } from "@/lib/prisma";

// Les notifications de l'admin : ce qui se passe dans le club.
// (Une seule personne admin : pas besoin de destinataire.)

export type AdminNotificationKind = "member" | "room" | "event" | "call";

export type AdminNotificationItem = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: Date;
};

/** On garde au plus ce nombre de notifications (les plus vieilles partent). */
const KEEP = 200;

/**
 * Prévient l'admin. Ne fait jamais échouer l'action du membre :
 * si l'écriture rate, on note juste un avertissement.
 */
export async function notifyAdmin(notification: {
  kind: AdminNotificationKind;
  title: string;
  body?: string;
  link?: string;
}): Promise<void> {
  try {
    await prisma.adminNotification.create({
      data: {
        kind: notification.kind,
        title: notification.title.slice(0, 160),
        body: notification.body?.slice(0, 300) ?? null,
        link: notification.link ?? null,
      },
    });
  } catch (error) {
    console.warn("[admin] notification not saved:", error);
  }
}

/** Le nombre de notifications pas encore lues (pastille de la cloche). */
export async function countAdminUnread(): Promise<number> {
  return prisma.adminNotification.count({ where: { readAt: null } });
}

/** Les dernières notifications, les plus récentes d'abord. */
export async function listAdminNotifications(take = 60): Promise<AdminNotificationItem[]> {
  const rows = await prisma.adminNotification.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map(({ readAt, ...row }) => ({ ...row, read: readAt !== null }));
}

/** Tout marquer comme lu (et faire un peu de ménage). */
export async function markAllAdminRead(): Promise<void> {
  await prisma.adminNotification.updateMany({
    where: { readAt: null },
    data: { readAt: new Date() },
  });
  const old = await prisma.adminNotification.findMany({
    orderBy: { createdAt: "desc" },
    skip: KEEP,
    select: { id: true },
  });
  if (old.length > 0) {
    await prisma.adminNotification.deleteMany({ where: { id: { in: old.map((row) => row.id) } } });
  }
}

/** Tout effacer. */
export async function clearAdminNotifications(): Promise<void> {
  await prisma.adminNotification.deleteMany({});
}
