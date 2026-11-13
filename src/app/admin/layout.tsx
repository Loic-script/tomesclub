import Image from "next/image";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { isAdmin } from "@/lib/admin";
import { countAdminUnread, countAdminUnreadByTab } from "@/lib/admin-notifications";
import { countUnreadForCoach } from "@/lib/coach-chat";
import { adminSignOut } from "../(auth)/admin/login/actions";
import { LogoutIcon } from "./admin-icons";
import { AdminBottomLinks, AdminLiveRefresh, AdminSideLinks, type AdminBadges } from "./admin-nav";

// Le cadre de l'espace admin : le même fond sombre et le même verre que l'espace membre.
// Grand écran : une barre latérale en verre. Téléphone : une pilule en bas.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="on-dark relative flex flex-1 flex-col overflow-hidden bg-[linear-gradient(160deg,#1a1150,#45091f_45%,#7a082e)]">
      {/* Lueurs douces, comme dans l'espace membre */}
      <div
        aria-hidden
        className="pointer-events-none fixed -right-24 -top-24 size-[30rem] rounded-full bg-navy/50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -bottom-32 left-1/4 size-[28rem] rounded-full bg-accent/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.035] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px]"
      />

      {/* ----- Barre latérale (grand écran) ----- */}
      <aside className="neu card-accent fixed inset-y-4 left-0 z-30 hidden w-64 flex-col rounded-r-[2rem] !border-l-0 p-4 lg:flex">
        {/* La marque : le logo dans une pastille blanche, le nom, et le badge "Admin" */}
        <Link
          href="/admin"
          className="group mb-6 flex items-center gap-3 rounded-2xl bg-black/15 p-2.5 ring-1 ring-white/15 transition hover:bg-black/20"
        >
          <span className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-lg shadow-black/25 ring-2 ring-white/40 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
            <Image src="/logo.png" alt="" width={36} height={36} className="size-9 object-contain" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-[17px] font-extrabold leading-tight tracking-tight text-white">
              Tomes Club
            </span>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-brand shadow-sm">
              <span aria-hidden className="size-1.5 rounded-full bg-emerald-500" />
              Admin
            </span>
          </span>
        </Link>

        {/* Le titre de section, avec un fin trait qui s'étire */}
        <p className="mb-2 flex items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">
          Manage
          <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-white/30 to-transparent" />
        </p>
        <Suspense fallback={<div className="h-56" />}>
          <SideLinksWithCount />
        </Suspense>

        <div className="mt-auto space-y-3">
          <form action={adminSignOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-accent"
            >
              <span className="flex size-8 items-center justify-center rounded-xl bg-white/[0.06]">
                <LogoutIcon className="size-[18px]" />
              </span>
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* ----- Le contenu ----- */}
      <main className="relative z-10 flex-1 lg:pl-72">
        {/* Le nom en haut, sur téléphone */}
        <div className="admin-top flex items-center gap-2.5 px-4 pt-5 sm:px-6 lg:hidden">
          <span className="font-display text-base font-extrabold text-white">Tomes Club</span>
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
            Admin
          </span>
          <form action={adminSignOut} className="ml-auto">
            <button
              type="submit"
              aria-label="Sign out"
              className="neu-sm neu-btn flex size-9 items-center justify-center rounded-full text-white/70 hover:text-accent"
            >
              <LogoutIcon className="size-4" />
            </button>
          </form>
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 pb-32 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-10">
          {children}
        </div>
      </main>

      {/* ----- Barre du bas (téléphone) ----- */}
      <Suspense fallback={null}>
        <BottomLinksWithCount />
      </Suspense>

      <Suspense fallback={null}>
        <LiveRefreshIfAdmin />
      </Suspense>
    </div>
  );
}

/** Les pastilles des onglets (0 sans session admin). */
async function loadBadges(): Promise<AdminBadges> {
  if (!(await isAdmin())) return { inbox: 0, messages: 0, overview: 0, members: 0, rooms: 0, events: 0 };
  const [inbox, messages, tabs] = await Promise.all([
    countAdminUnread(),
    countUnreadForCoach(),
    countAdminUnreadByTab(),
  ]);
  return { inbox, messages, ...tabs };
}

async function SideLinksWithCount() {
  return <AdminSideLinks badges={await loadBadges()} />;
}

async function BottomLinksWithCount() {
  return <AdminBottomLinks badges={await loadBadges()} />;
}

/** La mise à jour automatique : seulement pour une session admin valide. */
async function LiveRefreshIfAdmin() {
  return (await isAdmin()) ? <AdminLiveRefresh /> : null;
}
