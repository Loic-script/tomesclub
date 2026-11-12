"use client";

import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent, type KeyboardEvent } from "react";
import { MAX_MESSAGE_LENGTH, type ChatFile, type ChatMessage } from "@/lib/chat-types";
import { fileEmoji, formatSize } from "@/lib/file-kinds";

// Une discussion : les bulles + la zone pour écrire.
// Utilisée par le membre (bouton flottant) et par l'admin (page Messages).
// On peut envoyer des fichiers : bouton trombone, glisser-déposer, ou coller (Ctrl+V) une image.
// Les nouveaux messages arrivent tout seuls : on relit la discussion toutes les 4 secondes.

const EVERY_MS = 4000;
const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const dayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });

type Upload = { id: number; name: string; progress: number; error: string | null };

/** Envoie un fichier avec XMLHttpRequest (pour suivre l'avancement). */
function uploadFile(url: string, file: File, onProgress: (percent: number) => void): Promise<ChatMessage> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("content-type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      let data: { message?: ChatMessage; error?: string } | null = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // Réponse qui n'est pas du JSON (ex : refus de nginx)
      }
      if (xhr.status >= 200 && xhr.status < 300 && data?.message) resolve(data.message);
      else if (xhr.status === 413) reject(new Error("This file is too big."));
      else reject(new Error(data?.error ?? "The file was not sent. Try again."));
    };
    xhr.onerror = () => reject(new Error("No connection. Try again."));
    xhr.send(file);
  });
}

/** Un nom pour une image collée (le presse-papiers l'appelle souvent juste "image.png"). */
function nameOf(file: File): string {
  if (file.name && file.name !== "image.png") return file.name;
  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
  const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "");
  return `photo-${stamp}.${ext}`;
}

export function ChatThread({
  getUrl,
  postUrl,
  uploadUrl,
  extra,
  side,
  emptyText,
  onSent,
}: {
  /** L'adresse qui donne les messages */
  getUrl: string;
  /** L'adresse pour envoyer un message */
  postUrl: string;
  /** L'adresse pour envoyer un fichier (on ajoute ?name=...) */
  uploadUrl: string;
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
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragging, setDragging] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Augmente à chaque envoi : une lecture commencée avant l'envoi est ignorée.
  const version = useRef(0);
  const uploadCounter = useRef(0);
  const queue = useRef<Promise<void>>(Promise.resolve());

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

  // À chaque nouveau message (ou envoi en cours), on descend en bas de la discussion.
  const lastId = messages?.[messages.length - 1]?.id;
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [lastId, uploads.length]);

  /** Ajoute un message envoyé à la discussion. */
  function addMine(message: ChatMessage) {
    version.current += 1;
    setMessages((previous) => [...(previous ?? []).filter((item) => item.id !== message.id), message]);
    onSent?.(message);
  }

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
      addMine(message);
      setText("");
    } catch {
      setError("No connection. Try again.");
    } finally {
      setSending(false);
    }
  }

  /** Envoie des fichiers, un par un (dans l'ordre). */
  function sendFiles(files: File[]) {
    for (const file of files) {
      const id = ++uploadCounter.current;
      const name = nameOf(file);
      setUploads((list) => [...list, { id, name, progress: 0, error: null }]);
      queue.current = queue.current.then(async () => {
        const url = `${uploadUrl}${uploadUrl.includes("?") ? "&" : "?"}name=${encodeURIComponent(name)}`;
        try {
          const message = await uploadFile(url, file, (progress) =>
            setUploads((list) => list.map((item) => (item.id === id ? { ...item, progress } : item))),
          );
          addMine(message);
          setUploads((list) => list.filter((item) => item.id !== id));
        } catch (problem) {
          const message = problem instanceof Error ? problem.message : "The file was not sent.";
          setUploads((list) => list.map((item) => (item.id === id ? { ...item, error: message } : item)));
        }
      });
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Entrée = envoyer. Maj + Entrée = aller à la ligne.
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  }

  /** Coller (Ctrl+V) une capture d'écran ou un fichier copié : il part tout de suite. */
  function onPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const files = Array.from(event.clipboardData.files);
    if (files.length === 0) return;
    event.preventDefault();
    sendFiles(files);
  }

  function onDragOver(event: DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    setDragging(true);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) sendFiles(files);
  }

  let previousDay = "";

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      onDragOver={onDragOver}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={onDrop}
    >
      {/* Le cadre qui apparaît quand on glisse un fichier */}
      {dragging && (
        <div className="pointer-events-none absolute inset-2 z-10 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-accent bg-[#22103a]/85 text-center backdrop-blur-sm">
          <span className="text-3xl">📎</span>
          <p className="mt-2 font-semibold text-white">Drop to send</p>
          <p className="text-xs text-white/60">Photos, videos, documents...</p>
        </div>
      )}

      <div ref={listRef} className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-4 py-4">
        {messages === null ? (
          <p className="pt-10 text-center text-sm text-white/50">Loading...</p>
        ) : messages.length === 0 && uploads.length === 0 ? (
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
            const media = message.file && ["image", "video"].includes(message.file.kind);
            return (
              <div key={message.id}>
                {showDay && (
                  <p className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-white/35">
                    {day}
                  </p>
                )}
                <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl text-sm leading-relaxed shadow-sm ${
                      media ? "p-1" : "px-3.5 py-2"
                    } ${
                      mine
                        ? "rounded-br-md bg-gradient-to-br from-accent to-brand text-white"
                        : "rounded-bl-md bg-white/10 text-white"
                    }`}
                  >
                    {message.file && <Attachment file={message.file} mine={mine} />}
                    {message.body && (
                      <p className={`whitespace-pre-wrap break-words ${message.file ? "mt-1.5" : ""}`}>
                        {message.body}
                      </p>
                    )}
                    <p
                      className={`mt-0.5 text-right text-[10px] ${mine ? "text-white/70" : "text-white/40"} ${
                        media ? "px-2 pb-0.5" : ""
                      }`}
                    >
                      {timeFormat.format(date)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Les fichiers en train de partir */}
        {uploads.map((upload) => (
          <div key={upload.id} className="flex justify-end">
            <div className="w-56 max-w-[80%] rounded-2xl rounded-br-md bg-white/10 px-3.5 py-2.5 text-sm text-white">
              <p className="truncate font-medium">📎 {upload.name}</p>
              {upload.error ? (
                <div className="mt-1 flex items-center gap-2">
                  <p className="flex-1 text-xs text-red-300">{upload.error}</p>
                  <button
                    type="button"
                    onClick={() => setUploads((list) => list.filter((item) => item.id !== upload.id))}
                    className="text-xs font-semibold text-white/60 hover:text-white"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-brand transition-[width]"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="px-4 pb-1 text-xs font-medium text-red-300">{error}</p>}

      <div className="flex items-end gap-2 border-t border-white/10 p-3">
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(event) => {
            sendFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Send a photo or a file"
          title="Photo, video, file..."
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden>
            <path d="m21 11.5-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.6-8.6a3.7 3.7 0 0 1 5.2 5.2l-8.6 8.6a1.8 1.8 0 0 1-2.6-2.6l7.9-7.9" />
          </svg>
        </button>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          rows={1}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder="Write a message..."
          aria-label="Your message"
          className="max-h-28 min-h-10 min-w-0 flex-1 resize-none rounded-2xl bg-white/10 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-accent/60"
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

/** Le fichier dans la bulle : la photo, la vidéo, le son, ou une carte à télécharger. */
function Attachment({ file, mine }: { file: ChatFile; mine: boolean }) {
  if (file.kind === "image") {
    return (
      <a href={file.url} target="_blank" rel="noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element -- fichier privé servi par notre API */}
        <img src={file.url} alt={file.name} loading="lazy" className="max-h-72 w-auto max-w-full rounded-xl object-contain" />
      </a>
    );
  }
  if (file.kind === "video") {
    return <video src={file.url} controls preload="metadata" className="max-h-72 w-full max-w-sm rounded-xl bg-black" />;
  }
  return (
    <div className="min-w-0">
      {file.kind === "audio" && <audio src={file.url} controls preload="metadata" className="mb-1.5 w-60 max-w-full" />}
      <a
        href={`${file.url}?download=1`}
        className={`flex items-center gap-3 rounded-xl px-2.5 py-2 transition ${
          mine ? "bg-black/15 hover:bg-black/25" : "bg-white/10 hover:bg-white/15"
        }`}
      >
        <span className="text-2xl">{fileEmoji(file.kind, file.name)}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{file.name}</span>
          <span className={`block text-[11px] ${mine ? "text-white/75" : "text-white/50"}`}>
            {formatSize(file.size)} · Download
          </span>
        </span>
      </a>
    </div>
  );
}
