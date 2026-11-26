"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** true seulement dans le navigateur (createPortal a besoin de document). */
const useClient = () => useSyncExternalStore(() => () => {}, () => true, () => false);

/**
 * Une photo de profil qu'on peut toucher : elle s'ouvre en grand, en plein écran.
 * Sans photo (seulement les initiales) : rien ne s'ouvre.
 * On ferme avec ×, en touchant à côté, ou avec Échap.
 */
export function PhotoViewer({
  userId,
  name,
  hasPhoto,
  children,
}: {
  userId: string;
  name: string;
  hasPhoto: boolean;
  /** La petite photo (ce qu'on touche). */
  children: ReactNode;
}) {
  const client = useClient();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  if (!hasPhoto) return <>{children}</>;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`See the photo of ${name}`}
        className="cursor-zoom-in rounded-full transition duration-200 hover:scale-[1.03] active:scale-95"
      >
        {children}
      </button>

      {open &&
        client &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Photo of ${name}`}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[95] flex flex-col items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex size-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white ring-1 ring-white/20 transition hover:bg-white/20"
            >
              ×
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element -- image privée servie par notre API */}
            <img
              src={`/api/profile/photo/${userId}`}
              alt={`Photo of ${name}`}
              onClick={(event) => event.stopPropagation()}
              className="anim-pop max-h-[78dvh] max-w-full rounded-3xl object-contain shadow-2xl ring-1 ring-white/15"
            />
            <p className="mt-4 break-words text-center font-display text-lg font-bold text-white">{name}</p>
          </div>,
          document.body,
        )}
    </>
  );
}
