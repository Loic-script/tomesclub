"use server";

import { redirect } from "next/navigation";
import {
  checkAdminCredentials,
  createAdminSession,
  destroyAdminSession,
} from "@/lib/admin";

export type AdminSignInState = { error: string | null };

/** Formulaire /admin/login : vérifie les identifiants du .env puis ouvre la session admin. */
export async function adminSignIn(
  _prevState: AdminSignInState,
  formData: FormData,
): Promise<AdminSignInState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Please fill in both fields." };
  }
  if (!checkAdminCredentials(username, password)) {
    return { error: "Incorrect username or password." };
  }

  await createAdminSession();
  redirect("/admin");
}

/** Bouton "Sign out" de l'espace admin. */
export async function adminSignOut(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/login");
}
