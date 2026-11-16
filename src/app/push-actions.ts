"use server";

import { isAdmin } from "@/lib/admin";
import { pushPublicKey, removeSubscription, saveSubscription } from "@/lib/push";
import { getCurrentUser } from "@/lib/session";

export type PushAudience = "member" | "admin";

/** La clé publique du site (pour que le navigateur s'abonne). */
export async function getPushKey(): Promise<string> {
  return pushPublicKey();
}

function valid(subscription: unknown): subscription is { endpoint: string; keys: { p256dh: string; auth: string } } {
  const s = subscription as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null;
  return (
    typeof s?.endpoint === "string" &&
    s.endpoint.startsWith("https://") &&
    s.endpoint.length < 1000 &&
    typeof s.keys?.p256dh === "string" &&
    s.keys.p256dh.length < 200 &&
    typeof s.keys?.auth === "string" &&
    s.keys.auth.length < 100
  );
}

/** Garde cet appareil pour le membre connecté, ou pour l'admin. */
export async function subscribePush(subscription: unknown, audience: PushAudience): Promise<{ ok: boolean }> {
  if (!valid(subscription)) return { ok: false };
  if (audience === "admin") {
    if (!(await isAdmin())) return { ok: false };
    await saveSubscription(subscription, { admin: true });
    return { ok: true };
  }
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  await saveSubscription(subscription, { userId: user.id });
  return { ok: true };
}

/** Coupe les notifications sur cet appareil. */
export async function unsubscribePush(endpoint: string): Promise<void> {
  if (typeof endpoint !== "string" || endpoint.length > 1000) return;
  if (!(await isAdmin()) && !(await getCurrentUser())) return;
  await removeSubscription(endpoint);
}
