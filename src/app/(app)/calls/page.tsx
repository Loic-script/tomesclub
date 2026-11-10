import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { delay, PageHeader, PageSkeleton, SectionHeader } from "@/components/app-ui";
import { VideoIcon } from "@/components/icons";
import { listActiveCalls, listCallableMembers } from "@/lib/calls";
import { listMembers } from "@/lib/members";
import { requireMember } from "@/lib/session";
import { MembersCallList } from "./members-call-list";
import { RandomSearchCard } from "./random-search";

export const metadata: Metadata = { title: "Calls" };

// Page /calls : appeler un membre, ou laisser le hasard choisir un partenaire.
export default function CallsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CallsHome />
    </Suspense>
  );
}

async function CallsHome() {
  const user = await requireMember();
  const [members, activeCalls, presence] = await Promise.all([
    listCallableMembers(user.id),
    listActiveCalls(user.id),
    // Seulement pour savoir qui est en ligne (pastille verte).
    listMembers(user.id, 0),
  ]);

  const onlineIds = new Set(presence.filter((member) => member.online).map((member) => member.id));
  // Les membres en ligne d'abord ; sinon l'ordre reste celui de la liste (par prénom).
  const callable = members
    .map((member) => ({ ...member, online: onlineIds.has(member.id) }))
    .sort((a, b) => Number(b.online) - Number(a.online));
  const onlineCount = callable.filter((member) => member.online).length;

  return (
    <>
      <PageHeader
        title="Calls"
        subtitle={`Speak English face to face, ${user.firstName}: with a random partner or someone you choose.`}
      />

      <div className="space-y-8">
        {/* ----- Un appel en cours : on le rejoint d'abord ----- */}
        {activeCalls.length > 0 && (
          <section aria-labelledby="live-calls" className="anim-rise" style={delay(60)}>
            <SectionHeader id="live-calls" title="Calls in progress" count={activeCalls.length} />
            <ul className="grid gap-3 md:grid-cols-2">
              {activeCalls.map((call) => (
                <li
                  key={call.id}
                  className="card flex items-center gap-4 border-brand-200 bg-brand-50 p-4"
                >
                  <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                    <span aria-hidden className="anim-ping absolute inset-0 rounded-full bg-brand/40" />
                    <VideoIcon className="relative size-5" />
                  </span>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold text-ink">
                      {call.startedByMe ? "Started by you" : `${call.startedByName} is calling you`}
                    </p>
                    <p className="truncate text-mute">With {call.otherNames.join(", ")}</p>
                  </div>
                  <Link href={`/call/${call.id}`} className="btn btn-primary shrink-0">
                    Join
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ----- L'action principale : un partenaire au hasard ----- */}
        <div className="anim-rise" style={delay(120)}>
          <RandomSearchCard />
        </div>

        {/* ----- Ou choisir quelqu'un ----- */}
        <section aria-labelledby="call-members" className="anim-rise" style={delay(200)}>
          <SectionHeader
            id="call-members"
            title="Call a member"
            description="Choose someone and start a video call."
            action={
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-mute">
                <span
                  aria-hidden
                  className={`size-2 rounded-full ${onlineCount > 0 ? "bg-success" : "bg-line-strong"}`}
                />
                {onlineCount} online
              </span>
            }
          />
          <MembersCallList members={callable} />
        </section>
      </div>
    </>
  );
}
