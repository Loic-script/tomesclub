import type { Metadata } from "next";
import Image from "next/image";
import { InstallPanel } from "./install-panel";

export const metadata: Metadata = {
  title: "Install the app",
  description: "Install Tomes Club on your phone or computer, like a real app.",
};

// Page d'installation : le lien « Télécharger » du site misterrindra.mg arrive ici.
export default function InstallPage() {
  return (
    <div className="anim-rise w-full max-w-sm rounded-[2rem] bg-white px-7 py-9 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)] ring-1 ring-white/15 max-sm:min-h-dvh max-sm:max-w-none max-sm:rounded-none max-sm:ring-0">
      <Image src="/icons/icon-192.png" alt="Tomes Club" width={88} height={88} className="mx-auto" priority />
      <h1 className="mt-5 font-display text-2xl font-bold text-navy">Get the Tomes Club app</h1>
      <p className="mt-2 text-sm leading-6 text-zinc-500">
        Install it on your phone or computer: it opens from its own icon, in its own window, and rings
        when someone calls you.
      </p>
      <div className="mt-7">
        <InstallPanel />
      </div>
    </div>
  );
}
