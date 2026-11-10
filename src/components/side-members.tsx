import Link from "next/link";
import type { CSSProperties } from "react";
import { FollowButton } from "@/components/follow-button";
import { MemberAvatar } from "@/components/member-avatar";
import { listMembers } from "@/lib/members";
import { getCurrentUser } from "@/lib/session";

// Le panneau de droite : les membres du club.
// Point vert = en ligne, bouton pour suivre, et on touche le nom pour voir la fiche.
export async function SideMembers({ className = "" }: { className?: string }) {
  const user = await getCurrentUser();
  const members = user ? await listMembers(user.id) : [];
  const onlineCount = members.filter((member) => member.online).length;

  return (
    <aside aria-label="Members" className={className}>
      <div
        className="neu anim-rise flex max-h-[76vh] w-72 flex-col rounded-[2rem] p-5"
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

        {members.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/55">
            No other members yet.
          </p>
        ) : (
          <ul className="-mr-2 flex-1 space-y-2 overflow-y-auto pr-2">
            {members.map((member, index) => (
              <li
                key={member.id}
                className="anim-rise"
                style={{ "--d": `${350 + Math.min(index, 8) * 60}ms` } as CSSProperties}
              >
                <div className="neu-sm flex items-center gap-2.5 rounded-2xl p-2">
                  {/* La photo + le point vert, cliquables : ça ouvre la fiche */}
                  <Link
                    href={`/members/${member.id}`}
                    aria-label={`See ${member.firstName}'s profile`}
                    className="relative shrink-0 transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    <MemberAvatar
                      userId={member.id}
                      name={`${member.firstName} ${member.lastName}`}
                      hasPhoto={member.hasPhoto}
                      size="size-10"
                    />
                    <span
                      aria-label={member.online ? "Online" : "Offline"}
                      className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[#2b1538] ${
                        member.online ? "bg-emerald-400" : "bg-white/30"
                      }`}
                    />
                  </Link>

                  <Link href={`/members/${member.id}`} className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">
                      {member.firstName}
                    </span>
                    <span className="block truncate text-[11px] text-white/50">
                      {member.online ? "Online now" : (member.country ?? member.englishLevel ?? "Member")}
                    </span>
                  </Link>

                  <FollowButton
                    memberId={member.id}
                    following={member.following}
                    followsMe={member.followsMe}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

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
