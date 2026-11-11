import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ROOM_ACTIVITIES, type RoomActivity } from "@/lib/room-activities";

// Toutes les activites de room : les 13 du catalogue + celles ajoutees par l admin.

export type ActivityWithSource = RoomActivity & { custom: boolean };

/** Relit prudemment le JSON des categories. */
function readCategories(value: unknown): RoomActivity["categories"] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => ({
      name: typeof entry?.name === "string" ? entry.name : "",
      topics: Array.isArray(entry?.topics)
        ? entry.topics.filter((topic: unknown): topic is string => typeof topic === "string")
        : [],
    }))
    .filter((category) => category.name && category.topics.length > 0);
}

async function listCustom(): Promise<ActivityWithSource[]> {
  const rows = await prisma.customActivity.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((row) => ({
    key: row.key,
    icon: row.icon,
    name: row.name,
    description: row.description,
    categories: readCategories(row.categories),
    formats: row.formats,
    custom: true,
  }));
}

/** Le catalogue complet (pour le formulaire "Create a room"). */
export async function listActivities(): Promise<ActivityWithSource[]> {
  return [...ROOM_ACTIVITIES.map((activity) => ({ ...activity, custom: false })), ...(await listCustom())];
}

/** L activite qui a cette cle (catalogue ou ajoutee), ou undefined. */
export async function getActivity(key: string | null | undefined): Promise<RoomActivity | undefined> {
  if (!key) return undefined;
  const builtIn = ROOM_ACTIVITIES.find((activity) => activity.key === key);
  if (builtIn) return builtIn;
  if (!key.startsWith("custom-")) return undefined;
  const row = await prisma.customActivity.findUnique({ where: { key } });
  if (!row) return undefined;
  return {
    key: row.key,
    icon: row.icon,
    name: row.name,
    description: row.description,
    categories: readCategories(row.categories),
    formats: row.formats,
  };
}

/** Plusieurs activites d un coup (pour une liste de rooms). */
export async function getActivityMap(keys: (string | null)[]): Promise<Map<string, RoomActivity>> {
  const all = await listActivities();
  const wanted = new Set(keys.filter(Boolean));
  return new Map(all.filter((activity) => wanted.has(activity.key)).map((activity) => [activity.key, activity]));
}

/** "Book Club!" -> "book-club" */
function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

export async function addCustomActivity(input: Omit<RoomActivity, "key">): Promise<void> {
  await prisma.customActivity.create({
    data: {
      key: `custom-${slug(input.name) || "activity"}-${randomUUID().slice(0, 6)}`,
      icon: input.icon,
      name: input.name,
      description: input.description,
      categories: input.categories,
      formats: input.formats,
    },
  });
}

export async function updateCustomActivity(key: string, input: Omit<RoomActivity, "key">): Promise<boolean> {
  const result = await prisma.customActivity.updateMany({
    where: { key },
    data: {
      icon: input.icon,
      name: input.name,
      description: input.description,
      categories: input.categories,
      formats: input.formats,
    },
  });
  return result.count > 0;
}

export async function deleteCustomActivity(key: string): Promise<void> {
  await prisma.customActivity.deleteMany({ where: { key } });
}
