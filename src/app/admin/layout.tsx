import Image from "next/image";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { adminSignOut } from "../(auth)/admin/login/actions";
import { AdminNav } from "./admin-nav";

// Le cadre commun de l'espace admin : en-tête, onglets, déconnexion.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 flex-col bg-cream">
      <header className="border-b border-black/5 bg-cream/80 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center gap-3">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl border border-zinc-100 bg-white shadow-sm">
              <Image src="/logo.png" alt="" width={32} height={32} className="rounded-full" />
            </span>
            <span>
              <span className="block font-display text-lg font-bold leading-tight text-navy">
                Tomes Club
              </span>
              <span className="block text-xs text-mute">Admin area</span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-3">
            {/* Les onglets lisent l'adresse de la page : obligatoire dans un <Suspense>. */}
            <Suspense fallback={<div className="h-9" />}>
              <AdminNav />
            </Suspense>
            <form action={adminSignOut}>
              <button
                type="submit"
                className="rounded-full border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {children}
    </main>
  );
}
