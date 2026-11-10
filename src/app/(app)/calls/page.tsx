import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { delay, GlassCard, PageHeader } from "@/components/app-ui";
import { listActiveCalls, listCallableMembers } from "@/lib/calls";
import { requireMember } from "@/lib/session";
import { MembersCallList } from "./members-call-list";
import { RandomSearchCard } from "./random-search";

export const metadata: Metadata = { title: "Calls" };

// Page /calls : appeler un membre, ou se faire appeler par le hasard.
export default function CallsPage() {
  return (
    <Suspense fallback={<p className="pt-20 text-center text-mute">Loading...</p>}>
      <CallsHome />
    </Suspense>
  );
}

async function CallsHome() {
  const user = await requireMember();
  const [members, activeCalls] = await Promise.all([
    listCallableMembers(user.id),
    listActiveCalls(user.id),
  ]);

  return (
    <>
      <PageHeader title="Calls" subtitle={`Ready to speak English, ${user.firstName}?`} />

      <div className="space-y-5">
        <div className="anim-rise" style={delay(150)}>
          <RandomSearchCard />
        </div>

        {activeCalls.length > 0 && (
          <GlassCard className="anim-rise" style={delay(250)}>
            <h2 className="mb-3 font-display text-lg font-bold text-ink">Calls in progress</h2>
            <ul className="space-y-3">
              {activeCalls.map((call) => (
                <li
                  key={call.id}
                  className="neu-inset flex items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5"
                >
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold text-ink">
                      {call.startedByMe ? "Started by you" : `${call.startedByName} is calling you`}
                    </p>
                    <p className="truncate text-mute">With {call.otherNames.join(", ")}</p>
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
          <h2 className="font-display text-lg font-bold text-ink">Members</h2>
          <p className="mb-2 text-sm text-mute">Pick someone and start a video call.</p>
          <MembersCallList members={members} />
        </GlassCard>
      </div>
    </>
  );
}
