"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { fileEmoji, formatSize, type ActivityFileView } from "@/lib/file-kinds";
import { TrashIcon } from "../admin-icons";
import { deleteActivityFileAction, retryConversionAction } from "./actions";

type Upload = {
  localId: number;
  name: string;
  size: number;
  progress: number;
  status: "waiting" | "uploading" | "done" | "error";
  error?: string;
};

/** Envoie un fichier avec une barre de progression (XMLHttpRequest sait la suivre). */
function sendFile(activityKey: string, file: File, onProgress: (ratio: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const query = new URLSearchParams({ activity: activityKey, name: file.name });
    request.open("POST", `/api/admin/activity-files?${query.toString()}`);
    request.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) return resolve();
      let message = "The upload failed.";
      if (request.status === 413) message = "This file is too big for the server.";
      try {
        message = (JSON.parse(request.responseText) as { error?: string }).error ?? message;
      } catch {
        // Réponse qui n'est pas du JSON (ex : limite du serveur web).
      }
      reject(new Error(message));
    };
    request.onerror = () => reject(new Error("Network error. Please try again."));
    request.send(file);
  });
}

// La fenêtre "Files" d'une activité : envoyer, voir et supprimer ses fichiers.
export function ActivityFilesDialog({
  activity,
  files,
  onClose,
}: {
  activity: { key: string; name: string; icon: string };
  files: ActivityFileView[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragging, setDragging] = useState(false);
  const queue = useRef<{ localId: number; file: File }[]>([]);
  const busy = useRef(false);
  const nextId = useRef(0);
  const input = useRef<HTMLInputElement>(null);

  // Échap ferme ; la page derrière ne défile plus.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  // Une conversion PDF en cours : on regarde à nouveau toutes les 4 secondes.
  const converting = files.some((file) => file.pdfStatus === "pending");
  useEffect(() => {
    if (!converting) return;
    const timer = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(timer);
  }, [converting, router]);

  function update(localId: number, patch: Partial<Upload>) {
    setUploads((list) => list.map((item) => (item.localId === localId ? { ...item, ...patch } : item)));
  }

  /** Les fichiers partent un par un. */
  async function runQueue() {
    if (busy.current) return;
    busy.current = true;
    while (queue.current.length > 0) {
      const next = queue.current.shift()!;
      update(next.localId, { status: "uploading" });
      try {
        await sendFile(activity.key, next.file, (ratio) => update(next.localId, { progress: ratio }));
        update(next.localId, { status: "done", progress: 1 });
        router.refresh();
      } catch (error) {
        update(next.localId, { status: "error", error: (error as Error).message });
      }
    }
    busy.current = false;
  }

  function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const added = Array.from(list).map((file) => ({ localId: nextId.current++, file }));
    queue.current.push(...added);
    setUploads((current) => [
      ...current.filter((item) => item.status !== "done"),
      ...added.map(({ localId, file }) => ({
        localId,
        name: file.name,
        size: file.size,
        progress: 0,
        status: "waiting" as const,
      })),
    ]);
    void runQueue();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Files of ${activity.name}`}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="anim-rise flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2rem] border border-white/15 bg-[#22102f]/95 shadow-2xl shadow-black/60 sm:rounded-[2rem]">
        {/* En-tête */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-2xl">
            {activity.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Activity files</p>
            <p className="truncate font-display text-lg font-bold text-white">{activity.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 items-center justify-center rounded-full text-xl text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto p-5">
          {/* Déposer des fichiers */}
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              addFiles(event.dataTransfer.files);
            }}
            className={`flex w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed px-4 py-8 text-center transition ${
              dragging ? "border-accent bg-accent/10" : "border-white/15 hover:border-accent/60 hover:bg-white/[0.03]"
            }`}
          >
            <span className="text-3xl" aria-hidden>
              📤
            </span>
            <span className="text-sm font-bold text-white">Drop files here or click to choose</span>
            <span className="max-w-sm text-xs text-white/50">
              PowerPoint, Word, PDF, photos, videos, audio… any type. PowerPoint and Word are turned into
              slides the host can show during the call.
            </span>
          </button>
          <input
            ref={input}
            type="file"
            multiple
            className="sr-only"
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />

          {/* Les envois en cours */}
          {uploads.length > 0 && (
            <ul className="space-y-2">
              {uploads.map((upload) => (
                <li key={upload.localId} className="rounded-2xl bg-black/25 p-3 ring-1 ring-white/10">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="min-w-0 flex-1 truncate font-semibold text-white">{upload.name}</span>
                    <span className="shrink-0 text-white/45">{formatSize(upload.size)}</span>
                    <span
                      className={`shrink-0 font-bold ${
                        upload.status === "error"
                          ? "text-red-300"
                          : upload.status === "done"
                            ? "text-emerald-300"
                            : "text-accent"
                      }`}
                    >
                      {upload.status === "waiting" && "Waiting"}
                      {upload.status === "uploading" && `${Math.round(upload.progress * 100)}%`}
                      {upload.status === "done" && "✓ Done"}
                      {upload.status === "error" && "Failed"}
                    </span>
                  </div>
                  {upload.status !== "error" ? (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-accent to-brand transition-[width] duration-300"
                        style={{ width: `${Math.round(upload.progress * 100)}%` }}
                      />
                    </div>
                  ) : (
                    <p className="mt-1 text-[11px] text-red-200">{upload.error}</p>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Les fichiers de l'activité */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
              {files.length} {files.length === 1 ? "file" : "files"}
            </p>
            {files.length === 0 ? (
              <p className="rounded-2xl bg-black/20 px-4 py-6 text-center text-sm text-white/45">
                No file yet. Hosts will see these files during the call.
              </p>
            ) : (
              <ul className="space-y-2">
                {files.map((file) => (
                  <FileRow key={file.id} file={file} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FileRow({ file }: { file: ActivityFileView }) {
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();

  let status: { text: string; tone: string };
  if (file.pdfStatus === "pending") status = { text: "Preparing slides…", tone: "bg-accent/15 text-accent" };
  else if (file.pdfStatus === "failed")
    status = { text: "Can't show live", tone: "bg-amber-400/15 text-amber-300" };
  else if (file.viewKind === "none") status = { text: "Download only", tone: "bg-white/10 text-white/55" };
  else status = { text: "Ready for the call", tone: "bg-emerald-400/15 text-emerald-300" };

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/[0.05] p-3 ring-1 ring-white/10">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">
        {fileEmoji(file.kind, file.name)}
      </span>
      <span className="min-w-0 flex-1">
        <a
          href={`/api/activity-files/${file.id}`}
          target="_blank"
          rel="noreferrer"
          className="block truncate text-sm font-semibold text-white hover:text-accent"
        >
          {file.name}
        </a>
        <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-white/45">
          {formatSize(file.size)}
          <span className={`rounded-full px-2 py-0.5 font-semibold ${status.tone}`}>{status.text}</span>
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        {file.pdfStatus === "failed" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => retryConversionAction(file.id))}
            className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15 disabled:opacity-60"
          >
            {pending ? "..." : "Retry"}
          </button>
        )}
        {armed ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => deleteActivityFileAction(file.id))}
              className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
            >
              {pending ? "..." : "Delete"}
            </button>
            <button
              type="button"
              onClick={() => setArmed(false)}
              className="rounded-full px-2 py-1.5 text-xs text-white/60 hover:text-white"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setArmed(true)}
            aria-label={`Delete ${file.name}`}
            className="flex size-8 items-center justify-center rounded-full text-white/50 transition hover:bg-red-500/15 hover:text-red-300"
          >
            <TrashIcon />
          </button>
        )}
      </span>
    </li>
  );
}
