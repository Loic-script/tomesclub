"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { cleanGuideSteps, resetGuideSteps, saveGuideSteps } from "@/lib/guide";

export type GuideSaveResult = { ok: true } | { ok: false; error: string };

/** Enregistre toutes les étapes du guide — admin seulement. */
export async function saveGuideAction(
  steps: unknown,
): Promise<GuideSaveResult> {
  // Une Server Action est un point d'entrée public : on revérifie la session admin.
  await requireAdmin();
  const clean = cleanGuideSteps(steps);
  if (!clean) {
    return {
      ok: false,
      error:
        "Each step needs a title (80 characters max) and a text (600 max). 1 to 20 steps.",
    };
  }
  await saveGuideSteps(clean);
  refresh();
  return { ok: true };
}

/** Revient aux étapes par défaut — admin seulement. */
export async function resetGuideAction(): Promise<void> {
  await requireAdmin();
  await resetGuideSteps();
  refresh();
}
