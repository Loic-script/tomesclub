"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { MAX_MESSAGE_LENGTH, type ChatMessage } from "@/lib/chat-types";

// Une discussion : les bulles + la zone pour écrire.
// Utilisée par le membre (bouton flottant) et par l'admin (page Messages).
// Les nouveaux messages arrivent tout seuls : on relit la discussion toutes les 4 secondes.

const EVERY_MS = 4000;
const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const dayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });

export function ChatThread({
  getUrl,
  postUrl,
  extra,
  side,
  emptyText,
  onSent,
}: {
  /** L'adresse qui donne les messages */
  getUrl: string;
  /** L'adresse pour envoyer un message */
  postUrl: string;
  /** Données ajoutées à l'envoi (ex : { userId } côté admin) */
  extra?: Record<string, string>;
  /** Qui je suis : mes messages sont à droite */
  side: "member" | "coach";
  emptyText: string;
  onSent?: (message: ChatMessage) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Augmente à chaque envoi : une lecture commencée avant l'envoi est ignorée.
  const version = useRef(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (document.visibilityState === "hidden") return;
      const startedAt = version.current;
      try {
        const response = await fetch(getUrl, { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { messages?: ChatMessage[] };
        if (alive && data.messages && startedAt === version.current) setMessages(data.messages);
      } catch {
        // Pas de réseau : on réessaie au prochain tour.
      }
    };
    void load();
    const timer = setInterval(load, EVERY_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [getUrl]);

  // À chaque nouveau message, on descend en bas de la discussion.
  const lastId = messages?.[messages.length - 1]?.id;
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [lastId]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const response = await fetch(postUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...extra, body }),
      });
      const data = (await response.json().catch(() => null)) as { message?: ChatMessage; error?: string } | null;
      const message = data?.message;
      if (!response.ok || !message) {
        setError(data?.error ?? "The message was not sent. Try again.");
        return;
      }
      version.current += 1;
      setMessages((previous) => [...(previous ?? []).filter((item) => item.id !== message.id), message]);
      setText("");
      onSent?.(message);
    } catch {
      setError("No connection. Try again.");
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Entrée = envoyer. Maj + Entrée = aller à la ligne.
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  }

  let previousDay = "";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={listRef} className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-4 py-4">
        {messages === null ? (
          <p className="pt-10 text-center text-sm text-white/50">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="mx-auto max-w-[16rem] pt-10 text-center text-sm leading-relaxed text-white/50">
            {emptyText}
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.fromCoach === (side === "coach");
            const date = new Date(message.createdAt);
            const day = dayFormat.format(date);
            const showDay = day !== previousDay;
            previousDay = day;
            return (
              <div key={message.id}>
                {showDay && (
                  <p className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-white/35">
                    {day}
                  </p>
                )}
                <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                      mine
                        ? "rounded-br-md bg-gradient-to-br from-accent to-brand text-white"
                        : "rounded-bl-md bg-white/10 text-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.body}</p>
                    <p className={`mt-0.5 text-right text-[10px] ${mine ? "text-white/70" : "text-white/40"}`}>
                      {timeFormat.format(date)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && <p className="px-4 pb-1 text-xs font-medium text-red-300">{error}</p>}

      <div className="flex items-end gap-2 border-t border-white/10 p-3">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder="Write a message..."
          aria-label="Your message"
          className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl bg-white/10 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-accent/60"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={sending || !text.trim()}
          aria-label="Send"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-brand text-white shadow-lg shadow-brand/30 transition hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-[18px]" aria-hidden>
            <path d="M21 3 10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5 21 3Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
