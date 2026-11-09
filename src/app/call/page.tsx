import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { listActiveCalls, listOtherMembers } from "@/lib/calls";
import { requireUser } from "@/lib/session";
import { NewCallForm } from "./new-call-form";

export const metadata: Metadata = { title: "Video call" };

// Page /call : choisir des membres et lancer un appel vidéo.
export default function CallPage() {
  return (
    <main className="flex flex-1 justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-xl space-y-6">
        <Link href="/" className="text-sm font-semibold text-brand hover:underline">
          ← Home
        </Link>
        <h1 className="text-3xl font-bold text-navy">Video call</h1>

        {/* Lit la session : doit être dans un <Suspense>. */}
        <Suspense
          fallback={
            <Card>
              <p className="text-zinc-500">Loading...</p>
            </Card>
          }
        >
          <CallDashboard />
        </Suspense>
      </div>
    </main>
  );
}

async function CallDashboard() {
  const user = await requireUser();
  const [members, activeCalls] = await Promise.all([
    listOtherMembers(user.id),
    listActiveCalls(user.id),
  ]);

  return (
    <>
      {activeCalls.length > 0 && (
        <Card>
          <h2 className="mb-3 text-lg font-bold text-navy">Calls in progress</h2>
          <ul className="space-y-3">
            {activeCalls.map((call) => (
              <li
                key={call.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-cream/60 px-3 py-2.5"
              >
                <div className="min-w-0 text-sm">
                  <p className="font-semibold text-zinc-900">
                    {call.startedByMe ? "Started by you" : `${call.startedByName} is calling you`}
                  </p>
                  <p className="truncate text-zinc-600">With {call.otherNames.join(", ")}</p>
                </div>
                <Link
                  href={`/call/${call.id}`}
                  className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                >
                  Join
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-bold text-navy">Start a new call</h2>
        <p className="mb-4 text-sm text-zinc-600">Choose the people you want to call.</p>
        <NewCallForm members={members} />
      </Card>
    </>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <section className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5">{children}</section>;
}
