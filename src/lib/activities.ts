import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ROOM_ACTIVITIES, type RoomActivity } from "@/lib/room-activities";

// Toutes les activites de room : les 13 du catalogue + celles ajoutees par l admin.
// L admin peut aussi MODIFIER une activite du catalogue : sa version est gardee dans la
// meme table, avec la meme cle (ex : "debate"). "Reset" efface cette version.

export type ActivityWithSource = RoomActivity & { custom: boolean; edited: boolean };

const isBuiltIn = (key: string) => ROOM_ACTIVITIES.some((activity) => activity.key === key);

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

type Row = {
  key: string;
  icon: string;
  name: string;
  description: string;
  categories: unknown;
  formats: string[];
};

function fromRow(row: Row): RoomActivity {
  return {
    key: row.key,
    icon: row.icon,
    name: row.name,
    description: row.description,
    categories: readCategories(row.categories),
    formats: row.formats,
  };
}

/** Le catalogue complet (pour le formulaire "Create a room"). */
export async function listActivities(): Promise<ActivityWithSource[]> {
  const rows = await prisma.customActivity.findMany({ orderBy: { createdAt: "asc" } });
  const byKey = new Map(rows.map((row) => [row.key, row]));
  const builtIn = ROOM_ACTIVITIES.map((activity) => {
    const edited = byKey.get(activity.key);
    return edited
      ? { ...fromRow(edited), custom: false, edited: true }
      : { ...activity, custom: false, edited: false };
  });
  const custom = rows
    .filter((row) => !isBuiltIn(row.key))
    .map((row) => ({ ...fromRow(row), custom: true, edited: false }));
  return [...builtIn, ...custom];
}

/** L activite qui a cette cle (catalogue, modifiee ou ajoutee), ou undefined. */
export async function getActivity(key: string | null | undefined): Promise<RoomActivity | undefined> {
  if (!key) return undefined;
  const builtIn = ROOM_ACTIVITIES.find((activity) => activity.key === key);
  if (!builtIn && !key.startsWith("custom-")) return undefined;
  const row = await prisma.customActivity.findUnique({ where: { key } });
  if (row) return fromRow(row);
  return builtIn;
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
  // Activite du catalogue : on cree (ou remplace) sa version modifiee.
  if (isBuiltIn(key)) {
    const data = {
      icon: input.icon,
      name: input.name,
      description: input.description,
      categories: input.categories,
      formats: input.formats,
    };
    await prisma.customActivity.upsert({ where: { key }, create: { key, ...data }, update: data });
    return true;
  }
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
  // Les activites du catalogue ne se suppriment pas (on peut seulement les remettre a zero).
  if (isBuiltIn(key)) return;
  await prisma.customActivity.deleteMany({ where: { key } });
}

/** Remet une activite du catalogue comme a l origine. */
export async function resetBuiltInActivity(key: string): Promise<void> {
  if (!isBuiltIn(key)) return;
  await prisma.customActivity.deleteMany({ where: { key } });
}
