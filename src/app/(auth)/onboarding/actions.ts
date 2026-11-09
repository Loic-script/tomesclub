"use server";

import { redirect } from "next/navigation";
import { saveProfileFromForm } from "@/lib/profile";
import { requireUser } from "@/lib/session";

export type OnboardingState = { error: string | null };

/** Bouton "Finish" du formulaire d'accueil : on vérifie tout, on enregistre, et direction l'app. */
export async function completeOnboarding(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  // Une Server Action peut être appelée par n'importe qui : on revérifie la session.
  const user = await requireUser();

  const error = await saveProfileFromForm(user.id, formData);
  if (error) return { error };

  redirect("/home");
}
