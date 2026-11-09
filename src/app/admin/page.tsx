import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { adminSignOut } from "../(auth)/admin/login/actions";

export const metadata: Metadata = { title: "Admin" };

// Page /admin : le tableau de bord de l'équipe (protégé par la session admin).
export default function AdminPage() {
  return (
    <main className="flex flex-1 flex-col bg-cream">
      <Suspense fallback={<p className="m-auto text-zinc-500">Loading...</p>}>
        <AdminHome />
      </Suspense>
    </main>
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
      <header className="mb-8 flex items-center gap-4">
        <Image src="/logo.jpeg" alt="" width={56} height={56} preload className="rounded-2xl shadow" />
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">Tomes Club — Admin</h1>
          <p className="text-sm text-zinc-600">Club overview</p>
        </div>
        <form action={adminSignOut} className="ml-auto">
          <button
            type="submit"
            className="rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
          >
            Sign out
          </button>
        </form>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Members" value={members} />
        <StatCard label="Completed profiles" value={completedProfiles} />
        <StatCard label="Video calls created" value={calls} />
      </div>

      <p className="mt-8 text-sm text-zinc-500">
        More admin tools (classes, schedules, members management) will appear here.
      </p>
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
