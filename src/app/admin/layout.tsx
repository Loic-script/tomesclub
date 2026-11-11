import Image from "next/image";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { isAdmin } from "@/lib/admin";
import { countAdminUnread } from "@/lib/admin-notifications";
import { adminSignOut } from "../(auth)/admin/login/actions";
import { LogoutIcon } from "./admin-icons";
import { AdminBottomLinks, AdminLiveRefresh, AdminSideLinks } from "./admin-nav";

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
      <aside className="neu fixed inset-y-4 left-4 z-30 hidden w-64 flex-col rounded-[2rem] p-4 lg:flex">
        <Link href="/admin" className="mb-8 flex items-center gap-3 px-2 pt-2">
          <span className="relative flex size-11 items-center justify-center">
            <span aria-hidden className="anim-halo absolute inset-0 rounded-full bg-accent/40 blur-md" />
            <Image
              src="/logo.png"
              alt=""
              width={40}
              height={40}
              className="relative rounded-full ring-2 ring-white/20"
            />
          </span>
          <span>
            <span className="block font-display text-lg font-extrabold leading-tight text-white">
              Tomes Club
            </span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              Admin
            </span>
          </span>
        </Link>

        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Manage</p>
        <Suspense fallback={<div className="h-56" />}>
          <SideLinksWithCount />
        </Suspense>

        <div className="mt-auto space-y-3">
          <div className="neu-inset rounded-2xl p-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-white">
              <span className="relative flex size-2">
                <span className="anim-ping absolute inset-0 rounded-full bg-emerald-300" />
                <span className="relative size-2 rounded-full bg-emerald-300" />
              </span>
              Live
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-white/50">
              Members, rooms and notifications update every 30 seconds.
            </p>
          </div>
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
        {/* Le logo en haut, sur téléphone */}
        <div className="flex items-center gap-2.5 px-4 pt-5 sm:px-6 lg:hidden">
          <Image src="/logo.png" alt="" width={30} height={30} className="rounded-full ring-2 ring-white/20" />
          <span className="font-display text-base font-extrabold text-white">Tomes Club</span>
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
            Admin
          </span>
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

async function SideLinksWithCount() {
  const unread = (await isAdmin()) ? await countAdminUnread() : 0;
  return <AdminSideLinks unread={unread} />;
}

async function BottomLinksWithCount() {
  const unread = (await isAdmin()) ? await countAdminUnread() : 0;
  return <AdminBottomLinks unread={unread} signOut={adminSignOut} />;
}

/** La mise à jour automatique : seulement pour une session admin valide. */
async function LiveRefreshIfAdmin() {
  return (await isAdmin()) ? <AdminLiveRefresh /> : null;
}
