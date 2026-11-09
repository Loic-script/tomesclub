import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignOutButton } from "@/components/sign-out-button";
import { getProfileSummary } from "@/lib/profile";
import { getCurrentUser } from "@/lib/session";

// Page d'accueil provisoire (le vrai design viendra plus tard).
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-cream px-4 py-10 text-center">
      <Image
        src="/logo.jpeg"
        alt="Tomes Club logo"
        width={160}
        height={160}
        preload
        className="rounded-2xl shadow-md"
      />

      {/* La session se lit au moment de la requête : elle doit être dans un <Suspense>. */}
      <Suspense fallback={<p className="text-zinc-500">Loading...</p>}>
        <UserStatus />
      </Suspense>
    </main>
  );
}

async function UserStatus() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark"
      >
        Sign in
      </Link>
    );
  }

  // Fiche pas encore remplie → direction le formulaire d'accueil.
  const profile = await getProfileSummary(user.id);
  if (!profile?.completedAt) redirect("/onboarding");

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-xl font-semibold text-navy">Welcome, {profile.firstName} 👋</p>
      <Link
        href="/call"
        className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark"
      >
        Start a video call
      </Link>
      <SignOutButton />
    </div>
  );
}
