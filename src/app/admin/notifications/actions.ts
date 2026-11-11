"use server";

import { requireAdmin } from "@/lib/admin";
import { clearAdminNotifications, markAllAdminRead } from "@/lib/admin-notifications";

// Les boutons de la boîte de notifications admin.

/** "Mark all read" */
export async function markAllAdminReadAction(): Promise<void> {
  await requireAdmin();
  await markAllAdminRead();
}

/** "Clear all" */
export async function clearAdminNotificationsAction(): Promise<void> {
  await requireAdmin();
  await clearAdminNotifications();
}
