import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Admin" };

// Page /admin : le tableau de bord de l'équipe (protégé par la session admin).
export default function AdminPage() {
  return (
    <Suspense fallback={<p className="m-auto text-zinc-500">Loading...</p>}>
      <AdminHome />
    </Suspense>
  );
}

async function AdminHome() {
  await requireAdmin();

  const [members, completedProfiles, calls] = await Promise.all([
    prisma.user.count(),
    prisma.profile.count({ where: { completedAt: { not: null } } }),
    prisma.call.count(),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="mb-6 font-display text-2xl font-bold text-navy">Club overview</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Members" value={members} />
        <StatCard label="Completed profiles" value={completedProfiles} />
        <StatCard label="Video calls created" value={calls} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/admin/members"
          className="inline-block rounded-lg bg-navy px-5 py-2.5 font-semibold text-white transition hover:bg-navy/90"
        >
          Manage members →
        </Link>
        <Link
          href="/admin/events"
          className="inline-block rounded-lg bg-brand px-5 py-2.5 font-semibold text-white transition hover:bg-brand-dark"
        >
          Events & announcements →
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-sm text-zinc-600">{label}</p>
      <p className="font-display text-3xl font-bold text-brand">{value}</p>
    </div>
  );
}
