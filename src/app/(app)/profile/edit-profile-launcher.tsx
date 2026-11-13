"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ProfileFormInitial } from "@/components/profile-form";
import { EditProfileCard } from "./edit-profile-card";

// Le bouton crayon, posé sur la carte de membre : il ouvre la fenêtre "Edit profile"
// (même bandeau diagonal que la carte). Après l'enregistrement, la carte se met à jour.
export function EditProfileLauncher({
  initial,
  defaultOpen = false,
}: {
  initial: ProfileFormInitial;
  /** Ouvert tout de suite (adresse /profile?edit=1, ou ancienne page /profile/edit) */
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);

  const close = useCallback(() => {
    setOpen(false);
    // On enlève "?edit=1" de l'adresse, sans recharger.
    if (window.location.search.includes("edit=1")) window.history.replaceState(null, "", "/profile");
  }, []);

  const saved = useCallback(() => {
    close();
    router.refresh();
  }, [close, router]);

  // Échap ferme ; la page derrière ne défile pas pendant que la fenêtre est ouverte.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Edit profile"
        title="Edit profile"
        className="absolute right-3 top-3 z-20 flex size-10 items-center justify-center rounded-full bg-white text-navy shadow-lg ring-2 ring-white/60 transition hover:scale-110 hover:text-brand active:scale-95"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-[18px]">
          <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
          <path d="m13.5 6.5 4 4" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(event) => {
              if (event.target === event.currentTarget) close();
            }}
          >
            <div role="dialog" aria-modal="true" aria-label="Edit profile" className="flex w-full justify-center p-3">
              <EditProfileCard initial={initial} onClose={close} onSaved={saved} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
