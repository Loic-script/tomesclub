"use server";

import { redirect } from "next/navigation";
import {
  ENGLISH_LEVELS,
  MAX_PHOTO_BYTES,
  OCCUPATIONS,
  PHOTO_TYPES,
} from "@/lib/onboarding-options";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export type OnboardingState = { error: string | null };

/** Bouton "Finish" du formulaire d'accueil : on vérifie tout, on enregistre, et direction l'accueil. */
export async function completeOnboarding(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  // Une Server Action peut être appelée par n'importe qui : on revérifie la session.
  const user = await requireUser();

  // Un champ texte facultatif : vide → null.
  const text = (key: string): string | null => {
    const value = String(formData.get(key) ?? "").trim();
    return value ? value.slice(0, 200) : null;
  };

  // --- Étape 1 : identité ---
  const firstName = String(formData.get("firstName") ?? "").trim().slice(0, 100);
  const lastName = String(formData.get("lastName") ?? "").trim().slice(0, 100);
  if (!firstName || !lastName) {
    return { error: "Please fill in your first and last name." };
  }

  let birthDate: Date | null = null;
  const birthRaw = String(formData.get("birthDate") ?? "");
  if (birthRaw) {
    const parsed = new Date(`${birthRaw}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed > new Date()) {
      return { error: "The birth date is not valid." };
    }
    birthDate = parsed;
  }

  // --- Étape 2 : occupations (chaque case cochée doit avoir son détail) ---
  const checkedKinds = formData.getAll("occupations").map(String);
  const occupations: { kind: string; detail: string }[] = [];
  for (const occupation of OCCUPATIONS) {
    if (!checkedKinds.includes(occupation.kind)) continue;
    const detail = String(formData.get(`occupationDetail_${occupation.kind}`) ?? "")
      .trim()
      .slice(0, 200);
    if (!detail) return { error: `Please add a detail for "${occupation.label}".` };
    occupations.push({ kind: occupation.kind, detail });
  }

  // --- Étape 3 : langues, niveau d'anglais, centres d'intérêt ---
  const englishLevel = String(formData.get("englishLevel") ?? "");
  if (!ENGLISH_LEVELS.some((level) => level.value === englishLevel)) {
    return { error: "Please choose your English level." };
  }

  const cleanList = (values: FormDataEntryValue[]): string[] =>
    [
      ...new Set(values.map((value) => String(value).trim().slice(0, 50)).filter(Boolean)),
    ].slice(0, 20);
  const languages = cleanList(formData.getAll("languages"));
  const interests = cleanList(formData.getAll("interests"));

  // --- Étape 4 : la photo (facultative) ---
  let photo: Uint8Array<ArrayBuffer> | null = null;
  let photoType: string | null = null;
  const file = formData.get("photo");
  if (file instanceof File && file.size > 0) {
    if (!PHOTO_TYPES.includes(file.type)) {
      return { error: "The photo must be a JPG, PNG or WebP image." };
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return { error: "The photo is too big (3 MB maximum)." };
    }
    photo = new Uint8Array(await file.arrayBuffer());
    photoType = file.type;
  }

  const data = {
    firstName,
    lastName,
    birthDate,
    country: text("country"),
    city: text("city"),
    phone: text("phone"),
    occupations,
    languages,
    englishLevel,
    interests,
    completedAt: new Date(),
    ...(photo ? { photo, photoType } : {}),
  };

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });

  redirect("/");
}
