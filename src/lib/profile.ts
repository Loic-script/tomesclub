import "server-only";
import {
  ENGLISH_LEVELS,
  MAX_PHOTO_BYTES,
  OCCUPATIONS,
  PHOTO_TYPES,
} from "@/lib/onboarding-options";
import { prisma } from "@/lib/prisma";

// Lire et enregistrer la fiche d'un membre (côté serveur).

/** Le strict nécessaire pour savoir si le formulaire d'accueil est terminé. */
export function getProfileSummary(userId: string) {
  return prisma.profile.findUnique({
    where: { userId },
    select: { firstName: true, completedAt: true },
  });
}

/** La fiche complète (sans les octets de la photo, trop lourds). */
export function getFullProfile(userId: string) {
  return prisma.profile.findUnique({
    where: { userId },
    select: {
      firstName: true,
      lastName: true,
      birthDate: true,
      country: true,
      city: true,
      phone: true,
      occupations: true,
      languages: true,
      englishLevel: true,
      interests: true,
      photoType: true,
      completedAt: true,
    },
  });
}

/**
 * Vérifie puis enregistre la fiche envoyée par le formulaire (accueil OU modification).
 * Renvoie un message d'erreur, ou null si tout est bon.
 */
export async function saveProfileFromForm(
  userId: string,
  formData: FormData,
): Promise<string | null> {
  const text = (key: string): string | null => {
    const value = String(formData.get(key) ?? "").trim();
    return value ? value.slice(0, 200) : null;
  };

  // --- Identité ---
  const firstName = String(formData.get("firstName") ?? "").trim().slice(0, 100);
  const lastName = String(formData.get("lastName") ?? "").trim().slice(0, 100);
  if (!firstName || !lastName) return "Please fill in your first and last name.";

  let birthDate: Date | null = null;
  const birthRaw = String(formData.get("birthDate") ?? "");
  if (birthRaw) {
    const parsed = new Date(`${birthRaw}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed > new Date()) {
      return "The birth date is not valid.";
    }
    birthDate = parsed;
  }

  // --- Occupations (chaque case cochée doit avoir son détail) ---
  const checkedKinds = formData.getAll("occupations").map(String);
  const occupations: { kind: string; detail: string }[] = [];
  for (const occupation of OCCUPATIONS) {
    if (!checkedKinds.includes(occupation.kind)) continue;
    const detail = String(formData.get(`occupationDetail_${occupation.kind}`) ?? "")
      .trim()
      .slice(0, 200);
    if (!detail) return `Please add a detail for "${occupation.label}".`;
    occupations.push({ kind: occupation.kind, detail });
  }

  // --- Langues, niveau, centres d'intérêt ---
  const englishLevel = String(formData.get("englishLevel") ?? "");
  if (!ENGLISH_LEVELS.some((level) => level.value === englishLevel)) {
    return "Please choose your English level.";
  }

  const cleanList = (values: FormDataEntryValue[]): string[] =>
    [
      ...new Set(values.map((value) => String(value).trim().slice(0, 50)).filter(Boolean)),
    ].slice(0, 20);
  const languages = cleanList(formData.getAll("languages"));
  const interests = cleanList(formData.getAll("interests"));

  // --- Photo (facultative ; si absente, on garde l'ancienne) ---
  let photo: Uint8Array<ArrayBuffer> | null = null;
  let photoType: string | null = null;
  const file = formData.get("photo");
  if (file instanceof File && file.size > 0) {
    if (!PHOTO_TYPES.includes(file.type)) return "The photo must be a JPG, PNG or WebP image.";
    if (file.size > MAX_PHOTO_BYTES) return "The photo is too big (3 MB maximum).";
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
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  return null;
}
