import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getProfileSummary } from "@/lib/profile";
import { getCurrentUser } from "@/lib/session";

// Page d'entrée : on envoie chacun au bon endroit.
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-[linear-gradient(160deg,#1a1150,#45091f_45%,#7a082e)]">
      <Suspense fallback={<p className="text-white/60">Loading...</p>}>
        <Gate />
      </Suspense>
    </main>
  );
}

async function Gate() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfileSummary(user.id);
  if (!profile?.completedAt) redirect("/onboarding");

  redirect("/home");
  return null; // jamais atteint : redirect() interrompt l'affichage
}
