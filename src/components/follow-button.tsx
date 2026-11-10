"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleFollowAction } from "@/app/(app)/members/actions";

// Le bouton pour suivre un membre.
// - je ne le suis pas, il ne me suit pas  -> "Follow"
// - je ne le suis pas mais il me suit     -> "Follow back"
// - je le suis déjà                       -> "Following" (toucher = arrêter)
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
  const large = size === "lg";

  // Toujours sur une seule ligne, icône et texte côte à côte.
  const shape = large
    ? "h-11 gap-1.5 px-6 text-sm"
    : "h-8 gap-1 px-3 text-xs";

  // Dans la liste (petit) : rose pâle, discret. Sur une fiche (grand) : bordeaux plein.
  const look = isFollowing
    ? "bg-white text-mute ring-1 ring-line hover:text-brand hover:ring-blush-2"
    : large
      ? "bg-brand text-white shadow-md hover:bg-brand-700"
      : "bg-brand-50 text-brand ring-1 ring-brand-100 hover:bg-brand hover:text-white hover:ring-brand";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={isFollowing}
      className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full font-semibold leading-none transition-colors duration-200 active:scale-[0.97] disabled:opacity-60 ${shape} ${look}`}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className={large ? "size-4" : "size-3.5"}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {isFollowing ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <path d="M12 5v14M5 12h14" />}
      </svg>
      {label}
    </button>
  );
}
