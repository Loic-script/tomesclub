"use client";

import { RoomEvent, type RemoteParticipant, type Room } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { fileEmoji, type ActivityFileView } from "@/lib/file-kinds";

// "La scène" : l'hôte montre un fichier de l'activité (PowerPoint en PDF, PDF, photo,
// vidéo, audio) à tout le monde. L'hôte contrôle (page, lecture, pause, avancer...),
// les participants regardent. Ce n'est pas un partage d'écran : chacun charge le
// fichier chez lui, et LiveKit envoie seulement les ordres (canal "stage").

const TOPIC = "stage";
/** Pendant la lecture, l'hôte redonne la position toutes les 2 s (pour rester ensemble). */
const HEARTBEAT_MS = 2000;
/** Écart toléré avant de recaler la vidéo d'un participant. */
const DRIFT_S = 1.2;

export type StageFile = Pick<ActivityFileView, "id" | "name" | "kind" | "viewKind" | "url">;
export type StageState = {
  file: StageFile;
  page: number;
  playing: boolean;
  time: number;
  /** Le nom de la personne qui montre. */
  by: string;
};

type Message = { t: "show"; state: StageState } | { t: "stop" };

/* ---------- Le crochet : l'état de la scène, partagé par LiveKit ---------- */

export function useStage(room: Room, isHost: boolean) {
  const [state, setState] = useState<StageState | null>(null);
  const latest = useRef<StageState | null>(null);

  const send = useCallback(
    (message: Message) => {
      if (room.state !== "connected") return;
      const data = new TextEncoder().encode(JSON.stringify(message));
      void room.localParticipant.publishData(data, { reliable: true, topic: TOPIC }).catch(() => {});
    },
    [room],
  );

  /** L'hôte change quelque chose : chez lui tout de suite, et chez les autres. */
  const publish = useCallback(
    (next: StageState | null, render = true) => {
      latest.current = next;
      if (render) setState(next);
      send(next ? { t: "show", state: next } : { t: "stop" });
    },
    [send],
  );

  // Recevoir les ordres de l'hôte.
  useEffect(() => {
    const onData = (payload: Uint8Array, participant?: RemoteParticipant, _kind?: unknown, topic?: string) => {
      if (topic !== TOPIC || !participant) return;
      let message: Message;
      try {
        message = JSON.parse(new TextDecoder().decode(payload)) as Message;
      } catch {
        return;
      }
      if (message.t === "stop") {
        latest.current = null;
        setState(null);
      } else if (message.t === "show" && message.state?.file?.id) {
        latest.current = message.state;
        setState(message.state);
      }
    };
    room.on(RoomEvent.DataReceived, onData);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
    };
  }, [room]);

  // Quelqu'un arrive : l'hôte lui envoie ce qui est montré.
  useEffect(() => {
    if (!isHost) return;
    const greet = () => {
      if (latest.current) send({ t: "show", state: latest.current });
    };
    room.on(RoomEvent.ParticipantConnected, greet);
    return () => {
      room.off(RoomEvent.ParticipantConnected, greet);
    };
  }, [room, isHost, send]);

  const show = useCallback(
    (file: StageFile) =>
      publish({ file, page: 1, playing: false, time: 0, by: room.localParticipant.name || "Host" }),
    [publish, room],
  );
  const stop = useCallback(() => publish(null), [publish]);
  const setPage = useCallback(
    (page: number) => {
      if (latest.current) publish({ ...latest.current, page });
    },
    [publish],
  );
  /** Lecture / pause / position de la vidéo (sans redessiner chez l'hôte). */
  const setMedia = useCallback(
    (playing: boolean, time: number) => {
      if (latest.current) publish({ ...latest.current, playing, time }, false);
    },
    [publish],
  );

  return { state, show, stop, setPage, setMedia };
}

export type Stage = ReturnType<typeof useStage>;

/* ---------- L'affichage de la scène ---------- */

export function StageView({
  stage,
  isHost,
  onOpenFiles,
}: {
  stage: Stage;
  isHost: boolean;
  onOpenFiles: () => void;
}) {
  const current = stage.state;
  if (!current) return null;
  const { file } = current;

  return (
    <section
      aria-label={`Shared file: ${file.name}`}
      className="relative flex min-h-0 flex-1 flex-col bg-zinc-950"
    >
      {/* La barre du fichier */}
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-zinc-900/90 px-3 py-2">
        <span aria-hidden className="text-lg">
          {fileEmoji(file.kind, file.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">{file.name}</span>
          <span className="block text-[11px] text-white/45">
            {isHost ? "You control what everyone sees" : `Shown by ${current.by}`}
          </span>
        </span>
        {isHost && (
          <>
            <button
              type="button"
              onClick={onOpenFiles}
              className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
            >
              Files
            </button>
            <button
              type="button"
              onClick={stage.stop}
              className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-600"
            >
              Stop showing
            </button>
          </>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        {file.viewKind === "pdf" && (
          <PdfViewer key={file.id} url={file.url} page={current.page} isHost={isHost} onPage={stage.setPage} />
        )}
        {file.viewKind === "image" && (
          // eslint-disable-next-line @next/next/no-img-element -- fichier privé servi par notre API
          <img src={file.url} alt={file.name} className="absolute inset-0 size-full object-contain p-2" />
        )}
        {(file.viewKind === "video" || file.viewKind === "audio") && (
          <MediaViewer
            key={file.id}
            url={file.url}
            audioOnly={file.viewKind === "audio"}
            name={file.name}
            isHost={isHost}
            playing={current.playing}
            time={current.time}
            onMedia={stage.setMedia}
          />
        )}
        {file.viewKind === "none" && (
          <div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="text-5xl" aria-hidden>
              {fileEmoji(file.kind, file.name)}
            </span>
            <p className="font-semibold text-white">{file.name}</p>
            <p className="max-w-xs text-sm text-white/55">This file can&apos;t be shown inside the call.</p>
            <a
              href={`${file.url}${file.url.includes("?") ? "&" : "?"}download=1`}
              className="rounded-full bg-accent px-5 py-2 text-sm font-bold text-zinc-950"
            >
              Download
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- PDF (et PowerPoint / Word convertis) ---------- */

type PdfPage = {
  getViewport: (options: { scale: number }) => { width: number; height: number };
  render: (options: {
    canvasContext: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void>; cancel: () => void };
};
type PdfDoc = {
  numPages: number;
  getPage: (n: number) => Promise<PdfPage>;
  destroy: () => Promise<void>;
};

function PdfViewer({
  url,
  page,
  isHost,
  onPage,
}: {
  url: string;
  page: number;
  isHost: boolean;
  onPage: (page: number) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [error, setError] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Charger le document (pdf.js, chargé seulement quand on en a besoin).
  useEffect(() => {
    let cancelled = false;
    let loaded: PdfDoc | null = null;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        loaded = (await pdfjs.getDocument({ url }).promise) as unknown as PdfDoc;
        if (cancelled) void loaded.destroy();
        else setDoc(loaded);
      } catch (err) {
        console.error("[stage] PDF", err);
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
      if (loaded) void loaded.destroy();
    };
  }, [url]);

  // Suivre la taille de la zone (la page s'adapte à l'écran).
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const pages = doc?.numPages ?? 0;
  const shown = Math.min(Math.max(1, page), Math.max(1, pages));

  // Dessiner la page demandée.
  useEffect(() => {
    if (!doc || !canvas.current || size.width === 0 || size.height === 0) return;
    let task: { promise: Promise<void>; cancel: () => void } | null = null;
    let cancelled = false;
    (async () => {
      const pdfPage = await doc.getPage(shown);
      if (cancelled || !canvas.current) return;
      const base = pdfPage.getViewport({ scale: 1 });
      const fit = Math.max(0.1, Math.min((size.width - 16) / base.width, (size.height - 16) / base.height));
      const ratio = window.devicePixelRatio || 1;
      const viewport = pdfPage.getViewport({ scale: fit * ratio });
      const element = canvas.current;
      element.width = Math.floor(viewport.width);
      element.height = Math.floor(viewport.height);
      element.style.width = `${Math.floor(viewport.width / ratio)}px`;
      element.style.height = `${Math.floor(viewport.height / ratio)}px`;
      const context = element.getContext("2d");
      if (!context) return;
      task = pdfPage.render({ canvasContext: context, canvas: element, viewport });
      await task.promise.catch(() => {});
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, shown, size]);

  // L'hôte tourne les pages avec les flèches du clavier.
  useEffect(() => {
    if (!isHost || pages === 0) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /input|textarea|select/i.test(target.tagName)) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") onPage(Math.min(pages, shown + 1));
      if (event.key === "ArrowLeft" || event.key === "PageUp") onPage(Math.max(1, shown - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isHost, pages, shown, onPage]);

  return (
    <div ref={box} className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {error ? (
        <p className="px-6 text-center text-sm text-white/60">This document could not be opened.</p>
      ) : !doc ? (
        <p className="text-sm text-white/50">Loading the document…</p>
      ) : null}
      <canvas ref={canvas} className={`rounded-lg bg-white shadow-2xl ${doc ? "" : "hidden"}`} />

      {doc && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/75 p-1 text-white shadow-lg backdrop-blur">
          {isHost && (
            <button
              type="button"
              onClick={() => onPage(Math.max(1, shown - 1))}
              disabled={shown <= 1}
              aria-label="Previous page"
              className="flex size-9 items-center justify-center rounded-full text-lg transition hover:bg-white/15 disabled:opacity-30"
            >
              ‹
            </button>
          )}
          <span className="px-2 text-xs font-semibold tabular-nums">
            {shown} / {pages}
          </span>
          {isHost && (
            <button
              type="button"
              onClick={() => onPage(Math.min(pages, shown + 1))}
              disabled={shown >= pages}
              aria-label="Next page"
              className="flex size-9 items-center justify-center rounded-full text-lg transition hover:bg-white/15 disabled:opacity-30"
            >
              ›
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Vidéo et audio ---------- */

function MediaViewer({
  url,
  audioOnly,
  name,
  isHost,
  playing,
  time,
  onMedia,
}: {
  url: string;
  audioOnly: boolean;
  name: string;
  isHost: boolean;
  playing: boolean;
  time: number;
  onMedia: (playing: boolean, time: number) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const [needsTap, setNeedsTap] = useState(false);
  const current = () => (audioOnly ? audio.current : video.current);

  // L'hôte : chaque lecture, pause ou saut est envoyé aux autres.
  useEffect(() => {
    const element = audioOnly ? audio.current : video.current;
    if (!isHost || !element) return;
    const report = () => onMedia(!element.paused, element.currentTime);
    const events = ["play", "pause", "seeked"] as const;
    for (const event of events) element.addEventListener(event, report);
    const heartbeat = setInterval(() => {
      if (!element.paused) report();
    }, HEARTBEAT_MS);
    return () => {
      for (const event of events) element.removeEventListener(event, report);
      clearInterval(heartbeat);
    };
  }, [isHost, onMedia, audioOnly]);

  // Les participants suivent l'hôte (position, lecture, pause).
  useEffect(() => {
    const element = audioOnly ? audio.current : video.current;
    if (isHost || !element) return;
    if (Math.abs(element.currentTime - time) > DRIFT_S) element.currentTime = time;
    if (playing && element.paused) {
      element.play().catch(() => {
        // Le navigateur refuse le son sans un clic : on joue sans le son et on propose de l'activer.
        element.muted = true;
        setNeedsTap(true);
        void element.play().catch(() => {});
      });
    } else if (!playing && !element.paused) {
      element.pause();
    }
  }, [isHost, playing, time, audioOnly]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-3">
      {audioOnly ? (
        <>
          <span className="text-6xl" aria-hidden>
            🎧
          </span>
          <p className="max-w-sm truncate text-sm font-semibold text-white">{name}</p>
          <audio ref={audio} src={url} controls={isHost} preload="auto" className="w-full max-w-md" />
          {!isHost && <p className="text-xs text-white/50">{playing ? "Playing…" : "Paused by the host"}</p>}
        </>
      ) : (
        <video
          ref={video}
          src={url}
          controls={isHost}
          playsInline
          preload="auto"
          className="max-h-full max-w-full rounded-lg bg-black"
        />
      )}

      {needsTap && (
        <button
          type="button"
          onClick={() => {
            const element = current();
            if (element) element.muted = false;
            setNeedsTap(false);
          }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-zinc-950 shadow-lg"
        >
          🔊 Tap to hear the sound
        </button>
      )}
    </div>
  );
}

/* ---------- La liste des fichiers de l'hôte ---------- */

export function FilesDrawer({
  files,
  activityName,
  currentId,
  onPick,
  onClose,
}: {
  files: ActivityFileView[];
  activityName: string | null;
  currentId: string | null;
  onPick: (file: ActivityFileView) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-[2px]"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <aside
        aria-label="Activity files"
        className="anim-rise flex h-full w-full max-w-sm flex-col border-l border-white/10 bg-zinc-900 shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Show to everyone</p>
            <p className="truncate font-display text-base font-bold text-white">
              {activityName ? `${activityName} files` : "Activity files"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 items-center justify-center rounded-full text-xl text-white/60 hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        </div>
        {files.length === 0 ? (
          <p className="p-6 text-center text-sm text-white/50">This activity has no file yet.</p>
        ) : (
          <ul className="flex-1 space-y-2 overflow-y-auto p-3">
            {files.map((file) => {
              const preparing = file.pdfStatus === "pending";
              return (
                <li key={file.id}>
                  <button
                    type="button"
                    disabled={preparing}
                    onClick={() => onPick(file)}
                    className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left ring-1 transition disabled:opacity-50 ${
                      currentId === file.id
                        ? "bg-accent/15 ring-accent"
                        : "bg-white/[0.04] ring-white/10 hover:bg-white/[0.08]"
                    }`}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">
                      {fileEmoji(file.kind, file.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">{file.name}</span>
                      <span className="block text-[11px] text-white/45">
                        {preparing
                          ? "Preparing slides…"
                          : currentId === file.id
                            ? "On screen now"
                            : file.viewKind !== "none"
                              ? "Click to show everyone"
                              : "Share as a download"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
    </div>
  );
}
