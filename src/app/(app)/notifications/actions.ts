"use server";

import {
  clearMyNotifications,
  markAllRead,
  setNotificationSetting,
} from "@/lib/notifications";
import { requireMember } from "@/lib/session";

// Les actions de la page Notifications.

/** Bouton "Mark all as read". */
export async function markAllReadAction(): Promise<void> {
  const user = await requireMember();
  await markAllRead(user.id);
}

/** Bouton "Clear all" : vide la liste. */
export async function clearAllAction(): Promise<void> {
  const user = await requireMember();
  await clearMyNotifications(user.id);
}

/** Les interrupteurs des réglages (appels / événements). */
export async function toggleSettingAction(formData: FormData): Promise<void> {
  const user = await requireMember();

  const field = String(formData.get("field") ?? "");
  if (field !== "notifyCalls" && field !== "notifyEvents") return;

  // Le formulaire envoie la valeur voulue ("on" = allumer).
  const value = formData.get("value") === "on";
  await setNotificationSetting(user.id, field, value);
}
