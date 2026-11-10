import Link from "next/link";
import { FollowButton } from "@/components/follow-button";
import { ArrowRightIcon } from "@/components/icons";
import { MemberAvatar } from "@/components/member-avatar";
import { listMembers } from "@/lib/members";
import { getCurrentUser } from "@/lib/session";

// Le panneau "Members" : qui est en ligne, le bouton pour suivre,
// et on touche un nom pour voir la fiche. Lu au moment de la requête → <Suspense>.
export async function SideMembers({ className = "" }: { className?: string }) {
  const user = await getCurrentUser();
  const members = user ? await listMembers(user.id) : [];
  const onlineCount = members.filter((member) => member.online).length;

  return (
    <section aria-labelledby="members-panel-title" className={`card flex flex-col ${className}`}>
      <header className="flex items-center gap-3 border-b border-line px-5 py-4">
        <h2 id="members-panel-title" className="font-display text-base font-semibold text-ink">
          Members
        </h2>
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-mute">
          <span className="relative flex size-2">
            {onlineCount > 0 && (
              <span aria-hidden className="anim-ping absolute inset-0 rounded-full bg-success/60" />
            )}
            <span
              className={`relative size-2 rounded-full ${onlineCount > 0 ? "bg-success" : "bg-line-strong"}`}
            />
          </span>
          {onlineCount} online
        </span>
      </header>

      {members.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-mute">No other members yet.</p>
      ) : (
        <ul className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-blush/60"
            >
              <Link
                href={`/members/${member.id}`}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg"
              >
                <MemberAvatar
                  userId={member.id}
                  name={`${member.firstName} ${member.lastName}`}
                  hasPhoto={member.hasPhoto}
                  size="size-10"
                  online={member.online}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {member.firstName} {member.lastName}
                  </span>
                  <span
                    className={`block truncate text-xs ${member.online ? "font-medium text-success" : "text-mute"}`}
                  >
                    {member.online
                      ? "Online now"
                      : (member.country ?? member.englishLevel ?? "Member")}
                  </span>
                </span>
              </Link>

              <FollowButton
                memberId={member.id}
                following={member.following}
                followsMe={member.followsMe}
              />
            </li>
          ))}
        </ul>
      )}

      <footer className="border-t border-line p-2">
        <Link href="/calls" className="btn btn-ghost w-full justify-between text-brand hover:text-brand">
          Call a member
          <ArrowRightIcon className="size-4" />
        </Link>
      </footer>
    </section>
  );
}

/** La place que prend le panneau pendant le chargement. */
export function SideMembersFallback({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`card animate-pulse p-5 ${className}`}>
      <div className="h-5 w-24 rounded-md bg-blush-2/70" />
      <div className="mt-5 space-y-4">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="flex items-center gap-3">
            <span className="size-10 rounded-full bg-blush" />
            <span className="h-3.5 flex-1 rounded bg-blush" />
          </div>
        ))}
      </div>
    </div>
  );
}
