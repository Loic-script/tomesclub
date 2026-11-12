"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChatThread } from "./chat-thread";

// Le bouton rond qui flotte en bas à droite de l'espace membre :
// il ouvre la discussion avec le coach. Une pastille montre les messages pas lus.

const PEEK_MS = 20 * 1000;

export function CoachChat() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  // Fenêtre fermée : on regarde de temps en temps s'il y a un nouveau message.
  useEffect(() => {
    if (open) return;
    let alive = true;
    const peek = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const response = await fetch("/api/chat?peek=1", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { unread?: number };
        if (alive) setUnread(data.unread ?? 0);
      } catch {
        // Pas de réseau : on réessaie plus tard.
      }
    };
    void peek();
    const timer = setInterval(peek, PEEK_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [open]);

  // La touche Échap ferme la fenêtre.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function toggle() {
    setOpen((value) => !value);
    setUnread(0);
  }

  return (
    <>
      {open && (
        <section
          role="dialog"
          aria-label="Chat with your coach"
          className="anim-pop fixed inset-x-3 bottom-24 z-50 flex h-[min(70dvh,520px)] flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#22103a]/95 shadow-2xl shadow-black/50 backdrop-blur-xl sm:inset-x-auto sm:right-6 sm:w-[360px]"
        >
          <header className="flex items-center gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-3">
            <Image src="/logo.png" alt="" width={38} height={38} className="rounded-full ring-2 ring-white/20" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base font-bold text-white">Your coach</p>
              <p className="truncate text-[11px] text-white/50">Tomes Club · ask anything</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close the chat"
              className="flex size-9 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </header>
          <ChatThread
            getUrl="/api/chat"
            postUrl="/api/chat"
            uploadUrl="/api/chat/files"
            side="member"
            emptyText="Say hello to your coach! Ask a question about English, the classes or the app."
          />
        </section>
      )}

      {/* Le bouton flottant (caché sur téléphone quand la fenêtre est ouverte) */}
      <button
        type="button"
        onClick={toggle}
        aria-label={open ? "Close the chat" : unread > 0 ? `Messages: ${unread} new` : "Message your coach"}
        aria-expanded={open}
        className={`fixed bottom-24 right-4 z-50 size-14 items-center justify-center rounded-full bg-gradient-to-br from-accent to-brand text-white shadow-xl shadow-black/40 ring-1 ring-white/25 transition duration-300 hover:scale-110 active:scale-95 sm:bottom-6 sm:right-6 ${
          open ? "hidden sm:flex" : "flex"
        }`}
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-6" aria-hidden>
            <path d="m6 9 6 6 6-6" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-6" aria-hidden>
            <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.4A8.5 8.5 0 1 1 21 11.5Z" />
            <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" />
          </svg>
        )}
        {!open && unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-brand shadow">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
}
