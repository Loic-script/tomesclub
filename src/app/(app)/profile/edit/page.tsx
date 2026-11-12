import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ProfileForm } from "@/components/profile-form";
import { getFullProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";
import { updateProfile } from "./actions";

export const metadata: Metadata = { title: "Edit profile" };

// Page /profile/edit : modifier sa fiche (même formulaire que l'accueil, pré-rempli).
export default function EditProfilePage() {
  return (
    <div className="flex justify-center">
      <Suspense fallback={<p className="pt-20 text-center text-white/60">Loading...</p>}>
        <EditGate />
      </Suspense>
    </div>
  );
}

async function EditGate() {
  const user = await requireUser();
  const profile = await getFullProfile(user.id);
  if (!profile?.completedAt) redirect("/onboarding");

  const occupations = Array.isArray(profile.occupations)
    ? (profile.occupations as { kind?: string; detail?: string }[]).flatMap((entry) =>
        entry.kind ? [{ kind: entry.kind, detail: entry.detail ?? "" }] : [],
      )
    : [];

  return (
    <ProfileForm
      mode="edit"
      action={updateProfile}
      initial={{
        firstName: profile.firstName,
        lastName: profile.lastName,
        birthDate: profile.birthDate ? profile.birthDate.toISOString().slice(0, 10) : "",
        country: profile.country ?? "",
        city: profile.city ?? "",
        phone: profile.phone ?? "",
        occupations,
        languages: profile.languages,
        englishLevel: profile.englishLevel ?? "",
        interests: profile.interests,
        userType: profile.roleRequest ?? profile.role,
        userTypePending: Boolean(profile.roleRequest),
        photoUrl: profile.photoType ? `/api/profile/photo/${user.id}` : null,
      }}
    />
  );
}
