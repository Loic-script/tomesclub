"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { authClient } from "@/lib/auth-client";

// Se déconnecter, puis revenir à la page de connexion.
export function SignOutButton({
  className = "btn btn-secondary",
  label = "Sign out",
  icon,
  labelClassName,
}: {
  className?: string;
  label?: string;
  icon?: ReactNode;
  labelClassName?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleSignOut} disabled={pending} className={className}>
      {icon}
      <span className={labelClassName}>{pending ? "Signing out..." : label}</span>
    </button>
  );
}
