import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { delay, GlassCard, PageHeader } from "@/components/app-ui";
import { listActiveCalls } from "@/lib/calls";
import { listMembers, type MemberCard } from "@/lib/members";
import { requireMember } from "@/lib/session";
import { MembersCallList } from "./members-call-list";
import { RandomSearchCard } from "./random-search";

export const metadata: Metadata = { title: "Calls" };

// Page /calls : appeler un membre, ou se faire appeler par le hasard.
export default function CallsPage() {
  return (
    <Suspense fallback={<p className="pt-20 text-center text-white/60">Loading...</p>}>
      <CallsHome />
    </Suspense>
  );
}

async function CallsHome() {
  const user = await requireMember();
  const [members, activeCalls] = await Promise.all([
    // Tout le monde (0 = pas de limite), avec "en ligne" et "je le suis".
    listMembers(user.id, 0),
    listActiveCalls(user.id),
  ]);

  // La première carte : seulement les membres en ligne ou que je suis.
  const nearby = members
    .filter((member) => member.online || member.following)
    .sort((a, b) => priority(a) - priority(b) || a.firstName.localeCompare(b.firstName));

  return (
    <>
      <PageHeader eyebrow="One-to-one" title="Calls" subtitle={`Ready to speak English, ${user.firstName}?`} />

      <div className="space-y-5">
        <div className="anim-rise" style={delay(150)}>
          <RandomSearchCard />
        </div>

        {activeCalls.length > 0 && (
          <GlassCard className="anim-rise" style={delay(250)}>
            <h2 className="mb-3 font-display text-lg font-bold text-white">Calls in progress</h2>
            <ul className="space-y-3">
              {activeCalls.map((call) => (
                <li
                  key={call.id}
                  className="neu-inset flex items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5"
                >
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold text-white">
                      {call.startedByMe ? "Started by you" : `${call.startedByName} is calling you`}
                    </p>
                    <p className="truncate text-white/60">With {call.otherNames.join(", ")}</p>
                  </div>
                  <Link
                    href={`/call/${call.id}`}
                    className="neu-btn shrink-0 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white shadow-md"
                  >
                    Join
                  </Link>
                </li>
              ))}
            </ul>
          </GlassCard>
        )}

        <GlassCard className="anim-rise" style={delay(350)}>
          <h2 className="font-display text-lg font-bold text-white">Members</h2>
          <p className="mb-2 text-sm text-white/60">
            Online now and people you follow. Pick someone and start a video call.
          </p>
          <MembersCallList
            members={nearby}
            emptyText="Nobody online yet. Follow members to keep them here."
          />
        </GlassCard>
      </div>
    </>
  );
}

/**
 * L'ordre de la carte "Members" :
 * 0 = je le suis ET il est en ligne, 1 = en ligne, 2 = je le suis (hors ligne).
 */
function priority(member: MemberCard): number {
  if (member.following && member.online) return 0;
  if (member.online) return 1;
  return 2;
}
