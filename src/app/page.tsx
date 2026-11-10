import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getProfileSummary } from "@/lib/profile";
import { getCurrentUser } from "@/lib/session";

// Page d'entrée : on envoie chacun au bon endroit.
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-cream">
      <Suspense fallback={<p className="text-mute">Loading...</p>}>
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
