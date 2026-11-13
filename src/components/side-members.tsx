import Link from "next/link";
import type { CSSProperties } from "react";
import { SideMembersList } from "@/components/side-members-list";
import { listMembers } from "@/lib/members";
import { getCurrentUser } from "@/lib/session";

// Le panneau de droite : les membres du club.
// Point vert = en ligne, bouton pour suivre, recherche par nom, et on touche le nom pour voir la fiche.
export async function SideMembers({ className = "" }: { className?: string }) {
  const user = await getCurrentUser();
  // Tous les membres (0 = pas de limite) : la recherche se fait dans le panneau.
  const members = user ? await listMembers(user.id, 0) : [];
  const onlineCount = members.filter((member) => member.online).length;

  return (
    <aside aria-label="Members" className={className}>
      <div
        className="neu nav-glass anim-rise flex max-h-[76vh] w-72 flex-col rounded-[2rem] p-5"
        style={{ "--d": "300ms" } as CSSProperties}
      >
        <header className="mb-4 flex items-center gap-2">
          <h2 className="font-display text-lg font-bold text-white">Members</h2>
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/70">
            <span className="relative flex size-2">
              {onlineCount > 0 && (
                <span aria-hidden className="anim-ping absolute inset-0 rounded-full bg-emerald-400/70" />
              )}
              <span
                className={`relative size-2 rounded-full ${
                  onlineCount > 0 ? "bg-emerald-400" : "bg-white/30"
                }`}
              />
            </span>
            {onlineCount} online
          </span>
        </header>

        <SideMembersList members={members} />

        <Link
          href="/calls"
          className="neu-sm neu-btn mt-4 block rounded-2xl py-2 text-center text-xs font-semibold text-white/80 hover:text-white"
        >
          Call a member
        </Link>
      </div>
    </aside>
  );
}

/** La place que prend le panneau pendant le chargement. */
export function SideMembersFallback({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`${className} neu h-96 w-72 rounded-[2rem]`} />;
}
