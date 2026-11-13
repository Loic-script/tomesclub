import "server-only";
import {
  DEFAULT_GUIDE,
  GUIDE_ICONS,
  GUIDE_LIMITS,
  type GuideIconKey,
  type GuideStepData,
} from "@/lib/guide-defaults";
import { prisma } from "@/lib/prisma";

// Le guide "How it works" : les étapes (base de données, sinon celles par défaut)
// et le "déjà vu" de chaque membre (le guide s'ouvre tout seul une seule fois).

const isIcon = (value: unknown): value is GuideIconKey =>
  typeof value === "string" &&
  (GUIDE_ICONS as readonly string[]).includes(value);

/** Les étapes du guide, dans l'ordre. Table vide → les étapes par défaut. */
export async function getGuideSteps(): Promise<GuideStepData[]> {
  const rows = await prisma.guideStep.findMany({
    orderBy: { position: "asc" },
    select: { icon: true, title: true, body: true },
  });
  if (rows.length === 0) return DEFAULT_GUIDE;
  return rows.map((row) => ({
    icon: isIcon(row.icon) ? row.icon : "sparkle",
    title: row.title,
    body: row.body,
  }));
}

/** Vérifie et nettoie les étapes envoyées par l'admin. null = pas valide. */
export function cleanGuideSteps(input: unknown): GuideStepData[] | null {
  if (!Array.isArray(input)) return null;
  if (
    input.length < GUIDE_LIMITS.minSteps ||
    input.length > GUIDE_LIMITS.maxSteps
  )
    return null;
  const steps: GuideStepData[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") return null;
    const { icon, title, body } = item as Record<string, unknown>;
    const cleanTitle = typeof title === "string" ? title.trim() : "";
    const cleanBody = typeof body === "string" ? body.trim() : "";
    if (!cleanTitle || !cleanBody) return null;
    if (
      cleanTitle.length > GUIDE_LIMITS.title ||
      cleanBody.length > GUIDE_LIMITS.body
    )
      return null;
    steps.push({
      icon: isIcon(icon) ? icon : "sparkle",
      title: cleanTitle,
      body: cleanBody,
    });
  }
  return steps;
}

/** Remplace toutes les étapes (l'admin enregistre). */
export async function saveGuideSteps(steps: GuideStepData[]): Promise<void> {
  await prisma.$transaction([
    prisma.guideStep.deleteMany(),
    prisma.guideStep.createMany({
      data: steps.map((step, position) => ({
        position,
        icon: step.icon,
        title: step.title,
        body: step.body,
      })),
    }),
  ]);
}

/** Retour aux étapes par défaut (on vide la table). */
export async function resetGuideSteps(): Promise<void> {
  await prisma.guideStep.deleteMany();
}

/** Le membre n'a jamais vu le guide → il s'ouvre tout seul. */
export async function shouldShowGuide(userId: string): Promise<boolean> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { guideSeenAt: true },
  });
  return Boolean(profile && !profile.guideSeenAt);
}

/** Le membre a vu le guide : il ne s'ouvrira plus tout seul. */
export async function markGuideSeen(userId: string): Promise<void> {
  await prisma.profile.updateMany({
    where: { userId, guideSeenAt: null },
    data: { guideSeenAt: new Date() },
  });
}
