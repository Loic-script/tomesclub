"use client";

import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";

// Un formulaire qui lance une action serveur, puis rafraîchit la page.
// Sans ce rafraîchissement, l action est bien enregistrée mais l écran
// ne change pas (interrupteur, "Mark all read", "Clear all").
// Pendant l envoi, le formulaire porte aria-busy (style : group-aria-busy:...).
export function ActionForm({
  action,
  className = "",
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      aria-busy={pending}
      className={`group ${className}`}
      action={(formData) =>
        startTransition(async () => {
          await action(formData);
          router.refresh();
        })
      }
    >
      {children}
    </form>
  );
}
