import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ProfileForm } from "@/components/profile-form";
import { getProfileSummary } from "@/lib/profile";
import { requireUser } from "@/lib/session";
import { completeOnboarding } from "./actions";

export const metadata: Metadata = { title: "Welcome" };

// Page /onboarding : le formulaire d'accueil, juste après la première connexion.
// Même fond que la page de connexion (layout du groupe (auth)).
export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-2xl rounded-[2rem] bg-white p-10 text-center text-zinc-500 shadow-2xl">
          Loading...
        </div>
      }
    >
      <OnboardingGate />
    </Suspense>
  );
}

async function OnboardingGate() {
  const user = await requireUser();

  // Formulaire déjà rempli → direction l'application.
  const profile = await getProfileSummary(user.id);
  if (profile?.completedAt) redirect("/calls");

  // On pré-remplit le prénom et le nom à partir du nom Google.
  // Compte créé avec un email : son nom est juste le début de l'adresse, on ne le propose pas.
  const fromEmail = user.name === user.email.split("@")[0];
  const [firstGuess = "", ...rest] = fromEmail ? [] : user.name.trim().split(/\s+/);
  return (
    <ProfileForm
      mode="onboarding"
      action={completeOnboarding}
      initial={{
        firstName: firstGuess,
        lastName: rest.join(" "),
        birthDate: "",
        country: "",
        city: "",
        phone: "",
        occupations: [],
        languages: [],
        englishLevel: "",
        interests: [],
        userType: "member",
        userTypePending: false,
        photoUrl: null,
      }}
    />
  );
}
