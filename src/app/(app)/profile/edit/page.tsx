import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/app-ui";
import { ArrowLeftIcon } from "@/components/icons";
import { ProfileForm } from "@/components/profile-form";
import { getFullProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";
import { updateProfile } from "./actions";

export const metadata: Metadata = { title: "Edit profile" };

// Page /profile/edit : modifier sa fiche (même formulaire que l'accueil, pré-rempli).
export default function EditProfilePage() {
  return (
    <>
      <Link
        href="/profile"
        className="mb-5 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-mute transition-colors hover:text-brand"
      >
        <ArrowLeftIcon className="size-4" />
        Back to profile
      </Link>
      <div className="flex justify-center">
        <Suspense fallback={<PageSkeleton />}>
          <EditGate />
        </Suspense>
      </div>
    </>
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
        photoUrl: profile.photoType ? `/api/profile/photo/${user.id}` : null,
      }}
    />
  );
}
