"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { approvePrivateRoom, refusePrivateRoom } from "@/lib/private-rooms";
import {
  addCustomActivity,
  deleteCustomActivity,
  resetBuiltInActivity,
  updateCustomActivity,
} from "@/lib/activities";
import { deleteActivityFile, deleteFilesOfActivity, retryConversion } from "@/lib/activity-files";
import { readRoomForm } from "@/lib/room-form";
import type { RoomActivity } from "@/lib/room-activities";
import { closeRoom, createRoom } from "@/lib/rooms";

export type AdminRoomState = { error: string | null };
export type ActivityFormState = { error: string | null; saved: boolean };

/** Le coach ouvre une salle (hote = "Coach"), puis y entre. */
export async function adminCreateRoomAction(
  _prevState: AdminRoomState,
  formData: FormData,
): Promise<AdminRoomState> {
  await requireAdmin();
  const input = await readRoomForm(formData);
  if (typeof input === "string") return { error: input };

  let roomId: string;
  try {
    roomId = (await createRoom(null, input)).id;
  } catch (error) {
    console.error("[adminCreateRoomAction]", error);
    return { error: "Could not create the room. Is the video server running?" };
  }
  redirect(`/room/${roomId}?as=admin`);
}

/** Fermer une salle pour tout le monde (et la supprimer). */
export async function adminCloseRoomAction(roomId: string): Promise<void> {
  await requireAdmin();
  await closeRoom(roomId);
  refresh();
}

const text = (formData: FormData, key: string, max: number) =>
  String(formData.get(key) ?? "").trim().slice(0, max);

/** Une liste ecrite "une par ligne" (ou separee par des virgules pour les formats). */
function lines(value: string, max: number, splitCommas = false): string[] {
  const parts = value.split(splitCommas ? /[\n,]/ : /\n/);
  return [...new Set(parts.map((part) => part.trim().slice(0, 160)).filter(Boolean))].slice(0, max);
}

/** Lit le formulaire d une activite. Texte = message d erreur. */
function readActivityForm(formData: FormData): Omit<RoomActivity, "key"> | string {
  const icon = text(formData, "icon", 8) || "✨";
  const name = text(formData, "name", 60);
  if (!name) return "Please give the activity a name.";
  const description = text(formData, "description", 300);
  if (!description) return "Please write a short description.";

  const formats = lines(text(formData, "formats", 600), 8, true);
  if (formats.length === 0) return "Please add at least one format (e.g. Pairs, Teams).";

  const names = formData.getAll("categoryName").map((value) => String(value).trim().slice(0, 40));
  const topics = formData.getAll("categoryTopics").map((value) => String(value));
  const categories = names
    .map((categoryName, index) => ({ name: categoryName, topics: lines(topics[index] ?? "", 40) }))
    .filter((category) => category.name && category.topics.length > 0)
    .slice(0, 8);
  if (categories.length === 0) return "Please add at least one category with one theme.";

  return { icon, name, description, formats, categories };
}

export async function addActivityAction(
  _prevState: ActivityFormState,
  formData: FormData,
): Promise<ActivityFormState> {
  await requireAdmin();
  const input = readActivityForm(formData);
  if (typeof input === "string") return { error: input, saved: false };
  await addCustomActivity(input);
  refresh();
  return { error: null, saved: true };
}

export async function updateActivityAction(
  key: string,
  _prevState: ActivityFormState,
  formData: FormData,
): Promise<ActivityFormState> {
  await requireAdmin();
  const input = readActivityForm(formData);
  if (typeof input === "string") return { error: input, saved: false };
  const ok = await updateCustomActivity(key, input);
  if (!ok) return { error: "This activity no longer exists.", saved: false };
  refresh();
  return { error: null, saved: true };
}

/** Une activite du catalogue modifiee : revenir a l original (les fichiers restent). */
export async function resetActivityAction(key: string): Promise<void> {
  await requireAdmin();
  await resetBuiltInActivity(key);
  refresh();
}

export async function deleteActivityAction(key: string): Promise<void> {
  await requireAdmin();
  if (!key.startsWith("custom-")) return;
  await deleteFilesOfActivity(key);
  await deleteCustomActivity(key);
  refresh();
}

/** Supprimer un fichier d une activite. */
export async function deleteActivityFileAction(id: string): Promise<void> {
  await requireAdmin();
  await deleteActivityFile(id);
  refresh();
}

/** Refaire la version PDF d un PowerPoint / Word. */
export async function retryConversionAction(id: string): Promise<void> {
  await requireAdmin();
  await retryConversion(id);
  refresh();
}

/** Salle privée d'un Leader / Teacher : accepter (elle s'ouvre, les invités sont prévenus). */
export async function approvePrivateRoomAction(roomId: string): Promise<void> {
  await requireAdmin();
  try {
    await approvePrivateRoom(roomId);
  } catch (error) {
    console.error("[approvePrivateRoomAction]", error);
  }
  refresh();
}

/** Salle privée d'un Leader / Teacher : refuser (elle est supprimée, l'hôte est prévenu). */
export async function refusePrivateRoomAction(roomId: string): Promise<void> {
  await requireAdmin();
  await refusePrivateRoom(roomId);
  refresh();
}
