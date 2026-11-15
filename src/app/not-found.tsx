import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found" };

// Page 404 : même fond que la connexion, le logo, et un bouton pour revenir.
export default function NotFound() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#1a1150,#45091f_52%,#7a082e)] px-6 py-16">
      <div aria-hidden className="absolute -right-24 -top-24 size-96 rounded-full bg-navy/50 blur-3xl" />
      <div aria-hidden className="absolute -bottom-32 -left-24 size-[28rem] rounded-full bg-accent/15 blur-3xl" />

      <div className="anim-rise relative z-10 w-full max-w-sm rounded-[2rem] border border-white/15 bg-white/10 px-8 py-10 text-center backdrop-blur-md">
        <Image src="/logo-mark.png" alt="Tomes Club" width={64} height={64} className="mx-auto" priority />
        <p className="mt-6 font-display text-7xl font-extrabold tracking-tight text-white">404</p>
        <h1 className="mt-2 font-display text-xl font-bold text-white">Page not found</h1>
        <p className="mt-2 text-sm text-white/65">
          This page does not exist or was moved. Let&apos;s go back to the club.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-brand px-7 py-3 text-sm font-bold text-white shadow-lg shadow-black/20 transition hover:brightness-110"
        >
          Back to Tomes Club
        </Link>
      </div>
    </main>
  );
}
