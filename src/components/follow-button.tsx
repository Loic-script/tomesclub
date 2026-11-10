"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleFollowAction } from "@/app/(app)/members/actions";

// Le bouton pour suivre un membre.
// - je ne le suis pas, il ne me suit pas  → "Follow"
// - je ne le suis pas mais il me suit     → "Follow back"
// - je le suis déjà                       → "Following" (toucher = arrêter)
export function FollowButton({
  memberId,
  following,
  followsMe,
  size = "sm",
}: {
  memberId: string;
  following: boolean;
  followsMe: boolean;
  size?: "sm" | "lg";
}) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(following);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !isFollowing;
    setIsFollowing(next); // on change tout de suite : ça paraît plus rapide
    startTransition(async () => {
      await toggleFollowAction(memberId, next);
      router.refresh();
    });
  }

  const label = isFollowing ? "Following" : followsMe ? "Follow back" : "Follow";
  const padding = size === "lg" ? "px-6 py-2.5 text-sm" : "px-3 py-1.5 text-[11px]";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={isFollowing}
      className={`${padding} shrink-0 whitespace-nowrap rounded-full font-semibold transition-all duration-300 disabled:opacity-60 ${
        isFollowing
          ? "neu-inset text-white/70 hover:text-white"
          : "neu-btn bg-gradient-to-r from-brand to-brand-dark text-white shadow-lg hover:-translate-y-0.5"
      }`}
    >
      {label}
    </button>
  );
}
