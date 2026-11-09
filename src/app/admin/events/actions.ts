"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { MAX_PHOTO_BYTES, PHOTO_TYPES } from "@/lib/onboarding-options";
import { prisma } from "@/lib/prisma";

export type CreateEventState = { error: string | null };

/** Formulaire admin : publier un événement (avec date) ou une annonce. */
export async function createEvent(
  _prevState: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  await requireAdmin();

  const kind = String(formData.get("kind") ?? "");
  if (kind !== "event" && kind !== "announcement") {
    return { error: "Please choose a type." };
  }

  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  if (!title) return { error: "Please write a title." };

  const description = String(formData.get("description") ?? "").trim().slice(0, 1000);

  let startsAt: Date | null = null;
  if (kind === "event") {
    const raw = String(formData.get("startsAt") ?? "");
    if (!raw) return { error: "Please choose a date and time for the event." };
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return { error: "The date is not valid." };
    startsAt = parsed;
  }

  // L'image de la carte (facultative).
  let image: Uint8Array<ArrayBuffer> | null = null;
  let imageType: string | null = null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    if (!PHOTO_TYPES.includes(file.type)) {
      return { error: "The image must be a JPG, PNG or WebP file." };
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return { error: "The image is too big (3 MB maximum)." };
    }
    image = new Uint8Array(await file.arrayBuffer());
    imageType = file.type;
  }

  await prisma.event.create({
    data: { kind, title, description: description || null, startsAt, image, imageType },
  });

  redirect("/admin/events");
}

/** Supprimer un événement ou une annonce. */
export async function deleteEvent(eventId: string): Promise<void> {
  await requireAdmin();
  await prisma.event.delete({ where: { id: eventId } }).catch(() => {
    // Déjà supprimé : rien à faire.
  });
  redirect("/admin/events");
}
