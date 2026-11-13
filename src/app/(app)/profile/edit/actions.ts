"use server";

import { refresh } from "next/cache";
import type { ProfileFormState } from "@/components/profile-form";
import { saveProfileFromForm } from "@/lib/profile";
import { requireUser } from "@/lib/session";

/** "Save changes" de la fenêtre de modification du profil : on reste sur la page. */
export async function saveProfileInline(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireUser();
  const error = await saveProfileFromForm(user.id, formData);
  if (error) return { error };
  refresh();
  return { error: null, saved: true };
}
