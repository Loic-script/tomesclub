import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getProfileSummary } from "@/lib/profile";
import { requireUser } from "@/lib/session";
import { OnboardingForm } from "./onboarding-form";

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

  // Formulaire déjà rempli → retour à l'accueil.
  const profile = await getProfileSummary(user.id);
  if (profile?.completedAt) redirect("/");

  // On pré-remplit le prénom et le nom à partir du nom Google.
  const [firstGuess = "", ...rest] = user.name.trim().split(/\s+/);
  return <OnboardingForm defaultFirstName={firstGuess} defaultLastName={rest.join(" ")} />;
}
