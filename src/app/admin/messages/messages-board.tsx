"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChatThread } from "@/components/chat-thread";
import { MemberAvatar } from "@/components/member-avatar";
import type { ChatMessage, Conversation } from "@/lib/chat-types";
import { ChatIcon, SearchIcon } from "../admin-icons";

// La messagerie de l'admin : la liste des membres à gauche, la discussion à droite.
// Sur téléphone : la liste, puis la discussion en plein écran (bouton retour).

const LIST_MS = 8000;
const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

/** "12:29" si c'est aujourd'hui, sinon "12 Nov". */
function shortTime(iso: string): string {
  const date = new Date(iso);
  return date.toDateString() === new Date().toDateString() ? timeFormat.format(date) : dateFormat.format(date);
}

export function MessagesBoard({
  initial,
  initialUser,
}: {
  initial: Conversation[];
  initialUser: string | null;
}) {
  const [conversations, setConversations] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialUser && initial.some((item) => item.userId === initialUser) ? initialUser : null,
  );
  const [search, setSearch] = useState("");

  // La liste se met à jour toute seule (nouveaux messages, pastilles).
  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const response = await fetch("/api/admin/chat", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { conversations?: Conversation[] };
        if (alive && data.conversations) setConversations(data.conversations);
      } catch {
        // Pas de réseau : on réessaie au prochain tour.
      }
    };
    const timer = setInterval(load, LIST_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const selected = conversations.find((item) => item.userId === selectedId) ?? null;

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? conversations.filter((item) => item.name.toLowerCase().includes(query)) : conversations;
  }, [conversations, search]);

  /** Mon message vient de partir : la discussion remonte en haut de la liste. */
  function onSent(message: ChatMessage) {
    setConversations((list) => {
      const updated = list.map((item) =>
        item.userId === selectedId
          ? { ...item, lastBody: message.body, lastFromCoach: true, lastAt: message.createdAt, unread: 0 }
          : item,
      );
      return [...updated].sort((a, b) => {
        if (a.lastAt && b.lastAt) return a.lastAt < b.lastAt ? 1 : -1;
        if (a.lastAt) return -1;
        if (b.lastAt) return 1;
        return a.name.localeCompare(b.name);
      });
    });
  }

  return (
    <div className="neu anim-rise grid h-[calc(100dvh-14rem)] min-h-[440px] overflow-hidden rounded-3xl lg:h-[calc(100dvh-10rem)] lg:grid-cols-[320px_1fr]">
      {/* ----- La liste des membres ----- */}
      <aside className={`min-h-0 flex-col border-white/10 lg:flex lg:border-r ${selected ? "hidden" : "flex"}`}>
        <div className="p-3">
          <label className="neu-inset flex items-center gap-2 rounded-full px-4 py-2.5">
            <SearchIcon className="size-4 text-white/50" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search a member"
              aria-label="Search a member"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
            />
          </label>
        </div>
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-3">
          {visible.length === 0 && <li className="px-3 py-8 text-center text-sm text-white/50">No member found.</li>}
          {visible.map((item) => {
            const active = item.userId === selectedId;
            return (
              <li key={item.userId}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(item.userId);
                    setConversations((list) =>
                      list.map((row) => (row.userId === item.userId ? { ...row, unread: 0 } : row)),
                    );
                  }}
                  aria-current={active ? "true" : undefined}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                    active ? "bg-white/[0.12]" : "hover:bg-white/[0.06]"
                  }`}
                >
                  <MemberAvatar userId={item.userId} name={item.name} hasPhoto={item.hasPhoto} size="size-11" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className={`min-w-0 flex-1 truncate text-sm text-white ${item.unread ? "font-bold" : "font-semibold"}`}>
                        {item.name}
                      </span>
                      {item.lastAt && <span className="shrink-0 text-[10px] text-white/40">{shortTime(item.lastAt)}</span>}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className={`min-w-0 flex-1 truncate text-xs ${item.unread ? "font-semibold text-white" : "text-white/50"}`}>
                        {item.lastBody ? `${item.lastFromCoach ? "You: " : ""}${item.lastBody}` : "No message yet"}
                      </span>
                      {item.unread > 0 && (
                        <span className="flex min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-navy">
                          {item.unread > 9 ? "9+" : item.unread}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* ----- La discussion ----- */}
      <section className={`min-h-0 min-w-0 flex-col lg:flex ${selected ? "flex" : "hidden"}`}>
        {selected ? (
          <>
            <header className="flex items-center gap-3 border-b border-white/10 bg-white/[0.04] px-3 py-3 sm:px-4">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label="Back to the list"
                className="flex size-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white lg:hidden"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden>
                  <path d="m15 6-6 6 6 6" />
                </svg>
              </button>
              <MemberAvatar userId={selected.userId} name={selected.name} hasPhoto={selected.hasPhoto} size="size-10" />
              <p className="min-w-0 flex-1 truncate font-display text-base font-bold text-white">{selected.name}</p>
              <Link
                href={`/admin/members/${selected.userId}`}
                className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
              >
                Profile
              </Link>
            </header>
            <ChatThread
              key={selected.userId}
              getUrl={`/api/admin/chat?user=${encodeURIComponent(selected.userId)}`}
              postUrl="/api/admin/chat"
              extra={{ userId: selected.userId }}
              side="coach"
              emptyText={`No message yet. Write the first one to ${selected.name}.`}
              onSent={onSent}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <span className="flex size-16 items-center justify-center rounded-3xl bg-white/10 text-white/60">
              <ChatIcon className="size-7" />
            </span>
            <p className="mt-4 font-semibold text-white">Choose a member</p>
            <p className="mt-1 max-w-xs text-sm text-white/50">Pick someone in the list to read or write a message.</p>
          </div>
        )}
      </section>
    </div>
  );
}
