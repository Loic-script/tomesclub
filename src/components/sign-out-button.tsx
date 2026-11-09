"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className="rounded-lg border border-brand px-4 py-2 font-semibold text-brand transition hover:bg-brand hover:text-white disabled:opacity-60"
    >
      {pending ? "Please wait..." : "Sign out"}
    </button>
  );
}
