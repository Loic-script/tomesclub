"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { isApple, useInstallApp } from "@/components/install-app-button";

/** Vrai côté navigateur seulement (le serveur ne sait pas quel téléphone c'est). */
const useClient = () => useSyncExternalStore(() => () => {}, () => true, () => false);

// Le grand bouton « Installer », et les étapes quand le navigateur ne peut pas ouvrir la fenêtre lui-même.
export function InstallPanel() {
  const client = useClient();
  const { installed, canPrompt, install } = useInstallApp();
  const [steps, setSteps] = useState(false);

  if (!client) return <div className="h-14" />;

  if (installed) {
    return (
      <div className="space-y-4">
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          ✅ Tomes Club is installed on this device.
        </p>
        <Link href="/" className="block rounded-full bg-brand px-6 py-3.5 text-center text-sm font-bold text-white">
          Open Tomes Club
        </Link>
      </div>
    );
  }

  const apple = isApple();
  const showSteps = steps || apple || !canPrompt;

  return (
    <div className="space-y-4">
      {!apple && (
        <button
          type="button"
          onClick={async () => {
            if (!(await install())) setSteps(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#9c0b3b,#c2185b)] px-6 py-4 text-base font-bold text-white shadow-[0_14px_30px_-10px_rgba(156,11,59,0.8)] transition hover:brightness-110 active:scale-[0.98]"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4.5 17.5v1A2.5 2.5 0 0 0 7 21h10a2.5 2.5 0 0 0 2.5-2.5v-1" />
          </svg>
          Install the app
        </button>
      )}

      {showSteps && (
        <div className="rounded-2xl bg-zinc-50 px-4 py-3 text-left text-sm text-zinc-700 ring-1 ring-zinc-200">
          {apple ? (
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>Open this page in <b>Safari</b>.</li>
              <li>Tap the <b>Share</b> button <span aria-hidden>⬆️</span> at the bottom.</li>
              <li>Choose <b>Add to Home Screen</b>, then <b>Add</b>.</li>
            </ol>
          ) : (
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>Open this page in <b>Chrome</b> or <b>Edge</b>.</li>
              <li>Open the browser menu <b>⋮</b>.</li>
              <li>Choose <b>Install app</b> (or <b>Add to Home screen</b>).</li>
            </ol>
          )}
        </div>
      )}

      <Link href="/" className="block text-center text-sm font-semibold text-navy hover:underline">
        Or use it in the browser →
      </Link>
    </div>
  );
}
