"use server";

import { redirect } from "next/navigation";
import type { ProfileFormState } from "@/components/profile-form";
import { saveProfileFromForm } from "@/lib/profile";
import { requireUser } from "@/lib/session";

/** Bouton "Save changes" de la page de modification du profil. */
export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireUser();

  const error = await saveProfileFromForm(user.id, formData);
  if (error) return { error };

  redirect("/profile");
}
