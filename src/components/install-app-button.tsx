"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/** L'événement du navigateur qui permet d'ouvrir la fenêtre "Installer" (Chrome, Edge, Android). */
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STANDALONE = "(display-mode: standalone)";

/** Vrai si on est déjà dans l'application installée (pas dans un onglet du navigateur). */
function useInstalled() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(STANDALONE);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () =>
      window.matchMedia(STANDALONE).matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
    () => true, // côté serveur : on n'affiche rien
  );
}

const isApple = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/**
 * Bouton "Install app" en bas à droite : installe Tomes Club comme une vraie application
 * (icône sur l'écran d'accueil ou le bureau, fenêtre à part, sans barre du navigateur).
 * Chrome / Edge / Android : la fenêtre d'installation s'ouvre directement.
 * iPhone / autres : une petite aide explique comment faire.
 */
export function InstallAppButton() {
  const installed = useInstalled();
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [done, setDone] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    // Le service worker rend l'application installable.
    navigator.serviceWorker?.register("/sw.js").catch(() => {});

    const onPrompt = (event: Event) => {
      event.preventDefault(); // on garde l'événement pour notre propre bouton
      setPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setDone(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || done) return null;

  const install = async () => {
    if (!prompt) {
      setHelp((open) => !open);
      return;
    }
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    setPrompt(null);
    if (outcome === "accepted") setDone(true);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      {help && (
        <div
          role="dialog"
          aria-label="How to install Tomes Club"
          className="anim-rise w-72 rounded-2xl border border-white/15 bg-zinc-900/95 p-4 text-sm text-white/80 shadow-2xl backdrop-blur-md"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-display text-base font-bold text-white">Install Tomes Club</p>
            <button
              type="button"
              onClick={() => setHelp(false)}
              aria-label="Close"
              className="-mr-1 -mt-1 rounded-full px-2 text-lg leading-none text-white/50 hover:text-white"
            >
              ×
            </button>
          </div>
          {isApple() ? (
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Open this page in <b className="text-white">Safari</b>.</li>
              <li>Tap the <b className="text-white">Share</b> button <span aria-hidden>⬆️</span>.</li>
              <li>Choose <b className="text-white">Add to Home Screen</b>.</li>
            </ol>
          ) : (
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Open this page in <b className="text-white">Chrome</b> or <b className="text-white">Edge</b>.</li>
              <li>Open the browser menu <b className="text-white">⋮</b>.</li>
              <li>Choose <b className="text-white">Install app</b> (or <b className="text-white">Add to Home screen</b>).</li>
            </ol>
          )}
          <p className="mt-2 text-xs text-white/50">Then open Tomes Club from its icon, like any app.</p>
        </div>
      )}

      <button
        type="button"
        onClick={install}
        aria-label="Install the Tomes Club app"
        title="Install the app"
        className="group flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#9c0b3b,#c2185b)] p-3 text-white shadow-[0_12px_30px_-8px_rgba(156,11,59,0.8)] ring-1 ring-white/25 transition hover:scale-105 hover:brightness-110 active:scale-95 sm:px-5 sm:py-3"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4.5 17.5v1A2.5 2.5 0 0 0 7 21h10a2.5 2.5 0 0 0 2.5-2.5v-1" />
        </svg>
        <span className="text-sm font-bold max-sm:hidden">Install app</span>
      </button>
    </div>
  );
}
