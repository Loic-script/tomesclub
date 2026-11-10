"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleFollowAction } from "@/app/(app)/members/actions";
import { CheckIcon, PlusIcon } from "@/components/icons";

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
  const large = size === "lg";
  // Dans une liste (petit) : bouton doux, pour ne pas crier 12 fois.
  // Sur une fiche (grand) : bouton principal.
  const look = isFollowing ? "btn-secondary text-mute" : large ? "btn-primary" : "btn-soft";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={isFollowing}
      className={`btn ${large ? "" : "btn-sm"} ${look} shrink-0`}
    >
      {isFollowing ? (
        <CheckIcon className={large ? "size-4" : "size-3.5"} />
      ) : (
        <PlusIcon className={large ? "size-4" : "size-3.5"} />
      )}
      {label}
    </button>
  );
}
