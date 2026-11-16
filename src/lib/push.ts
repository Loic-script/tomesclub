import "server-only";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// Les notifications "push" : elles arrivent sur le téléphone ou l'ordinateur
// même quand l'application est fermée (comme WhatsApp).

/** Ce que le service worker reçoit et affiche (public/sw.js). */
export type PushPayload = {
  /** "call" = un appel qui sonne ; "message" = un message ; "notice" = le reste. */
  kind: "call" | "message" | "notice";
  title: string;
  body?: string;
  /** La page ouverte quand on touche la notification. */
  url?: string;
  /** Même tag = la nouvelle notification remplace l'ancienne. */
  tag?: string;
};

const KEY_ID = "vapid";

/** Les clés du site : créées une seule fois puis gardées dans la base. */
async function vapidKeys(): Promise<{ publicKey: string; privateKey: string }> {
  const saved = await prisma.pushKey.findUnique({ where: { id: KEY_ID } });
  if (saved) return saved;
  const fresh = webpush.generateVAPIDKeys();
  try {
    return await prisma.pushKey.create({ data: { id: KEY_ID, ...fresh } });
  } catch {
    // Deux demandes en même temps : on garde celle qui a été écrite en premier.
    return prisma.pushKey.findUniqueOrThrow({ where: { id: KEY_ID } });
  }
}

/** La clé publique, donnée au navigateur pour s'abonner. */
export async function pushPublicKey(): Promise<string> {
  return (await vapidKeys()).publicKey;
}

export type BrowserSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/** Garde l'abonnement d'un appareil (un membre, ou l'admin). */
export async function saveSubscription(
  subscription: BrowserSubscription,
  owner: { userId: string } | { admin: true },
): Promise<void> {
  const data = {
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    userId: "userId" in owner ? owner.userId : null,
    admin: "admin" in owner,
  };
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: { endpoint: subscription.endpoint, ...data },
    update: data,
  });
}

/** Oublie un appareil (notifications coupées). */
export async function removeSubscription(endpoint: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

async function send(
  rows: { id: string; endpoint: string; p256dh: string; auth: string }[],
  payload: PushPayload,
): Promise<void> {
  if (rows.length === 0) return;
  const keys = await vapidKeys();
  const body = JSON.stringify({
    ...payload,
    title: payload.title.slice(0, 120),
    body: payload.body?.slice(0, 200),
  });
  const options = {
    vapidDetails: {
      subject: process.env.BETTER_AUTH_URL?.startsWith("https://")
        ? process.env.BETTER_AUTH_URL
        : "mailto:noreply@tomesclub.app",
      publicKey: keys.publicKey,
      privateKey: keys.privateKey,
    },
    // Un appel ne sert plus à rien après une minute ; le reste peut attendre une journée.
    TTL: payload.kind === "call" ? 60 : 24 * 60 * 60,
    urgency: payload.kind === "notice" ? ("normal" as const) : ("high" as const),
  };
  const gone: string[] = [];
  await Promise.allSettled(
    rows.map(async (row) => {
      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          body,
          options,
        );
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        // L'appareil n'existe plus (application désinstallée, notifications refusées) : on l'oublie.
        if (status === 404 || status === 410) gone.push(row.id);
        else console.warn("[push] not sent:", status ?? error);
      }
    }),
  );
  if (gone.length > 0) await prisma.pushSubscription.deleteMany({ where: { id: { in: gone } } });
}

const PUSH_SELECT = { id: true, endpoint: true, p256dh: true, auth: true } as const;

/**
 * Envoie une notification push à des membres. Ne fait jamais échouer l'action :
 * on n'attend pas la fin de l'envoi, et une erreur est seulement notée.
 */
export function pushToUsers(userIds: string[], payload: PushPayload): void {
  const unique = [...new Set(userIds)].filter(Boolean);
  if (unique.length === 0) return;
  void prisma.pushSubscription
    .findMany({ where: { userId: { in: unique } }, select: PUSH_SELECT })
    .then((rows) => send(rows, payload))
    .catch((error) => console.warn("[push] members:", error));
}

/** Envoie une notification push sur les appareils de l'admin. */
export function pushToAdmin(payload: PushPayload): void {
  void prisma.pushSubscription
    .findMany({ where: { admin: true }, select: PUSH_SELECT })
    .then((rows) => send(rows, payload))
    .catch((error) => console.warn("[push] admin:", error));
}
