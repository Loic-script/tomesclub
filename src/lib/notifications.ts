import "server-only";
import { prisma } from "@/lib/prisma";

// Tout ce qui concerne les notifications des membres.

/** Les sortes de notifications. */
export type NotificationKind = "call" | "follow" | "room" | "event" | "announcement";

/** Les quatre réglages que le membre peut allumer ou éteindre. */
export type NotificationSetting =
  | "notifyCalls"
  | "notifyFollows"
  | "notifyRooms"
  | "notifyEvents";

export type NotificationSettings = Record<NotificationSetting, boolean>;

/** On garde seulement les 50 dernières notifications à l'écran. */
const MAX_SHOWN = 50;

export type MemberNotification = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: Date;
};

/** Le réglage du profil qui autorise (ou non) cette sorte de notification. */
function preferenceField(kind: NotificationKind): NotificationSetting {
  if (kind === "call") return "notifyCalls";
  if (kind === "follow") return "notifyFollows";
  if (kind === "room") return "notifyRooms";
  return "notifyEvents"; // "event" et "announcement"
}

/**
 * Envoie la même notification à plusieurs membres.
 * Les membres qui ont coupé cette sorte de notification sont ignorés.
 */
export async function notifyMembers(
  userIds: string[],
  notification: { kind: NotificationKind; title: string; body?: string; link?: string },
): Promise<void> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return;

  // On ne garde que ceux qui veulent bien recevoir ça.
  const allowed = await prisma.profile.findMany({
    where: { userId: { in: unique }, [preferenceField(notification.kind)]: true },
    select: { userId: true },
  });
  if (allowed.length === 0) return;

  await prisma.notification.createMany({
    data: allowed.map((profile) => ({
      userId: profile.userId,
      kind: notification.kind,
      title: notification.title,
      body: notification.body ?? null,
      link: notification.link ?? null,
    })),
  });
}

/**
 * Envoie une notification à tous les membres (fiche terminée).
 * `exceptUserId` : la personne qui vient de faire l'action (on ne se prévient pas soi-même).
 */
export async function notifyAllMembers(
  notification: { kind: NotificationKind; title: string; body?: string; link?: string },
  exceptUserId?: string,
): Promise<void> {
  const members = await prisma.profile.findMany({
    where: {
      completedAt: { not: null },
      ...(exceptUserId ? { userId: { not: exceptUserId } } : {}),
    },
    select: { userId: true },
  });
  await notifyMembers(
    members.map((member) => member.userId),
    notification,
  );
}

/** Le nombre de notifications pas encore lues (pour la pastille rouge). */
export async function countUnread(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

/** Mes notifications, les plus récentes d'abord. */
export async function listMyNotifications(userId: string): Promise<MemberNotification[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: MAX_SHOWN,
    select: {
      id: true,
      kind: true,
      title: true,
      body: true,
      link: true,
      readAt: true,
      createdAt: true,
    },
  });
  return rows.map(({ readAt, ...row }) => ({ ...row, read: readAt !== null }));
}

/** Marque toutes mes notifications comme lues. */
export async function markAllRead(userId: string): Promise<void> {
  // Appelé seulement depuis une action de formulaire : la date du jour est permise ici.
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

/** Supprime toutes mes notifications. */
export async function clearMyNotifications(userId: string): Promise<void> {
  await prisma.notification.deleteMany({ where: { userId } });
}

/** Mes réglages de notifications. */
export async function getNotificationSettings(userId: string): Promise<NotificationSettings> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { notifyCalls: true, notifyFollows: true, notifyRooms: true, notifyEvents: true },
  });
  return {
    notifyCalls: profile?.notifyCalls ?? true,
    notifyFollows: profile?.notifyFollows ?? true,
    notifyRooms: profile?.notifyRooms ?? true,
    notifyEvents: profile?.notifyEvents ?? true,
  };
}

/** Est-ce un nom de réglage valide ? (le formulaire ne vaut pas confiance) */
export function isNotificationSetting(value: string): value is NotificationSetting {
  return (
    value === "notifyCalls" ||
    value === "notifyFollows" ||
    value === "notifyRooms" ||
    value === "notifyEvents"
  );
}

/** Allume ou éteint une sorte de notification. */
export async function setNotificationSetting(
  userId: string,
  field: NotificationSetting,
  value: boolean,
): Promise<void> {
  await prisma.profile.update({ where: { userId }, data: { [field]: value } });
}
